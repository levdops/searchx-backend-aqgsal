FROM node:8.17-alpine

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

USER node

COPY package*.json ./

RUN npm install --frozen-lockfile

COPY --chown=node:node . .

CMD [ "node", "scripts/worker.js" ]