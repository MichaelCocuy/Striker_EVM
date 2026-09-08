# Build the static bundle, then serve it with nginx, which also proxies /api to the backend
# so the browser talks to a single origin and no CORS preflight is involved.
FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html ./
COPY public ./public
COPY src ./src

# The bundle calls the API on its own origin and never boots the mock service worker.
ENV VITE_API_BASE_URL=/api/v1 \
    VITE_USE_MOCKS=false
RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
