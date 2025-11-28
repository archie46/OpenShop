#!/bin/bash

# OpenShop Minikube Build and Deploy Script
# This script builds all Docker images and deploys them to Minikube

set -e  # Exit on error

# Parse command line arguments
START_STEP="${1:-build}"

echo "=========================================="
echo "OpenShop Minikube Deployment Script"
echo "=========================================="
echo ""
echo "Usage: $0 [step]"
echo "Steps: build, namespace, kafka, databases, microservices, all"
echo "Starting from: $START_STEP"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status() {
    echo -e "${CYAN}[STATUS]${NC} $1"
}

print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

# Function to show pod logs
show_pod_logs() {
    local pod_label=$1
    local pod_name=$2
    print_status "Fetching logs for $pod_name..."
    
    # Get the pod name
    POD=$(kubectl get pods -n openshop -l $pod_label -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    
    if [ -n "$POD" ]; then
        echo -e "${CYAN}--- Last 20 lines of $pod_name logs ---${NC}"
        kubectl logs -n openshop $POD --tail=20 2>/dev/null || echo "No logs available yet"
        echo -e "${CYAN}--- End of logs ---${NC}"
    else
        print_warn "Pod for $pod_name not found yet"
    fi
}

# Function to wait for pod with detailed status
wait_for_pod() {
    local label=$1
    local name=$2
    local timeout=$3
    
    print_step "Waiting for $name to be ready..."
    
    local elapsed=0
    local interval=5
    
    while [ $elapsed -lt $timeout ]; do
        # Check pod status
        POD_STATUS=$(kubectl get pods -n openshop -l $label -o jsonpath='{.items[0].status.phase}' 2>/dev/null)
        POD_READY=$(kubectl get pods -n openshop -l $label -o jsonpath='{.items[0].status.conditions[?(@.type=="Ready")].status}' 2>/dev/null)
        
        if [ "$POD_STATUS" = "Running" ] && [ "$POD_READY" = "True" ]; then
            print_info "✓ $name is ready!"
            return 0
        fi
        
        # Show current status
        if [ -n "$POD_STATUS" ]; then
            print_status "$name status: $POD_STATUS (Ready: ${POD_READY:-False}) - ${elapsed}s elapsed"
            
            # Show logs every 15 seconds
            if [ $((elapsed % 15)) -eq 0 ] && [ $elapsed -gt 0 ]; then
                show_pod_logs "$label" "$name"
            fi
        else
            print_status "$name: Pod not scheduled yet - ${elapsed}s elapsed"
        fi
        
        sleep $interval
        elapsed=$((elapsed + interval))
    done
    
    print_warn "$name did not become ready within ${timeout}s"
    show_pod_logs "$label" "$name"
    return 1
}

# Function to check Kafka is actually accepting connections
check_kafka_ready() {
    print_step "Verifying Kafka is accepting connections..."
    
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        # Try to list topics to verify Kafka is ready
        if kubectl exec -n openshop deployment/kafka -- kafka-topics --bootstrap-server localhost:9092 --list &>/dev/null; then
            print_info "✓ Kafka is ready and accepting connections!"
            return 0
        fi
        
        attempt=$((attempt + 1))
        print_status "Kafka connection attempt $attempt/$max_attempts..."
        sleep 5
    done
    
    print_warn "Kafka may not be fully ready yet"
    show_pod_logs "app=kafka" "kafka"
    return 1
}

# Check if Minikube is running
print_info "Checking Minikube status..."
if ! minikube status > /dev/null 2>&1; then
    print_error "Minikube is not running. Please start Minikube first with: minikube start --cpus=4 --memory=8192"
    exit 1
fi

print_info "✓ Minikube is running!"

# Configure Docker to use Minikube's Docker daemon
print_info "Configuring Docker to use Minikube's Docker daemon..."
eval $(minikube -p minikube docker-env)

# Navigate to project root
cd "$(dirname "$0")/.."

# Build step
if [[ "$START_STEP" == "build" || "$START_STEP" == "all" ]]; then
    print_step "Building all microservices and UI..."
    echo ""

    # First, build common-events module (required by other services)
    print_info "Building common-events (shared module)..."
    cd common-events
    
    print_status "Running Maven build for common-events..."
    # common-events doesn't have mvnw, use mvn directly
    if command -v mvn &> /dev/null; then
        BUILD_OUTPUT=$(mktemp)
        if mvn clean install -DskipTests > "$BUILD_OUTPUT" 2>&1; then
            print_info "  ✓ Maven build successful"
            rm "$BUILD_OUTPUT"
        else
            print_error "  ✗ Maven build failed for common-events"
            echo ""
            print_warn "Build output:"
            echo "----------------------------------------"
            cat "$BUILD_OUTPUT"
            echo "----------------------------------------"
            rm "$BUILD_OUTPUT"
            exit 1
        fi
    else
        print_error "  ✗ Maven (mvn) command not found. Please install Maven."
        print_info "On macOS: brew install maven"
        print_info "On Ubuntu/Debian: sudo apt-get install maven"
        exit 1
    fi
    
    cd ..
    print_info "✓ common-events completed!"
    echo ""

    # Now build the microservices
    services=("userservice" "productservice" "orderservice" "paymentservice" "cartservice" "inventoryservice" "shippingservice" "apigateway")

    for service in "${services[@]}"; do
        print_info "Building $service..."
        
        # Navigate to service directory
        cd "$service"
        
        # Build with Maven
        print_status "Running Maven build for $service..."
        BUILD_OUTPUT=$(mktemp)
        if ./mvnw clean package -DskipTests > "$BUILD_OUTPUT" 2>&1; then
            print_info "  ✓ Maven build successful"
            rm "$BUILD_OUTPUT"
        else
            print_error "  ✗ Maven build failed for $service"
            echo ""
            print_warn "Build output:"
            echo "----------------------------------------"
            tail -100 "$BUILD_OUTPUT"
            echo "----------------------------------------"
            rm "$BUILD_OUTPUT"
            exit 1
        fi
        
        # Build Docker image
        print_status "Building Docker image for $service..."
        
        # Determine image name based on service
        if [ "$service" = "apigateway" ]; then
            image_name="api-gateway:latest"
        else
            image_name="${service/service/}-service:latest"
        fi
        
        # Delete old Docker image if it exists
        print_status "Removing old Docker image if exists: $image_name..."
        docker rmi -f "$image_name" 2>/dev/null || true
        print_info "  ✓ Old image removed (if existed)"
        
        BUILD_OUTPUT=$(mktemp)
        if docker build --no-cache -t "$image_name" . > "$BUILD_OUTPUT" 2>&1; then
            print_info "  ✓ Docker image built: $image_name"
            rm "$BUILD_OUTPUT"
        else
            print_error "  ✗ Docker build failed for $service"
            echo ""
            print_warn "Docker build output:"
            echo "----------------------------------------"
            tail -100 "$BUILD_OUTPUT"
            echo "----------------------------------------"
            rm "$BUILD_OUTPUT"
            exit 1
        fi
        
        # Navigate back to project root
        cd ..
        
        print_info "✓ $service completed!"
        echo ""
    done

    print_info "=========================================="
    print_info "All backend services built successfully!"
    print_info "=========================================="
    echo ""

    # Build UI
    print_info "Building UI..."
    cd ui
    
    # Copy k8s environment file for build
    print_status "Preparing UI for Kubernetes deployment..."
    cp .env.k8s .env
    
    # Build Docker image
    print_status "Building Docker image for UI..."
    
    # Delete old Docker image if it exists
    print_status "Removing old Docker image if exists: openshop-ui:latest..."
    docker rmi -f openshop-ui:latest 2>/dev/null || true
    print_info "  ✓ Old image removed (if existed)"
    
    BUILD_OUTPUT=$(mktemp)
    if docker build --no-cache -t openshop-ui:latest . > "$BUILD_OUTPUT" 2>&1; then
        print_info "  ✓ Docker image built: openshop-ui:latest"
        rm "$BUILD_OUTPUT"
    else
        print_error "  ✗ Docker build failed for UI"
        echo ""
        print_warn "Docker build output:"
        echo "----------------------------------------"
        cat "$BUILD_OUTPUT"
        echo "----------------------------------------"
        rm "$BUILD_OUTPUT"
        exit 1
    fi
    
    # Navigate back to project root
    cd ..
    
    print_info "✓ UI build completed!"
    echo ""
else
    print_info "Skipping build step (starting from: $START_STEP)"
    echo ""
fi

# Deploy to Kubernetes
cd k8s

# Namespace step
if [[ "$START_STEP" == "build" || "$START_STEP" == "all" || "$START_STEP" == "namespace" ]]; then
    print_step "Deploying to Kubernetes..."
    echo ""

    print_info "Creating namespace..."
    kubectl apply -f 00-namespace.yaml

    print_info "Creating secrets..."
    kubectl apply -f 01-secrets.yaml

    print_info "Creating config maps..."
    kubectl apply -f 02-configmap.yaml
    echo ""
else
    print_info "Skipping namespace/config step"
    echo ""
fi

# Kafka step (with Strimzi)
if [[ "$START_STEP" == "build" || "$START_STEP" == "all" || "$START_STEP" == "namespace" || "$START_STEP" == "kafka" ]]; then
    print_step "Deploying Kafka with Strimzi (KRaft mode - no ZooKeeper needed)..."
    
    # Check if Strimzi operator is already installed
    if ! kubectl get deployment strimzi-cluster-operator -n openshop &>/dev/null; then
        print_info "Installing Strimzi Kafka operator..."
        kubectl create -f 'https://strimzi.io/install/latest?namespace=openshop' -n openshop
        
        print_info "Waiting for Strimzi operator to be ready..."
        kubectl wait --for=condition=ready pod -l name=strimzi-cluster-operator -n openshop --timeout=300s || {
            print_error "Strimzi operator failed to start"
            show_pod_logs "name=strimzi-cluster-operator" "Strimzi Operator"
            exit 1
        }
        print_info "✓ Strimzi operator is ready!"
    else
        print_info "✓ Strimzi operator already installed"
    fi
    
    echo ""
    print_info "Deploying Kafka cluster..."
    kubectl apply -f 03-kafka-zookeeper.yaml

    echo ""
    print_info "Waiting for Kafka cluster to be ready..."
    # Wait for Kafka broker pod
    wait_for_pod "strimzi.io/cluster=openshop-kafka,strimzi.io/pool-name=broker" "Kafka Broker" 300
    
    # Wait for Entity Operator
    wait_for_pod "app.kubernetes.io/name=entity-operator,strimzi.io/cluster=openshop-kafka" "Kafka Entity Operator" 180
    
    # Wait for Kafka resource to be ready
    print_info "Waiting for Kafka cluster resource to be ready..."
    kubectl wait kafka/openshop-kafka --for=condition=Ready --timeout=300s -n openshop || {
        print_warn "Kafka cluster may not be fully ready yet"
        kubectl describe kafka openshop-kafka -n openshop
    }
    
    print_info "✓ Kafka cluster deployed successfully!"
    echo ""
else
    print_info "Skipping Kafka deployment"
    echo ""
fi

# Databases step
if [[ "$START_STEP" == "build" || "$START_STEP" == "all" || "$START_STEP" == "namespace" || "$START_STEP" == "kafka" || "$START_STEP" == "databases" ]]; then
    print_step "Deploying databases..."
    kubectl apply -f 04-databases.yaml

    echo ""
    print_info "Waiting for all 8 databases to be ready..."
    print_info "Databases: user, product, order, cart, inventory, payment, notification, shipping"
    echo ""

    # Wait for each database
    databases=(
        "app=postgres-user:User DB"
        "app=postgres-product:Product DB"
        "app=postgres-order:Order DB"
        "app=postgres-cart:Cart DB"
        "app=postgres-inventory:Inventory DB"
        "app=postgres-payment:Payment DB"
        "app=postgres-notification:Notification DB"
        "app=postgres-shipping:Shipping DB"
    )

    for db in "${databases[@]}"; do
        IFS=':' read -r label name <<< "$db"
        wait_for_pod "$label" "$name" 300
    done
    echo ""
else
    print_info "Skipping databases deployment"
    echo ""
fi

# Microservices step
if [[ "$START_STEP" == "build" || "$START_STEP" == "all" || "$START_STEP" == "namespace" || "$START_STEP" == "kafka" || "$START_STEP" == "databases" || "$START_STEP" == "microservices" ]]; then
    print_step "Deploying microservices..."
    kubectl apply -f 05-microservices.yaml

    echo ""
    print_info "Waiting for microservices to start (30 seconds)..."
    sleep 30
    
    # Deploy UI
    print_step "Deploying UI..."
    kubectl apply -f 06-ui.yaml
    
    echo ""
    print_info "Waiting for UI to be ready..."
    wait_for_pod "app=openshop-ui" "OpenShop UI" 180
    echo ""
else
    print_info "Skipping microservices and UI deployment"
    echo ""
fi

echo ""
print_info "=========================================="
print_info "Checking Deployment Status"
print_info "=========================================="
echo ""

# Show detailed pod status
print_status "Pod Status:"
kubectl get pods -n openshop -o wide

echo ""
print_status "Service Status:"
kubectl get services -n openshop

echo ""
print_status "Persistent Volume Claims:"
kubectl get pvc -n openshop

echo ""
print_info "=========================================="
print_info "Deployment Complete!"
print_info "=========================================="

# Get service URLs (LoadBalancer type)
print_info "Getting service URLs (LoadBalancer type)..."
echo ""

# Function to check if service is LoadBalancer type
check_loadbalancer_service() {
    local service_name=$1
    local service_type=$(kubectl get svc $service_name -n openshop -o jsonpath='{.spec.type}' 2>/dev/null)
    
    if [ "$service_type" = "LoadBalancer" ]; then
        return 0
    else
        return 1
    fi
}

# Check if services are LoadBalancer type
if check_loadbalancer_service "api-gateway" && check_loadbalancer_service "openshop-ui"; then
    print_info "Services configured as LoadBalancer type"
    
    # Check if minikube tunnel is running
    print_status "Checking for external IPs..."
    
    GATEWAY_EXTERNAL_IP=$(kubectl get svc api-gateway -n openshop -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)
    UI_EXTERNAL_IP=$(kubectl get svc openshop-ui -n openshop -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)
    
    if [ -n "$GATEWAY_EXTERNAL_IP" ] && [ -n "$UI_EXTERNAL_IP" ]; then
        # External IPs are assigned (tunnel is running)
        print_info "✓ External IPs assigned via minikube tunnel"
        GATEWAY_URL="http://${GATEWAY_EXTERNAL_IP}:8080"
        UI_URL="http://${UI_EXTERNAL_IP}"
    else
        # No external IPs (tunnel not running)
        print_warn "⚠️  External IPs not assigned - minikube tunnel is required!"
        GATEWAY_URL="<pending - start minikube tunnel>"
        UI_URL="<pending - start minikube tunnel>"
    fi
else
    # Fallback to NodePort logic (for backward compatibility)
    print_info "Services using NodePort type"
    
    # Get Minikube IP
    print_status "Getting Minikube IP address..."
    MINIKUBE_IP=$(minikube ip 2>/dev/null)
    
    if [ -z "$MINIKUBE_IP" ]; then
        print_warn "Could not get Minikube IP"
        MINIKUBE_IP="<minikube-ip>"
    fi
    
    print_info "Minikube IP: $MINIKUBE_IP"
    
    # Get NodePort values
    GATEWAY_PORT=$(kubectl get svc api-gateway -n openshop -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null)
    UI_PORT=$(kubectl get svc openshop-ui -n openshop -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null)
    
    if [ -n "$GATEWAY_PORT" ]; then
        GATEWAY_URL="http://${MINIKUBE_IP}:${GATEWAY_PORT}"
    else
        GATEWAY_URL="Service not ready"
    fi
    
    if [ -n "$UI_PORT" ]; then
        UI_URL="http://${MINIKUBE_IP}:${UI_PORT}"
    else
        UI_URL="Service not ready"
    fi
fi

echo ""
print_info "=========================================="
print_info "Service Access Information:"
print_info "=========================================="
print_info "API Gateway: $GATEWAY_URL"
print_info "UI: $UI_URL"
echo ""
print_info "=========================================="
print_info "Useful Commands"
print_info "=========================================="
echo ""
echo -e "${GREEN}Access OpenShop UI:${NC}"
echo "  minikube service openshop-ui -n openshop"
echo "  Or visit: $UI_URL"
echo ""
echo -e "${GREEN}Access API Gateway:${NC}"
echo "  minikube service api-gateway -n openshop"
echo "  Or visit: $GATEWAY_URL"
echo ""
echo -e "${GREEN}View logs for a specific service:${NC}"
echo "  kubectl logs -n openshop -f deployment/<service-name>"
echo "  Example: kubectl logs -n openshop -f deployment/user-service"
echo ""
echo -e "${GREEN}View logs for Kafka broker:${NC}"
echo "  kubectl logs -n openshop -f openshop-kafka-broker-0"
echo ""
echo -e "${GREEN}View logs for Kafka Entity Operator:${NC}"
echo "  kubectl logs -n openshop -f deployment/openshop-kafka-entity-operator"
echo ""
echo -e "${GREEN}View Strimzi operator logs:${NC}"
echo "  kubectl logs -n openshop -f deployment/strimzi-cluster-operator"
echo ""
echo -e "${GREEN}Check Kafka cluster status:${NC}"
echo "  kubectl get kafka openshop-kafka -n openshop"
echo "  kubectl describe kafka openshop-kafka -n openshop"
echo ""
echo -e "${GREEN}List Kafka topics:${NC}"
echo "  kubectl get kafkatopic -n openshop"
echo ""
echo -e "${GREEN}Execute command in Kafka broker pod:${NC}"
echo "  kubectl exec -n openshop -it openshop-kafka-broker-0 -c kafka -- bin/kafka-topics.sh --bootstrap-server localhost:9092 --list"
echo ""
echo -e "${GREEN}View logs for a database:${NC}"
echo "  kubectl logs -n openshop -f deployment/postgres-user"
echo ""
echo -e "${GREEN}Watch pod status:${NC}"
echo "  kubectl get pods -n openshop -w"
echo ""
echo -e "${GREEN}Check pod details:${NC}"
echo "  kubectl describe pod -n openshop <pod-name>"
echo ""
echo -e "${GREEN}Port forward to a service:${NC}"
echo "  kubectl port-forward -n openshop svc/<service-name> <local-port>:<service-port>"
echo ""

print_warn "Note: It may take a few minutes for all services to be fully ready."
print_warn "Monitor progress with: kubectl get pods -n openshop -w"
echo ""

# Show any pods that are not running
NOT_RUNNING=$(kubectl get pods -n openshop --field-selector=status.phase!=Running --no-headers 2>/dev/null | wc -l | tr -d ' ')
if [ "$NOT_RUNNING" -gt "0" ]; then
    print_warn "Some pods are not yet running. Check status with:"
    echo "  kubectl get pods -n openshop"
    echo ""
    print_info "To see logs of problematic pods:"
    kubectl get pods -n openshop --field-selector=status.phase!=Running --no-headers 2>/dev/null | awk '{print "  kubectl logs -n openshop " $1}'
fi

# Show LoadBalancer-specific instructions
if check_loadbalancer_service "api-gateway" && check_loadbalancer_service "openshop-ui"; then
    echo ""
    print_info "=========================================="
    print_info "🚨 IMPORTANT: LoadBalancer Configuration"
    print_info "=========================================="
    echo ""
    
    if [ -z "$GATEWAY_EXTERNAL_IP" ] || [ -z "$UI_EXTERNAL_IP" ]; then
        print_warn "Services are configured as LoadBalancer type"
        print_warn "External IPs are currently PENDING - tunnel required!"
        echo ""
        echo -e "${CYAN}Your services will be accessible at:${NC}"
        echo -e "  ${GREEN}OpenShop UI:${NC}    http://<EXTERNAL-IP>:80"
        echo -e "  ${GREEN}API Gateway:${NC}    http://<EXTERNAL-IP>:8080"
        echo ""
        echo -e "${RED}═══════════════════════════════════════════════════${NC}"
        echo -e "${RED}  ACTION REQUIRED: Start minikube tunnel${NC}"
        echo -e "${RED}═══════════════════════════════════════════════════${NC}"
        echo ""
        print_info "Follow these steps:"
        echo ""
        echo -e "${YELLOW}  Step 1: Open a NEW terminal window${NC}"
        echo ""
        echo -e "${YELLOW}  Step 2: Run this command:${NC}"
        echo -e "${GREEN}         sudo minikube tunnel${NC}"
        echo ""
        echo -e "${YELLOW}  Step 3: Enter your password when prompted${NC}"
        echo ""
        echo -e "${YELLOW}  Step 4: Keep that terminal window open${NC}"
        echo ""
        echo -e "${CYAN}Once the tunnel is running:${NC}"
        echo ""
        echo -e "  • External IPs will be automatically assigned"
        echo -e "  • Services will be accessible via LoadBalancer IPs"
        echo -e "  • Run ${GREEN}./k8s/access-services.sh${NC} to see the URLs"
        echo ""
        print_info "Manual check:"
        echo "  kubectl get services -n openshop api-gateway openshop-ui"
        echo ""
        print_info "For detailed documentation, see: k8s/LOADBALANCER-SETUP.md"
    else
        print_info "✅ minikube tunnel is active!"
        print_info "External IPs have been assigned"
        echo ""
        echo -e "${CYAN}Your services are now accessible at:${NC}"
        echo ""
        echo -e "  ${GREEN}OpenShop UI:${NC}    $UI_URL"
        echo -e "  ${GREEN}API Gateway:${NC}    $GATEWAY_URL"
        echo ""
        print_info "Quick access check:"
        echo -e "  ${GREEN}./k8s/access-services.sh${NC}"
        echo ""
        print_info "Open UI in browser:"
        echo -e "  ${GREEN}open $UI_URL${NC}"
    fi
fi

echo ""
print_info "=========================================="
print_info "Deployment script completed!"
print_info "=========================================="
