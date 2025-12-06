FROM node:20

RUN npm i -g @angular/cli@14.1.2
WORKDIR /app
COPY frontend .
COPY credentials/firebaseConfig.js /credentials/firebaseConfig.js
RUN npm install
RUN npm run build