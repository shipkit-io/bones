#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Pulling environment variables from Vercel...${NC}"
vercel env pull .env.production

echo -e "${YELLOW}Creating .env.local from .env.production...${NC}"
cp .env.production .env.local

# Modify local values
echo -e "${YELLOW}Updating local values...${NC}"
sed -i '' 's|https://shipkit.io|http://localhost:3000|g' .env.local
sed -i '' 's|^DATABASE_URL=.*|DATABASE_URL="postgresql://postgres:password@localhost:5432/shipkit"|g' .env.local

echo -e "${GREEN}Done! Your .env.local file has been created with production secrets and local overrides.${NC}"
echo -e "${YELLOW}Remember to never commit .env.local or .env.production to version control!${NC}"
