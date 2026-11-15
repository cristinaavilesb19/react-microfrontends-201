# Imagen de la microaplicación «host».
# Se construye desde la raíz del repositorio:
#   docker build -f ejercicios/M07-02-kubernetes/host/Dockerfile -t host:1 .

# --- Etapa 1: compilar con Node ---
FROM node:22-alpine AS build
WORKDIR /repo
# Dependencias primero: esta capa se reutiliza mientras package-lock.json no cambie.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY ejercicios/M07-02-kubernetes/host ./app
WORKDIR /repo/app
RUN npm run build

# --- Etapa 2: servir los estáticos con nginx ---
FROM nginx:1.29-alpine
COPY ejercicios/M07-02-kubernetes/host/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /repo/app/dist /usr/share/nginx/html
