FROM mcr.microsoft.com/devcontainers/javascript-node:22

# Set the working directory in the container
WORKDIR /workspace

# WARNING: Setting NODE_TLS_REJECT_UNAUTHORIZED to 0 disables SSL certificate verification.
# This is a security risk and should only be used if you understand the implications
# and have no other alternative (e.g., in a controlled corporate environment with a custom CA).
# Consider resolving the underlying certificate issue instead.
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
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
