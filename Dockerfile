# ==========================================
# STAGE 1: Install Dependencies & Build `@kachnadocs/shared`
# ==========================================
FROM node:lts-alpine AS base-builder
WORKDIR /app

# Copy root lockfile and workspace package definitions
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY shared/tsconfig.json ./shared/
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/

# Install ALL dependencies (including devDependencies needed for builds).
# --ignore-scripts skips the root `prepare` script, which would run build:shared
# before shared/src has been copied in below.
RUN npm ci --ignore-scripts

# Copy the source code for the shared types package
COPY shared/ ./shared/

# Build the shared workspace package (compiles to shared/dist)
RUN npm run build:shared


# ==========================================
# STAGE 2: Build the Vue.js web (`frontend`)
# ==========================================
FROM base-builder AS web-builder
WORKDIR /app

# Path the SPA is published under, e.g. --build-arg VITE_BASE_PATH=/kachnadocs for
# a site the shared proxy serves at https://example.com/kachnadocs/ rather than at
# the origin root. Baked into the bundle — index.html *and* the URLs the JS
# resolves lazy route chunks against — so an image built for one mount point
# cannot be re-pointed at another by a run-time variable. '/' means the origin
# root. The container reads the same value at run time as BASE_PATH (.env.example).
ARG VITE_BASE_PATH=/
ENV VITE_BASE_PATH=${VITE_BASE_PATH}

# Copy the web application source code
COPY apps/web/ ./apps/web/

# Build the web workspace (Vite outputs assets to apps/web/dist)
RUN npm run build --workspace=web


# ==========================================
# STAGE 3: Build the NestJS api (`backend`)
# ==========================================
FROM base-builder AS api-builder
WORKDIR /app

# Copy the backend application source code
COPY apps/api/ ./apps/api/

# Build the backend workspace (outputs to apps/api/dist)
RUN npm run build --workspace=api


# ==========================================
# STAGE 4: Final Production Runner
# ==========================================
FROM node:lts-alpine AS runner
WORKDIR /app

# Copy production package maps
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY apps/api/package*.json ./apps/api/

# Install ONLY production dependencies to keep the image slim
RUN npm ci --omit=dev --ignore-scripts

# Copy compiled shared types into the production workspace area
COPY --from=base-builder /app/shared/dist ./shared/dist

# Copy compiled NestJS code
COPY --from=api-builder /app/apps/api/dist ./apps/api/dist

# Copy compiled Vue/Vite assets directly into the NestJS client directory
COPY --from=web-builder /app/apps/web/dist ./apps/api/client

EXPOSE 3000

CMD ["node", "apps/api/dist/main.js"]
