#!/bin/bash

# OpenShop Troubleshooting Script
# This script helps diagnose deployment issues

echo "=========================================="
echo "OpenShop Troubleshooting"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_section() {
    echo -e "\n${BLUE}=========================================="
    echo -e "$1"
    echo -e "==========================================${NC}\n"
}

# Check if namespace exists
print_section "1. Checking Namespace"
if kubectl get namespace openshop > /dev/null 2>&1; then
    print_info "✓ Namespace 'openshop' exists"
else
    print_error "✗ Namespace 'openshop' does not exist"
    echo "Run: kubectl apply -f 00-namespace.yaml"
    exit 1
fi

# Check all pods
print_section "2. Pod Status"
kubectl get pods -n openshop -o wide

# Check for pods not running
print_section "3. Problematic Pods"
echo "Pods NOT in Running state:"
kubectl get pods -n openshop | grep -v "Running" | grep -v "NAME" || echo "All pods are running!"

# Check failed pods details
print_section "4. Failed Pod Details"
FAILED_PODS=$(kubectl get pods -n openshop --field-selector=status.phase!=Running,status.phase!=Succeeded -o jsonpath='{.items[*].metadata.name}')

if [ -z "$FAILED_PODS" ]; then
    print_info "No failed pods found"
else
    for pod in $FAILED_PODS; do
        print_warn "Describing pod: $pod"
        kubectl describe pod -n openshop $pod | tail -30
        echo ""
        print_warn "Recent logs for pod: $pod"
        kubectl logs -n openshop $pod --tail=50 2>&1 || echo "No logs available yet"
        echo ""
    done
fi

# Check deployments
print_section "5. Deployment Status"
kubectl get deployments -n openshop

# Check services
print_section "6. Service Status"
kubectl get services -n openshop

# Check PVCs
print_section "7. Persistent Volume Claims"
kubectl get pvc -n openshop

# Check events (last 20)
print_section "8. Recent Events"
kubectl get events -n openshop --sort-by='.lastTimestamp' | tail -20

# Check if Docker images exist
print_section "9. Docker Images Check"
print_info "Checking if Docker images are built in Minikube..."
eval $(minikube docker-env 2>/dev/null)
echo ""
echo "Service Images:"
for service in user product order payment cart inventory notification shipping api-gateway; do
    if docker images | grep -q "${service}-service"; then
        print_info "✓ ${service}-service:latest found"
    else
        print_error "✗ ${service}-service:latest NOT found"
    fi
done

# Check API Gateway specifically
print_section "10. API Gateway Specific Check"
print_info "API Gateway Pod Status:"
kubectl get pods -n openshop -l app=api-gateway

print_info "\nAPI Gateway Deployment:"
kubectl get deployment -n openshop api-gateway

if kubectl get pods -n openshop -l app=api-gateway -o jsonpath='{.items[0].metadata.name}' > /dev/null 2>&1; then
    POD_NAME=$(kubectl get pods -n openshop -l app=api-gateway -o jsonpath='{.items[0].metadata.name}')
    print_info "\nAPI Gateway Pod Logs:"
    kubectl logs -n openshop $POD_NAME --tail=100 2>&1
else
    print_error "No API Gateway pod found!"
fi

# Recommendations
print_section "11. Recommendations"
echo "Common issues and solutions:"
echo ""
echo "1. ImagePullBackOff or ErrImagePull:"
echo "   - Ensure Docker environment is set: eval \$(minikube docker-env)"
echo "   - Rebuild images: cd <service> && docker build -t <service>-service:latest ."
echo ""
echo "2. CrashLoopBackOff:"
echo "   - Check logs: kubectl logs -n openshop <pod-name>"
echo "   - Check if database is ready: kubectl get pods -n openshop | grep postgres"
echo ""
echo "3. Pending pods:"
echo "   - Check PVC status: kubectl get pvc -n openshop"
echo "   - Check node resources: kubectl top nodes"
echo ""
echo "4. Database connection issues:"
echo "   - Ensure databases are running: kubectl get pods -n openshop | grep postgres"
echo "   - Check database logs: kubectl logs -n openshop deployment/postgres-<service>"
echo ""
echo "To fix ImagePull issues, run:"
echo "  eval \$(minikube docker-env)"
echo "  cd k8s && ./build-and-deploy.sh"

print_section "Troubleshooting Complete"
echo "For more details on a specific pod:"
echo "  kubectl describe pod -n openshop <pod-name>"
echo "  kubectl logs -n openshop <pod-name> -f"
