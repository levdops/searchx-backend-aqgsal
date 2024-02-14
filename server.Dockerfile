FROM node:8.17-alpine

RUN apk --no-cache add curl

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

USER node

COPY package*.json ./

RUN npm install --frozen-lockfile

COPY --chown=node:node . .

EXPOSE 8080

CMD [ "node", "scripts/server.js" ]
