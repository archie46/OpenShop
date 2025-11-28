#!/bin/bash

# Stop script for all OpenShop services
# This script stops services running both in Docker and locally

set -e

# Load environment variables from .env file
if [ -f .env ]; then
    echo "Loading environment variables from .env file..."
    export $(grep -v '^#' .env | grep -v '^[[:space:]]*$' | xargs)
    echo "✓ Environment variables loaded"
    echo ""
fi

echo "============================================"
echo "OpenShop Stop Script"
echo "PostgreSQL Migration - Database Management"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Track what was stopped
stopped_docker=false
stopped_local=false

# Function to stop Docker Compose services
stop_docker_services() {
    echo -e "${BLUE}Checking for Docker Compose services...${NC}"
    
    if [ -f "docker-compose.yml" ]; then
        # Check if any containers are running
        if docker-compose ps -q 2>/dev/null | grep -q .; then
            echo -e "${YELLOW}Stopping Docker Compose services...${NC}"
            
            # Check if PostgreSQL containers are running
            local postgres_count=$(docker ps --filter "name=postgres-" --format "{{.Names}}" | wc -l)
            
            if [ "$postgres_count" -gt 0 ]; then
                echo ""
                echo -e "${YELLOW}⚠  PostgreSQL databases are running${NC}"
                echo "These databases contain persistent data."
                echo ""
                echo "Options:"
                echo "  1) Stop services only (keep PostgreSQL running)"
                echo "  2) Stop everything including PostgreSQL"
                echo ""
                echo -n "Enter choice (1 or 2): "
                read -r choice
                
                case $choice in
                    1)
                        echo ""
                        echo -e "${YELLOW}Stopping services (keeping PostgreSQL)...${NC}"
                        # Stop only service containers, not postgres
                        docker-compose stop user-service product-service order-service cart-service inventory-service payment-service shipping-service api-gateway kafka zookeeper 2>/dev/null || true
                        echo -e "${GREEN}✓ Services stopped (PostgreSQL still running)${NC}"
                        ;;
                    2)
                        echo ""
                        echo -e "${YELLOW}Stopping all services and PostgreSQL...${NC}"
                        docker-compose down
                        echo -e "${GREEN}✓ All services and databases stopped${NC}"
                        echo -e "${BLUE}Note: Database data is preserved in Docker volumes${NC}"
                        ;;
                    *)
                        echo ""
                        echo -e "${YELLOW}Invalid choice, stopping services only...${NC}"
                        docker-compose stop user-service product-service order-service cart-service inventory-service payment-service notification-service shipping-service api-gateway kafka zookeeper 2>/dev/null || true
                        echo -e "${GREEN}✓ Services stopped (PostgreSQL still running)${NC}"
                        ;;
                esac
            else
                docker-compose down
                echo -e "${GREEN}✓ Docker Compose services stopped${NC}"
            fi
            
            stopped_docker=true
        else
            echo -e "${YELLOW}No Docker Compose services running${NC}"
        fi
    else
        echo -e "${YELLOW}No docker-compose.yml found${NC}"
    fi
    echo ""
}

# Function to stop locally running Spring Boot services
stop_local_services() {
    echo -e "${BLUE}Checking for locally running Spring Boot services...${NC}"
    
    # List of service ports
    local ports=(8080 8081 8082 8083 8084 8085 8086 8087 8088)
    local services_found=false
    local pids_to_kill=()
    
    # Find all Java processes running Spring Boot
    if command -v pgrep &> /dev/null; then
        # Get all Java processes
        local java_pids=$(pgrep -f "spring-boot" 2>/dev/null || true)
        
        if [ -n "$java_pids" ]; then
            echo -e "${YELLOW}Found Spring Boot processes:${NC}"
            for pid in $java_pids; do
                # Get process details
                local process_info=$(ps -p $pid -o command= 2>/dev/null || true)
                if [ -n "$process_info" ]; then
                    echo "  PID $pid: $(echo $process_info | cut -c1-80)..."
                    pids_to_kill+=($pid)
                    services_found=true
                fi
            done
        fi
    fi
    
    # Also check for processes listening on our service ports
    for port in "${ports[@]}"; do
        if command -v lsof &> /dev/null; then
            local pid=$(lsof -ti :$port 2>/dev/null || true)
            if [ -n "$pid" ]; then
                # Check if we haven't already added this PID
                if [[ ! " ${pids_to_kill[@]} " =~ " ${pid} " ]]; then
                    local process_info=$(ps -p $pid -o command= 2>/dev/null || true)
                    echo -e "${YELLOW}Found process on port $port:${NC}"
                    echo "  PID $pid: $(echo $process_info | cut -c1-80)..."
                    pids_to_kill+=($pid)
                    services_found=true
                fi
            fi
        fi
    done
    
    if [ "$services_found" = true ]; then
        echo ""
        echo -e "${YELLOW}Stopping ${#pids_to_kill[@]} local service(s)...${NC}"
        
        for pid in "${pids_to_kill[@]}"; do
            if kill -0 $pid 2>/dev/null; then
                echo -n "  Stopping PID $pid..."
                kill $pid 2>/dev/null || true
                
                # Wait up to 10 seconds for graceful shutdown
                local waited=0
                while kill -0 $pid 2>/dev/null && [ $waited -lt 10 ]; do
                    sleep 1
                    waited=$((waited + 1))
                done
                
                # Force kill if still running
                if kill -0 $pid 2>/dev/null; then
                    echo -n " (force killing)..."
                    kill -9 $pid 2>/dev/null || true
                    sleep 1
                fi
                
                if ! kill -0 $pid 2>/dev/null; then
                    echo -e " ${GREEN}✓${NC}"
                else
                    echo -e " ${RED}✗ (failed)${NC}"
                fi
            fi
        done
        
        stopped_local=true
        echo -e "${GREEN}✓ Local services stopped${NC}"
    else
        echo -e "${YELLOW}No locally running services found${NC}"
    fi
    echo ""
}

