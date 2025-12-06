ARG BASE_TAG=latest
FROM nstrumenta/toolchain:${BASE_TAG}
COPY ./app /app/

WORKDIR /app
RUN npm install
RUN npm run build

EXPOSE 9229

CMD ["npm", "start"]