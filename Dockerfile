# syntax=docker/dockerfile:1

FROM oven/bun:1.3.14-slim AS dependencies
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM dependencies AS build
COPY . .
RUN bun run build

FROM oven/bun:1.3.14-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY --from=build --chown=bun:bun /app/dist ./dist

USER bun

EXPOSE 4321

CMD ["bun", "./dist/server/entry.mjs"]
