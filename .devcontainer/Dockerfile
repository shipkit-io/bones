FROM mcr.microsoft.com/devcontainers/javascript-node:22

# Set the working directory in the container
WORKDIR /workspace

# No NODE_TLS_REJECT_UNAUTHORIZED here on purpose: it is process-wide, so it turns
# off certificate verification for every Node TLS connection in the container, the
# Postgres client included. A custom CA belongs in the trust store, or scoped to
# the single RUN line that needs it.
ENV NODE_ENV=development

# Copy package manager files. These are copied first to leverage Docker cache
# so that dependencies are not re-installed if only application code changes.
COPY package.json pnpm-lock.yaml ./

# Install dependencies using pnpm.
RUN pnpm install --child-concurrency=4

# Make scripts in node_modules/.bin executable.
# The '|| true' is kept from the original command to ignore errors if any.
RUN chmod +x /workspace/node_modules/.bin/* 2>/dev/null || true

# Application code is mounted from the host via docker-compose, so no 'COPY . .'
# This keeps the development workflow fast as changes on the host are reflected immediately.

# Expose the Next.js port (default is 3000)
EXPOSE 3000

# Default command to start the Next.js development server.
CMD ["pnpm", "run", "dev"]
