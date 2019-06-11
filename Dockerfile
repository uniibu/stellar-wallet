FROM node:10.16-slim

WORKDIR /usr/src/app

COPY package*.json ./
COPY yarn.lock ./

RUN npm install yarn pm2 -g && yarn install --prod
COPY . .
RUN chmod +x /usr/src/app/bin/stellar-cli && ln -s /usr/src/app/bin/stellar-cli /usr/bin/

EXPOSE 8877

CMD [ "yarn", "start" ]