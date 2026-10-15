# syntax=docker/dockerfile:1

# KachnaDocs. One Dockerfile, two deployable targets:
#   docker build --target api -t kachnadocs-api .
#   docker build --target web -t kachnadocs-web .
# `web` serves the built SPA through nginx and proxies /api to the `api`
# container (see docker/nginx.conf and docker-compose.yml).

########################################
# base: lockfile + installed workspaces
########################################
FROM node:24-alpine AS base
WORKDIR /app
# Workspace manifests first, so `npm ci` is cached until they actually change.
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY shared/package.json ./shared/
COPY shared/src ./shared/src
COPY shared/tsconfig.json ./shared/tsconfig.json
# `prepare` builds shared/dist, which the workspace links need before anything compiles.
RUN npm ci

########################################
# build:api — compile, then drop dev dependencies
########################################
FROM base AS build-api
WORKDIR /app
RUN npm run build --workspace=api
# Pruning in place keeps the workspace links (@kachnadocs/shared resolves via
# a relative symlink into ./shared) intact while removing dev dependencies.
RUN npm prune --omit=dev

########################################
# api runtime: bare NestJS server
########################################
FROM node:24-alpine AS api
WORKDIR /app
# Relative structure of /app must be preserved exactly, so the shared
# workspace symlink keeps resolving.
COPY --from=build-api /app/node_modules ./node_modules
COPY --from=build-api /app/package.json ./package.json
COPY --from=build-api /app/apps/api/package.json ./apps/api/package.json
COPY --from=build-api /app/apps/api/dist ./apps/api/dist
COPY --from=build-api /app/shared/package.json ./shared/package.json
COPY --from=build-api /app/shared/dist ./shared/dist
# Keep in sync with apps/api/.env.example. Override at runtime with
# `docker run -e VAR=value` or the compose `environment:` block.
ENV NODE_ENV=production
ARG API_PORT=3000
ENV PORT=${API_PORT}
EXPOSE ${API_PORT}
# Process env always outranks the on-disk .env, so these win over any stale copy.
CMD ["node", "apps/api/dist/main.js"]

########################################
# build:web
########################################
FROM base AS build-web
WORKDIR /app
RUN npm run build --workspace=web

########################################
# web runtime: nginx serving the SPA, /api proxied upstream
########################################
FROM nginx:1-alpine AS web
# The SPA is static output; nginx alone serves it.
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build-web /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
