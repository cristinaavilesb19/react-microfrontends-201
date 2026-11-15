#!/usr/bin/env bash
# Deja la carpeta inicio/ de un laboratorio como estaba en el repositorio.
# Uso: bash scripts/reiniciar.sh M03-01-host-y-remote
set -euo pipefail
LAB="${1:?Indica la carpeta del laboratorio, p. ej. M03-01-host-y-remote}"
cd "$(dirname "$0")/.."
git checkout -- "ejercicios/$LAB/inicio"     # deshace tus cambios en ficheros del repositorio
git clean -fd "ejercicios/$LAB/inicio"        # borra los ficheros nuevos que hayas creado
echo "ejercicios/$LAB/inicio vuelve a su estado inicial."
