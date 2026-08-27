# Built from the repository root, not from apps/qr-bank-transfer. The app
# depends on packages/core through a file: reference, so the image needs both
# directories in the same relative layout as the repo.
FROM node:20-alpine

RUN apk add --no-cache openssl

ENV NODE_ENV=production
EXPOSE 3000
WORKDIR /app

# The shared library first — it changes far less often than the app, so this
# layer stays cached across most builds.
COPY packages/core ./packages/core

COPY apps/qr-bank-transfer/package.json apps/qr-bank-transfer/package-lock.json* ./apps/qr-bank-transfer/
WORKDIR /app/apps/qr-bank-transfer

# Not --omit=dev: the production build itself runs through vite, which is a
# dev dependency. Nothing from it ships in the built output.
RUN npm ci && npm cache clean --force

COPY apps/qr-bank-transfer ./
RUN npm run build

# Applies pending migrations, then serves. Migrations run at start rather than
# at build because the database is not reachable while the image is built.
CMD ["npm", "run", "docker-start"]
