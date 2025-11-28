# LoadBalancer Setup with Minikube Tunnel

## Overview

The UI and API Gateway services have been configured as LoadBalancer type to provide external access. In minikube, LoadBalancer services require the `minikube tunnel` command to assign external IPs.

## Services Configured as LoadBalancer

1. **API Gateway** (port 8080)
   - File: `k8s/05-microservices.yaml`
   - Service: `api-gateway`
   - Previously: NodePort (30080)
   - Now: LoadBalancer

2. **OpenShop UI** (port 80)
   - File: `k8s/06-ui.yaml`
   - Service: `openshop-ui`
   - Previously: NodePort (30090)
   - Now: LoadBalancer

## Setup Instructions

### 1. Apply the Updated Configuration

First, apply the updated Kubernetes manifests:

```bash
# From the k8s directory
cd k8s

# Apply the updated microservices configuration (includes API Gateway)
kubectl apply -f 05-microservices.yaml

# Apply the updated UI configuration
kubectl apply -f 06-ui.yaml
```

### 2. Start Minikube Tunnel

Open a **new terminal window** and run:

```bash
minikube tunnel
```

**Important Notes:**
- This command requires **sudo/administrator privileges**
- Keep this terminal window **open** while using the application
- The tunnel must remain active for LoadBalancer services to work
- You'll see output like: `Starting tunnel for service api-gateway.` and `Starting tunnel for service openshop-ui.`

### 3. Verify LoadBalancer External IPs

Wait a moment for the tunnel to assign external IPs, then check:

```bash
kubectl get services -n openshop api-gateway openshop-ui
```

You should see output similar to:

```
NAME           TYPE           CLUSTER-IP      EXTERNAL-IP      PORT(S)        AGE
api-gateway    LoadBalancer   10.96.123.45    10.96.123.45     8080:xxxxx/TCP 5m
openshop-ui    LoadBalancer   10.96.123.46    10.96.123.46     80:xxxxx/TCP   5m
```

The **EXTERNAL-IP** column should show an IP address (not `<pending>`).

### 4. Access the Application

Once the tunnel is running and external IPs are assigned:

#### Access UI:
```bash
# Get the UI external IP
UI_IP=$(kubectl get service openshop-ui -n openshop -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
echo "UI URL: http://${UI_IP}"

# Open in browser
open "http://${UI_IP}"
```

#### Access API Gateway:
```bash
# Get the API Gateway external IP
API_IP=$(kubectl get service api-gateway -n openshop -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
echo "API Gateway URL: http://${API_IP}:8080"

# Test API health
curl "http://${API_IP}:8080/actuator/health"
```

## Quick Access Script

Create a helper script to easily access the services:

```bash
# Create access-services.sh
cat > k8s/access-services.sh << 'EOF'
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
EOF

chmod +x k8s/access-services.sh
```

Then run:
```bash
./k8s/access-services.sh
```

## Troubleshooting

### External IP Shows `<pending>`

**Symptom:** Services show `<pending>` in EXTERNAL-IP column

**Solution:**
```bash
# Ensure minikube tunnel is running
minikube tunnel

# Check if tunnel is active
ps aux | grep "minikube tunnel"
```

### Cannot Access Services

**Check 1:** Verify tunnel is running
```bash
# In the tunnel terminal, you should see:
# Status:
#   machine: minikube
#   pid: xxxxx
#   route: 10.96.0.0/12 -> 192.168.xx.xx
#   minikube: Running
#   services: [api-gateway, openshop-ui]
```

**Check 2:** Verify pods are running
```bash
kubectl get pods -n openshop | grep -E "api-gateway|openshop-ui"
```

**Check 3:** Check service endpoints
```bash
kubectl get endpoints -n openshop api-gateway openshop-ui
```

### Permission Denied for Tunnel

**Symptom:** `minikube tunnel` fails with permission error

**Solution:**
```bash
# Run with sudo (will prompt for password)
sudo minikube tunnel

# Or add your user to sudoers for minikube tunnel (macOS/Linux)
# This allows running without password prompt
```

### Tunnel Keeps Stopping

**Solution:** Keep the terminal window open where you ran `minikube tunnel`. If you close it, the tunnel stops.

To run in background:
```bash
# Not recommended for development, but possible
nohup minikube tunnel > /tmp/minikube-tunnel.log 2>&1 &

# To stop background tunnel later
pkill -f "minikube tunnel"
```

## Comparing with Previous NodePort Setup

### Previous Access (NodePort):
```bash
# UI was accessible via:
minikube service openshop-ui -n openshop --url
# Example: http://192.168.49.2:30090

# API was accessible via:
minikube service api-gateway -n openshop --url
# Example: http://192.168.49.2:30080
```

### Current Access (LoadBalancer with Tunnel):
```bash
# UI accessible via:
http://<EXTERNAL-IP>

# API accessible via:
http://<EXTERNAL-IP>:8080
```

**Advantages of LoadBalancer:**
- More production-like setup
- Cleaner URLs (no high port numbers for UI)
- Better for development and testing
- Simpler integration with ingress controllers

## Alternative: Revert to NodePort

If you prefer NodePort (doesn't require tunnel), you can revert:

```bash
# Edit k8s/05-microservices.yaml - change api-gateway service type back to NodePort
# Edit k8s/06-ui.yaml - change openshop-ui service type back to NodePort

# Then re-add nodePort values:
# - API Gateway: nodePort: 30080
# - UI: nodePort: 30090

# Apply changes
kubectl apply -f k8s/05-microservices.yaml
kubectl apply -f k8s/06-ui.yaml
```

## Stopping the Tunnel

When you're done:
1. Press `Ctrl+C` in the terminal running `minikube tunnel`
2. The services will return to `<pending>` state but remain configured as LoadBalancer

## Integration with CI/CD

For automated deployments, consider:
- Using Ingress controller instead of LoadBalancer
- Or keep NodePort for minikube environments
- Use LoadBalancer for cloud environments (AWS ELB, GCP Load Balancer, etc.)
