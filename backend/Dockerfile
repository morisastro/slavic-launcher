FROM alpine:latest

RUN apk add --no-cache ca-certificates tzdata unzip wget

# Download PocketBase Linux binary (pinned version)
ARG PB_VERSION=0.23.10
RUN wget -qO /tmp/pb.zip \
      "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip" \
    && unzip /tmp/pb.zip -d /pb/ \
    && rm /tmp/pb.zip \
    && chmod +x /pb/pocketbase

# Copy seed script, hooks, and migrations (paths relative to repo root)
COPY backend/seed.sh /pb/seed.sh
COPY backend/pb_hooks /pb/pb_hooks
COPY backend/pb_migrations /pb/pb_migrations
RUN chmod +x /pb/seed.sh

# Data directory (on Render free tier this is ephemeral — data resets on redeploy)
RUN mkdir -p /pb/pb_data /pb/pb_public

EXPOSE 8090

# Healthcheck against the PocketBase API
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8090/api/health || exit 1

# Entrypoint: run migrations, seed, then serve
CMD ["/bin/sh", "-c", "/pb/pocketbase migrate up && /pb/seed.sh & /pb/pocketbase serve --http=0.0.0.0:8090 --publicDir=/pb/pb_public"]