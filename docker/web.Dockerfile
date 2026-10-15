# Production build of the SPA, served by nginx. /api is proxied to $API_UPSTREAM.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

FROM nginx:1.30-alpine
ENV API_UPSTREAM=http://api:4010
# The official image renders templates with the current environment at startup.
COPY docker/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
