FROM nstrumenta/toolchain:24.1.0a

# Install beads - git-backed issue tracker for AI agents
RUN curl -fsSL https://raw.githubusercontent.com/steveyegge/beads/main/scripts/install.sh | bash

# Configure git to use beads merge driver globally in the container
RUN git config --global merge.beads.driver "bd merge %O %A %B" && \
    git config --global merge.beads.name "Beads JSONL merge driver"
