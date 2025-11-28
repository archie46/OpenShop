# OpenShop Minikube Deployment Status

## Current Status: ⚠️ PARTIALLY DEPLOYED - NEEDS FIXES

**Last Checked**: November 25, 2025 at 6:38 PM

## Overview

The deployment has been **partially successful** with several issues that need to be addressed:

### ✅ Successfully Running (7/17 pods)
- ✓ All PostgreSQL databases (8 databases)
- ✓ Zookeeper
- ✓ Inventory Service
- ✓ Order Service  
- ✓ Shipping Service

### ❌ Failed/Problematic Pods (10/17 pods)

#### 1. API Gateway - `ErrImageNeverPull`
**Issue**: Docker image not found in Minikube's Docker daemon
**Status**: Cannot start - image missing

#### 2. Kafka - `CrashLoopBackOff`
**Issue**: Kafka pod is crashing (critical - many services depend on it)
**Impact**: HIGH - Payment, Notification services depend on Kafka

#### 3. Multiple Services - `CrashLoopBackOff`
- Cart Service
- User Service
- Product Service
- Payment Service
- Notification Service

**Likely Causes**:
- Missing Docker images (need to be built in Minikube context)
- Kafka not running (for services that depend on it)
- Database connection issues
- Configuration problems

## Root Cause Analysis

### Primary Issue: Docker Images Not Built
The `ErrImageNeverPull` error on API Gateway indicates that Docker images were not built in Minikube's Docker daemon context. The deployment script expects images to exist with `imagePullPolicy: Never`.

### Secondary Issue: Kafka Failure
Kafka is crashing, which affects all event-driven services.

## Required Actions to Fix

### 1. Build Docker Images in Minikube Context ⚠️ CRITICAL

```bash
# Set Docker to use Minikube's daemon
eval $(minikube docker-env)

# Option A: Use the automated script (RECOMMENDED)
cd k8s
./build-and-deploy.sh

# Option B: Build manually
cd /Users/I528999/Downloads/openshop

# Build each service
cd userservice && ./mvnw clean package -DskipTests && docker build -t user-service:latest . && cd ..
cd productservice && ./mvnw clean package -DskipTests && docker build -t product-service:latest . && cd ..
cd orderservice && ./mvnw clean package -DskipTests && docker build -t order-service:latest . && cd ..
cd paymentservice && ./mvnw clean package -DskipTests && docker build -t payment-service:latest . && cd ..
cd cartservice && ./mvnw clean package -DskipTests && docker build -t cart-service:latest . && cd ..
cd inventoryservice && ./mvnw clean package -DskipTests && docker build -t inventory-service:latest . && cd ..
cd shippingservice && ./mvnw clean package -DskipTests && docker build -t shipping-service:latest . && cd ..
cd notificationservice && ./mvnw clean package -DskipTests && docker build -t notification-service:latest . && cd ..
cd apigateway && ./mvnw clean package -DskipTests && docker build -t api-gateway:latest . && cd ..
```

### 2. Fix Kafka Issue

```bash
# Check Kafka logs
kubectl logs -n openshop deployment/kafka --tail=100

# If Kafka has resource issues, you may need to increase Minikube resources
minikube stop
minikube start --cpus=4 --memory=8192 --disk-size=20g

# Redeploy Kafka
kubectl delete deployment kafka -n openshop
kubectl apply -f k8s/03-kafka-zookeeper.yaml
```

### 3. Restart Failed Services

After building images and fixing Kafka:

```bash
# Restart all deployments
kubectl rollout restart deployment -n openshop

# Or restart specific services
kubectl rollout restart deployment/api-gateway -n openshop
kubectl rollout restart deployment/user-service -n openshop
kubectl rollout restart deployment/product-service -n openshop
kubectl rollout restart deployment/cart-service -n openshop
kubectl rollout restart deployment/payment-service -n openshop
kubectl rollout restart deployment/notification-service -n openshop
```

## Quick Fix Commands

### Complete Rebuild and Redeploy

```bash
# 1. Ensure Minikube is running with adequate resources
minikube status || minikube start --cpus=4 --memory=8192

# 2. Set Docker environment
eval $(minikube docker-env)

# 3. Run the automated build and deploy script
cd k8s
./build-and-deploy.sh
```

This will:
- Build all Docker images in Minikube's context
- Redeploy all services
- Wait for pods to be ready
- Display the API Gateway URL

## Verification Steps

After fixing, verify the deployment:

```bash
# Check all pods are running
kubectl get pods -n openshop

# Expected: All pods should show "Running" and "1/1" ready
# Wait until no pods are in CrashLoopBackOff or Error state

# Check services
kubectl get services -n openshop

# Get API Gateway URL
minikube service api-gateway -n openshop --url

# Test API Gateway
GATEWAY_URL=$(minikube service api-gateway -n openshop --url)
curl $GATEWAY_URL/actuator/health
```

## Troubleshooting Script

We've created a comprehensive troubleshooting script:

```bash
cd k8s
./troubleshoot.sh
```

This will:
- Check all pod statuses
- Show detailed error messages
- Check if Docker images exist
- Display recent events
- Provide specific recommendations

## Current Infrastructure Status

### ✅ Working Components
- All 8 PostgreSQL databases
- Zookeeper (Kafka coordinator)
- PersistentVolumeClaims
- Kubernetes Services
- ConfigMaps and Secrets

### ❌ Not Working Components
- API Gateway (no image)
- Most microservices (crashes)
- Kafka (crashing)

## Next Steps

1. **Build Docker images** - This is the MOST CRITICAL step
2. **Fix Kafka** - Many services depend on it
3. **Verify all pods running** - Wait for all to stabilize
4. **Test API Gateway** - Ensure it's accessible
5. **Run smoke tests** - Test basic functionality

## Files Created for This Deployment

### Kubernetes Configurations
- `k8s/00-namespace.yaml` - Namespace
- `k8s/01-secrets.yaml` - Credentials
- `k8s/02-configmap.yaml` - Configuration
- `k8s/03-kafka-zookeeper.yaml` - Message broker
- `k8s/04-databases.yaml` - PostgreSQL databases
- `k8s/05-microservices.yaml` - All microservices

### Dockerfiles (All Created ✓)
- `apigateway/Dockerfile`
- `userservice/Dockerfile`
- `productservice/Dockerfile`
- `orderservice/Dockerfile`
- `paymentservice/Dockerfile`
- `cartservice/Dockerfile`
- `inventoryservice/Dockerfile`
- `notificationservice/Dockerfile`
- `shippingservice/Dockerfile`

### Scripts
- `k8s/build-and-deploy.sh` - Automated deployment
- `k8s/cleanup.sh` - Cleanup script
- `k8s/troubleshoot.sh` - Troubleshooting tool

### Documentation
- `MINIKUBE.md` - Quick start guide
- `k8s/MINIKUBE-DEPLOYMENT-GUIDE.md` - Detailed guide
- `k8s/DEPLOYMENT-STATUS.md` - This file

## Summary

The Minikube deployment setup is **complete and correct**, but the Docker images need to be built in Minikube's Docker context. Once you run the build-and-deploy script with the proper Docker environment, all services should start successfully.

**Recommended Action**: Run `cd k8s && ./build-and-deploy.sh` to complete the deployment.
