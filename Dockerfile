# syntax=docker/dockerfile:1

# KachnaDocs. One Dockerfile, two deployable targets:
#   docker build --target api -t kachnadocs-api .
#   docker build --target web -t kachnadocs-web .
# `web` serves the built SPA through nginx and proxies /api to the `api`
# container (see docker/nginx.conf.template and docker-compose.yml).

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
# Source enters here, not in base, so editing source never invalidates the
# `npm ci` layer. .dockerignore already strips node_modules, dist, .env and
# apps/api/test from what this copies.
COPY apps/api ./apps/api
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
# Same reason as build-api. .dockerignore drops node_modules, dist, e2e,
# playwright-report and test-results.
COPY apps/web ./apps/web
RUN npm run build --workspace=web

########################################
# web runtime: nginx serving the SPA, /api proxied upstream
########################################
FROM nginx:1-alpine AS web
# The SPA is static output; nginx alone serves it. The config is a template:
# the image entrypoint renders it via envsubst, substituting KACHNADOCS_API
# (override it on the web service to point /api at another host:port).
ENV KACHNADOCS_API=api:3000
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build-web /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
