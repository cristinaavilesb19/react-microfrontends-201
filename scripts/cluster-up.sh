#!/usr/bin/env bash
# Crea el clúster kind del curso (si no existe) con la configuración que se le pase.
# Uso: bash scripts/cluster-up.sh ejercicios/M07-02-kubernetes/kind.yaml
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONFIG="${1:?Indica el fichero kind.yaml del laboratorio}"
NOMBRE="$(awk '/^name:/ {print $2}' "$CONFIG")"

# Codespaces: arregla la red de Docker para kind antes de crear el clúster.
bash "$ROOT/scripts/kind-net-fix.sh" || true

if kind get clusters 2>/dev/null | grep -qx "$NOMBRE"; then
  echo "El clúster $NOMBRE ya existe."
else
  # Sin variables de proxy: kubeadm las cogería al arrancar el nodo.
  env -u HTTP_PROXY -u HTTPS_PROXY -u http_proxy -u https_proxy \
    kind create cluster --config "$CONFIG"
fi

bash "$ROOT/scripts/kind-net-fix.sh" || true
kubectl cluster-info --context "kind-$NOMBRE" | head -1
