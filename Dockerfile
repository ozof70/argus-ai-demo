FROM node:22-alpine
WORKDIR /app
COPY . .
ENV PORT=8765
ENV ARGUS_HOST=0.0.0.0
ENV ARGUS_DB_PATH=/data/argus.sqlite
EXPOSE 8765
CMD ["node", "local.mjs"]
