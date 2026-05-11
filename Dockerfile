# syntax=docker/dockerfile:1.6

FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

FROM base AS build
COPY app ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
  pnpm install --frozen-lockfile --ignore-scripts && pnpm prepare && pnpm build

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
WORKDIR /app

RUN mkdir -p /app/data

COPY --from=build /app/.output ./.output

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
