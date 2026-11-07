# Deploying Second Brain on k3s

These manifests run Second Brain as a single pod on a single-node k3s host. The SQLite
database lives in a folder on the node's disk, and nginx on the host terminates TLS and
proxies to the pod's Service.

```
browser ──HTTPS──▶ (optional CDN, e.g. Cloudflare) ──▶ host nginx :443 ──▶ Service 10.43.200.82:80 ──▶ pod :3000
```

| File | What it creates |
|---|---|
| `namespace.yaml` | `second-brain` namespace |
| `configmap.yaml` | Non-secret settings (port, DB path, token lifetimes) |
| `pvc.yaml` | 2 GiB hostPath volume (default `/var/lib/second-brain/data`) mounted at `/app/db` |
| `deployment.yaml` | One replica, `Recreate` strategy, health probes, hardened security context |
| `service.yaml` | ClusterIP Service with a fixed IP (`10.43.200.82`) so host nginx can reach it |
| `kustomization.yaml` | Ties the manifests together and sets the image tag |
| `nginx-second-brain.conf.template` | Host nginx site; `deploy.sh` fills in the placeholders |
| `deploy.sh` | One-shot build, import, apply and nginx setup |

> **One replica only.** SQLite allows a single writer. Do not scale the Deployment above 1,
> and keep the data folder on local disk (not NFS/SMB).

## Prerequisites

- A k3s node with `kubectl` access, Docker for building, and nginx installed on the host.
- A TLS certificate for your domain on the host. The defaults point to a Cloudflare origin
  certificate at `/etc/nginx/ssl/cloudflare-origin.crt` and `.key`.

## Quick deploy

From the repository root:

```bash
./deploy/k3s/deploy.sh second-brain.example.com
```

The script builds the image, imports it into k3s, creates the namespace and JWT secret if
missing, applies the manifests, waits for the rollout, installs the nginx site, and checks the
app through nginx. Customise it with environment variables:

| Variable | Default | Purpose |
|---|---|---|
| `TAG` | `1.0.0` | Image tag |
| `DATA_DIR` | `/var/lib/second-brain/data` | Host folder for the SQLite database |
| `CLUSTER_IP` | `10.43.200.82` | Fixed Service IP (must be inside k3s's service range, default `10.43.0.0/16`, and unused) |
| `SSL_CERT` / `SSL_KEY` | Cloudflare origin cert paths | Certificate nginx serves |
| `SKIP_NGINX` | `0` | Set to `1` to skip the nginx step |

Example:

```bash
DATA_DIR=$HOME/volumes/second-brain TAG=1.0.1 ./deploy/k3s/deploy.sh brain.example.com
```

Then point DNS for the domain at the server. With Cloudflare, add a proxied `A` record and use
SSL/TLS mode **Full (strict)**.

Open `https://<your-domain>/` and complete the first-run Super Admin setup **right away**.
Until an admin exists, whoever opens the page first becomes the admin.

## Manual steps

The same thing, one step at a time.

**1. Build and import the image** (single-node k3s, no registry):

```bash
docker build -t second-brain:1.0.0 .
docker save second-brain:1.0.0 | sudo k3s ctr images import -
```

To use a registry instead, push the image and set `newName` under `images:` in
`kustomization.yaml`.

**2. Create the secret.** The JWT signing key is never committed:

```bash
kubectl create namespace second-brain
kubectl -n second-brain create secret generic second-brain-secrets \
  --from-literal=JWT_ACCESS_SECRET="$(openssl rand -hex 64)"
```

The app refuses to start in production without this, or with a known placeholder value.

**3. Apply the manifests.** Change the `hostPath.path` in `pvc.yaml` first if you want the
database somewhere else:

```bash
kubectl apply -k deploy/k3s
kubectl -n second-brain rollout status deployment/second-brain
```

**4. Install the nginx site.** Replace the placeholders in `nginx-second-brain.conf.template`
(`__DOMAIN__`, `__CLUSTER_IP__`, `__SSL_CERT__`, `__SSL_KEY__`), save it as
`/etc/nginx/sites-available/second-brain`, then:

```bash
sudo ln -s /etc/nginx/sites-available/second-brain /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

For a quick test without nginx or DNS:

```bash
kubectl -n second-brain port-forward svc/second-brain 3000:80
```

## Updating

Re-run `deploy.sh` with a new `TAG` (and the same `DATA_DIR`), or build and import a new tag,
update `newTag` in `kustomization.yaml`, and re-apply. `Recreate` stops the old pod before
starting the new one, so expect a few seconds of downtime.

## Backups

The database lives on the node in the data folder (default `/var/lib/second-brain/data`).
The PersistentVolume uses `Retain`, so deleting the namespace does not delete it. Take a
consistent snapshot from inside the running pod:

```bash
kubectl -n second-brain exec deploy/second-brain -- \
  sqlite3 /app/db/second_brain.sqlite ".backup '/app/db/backup.sqlite'"
kubectl -n second-brain cp \
  "$(kubectl -n second-brain get pod -l app.kubernetes.io/name=second-brain -o name | cut -d/ -f2)":/app/db/backup.sqlite \
  ./second_brain-backup.sqlite
```
