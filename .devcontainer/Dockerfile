FROM nstrumenta/toolchain:24.1.0a

# Install beads - git-backed issue tracker for AI agents
RUN curl -fsSL https://raw.githubusercontent.com/steveyegge/beads/main/install.sh | sh

# Ensure beads is in PATH
ENV PATH="/root/.local/bin:${PATH}"
