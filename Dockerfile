FROM node:22-alpine AS base
WORKDIR /app

FROM base AS prod-deps
ENV NODE_ENV=production
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=1
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM base AS build
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=1
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN mkdir -p dist node_modules/.prisma
RUN if [ -s prisma/schema.prisma ]; then npx prisma generate --schema prisma/schema.prisma; fi
RUN npm run build --if-present

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build --chown=node:node /app/node_modules/@prisma/client ./node_modules/@prisma/client

USER node
EXPOSE 3000

CMD ["sh", "-c", "test -f dist/app.js && exec node dist/app.js || { echo 'Missing dist/app.js. Add a build step before running the container.' >&2; exit 1; }"]
