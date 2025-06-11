FROM node:24.1.0-bookworm-slim

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