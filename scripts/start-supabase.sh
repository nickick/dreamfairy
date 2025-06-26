#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🚀 Starting Supabase setup..."

# Function to check if Docker is running
check_docker() {
    docker info >/dev/null 2>&1
    return $?
}

# Check if Docker is running
if ! check_docker; then
    echo -e "${YELLOW}Docker is not running. Starting Docker...${NC}"
    
    # Try to start Docker Desktop on macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # Check if Docker is installed via Homebrew
        if [ -d "/Applications/Docker.app" ]; then
            open -a Docker
        elif [ -d "/opt/homebrew/Caskroom/docker" ] || [ -d "/usr/local/Caskroom/docker" ]; then
            # Docker installed via Homebrew Cask
            open -a Docker
        else
            echo -e "${RED}Docker Desktop not found. Please install it with: brew install --cask docker${NC}"
            exit 1
        fi
        echo "Waiting for Docker to start..."
        
        # Wait for Docker to be ready (max 30 seconds)
        counter=0
        while ! check_docker && [ $counter -lt 30 ]; do
            sleep 1
            counter=$((counter + 1))
            echo -ne "."
        done
        echo ""
        
        if ! check_docker; then
            echo -e "${RED}Failed to start Docker after 30 seconds.${NC}"
            echo "Please start Docker Desktop manually and try again."
            exit 1
        fi
    else
        echo -e "${RED}Please start Docker manually and run this script again.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ Docker is running${NC}"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}Supabase CLI is not installed.${NC}"
    echo "Please install it with: npm install -g supabase"
    exit 1
fi

echo -e "${GREEN}✓ Supabase CLI is installed${NC}"

# Start Supabase
echo -e "${YELLOW}Starting Supabase...${NC}"
supabase start

# Check if Supabase started successfully
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Supabase is running!${NC}"
    echo ""
    echo "🎉 Setup complete! Your local Supabase instance is ready."
    echo ""
    echo "Supabase Studio: http://localhost:54323"
    echo "API URL: http://localhost:54321"
    echo ""
    echo "To serve Edge Functions locally, run: supabase functions serve"
else
    echo -e "${RED}Failed to start Supabase.${NC}"
    exit 1
fi