# Function to close Terminal windows (macOS specific)
close_terminal_windows() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo -e "${BLUE}Checking for Terminal windows...${NC}"
        
        # Count Terminal windows (excluding the current one)
        local terminal_count=$(osascript -e 'tell application "Terminal" to count windows' 2>/dev/null || echo "0")
        
        if [ "$terminal_count" -gt 1 ]; then
            echo -e "${YELLOW}Found $terminal_count Terminal windows${NC}"
            echo "Do you want to close all Terminal windows (except this one)? (y/n)"
            read -r response
            
            if [[ "$response" =~ ^[Yy]$ ]]; then
                osascript <<EOF 2>/dev/null || true
tell application "Terminal"
    set windowCount to count windows
    if windowCount > 1 then
        repeat with i from 2 to windowCount
            try
                close window 2
            end try
        end repeat
    end if
end tell
EOF
                echo -e "${GREEN}✓ Terminal windows closed${NC}"
            else
                echo -e "${YELLOW}Skipping Terminal window cleanup${NC}"
            fi
        else
            echo -e "${YELLOW}No additional Terminal windows to close${NC}"
        fi
        echo ""
    fi
}

# Main execution
main() {
    # Stop Docker services first
    stop_docker_services
    
    # Stop local services
    stop_local_services
    
    # Offer to close Terminal windows (macOS only)
    if [ "$stopped_local" = true ]; then
        close_terminal_windows
    fi
    
    # Check PostgreSQL status
    local postgres_running=false
    if command -v docker &> /dev/null; then
        local postgres_count=$(docker ps --filter "name=postgres-" --format "{{.Names}}" 2>/dev/null | wc -l)
        if [ "$postgres_count" -gt 0 ]; then
            postgres_running=true
        fi
    fi
    
    # Summary
    echo "============================================"
    if [ "$stopped_docker" = true ] || [ "$stopped_local" = true ]; then
        echo -e "${GREEN}✓ OpenShop services stopped successfully!${NC}"
        echo "============================================"
        echo ""
        if [ "$stopped_docker" = true ]; then
            echo "  - Docker Compose services stopped"
        fi
        if [ "$stopped_local" = true ]; then
            echo "  - Local services stopped"
        fi
        echo ""
        
        if [ "$postgres_running" = true ]; then
            echo -e "${GREEN}PostgreSQL Status:${NC}"
            echo "  ✓ PostgreSQL databases are still running"
            echo "  ✓ Your data is safe and ready for next startup"
            echo ""
            echo "PostgreSQL containers:"
            docker ps --filter "name=postgres-" --format "  - {{.Names}} ({{.Status}})"
            echo ""
            echo "To stop PostgreSQL:"
            echo "  docker-compose stop postgres-user postgres-product postgres-order postgres-cart postgres-inventory postgres-payment postgres-notification postgres-shipping"
            echo ""
            echo "To remove PostgreSQL (DELETES DATA):"
            echo "  docker-compose down -v"
        else
            echo -e "${YELLOW}PostgreSQL Status:${NC}"
            echo "  - PostgreSQL databases are stopped"
            echo ""
        fi
    else
        echo -e "${YELLOW}No running services found${NC}"
        echo "============================================"
        echo ""
    fi
    
    echo "To start services again:"
    echo "  - Locally: ./start-local.sh"
    echo "  - Docker: docker-compose up -d"
    echo ""
    echo "For more information: cat POSTGRESQL_MIGRATION_GUIDE.md"
    echo ""
}

# Run main function
main
