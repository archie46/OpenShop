#!/bin/bash

echo "===================================="
echo "OpenShop Service Access Information"
echo "===================================="
echo ""

# Get external IPs
UI_IP=$(kubectl get service openshop-ui -n openshop -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)
API_IP=$(kubectl get service api-gateway -n openshop -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)

# Check if minikube tunnel is running
if [ -z "$UI_IP" ] || [ -z "$API_IP" ]; then
    echo "⚠️  WARNING: External IPs not assigned!"
    echo ""
    echo "Please ensure 'minikube tunnel' is running in another terminal."
    echo "Run: minikube tunnel"
    echo ""
    exit 1
fi

echo "✅ Services are accessible:"
echo ""
echo "🌐 UI:          http://${UI_IP}"
echo "🔌 API Gateway: http://${API_IP}:8080"
echo ""
echo "API Health:     http://${API_IP}:8080/actuator/health"
echo ""
echo "===================================="
