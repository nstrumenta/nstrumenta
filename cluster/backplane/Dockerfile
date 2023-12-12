FROM node:20.3-bullseye-slim

# context is top level of nstrumenta repo
COPY . /app/
WORKDIR /app
RUN npm install
RUN npm run build

EXPOSE 9229

CMD ["npm", "start"]