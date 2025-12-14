ARG NODE_VERSION=24.12.0
FROM node:${NODE_VERSION}

RUN npm i -g @angular/cli@14.1.2
WORKDIR /app
COPY frontend .
COPY credentials/firebaseConfig.js /credentials/firebaseConfig.js
RUN npm install
RUN npm run build