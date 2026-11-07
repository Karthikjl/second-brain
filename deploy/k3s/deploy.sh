#!/usr/bin/env bash
# Build, load and deploy Second Brain on a single-node k3s host, fronted by host nginx.
#
# Usage:
#   ./deploy/k3s/deploy.sh <domain>
#
# Optional environment variables:
#   TAG         image tag                          (default: 1.0.0)
#   DATA_DIR    host folder for the SQLite DB      (default: /var/lib/second-brain/data)
#   CLUSTER_IP  fixed Service IP nginx proxies to  (default: 10.43.200.82, inside k3s's
#               default 10.43.0.0/16 service range; pick another if it is taken)
#   SSL_CERT    TLS certificate for nginx          (default: /etc/nginx/ssl/cloudflare-origin.crt)
#   SSL_KEY     TLS private key for nginx          (default: /etc/nginx/ssl/cloudflare-origin.key)
#   SKIP_NGINX  set to 1 to skip the nginx step
#
# Uses sudo for the k3s image import, the data folder and nginx.
set -euo pipefail

DOMAIN="${1:?usage: $0 <domain>}"
TAG="${TAG:-1.0.0}"
DATA_DIR="${DATA_DIR:-/var/lib/second-brain/data}"
CLUSTER_IP="${CLUSTER_IP:-10.43.200.82}"
SSL_CERT="${SSL_CERT:-/etc/nginx/ssl/cloudflare-origin.crt}"
SSL_KEY="${SSL_KEY:-/etc/nginx/ssl/cloudflare-origin.key}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
NS=second-brain
DEFAULT_DATA_DIR=/var/lib/second-brain/data
DEFAULT_CLUSTER_IP=10.43.200.82

echo "==> Build image second-brain:$TAG"
docker build -t "second-brain:$TAG" "$ROOT"

echo "==> Import image into k3s"
docker save "second-brain:$TAG" | sudo k3s ctr images import -

echo "==> Data folder $DATA_DIR"
sudo mkdir -p "$DATA_DIR"

echo "==> Namespace and secret"
kubectl get ns "$NS" >/dev/null 2>&1 || kubectl create namespace "$NS"
kubectl -n "$NS" get secret second-brain-secrets >/dev/null 2>&1 || \
  kubectl -n "$NS" create secret generic second-brain-secrets \
    --from-literal=JWT_ACCESS_SECRET="$(openssl rand -hex 64)"

echo "==> Apply manifests"
# A Service's clusterIP cannot be changed in place, so recreate it if it differs.
CUR_IP=$(kubectl -n "$NS" get svc second-brain -o jsonpath='{.spec.clusterIP}' 2>/dev/null || true)
if [ -n "$CUR_IP" ] && [ "$CUR_IP" != "$CLUSTER_IP" ]; then
  kubectl -n "$NS" delete svc second-brain
fi
kubectl kustomize "$ROOT/deploy/k3s" \
  | sed -e "s|$DEFAULT_DATA_DIR|$DATA_DIR|g" \
        -e "s|$DEFAULT_CLUSTER_IP|$CLUSTER_IP|g" \
        -e "s|newTag: \"1.0.0\"|newTag: \"$TAG\"|" \
        -e "s|image: second-brain:1.0.0|image: second-brain:$TAG|" \
  | kubectl apply -f -
kubectl -n "$NS" rollout restart deployment/second-brain
kubectl -n "$NS" rollout status deployment/second-brain --timeout=180s

if [ "${SKIP_NGINX:-0}" != "1" ]; then
  echo "==> nginx site for $DOMAIN"
  sed -e "s|__DOMAIN__|$DOMAIN|g" \
      -e "s|__CLUSTER_IP__|$CLUSTER_IP|g" \
      -e "s|__SSL_CERT__|$SSL_CERT|g" \
      -e "s|__SSL_KEY__|$SSL_KEY|g" \
      "$ROOT/deploy/k3s/nginx-second-brain.conf.template" \
    | sudo tee /etc/nginx/sites-available/second-brain >/dev/null
  sudo ln -sf /etc/nginx/sites-available/second-brain /etc/nginx/sites-enabled/second-brain
  if ! sudo nginx -t; then
    echo "nginx config test failed; removing the second-brain site." >&2
    sudo rm -f /etc/nginx/sites-enabled/second-brain
    exit 1
  fi
  sudo systemctl reload nginx

  echo "==> Check through nginx"
  # nginx reloads gracefully, so give the new workers a moment before failing.
  ok=0
  for _ in $(seq 1 10); do
    if curl -fsSk -m 5 --resolve "$DOMAIN:443:127.0.0.1" \
         "https://$DOMAIN/api/auth/setup-status" >/dev/null; then
      ok=1; break
    fi
    sleep 1
  done
  if [ "$ok" != 1 ]; then
    echo "App did not answer through nginx at https://$DOMAIN." >&2
    exit 1
  fi
fi

echo
echo "Deployed. Point DNS for $DOMAIN at this server, then open https://$DOMAIN"
echo "and create the Super Admin immediately: until one exists, the first visitor becomes admin."
