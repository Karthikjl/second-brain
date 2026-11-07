# Deploying Second Brain on k3s

These manifests run Second Brain as a single pod with its SQLite database on a persistent
volume, exposed through k3s's built-in Traefik ingress.

| File | What it creates |
|---|---|
| `namespace.yaml` | `second-brain` namespace |
| `configmap.yaml` | Non-secret settings (port, DB path, token lifetimes) |
| `pvc.yaml` | 2 GiB `local-path` volume for `/app/db` (the SQLite file) |
| `deployment.yaml` | One replica, `Recreate` strategy, health probes, hardened security context |
| `service.yaml` | ClusterIP service on port 80 → container port 3000 |
| `ingress.yaml` | Traefik ingress for `second-brain.local` (change to your domain) |
| `kustomization.yaml` | Ties it together and sets the image tag |

> **One replica only.** SQLite allows a single writer. Do not scale the Deployment above 1,
> and keep the volume on local disk (not NFS/SMB).

## 1. Build the image

On the machine where you build:

```bash
docker build -t second-brain:1.0.0 .
```

## 2. Get the image into k3s

**Option A: no registry (single-node k3s).** Import the image straight into k3s's containerd:

```bash
docker save second-brain:1.0.0 | sudo k3s ctr images import -
```

If you build on a different machine, copy it over first:

```bash
docker save second-brain:1.0.0 | ssh user@k3s-host 'sudo k3s ctr images import -'
```

**Option B: a registry.** Tag and push, then set the image in `kustomization.yaml`:

```bash
docker tag second-brain:1.0.0 registry.example.com/second-brain:1.0.0
docker push registry.example.com/second-brain:1.0.0
```

```yaml
images:
  - name: second-brain
    newName: registry.example.com/second-brain
    newTag: "1.0.0"
```

## 3. Create the secret

The JWT signing key is never committed. Create it directly in the cluster:

```bash
kubectl create namespace second-brain
kubectl -n second-brain create secret generic second-brain-secrets \
  --from-literal=JWT_ACCESS_SECRET="$(openssl rand -hex 64)"
```

The app refuses to start in production without this, or with a known placeholder value.

## 4. Deploy

Edit the host in `ingress.yaml`, then:

```bash
kubectl apply -k deploy/k3s
kubectl -n second-brain rollout status deployment/second-brain
```

Open `http://<your-host>/` and complete the first-run Super Admin setup **right away**. Until
an admin exists, whoever opens the page first becomes the admin.

For a quick test without DNS:

```bash
kubectl -n second-brain port-forward svc/second-brain 3000:80
```

## Updating

Build and import a new tag (for example `1.0.1`), update `newTag` in `kustomization.yaml`, and
re-apply. `Recreate` stops the old pod before starting the new one, so expect a few seconds of
downtime.

```bash
kubectl apply -k deploy/k3s
```

## Backups

The database lives on the node under `/var/lib/rancher/k3s/storage/`. Take a consistent
snapshot from inside the running pod:

```bash
kubectl -n second-brain exec deploy/second-brain -- \
  sqlite3 /app/db/second_brain.sqlite ".backup '/app/db/backup.sqlite'"
kubectl -n second-brain cp \
  "$(kubectl -n second-brain get pod -l app.kubernetes.io/name=second-brain -o name | cut -d/ -f2)":/app/db/backup.sqlite \
  ./second_brain-backup.sqlite
```

## HTTPS

Add a `tls:` block to `ingress.yaml` that points to a certificate Secret, for example one
issued by cert-manager, and use your real domain as the host.
