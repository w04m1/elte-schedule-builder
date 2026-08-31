FROM node:24-alpine@sha256:e67514e5d0f6c46656005e1b693b2ec9d52e80b641307de684d4a015ba7a4eaf AS base

ARG NPM_VERSION=11.17.0
RUN npm install --global "npm@${NPM_VERSION}"

FROM base AS development

WORKDIR /workspace

FROM base AS build

WORKDIR /app

COPY package*.json .npmrc ./
RUN npm ci

COPY . .
RUN npm run build

FROM base AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json .npmrc ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY server.js server-utils.js security-headers.js runtime-config.js server-logger.js ./

RUN mkdir -p /app/data
VOLUME /app/data
EXPOSE 3000
CMD ["node", "server.js"]
