# Builder stage
FROM node:22-alpine as builder
RUN apk add --no-cache --virtual .gyp python3 make g++
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install

# Final stage
FROM node:22-alpine
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY . .

# Run
ENTRYPOINT ["node", "index.js"]