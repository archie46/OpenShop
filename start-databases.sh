#!/bin/bash

# OpenShop Database Startup Script
# This script only starts the PostgreSQL database containers

set -e

# Load environment variables from .env file
if [ -f .env ]; then
    echo "Loading environment variables from .env file..."
    export $(grep -v '^#' .env | grep -v '^[[:space:]]*$' | xargs)
    echo "✓ Environment variables loaded"
    echo ""
fi

echo "============================================"
echo "OpenShop PostgreSQL Database Startup"
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
    echo "Docker is required to run PostgreSQL databases"
    exit 1
fi

echo -e "${GREEN}✓ Docker found: $(docker --version)${NC}"
echo ""

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: docker-compose is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ docker-compose found${NC}"
echo ""

# List of database and infrastructure containers
databases=(
    "zookeeper"
    "kafka"
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

if [ $running_count -eq ${#databases[@]} ]; then
    echo -e "${GREEN}All infrastructure and database containers are already running!${NC}"
    echo ""
    echo "Infrastructure ports:"
    echo "  Zookeeper:       localhost:2181"
    echo "  Kafka:           localhost:9092"
    echo ""
    echo "Database ports:"
    echo "  User DB:         localhost:5432"
    echo "  Product DB:      localhost:5433"
    echo "  Order DB:        localhost:5434"
    echo "  Cart DB:         localhost:5435"
    echo "  Inventory DB:    localhost:5436"
    echo "  Payment DB:      localhost:5437"
    echo "  Notification DB: localhost:5438"
    echo "  Shipping DB:     localhost:5439"
    echo ""
    echo "To stop all: ./stop-databases.sh"
    echo "To reset Kafka topics: ./reset-kafka-topics.sh"
    exit 0
fi

# Start the infrastructure and database containers
echo "Starting Kafka, Zookeeper, and PostgreSQL containers..."
echo ""

docker-compose up -d ${databases[@]}

echo ""
echo "Waiting for infrastructure and databases to initialize..."
echo "  - Zookeeper (2181)"
echo "  - Kafka (9092)"
echo "  - PostgreSQL databases (5432-5439)"
sleep 15

# Verify all containers are running
echo ""
echo "Verifying database status..."
all_running=true
for db in "${databases[@]}"; do
    if docker ps --format '{{.Names}}' | grep -q "^${db}$"; then
        echo -e "  ${GREEN}✓${NC} $db started successfully"
    else
        echo -e "  ${RED}✗${NC} $db failed to start"
        all_running=false
    fi
done

echo ""
if [ "$all_running" = true ]; then
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}All infrastructure and databases started!${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo ""
    echo "Infrastructure Connection Details:"
    echo ""
    echo "  Zookeeper:"
    echo "    Host: localhost"
    echo "    Port: 2181"
    echo ""
    echo "  Kafka:"
    echo "    Bootstrap Server: localhost:9092"
    echo "    Topics: Auto-created by services"
    echo ""
    echo "Database Connection Details:"
    echo ""
    echo "  User DB:"
    echo "    Host: localhost"
    echo "    Port: 5432"
    echo "    Database: userdb"
    echo "    Username: openshop"
    echo "    Password: openshop123"
    echo ""
    echo "  Product DB:"
    echo "    Host: localhost"
    echo "    Port: 5433"
    echo "    Database: productdb"
    echo "    Username: openshop"
    echo "    Password: openshop123"
    echo ""
    echo "  Order DB:"
    echo "    Host: localhost"
    echo "    Port: 5434"
    echo "    Database: orderdb"
    echo "    Username: openshop"
    echo "    Password: openshop123"
    echo ""
    echo "  Cart DB:"
    echo "    Host: localhost"
    echo "    Port: 5435"
    echo "    Database: cartdb"
    echo "    Username: openshop"
    echo "    Password: openshop123"
    echo ""
    echo "  Inventory DB:"
    echo "    Host: localhost"
    echo "    Port: 5436"
    echo "    Database: inventorydb"
    echo "    Username: openshop"
    echo "    Password: openshop123"
    echo ""
    echo "  Payment DB:"
    echo "    Host: localhost"
    echo "    Port: 5437"
    echo "    Database: paymentdb"
    echo "    Username: openshop"
    echo "    Password: openshop123"
    echo ""
    echo "  Notification DB:"
    echo "    Host: localhost"
    echo "    Port: 5438"
    echo "    Database: notificationdb"
    echo "    Username: openshop"
    echo "    Password: openshop123"
    echo ""
    echo "  Shipping DB:"
    echo "    Host: localhost"
    echo "    Port: 5439"
    echo "    Database: shippingdb"
    echo "    Username: openshop"
    echo "    Password: openshop123"
    echo ""
    echo "Useful commands:"
    echo "  View running containers: docker ps"
    echo "  View container logs:     docker logs <container-name>"
    echo "  Stop all:                ./stop-databases.sh"
    echo "  Reset Kafka topics:      ./reset-kafka-topics.sh"
    echo "  Connect to database:     docker exec -it postgres-user-db psql -U openshop -d userdb"
    echo ""
    echo "Next step: Run services with ./start-local.sh"
else
    echo -e "${RED}============================================${NC}"
    echo -e "${RED}Some databases failed to start${NC}"
    echo -e "${RED}============================================${NC}"
    echo ""
    echo "Check the logs with:"
    echo "  docker-compose logs <service-name>"
    echo ""
    echo "Or check all logs:"
    echo "  docker-compose logs"
    exit 1
fi
