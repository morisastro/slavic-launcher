FROM alpine:latest

RUN apk add --no-cache ca-certificates tzdata unzip wget

# Download PocketBase Linux binary (pinned version)
ARG PB_VERSION=0.23.10
RUN wget -qO /tmp/pb.zip \
      "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip" \
    && unzip /tmp/pb.zip -d /pb/ \
    && rm /tmp/pb.zip \
    && chmod +x /pb/pocketbase

# Copy seed script and migration hooks
COPY seed.sh /pb/seed.sh
COPY pb_hooks /pb/pb_hooks
RUN chmod +x /pb/seed.sh

# Persistent data lives here (mount a volume on this path in production)
VOLUME /pb/pb_data

EXPOSE 8090

# Healthcheck against the PocketBase API
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8090/api/health || exit 1

# Entrypoint: run migrations, seed if needed, then serve
CMD ["/bin/sh", "-c", "/pb/pocketbase migrate up && /pb/seed.sh & /pb/pocketbase serve --http=0.0.0.0:8090 --publicDir=/pb/pb_public"]
