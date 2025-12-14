FROM nstrumenta/base:latest

# context is top level of nstrumenta repo
COPY . /nstrumenta/
WORKDIR /nstrumenta
RUN npm install
RUN npm run build:cli
RUN echo 'alias nst="node /nstrumenta/dist/cli/index.js"' >> ~/.bashrc
RUN echo 'alias nstrumenta="node /nstrumenta/dist/cli/index.js"' >> ~/.bashrc
RUN mkdir /workspace
WORKDIR /workspace

RUN ln -s /usr/bin/python3 /usr/bin/python

COPY developer/requirements.txt .

RUN pip install -r requirements.txt