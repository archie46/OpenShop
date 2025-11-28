#!/bin/bash

# OpenShop Local Startup Script
# This script starts all services locally for development

set -e

# Load environment variables from .env file
if [ -f .env ]; then
    echo "Loading environment variables from .env file..."
    export $(grep -v '^#' .env | grep -v '^[[:space:]]*$' | xargs)
    echo "✓ Environment variables loaded"
    echo ""
fi

echo "============================================"
echo "OpenShop Local Development Startup"
echo "PostgreSQL Migration - Database Required"
echo "============================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
check_prerequisites() {
    echo "Checking prerequisites..."
    
    if ! command -v java &> /dev/null; then
        echo -e "${RED}Error: Java is not installed${NC}"
        exit 1
    fi
    
    if ! command -v mvn &> /dev/null; then
        echo -e "${RED}Error: Maven is not installed${NC}"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Error: Docker is not installed${NC}"
        echo -e "${RED}Docker is required to run PostgreSQL databases${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Java found: $(java -version 2>&1 | head -n 1)${NC}"
    echo -e "${GREEN}✓ Maven found: $(mvn -version | head -n 1)${NC}"
    echo -e "${GREEN}✓ Docker found: $(docker --version)${NC}"
    echo ""
}

# Check and start PostgreSQL containers
check_postgres() {
    echo "Checking PostgreSQL databases..."
    
    # Check if any postgres containers are running
    postgres_count=$(docker ps --filter "name=postgres-" --format "{{.Names}}" | wc -l)
    
    if [ "$postgres_count" -eq 0 ]; then
        echo -e "${YELLOW}⚠ No PostgreSQL containers are running${NC}"
        echo ""
        echo "PostgreSQL databases are required for all services."
        echo "Would you like to start them now? (y/n)"
        read -r response
        
        if [[ "$response" =~ ^[Yy]$ ]]; then
            echo ""
            ./start-databases.sh
            if [ $? -ne 0 ]; then
                echo -e "${RED}Failed to start databases${NC}"
                exit 1
            fi
        else
            echo -e "${RED}Cannot start services without PostgreSQL databases${NC}"
            echo ""
            echo "To start PostgreSQL manually, run:"
            echo "  ./start-databases.sh"
            echo ""
            exit 1
        fi
    else
        echo -e "${GREEN}✓ Found $postgres_count PostgreSQL container(s) running${NC}"
        docker ps --filter "name=postgres-" --format "  - {{.Names}} ({{.Status}})"
        echo ""
    fi
    
    # Verify PostgreSQL ports are accessible
    echo "Verifying PostgreSQL connectivity..."
    local ports=(5432 5433 5434 5435 5436 5437 5438 5439)
    local names=("user" "product" "order" "cart" "inventory" "payment" "notification" "shipping")
    
    for i in "${!ports[@]}"; do
        if nc -z localhost ${ports[$i]} 2>/dev/null; then
            echo -e "  ${GREEN}✓${NC} ${names[$i]} database (port ${ports[$i]})"
        else
            echo -e "  ${RED}✗${NC} ${names[$i]} database (port ${ports[$i]}) - not accessible"
        fi
    done
    echo ""
}

# Build all services
build_services() {
    echo "Building all services..."
    mvn clean install -DskipTests
    echo -e "${GREEN}✓ Build complete${NC}"
    echo ""
}

# Function to start a service in a new terminal
start_service() {
    local service_name=$1
    local service_dir=$2
    local port=$3
    
    echo -e "${YELLOW}Starting $service_name on port $port...${NC}"
    
    # Use osascript for macOS to open new terminal windows
    if [[ "$OSTYPE" == "darwin"* ]]; then
        osascript <<EOF
tell application "Terminal"
    do script "cd '$PWD/$service_dir' && mvn spring-boot:run -Dspring-boot.run.profiles=local"
end tell
EOF
    # Use gnome-terminal for Linux
    elif command -v gnome-terminal &> /dev/null; then
        gnome-terminal -- bash -c "cd '$PWD/$service_dir' && mvn spring-boot:run -Dspring-boot.run.profiles=local; exec bash"
    # Use xterm as fallback
    elif command -v xterm &> /dev/null; then
        xterm -e "cd '$PWD/$service_dir' && mvn spring-boot:run -Dspring-boot.run.profiles=local" &
    else
        echo -e "${RED}Could not find a terminal emulator. Please start services manually.${NC}"
        exit 1
    fi
    
    sleep 2
}

# Wait for service to be ready
wait_for_service() {
    local service_name=$1
    local port=$2
    local max_attempts=30
    local attempt=0
    
    echo -n "Waiting for $service_name to start on port $port..."
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s http://localhost:$port/actuator/health > /dev/null 2>&1; then
            echo -e " ${GREEN}✓${NC}"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e " ${RED}✗ (timeout)${NC}"
    echo -e "${YELLOW}Warning: $service_name did not start within expected time${NC}"
    return 1
}

# Main execution
main() {
    check_prerequisites
    check_postgres
    
    echo ""
    echo "Starting services in order..."
    echo "============================================"
    echo ""
    
    # Start services in dependency order
    start_service "User Service" "userservice" "8081"
    wait_for_service "User Service" "8081"
    
    start_service "Inventory Service" "inventoryservice" "8086"
    wait_for_service "Inventory Service" "8086"
    
    start_service "Product Service" "productservice" "8082"
    wait_for_service "Product Service" "8082"
    
    start_service "Payment Service" "paymentservice" "8084"
    wait_for_service "Payment Service" "8084"
    
    start_service "Order Service" "orderservice" "8083"
    wait_for_service "Order Service" "8083"
    
    start_service "Cart Service" "cartservice" "8085"
    wait_for_service "Cart Service" "8085"
    
    
    start_service "Shipping Service" "shippingservice" "8088"
    wait_for_service "Shipping Service" "8088"
    
    start_service "API Gateway" "apigateway" "8080"
    wait_for_service "API Gateway" "8080"
    
    echo ""
    echo "============================================"
    echo -e "${GREEN}All services started successfully!${NC}"
    echo "============================================"
    echo ""
    echo -e "${GREEN}PostgreSQL Migration Active!${NC}"
    echo "All services are using PostgreSQL for persistent storage."
    echo ""
    echo "Service URLs:"
    echo "  API Gateway:          http://localhost:8080"
    echo "  User Service:         http://localhost:8081"
    echo "  Product Service:      http://localhost:8082"
    echo "  Order Service:        http://localhost:8083"
    echo "  Payment Service:      http://localhost:8084"
    echo "  Cart Service:         http://localhost:8085"
    echo "  Inventory Service:    http://localhost:8086"
    echo "  Notification Service: http://localhost:8087"
    echo "  Shipping Service:     http://localhost:8088"
    echo ""
    echo "PostgreSQL Databases (running in Docker):"
    echo "  User DB:         localhost:5432"
    echo "  Product DB:      localhost:5433"
    echo "  Order DB:        localhost:5434"
    echo "  Cart DB:         localhost:5435"
    echo "  Inventory DB:    localhost:5436"
    echo "  Payment DB:      localhost:5437"
    echo "  Notification DB: localhost:5438"
    echo "  Shipping DB:     localhost:5439"
    echo ""
    echo "Check the logs in each terminal window for details."
    echo ""
    echo "Useful commands:"
    echo "  Test API:           curl http://localhost:8080/actuator/health"
    echo "  View DB status:     docker ps --filter \"name=postgres-\""
    echo "  Stop databases:     docker-compose down"
    echo "  Read guide:         cat POSTGRESQL_MIGRATION_GUIDE.md"
    echo ""
}

main
