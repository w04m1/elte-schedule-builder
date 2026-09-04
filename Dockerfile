FROM node:24-alpine@sha256:d32cdf619f63fe0471182d08996dd516c6275bb5fd31ae06e55a570bd9e1ad43 AS base

ARG NPM_VERSION=11.17.0
RUN npm install --global "npm@${NPM_VERSION}"

FROM base AS development

WORKDIR /workspace

FROM base AS build

WORKDIR /app

COPY package*.json .npmrc ./
COPY scripts/prepare.js ./scripts/prepare.js
RUN npm ci

COPY . .
RUN npm run build

FROM base AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json .npmrc ./
COPY scripts/prepare.js ./scripts/prepare.js
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY server ./server
COPY config/runtime.js ./config/runtime.js

RUN mkdir -p /app/data
VOLUME /app/data
EXPOSE 3000
CMD ["node", "server/index.js"]
