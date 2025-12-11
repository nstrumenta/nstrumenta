FROM nstrumenta/toolchain:24.1.0a

# Install beads - git-backed issue tracker for AI agents
RUN curl -fsSL https://raw.githubusercontent.com/steveyegge/beads/main/scripts/install.sh | bash

# Configure git to use beads merge driver globally in the container
RUN git config --global merge.beads.driver "bd merge %O %A %B" && \
    git config --global merge.beads.name "Beads JSONL merge driver"

# Install Chromium for Angular tests and Python build tools
RUN apt-get update && apt-get install -y chromium

# Install Python packaging tools for publishing
RUN python3 -m pip install --upgrade pip setuptools wheel twine

ENV CHROME_BIN=/usr/bin/chromium
