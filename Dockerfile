FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared-types/package.json packages/shared-types/
RUN npm ci

COPY packages/shared-types packages/shared-types
COPY apps/api apps/api
# Bust stale Render layers that still sent thinkingBudget: 0
ENV XRAY_BUILD=20260821-harsh-score
RUN npm run build -w @job-xray/shared-types && npm run build -w @job-xray/api

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8787

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared-types/package.json packages/shared-types/
RUN npm ci --omit=dev

COPY --from=build /app/packages/shared-types/dist packages/shared-types/dist
COPY --from=build /app/apps/api/dist apps/api/dist
COPY packages/shared-types/package.json packages/shared-types/package.json

WORKDIR /app/apps/api
EXPOSE 8787
CMD ["node", "dist/index.js"]