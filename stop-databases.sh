#!/bin/bash

# OpenShop Database Stop Script
# This script stops all PostgreSQL database containers

set -e

# Load environment variables from .env file
if [ -f .env ]; then
    echo "Loading environment variables from .env file..."
    export $(grep -v '^#' .env | grep -v '^[[:space:]]*$' | xargs)
    echo "✓ Environment variables loaded"
    echo ""
fi

echo "============================================"
echo "OpenShop PostgreSQL Database Stop"
echo "============================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: docker-compose is not installed${NC}"
    exit 1
fi

# List of database containers
databases=(
    "postgres-user"
    "postgres-product"
    "postgres-order"
    "postgres-cart"
    "postgres-inventory"
    "postgres-payment"
    "postgres-notification"
    "postgres-shipping"
)

# Check current status
echo "Checking current database status..."
running_count=0
for db in "${databases[@]}"; do
    if docker ps --format '{{.Names}}' | grep -q "^${db}$"; then
        echo -e "  ${GREEN}✓${NC} $db is running"
        running_count=$((running_count + 1))
    else
        echo -e "  ${YELLOW}○${NC} $db is not running"
    fi
done
echo ""

if [ $running_count -eq 0 ]; then
    echo -e "${YELLOW}No database containers are running.${NC}"
    exit 0
fi

# Stop the database containers
echo "Stopping PostgreSQL database containers..."
echo ""

docker-compose stop ${databases[@]}

echo ""
echo "Verifying all containers are stopped..."
all_stopped=true
for db in "${databases[@]}"; do
    if docker ps --format '{{.Names}}' | grep -q "^${db}$"; then
        echo -e "  ${RED}✗${NC} $db is still running"
        all_stopped=false
    else
        echo -e "  ${GREEN}✓${NC} $db stopped successfully"
    fi
done

echo ""
if [ "$all_stopped" = true ]; then
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}All databases stopped successfully!${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo ""
    echo "The database containers are stopped but not removed."
    echo "Data is preserved in Docker volumes."
    echo ""
    echo "Useful commands:"
    echo "  Start databases:       ./start-databases.sh"
    echo "  Remove containers:     docker-compose rm ${databases[*]}"
    echo "  Remove volumes (⚠ deletes all data):"
    echo "                         docker-compose down -v"
    echo ""
else
    echo -e "${RED}============================================${NC}"
    echo -e "${RED}Some databases failed to stop${NC}"
    echo -e "${RED}============================================${NC}"
    echo ""
    echo "Try forcing stop with:"
    echo "  docker-compose down"
    exit 1
fi
