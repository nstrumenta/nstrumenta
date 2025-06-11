FROM node:24.1.0-bookworm-slim

# This is working, but could possibly be simplified
# I added the non-root user in an attempt to avoid --no-sandbox
# but then wasn't successful with that, cleaner example might look like the last answer here:
# https://stackoverflow.com/questions/50662388/running-headless-chrome-puppeteer-with-no-sandbox

# Install Chromium and its dependencies
RUN apt-get update && \
    apt-get install -y chromium fonts-liberation libasound2 && \
    rm -rf /var/lib/apt/lists/*


# run as non-root user for launching chromium from jest-puppeteer
ARG USERNAME=tester
ARG USER_UID=1001
ARG USER_GID=$USER_UID

# Create the user
RUN groupadd --gid $USER_GID $USERNAME \
  && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME \
  #
  # [Optional] Add sudo support. Omit if you don't need to install software after connecting.
  && apt-get update \
  && apt-get install -y sudo \
  && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
  && chmod 0440 /etc/sudoers.d/$USERNAME

# copy and change owner
# context is top level of nstrumenta repo
COPY . /home/$USERNAME/nstrumenta/
RUN chown -R $USERNAME:$USERNAME /home/$USERNAME/nstrumenta
# test package.json has relative path to nstrumenta folder
COPY ./cluster/integration-tests/browser-client/client/app /home/$USERNAME/projectRoot/cluster/integration-tests/browser-client/client/app/
RUN chown -R $USERNAME:$USERNAME /home/$USERNAME/projectRoot

USER $USERNAME
#install nstrumenta
WORKDIR /home/$USERNAME/nstrumenta
RUN npm install
RUN npm run build

#install tester app
WORKDIR /home/$USERNAME/projectRoot/cluster/integration-tests/browser-client/client/app
RUN npm install
# symlink directly, nstrumenta from package.json only contained cluster folder
RUN rm -rf ./node_modules/nstrumenta
RUN ln -s ~/nstrumenta ./node_modules/nstrumenta

#install chromium with puppeteer script
RUN node node_modules/puppeteer/install.js
RUN npm run build

ENTRYPOINT ["npm", "run", "test-from-docker-compose"]
# ENTRYPOINT ["tail", "-f", "/dev/null"]