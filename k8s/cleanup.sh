#!/bin/bash

# OpenShop Minikube Cleanup Script
# This script removes all OpenShop resources from Minikube

echo "=========================================="
echo "OpenShop Minikube Cleanup Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Prompt for confirmation
echo ""
print_warn "This will delete ALL OpenShop resources from Minikube."
read -p "Are you sure you want to continue? (yes/no): " confirmation

if [ "$confirmation" != "yes" ]; then
    print_info "Cleanup cancelled."
    exit 0
fi

print_info "Starting cleanup..."

# Navigate to k8s directory
cd "$(dirname "$0")"

# Delete resources in reverse order
print_info "Deleting microservices..."
kubectl delete -f 05-microservices.yaml --ignore-not-found=true

print_info "Deleting databases..."
kubectl delete -f 04-databases.yaml --ignore-not-found=true

print_info "Deleting Kafka and Zookeeper..."
kubectl delete -f 03-kafka-zookeeper.yaml --ignore-not-found=true

print_info "Deleting config maps..."
kubectl delete -f 02-configmap.yaml --ignore-not-found=true

print_info "Deleting secrets..."
kubectl delete -f 01-secrets.yaml --ignore-not-found=true

print_info "Deleting namespace (this will delete everything in it)..."
kubectl delete -f 00-namespace.yaml --ignore-not-found=true

# Wait for namespace deletion
print_info "Waiting for namespace to be fully deleted..."
kubectl wait --for=delete namespace/openshop --timeout=120s 2>/dev/null || true

echo ""
print_info "=========================================="
print_info "Cleanup Complete!"
print_info "=========================================="

print_info "All OpenShop resources have been removed from Minikube."
echo ""
print_info "To verify cleanup, run:"
echo -e "${GREEN}kubectl get all -n openshop${NC}"
echo ""
print_info "To redeploy, run:"
echo -e "${GREEN}./build-and-deploy.sh${NC}"
