FROM node:20-alpine

WORKDIR /app

COPY backend/package.json backend/package-lock.json ./
RUN npm install --production

COPY backend/ .

EXPOSE 8090

CMD ["node", "server.js"]