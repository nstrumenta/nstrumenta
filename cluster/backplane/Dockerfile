FROM node:20.3-bullseye-slim

# context is top level of nstrumenta repo
COPY . /nstrumenta
WORKDIR /nstrumenta
RUN npm install
RUN npm run build:nodejs

WORKDIR /nstrumenta/cluster/backplane/app
RUN pwd ; 
RUN npm install
RUN npm run build

EXPOSE 8089

CMD ["npm", "start"]