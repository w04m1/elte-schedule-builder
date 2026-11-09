FROM node:24-alpine@sha256:a34ab6d7f6f4813f4d0c5469d74685604b962fbdbf5793a7bc7b4998ecb867c8 AS base

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
