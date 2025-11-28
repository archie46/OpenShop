# OpenShop Minikube Deployment Guide

Complete guide for deploying the OpenShop microservices application to Minikube.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Quick Start](#quick-start)
- [Detailed Deployment Steps](#detailed-deployment-steps)
- [Configuration Files](#configuration-files)
- [Accessing Services](#accessing-services)
- [Monitoring and Troubleshooting](#monitoring-and-troubleshooting)
- [Scaling](#scaling)
- [Cleanup](#cleanup)

## Prerequisites

### Required Software
- **Docker Desktop**: Latest version (for macOS/Windows) or Docker Engine (Linux)
- **Minikube**: v1.30.0 or higher
- **kubectl**: v1.27.0 or higher
- **Maven**: 3.8.0 or higher (for building services)
- **Java**: JDK 17 or higher

### Installation Instructions

#### macOS
```bash
# Install Minikube
brew install minikube

# Install kubectl
brew install kubectl

# Install Maven
brew install maven
```

#### Linux
```bash
# Install Minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install Maven
sudo apt-get update
sudo apt-get install maven
```

#### Windows
```powershell
# Using Chocolatey
choco install minikube
choco install kubernetes-cli
choco install maven
```

### System Requirements
- **CPU**: Minimum 4 cores (recommended)
- **Memory**: Minimum 8GB RAM
- **Disk Space**: At least 20GB free space

## Architecture Overview

OpenShop consists of the following components:

### Microservices (9 services)
1. **API Gateway** (Port 8080) - Entry point for all requests
2. **User Service** (Port 8081) - User authentication and management
3. **Product Service** (Port 8082) - Product catalog management
4. **Order Service** (Port 8083) - Order processing with Saga pattern
5. **Payment Service** (Port 8084) - Payment processing
6. **Cart Service** (Port 8085) - Shopping cart management
7. **Inventory Service** (Port 8086) - Inventory management
8. **Notification Service** (Port 8087) - Notification handling
9. **Shipping Service** (Port 8088) - Shipping management

### Infrastructure Components
- **PostgreSQL** (8 separate databases) - One for each service
- **Apache Kafka** - Message broker for event-driven communication
- **Zookeeper** - Kafka coordination service

### Communication Patterns
- **Synchronous**: REST APIs with OpenFeign clients
- **Asynchronous**: Kafka for event-driven messaging
- **Saga Pattern**: Kafka for distributed transactions

## Quick Start

### Option 1: Automated Deployment (Recommended)

```bash
# 1. Start Minikube
minikube start --cpus=4 --memory=8192

# 2. Navigate to k8s directory
cd k8s

# 3. Make scripts executable
chmod +x build-and-deploy.sh cleanup.sh

# 4. Run deployment script
./build-and-deploy.sh
```

This will:
- Build all Docker images
- Deploy all services to Minikube
- Configure networking
- Display the API Gateway URL

### Option 2: Manual Deployment

See [Detailed Deployment Steps](#detailed-deployment-steps) below.

## Detailed Deployment Steps

### Step 1: Start Minikube

```bash
# Start Minikube with adequate resources
minikube start --cpus=4 --memory=8192 --disk-size=20g

# Verify Minikube is running
minikube status
```

### Step 2: Configure Docker Environment

```bash
# Point Docker CLI to Minikube's Docker daemon
eval $(minikube docker-env)

# Verify configuration
docker ps
```

### Step 3: Build Docker Images

Build each service individually:

```bash
# Navigate to project root
cd /path/to/openshop

# Build User Service
cd userservice
./mvnw clean package -DskipTests
docker build -t user-service:latest .
cd ..

# Build Product Service
cd productservice
./mvnw clean package -DskipTests
docker build -t product-service:latest .
cd ..

# Build Order Service
cd orderservice
./mvnw clean package -DskipTests
docker build -t order-service:latest .
cd ..

# Build Payment Service
cd paymentservice
./mvnw clean package -DskipTests
docker build -t payment-service:latest .
cd ..

# Build Cart Service
cd cartservice
./mvnw clean package -DskipTests
docker build -t cart-service:latest .
cd ..

# Build Inventory Service
cd inventoryservice
./mvnw clean package -DskipTests
docker build -t inventory-service:latest .
cd ..

# Build Shipping Service
cd shippingservice
./mvnw clean package -DskipTests
docker build -t shipping-service:latest .
cd ..

# Build Notification Service
cd notificationservice
./mvnw clean package -DskipTests
docker build -t notification-service:latest .
cd ..

# Build API Gateway
cd apigateway
./mvnw clean package -DskipTests
docker build -t api-gateway:latest .
cd ..
```

### Step 4: Deploy to Kubernetes

```bash
# Navigate to k8s directory
cd k8s

# Apply configurations in order
kubectl apply -f 00-namespace.yaml
kubectl apply -f 01-secrets.yaml
kubectl apply -f 02-configmap.yaml
kubectl apply -f 03-kafka-zookeeper.yaml
kubectl apply -f 04-databases.yaml
kubectl apply -f 05-microservices.yaml
```

### Step 5: Verify Deployment

```bash
# Check all pods
kubectl get pods -n openshop

# Check all services
kubectl get services -n openshop

# Watch pods until all are ready
kubectl get pods -n openshop -w
```

Wait until all pods show `Running` status and `1/1` ready.

## Configuration Files

### File Structure
```
k8s/
├── 00-namespace.yaml           # OpenShop namespace
├── 01-secrets.yaml             # Database credentials
├── 02-configmap.yaml           # Service configurations
├── 03-kafka-zookeeper.yaml     # Message broker
├── 04-databases.yaml           # PostgreSQL databases
├── 05-microservices.yaml       # All microservices
├── build-and-deploy.sh         # Automated deployment
├── cleanup.sh                  # Cleanup script
└── MINIKUBE-DEPLOYMENT-GUIDE.md
```

### Key Configuration Details

#### Namespace
All resources are deployed in the `openshop` namespace for isolation.

#### Secrets
- Database credentials stored in `postgres-credentials` secret
- Username: `openshop`
- Password: `openshop123` (change in production!)

#### ConfigMaps
Service URLs and common configurations stored in `openshop-config` ConfigMap.

#### Resource Limits
Each microservice has:
- Requests: 512Mi memory, 250m CPU
- Limits: 1Gi memory, 500m CPU

## Accessing Services

### API Gateway

#### Get the URL
```bash
# Get the NodePort URL
minikube service api-gateway -n openshop --url

# Or access via NodePort (30080)
MINIKUBE_IP=$(minikube ip)
echo "API Gateway: http://$MINIKUBE_IP:30080"
```

#### Open in Browser
```bash
minikube service api-gateway -n openshop
```

### Example API Calls

#### Health Check
```bash
GATEWAY_URL=$(minikube service api-gateway -n openshop --url)
curl $GATEWAY_URL/actuator/health
```

#### Register a User
```bash
curl -X POST $GATEWAY_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123",
    "email": "test@example.com"
  }'
```

#### List Products
```bash
curl $GATEWAY_URL/api/products
```

### Direct Service Access

To access services directly (for debugging):

```bash
# Port-forward to a specific service
kubectl port-forward -n openshop svc/user-service 8081:8081

# In another terminal
curl http://localhost:8081/actuator/health
```

## Monitoring and Troubleshooting

### View Logs

```bash
# View logs for a specific service
kubectl logs -n openshop -f deployment/user-service

# View logs for all pods with a label
kubectl logs -n openshop -l app=user-service --tail=100

# View logs from a specific pod
kubectl logs -n openshop <pod-name>
```

### Check Pod Status

```bash
# Get detailed pod information
kubectl describe pod -n openshop <pod-name>

# Get all resources in namespace
kubectl get all -n openshop

# Check events
kubectl get events -n openshop --sort-by='.lastTimestamp'
```

### Common Issues

#### 1. Pods Not Starting

**Symptoms**: Pods stuck in `Pending` or `ImagePullBackOff`

**Solutions**:
```bash
# Check pod details
kubectl describe pod -n openshop <pod-name>

# Verify Docker images are built
eval $(minikube docker-env)
docker images | grep service

# Rebuild if needed
cd /path/to/service
docker build -t service-name:latest .
```

#### 2. Services Not Connecting

**Symptoms**: 500 errors, connection timeouts

**Solutions**:
```bash
# Check if all pods are ready
kubectl get pods -n openshop

# Check service endpoints
kubectl get endpoints -n openshop

# Test service connectivity from a pod
kubectl run -it --rm debug --image=busybox --restart=Never -n openshop -- sh
# Inside the pod:
wget -O- http://user-service:8081/actuator/health
```

#### 3. Database Connection Issues

**Symptoms**: Services crash with database errors

**Solutions**:
```bash
# Check database pod logs
kubectl logs -n openshop -f deployment/postgres-user

# Verify database is ready
kubectl get pods -n openshop -l app=postgres-user

# Test database connection
kubectl run -it --rm psql-client --image=postgres:15-alpine --restart=Never -n openshop -- sh
# Inside the pod:
psql -h postgres-user -U openshop -d userdb
```

#### 4. Kafka Issues

**Symptoms**: Services can't connect to Kafka

**Solutions**:
```bash
# Check Kafka and Zookeeper
kubectl get pods -n openshop | grep -E "kafka|zookeeper"

# View Kafka logs
kubectl logs -n openshop -f deployment/kafka

# Verify Kafka is listening
kubectl exec -n openshop deployment/kafka -- kafka-broker-api-versions --bootstrap-server localhost:9092
```

### Performance Monitoring

```bash
# View resource usage
kubectl top pods -n openshop

# View node resource usage
kubectl top nodes

# Get more detailed metrics
minikube addons enable metrics-server
kubectl get --raw /apis/metrics.k8s.io/v1beta1/namespaces/openshop/pods
```

## Scaling

### Scale a Service

```bash
# Scale user-service to 3 replicas
kubectl scale deployment user-service -n openshop --replicas=3

# Verify scaling
kubectl get pods -n openshop -l app=user-service

# Auto-scale based on CPU
kubectl autoscale deployment user-service -n openshop --cpu-percent=70 --min=2 --max=5
```

### Update a Service

```bash
# Rebuild the Docker image
cd /path/to/service
./mvnw clean package -DskipTests
eval $(minikube docker-env)
docker build -t service-name:latest .

# Restart the deployment
kubectl rollout restart deployment/service-name -n openshop

# Check rollout status
kubectl rollout status deployment/service-name -n openshop
```

## Cleanup

### Remove All Resources

#### Using Cleanup Script
```bash
cd k8s
./cleanup.sh
```

#### Manual Cleanup
```bash
# Delete all resources
kubectl delete namespace openshop

# Verify deletion
kubectl get all -n openshop
```

### Stop Minikube

```bash
# Stop Minikube (keeps cluster state)
minikube stop

# Delete Minikube cluster (removes everything)
minikube delete
```

### Reset Docker Environment

```bash
# Unset Docker environment variables
eval $(minikube docker-env -u)
```

## Advanced Topics

### Persistent Volumes

By default, PersistentVolumeClaims use Minikube's default storage class. Data persists as long as the PVC exists.

To backup data:
```bash
# Backup a database
kubectl exec -n openshop deployment/postgres-user -- pg_dump -U openshop userdb > backup.sql

# Restore
kubectl exec -i -n openshop deployment/postgres-user -- psql -U openshop userdb < backup.sql
```

### Custom Configuration

Edit ConfigMap:
```bash
kubectl edit configmap openshop-config -n openshop
```

Restart affected services:
```bash
kubectl rollout restart deployment/service-name -n openshop
```

### Ingress (Optional)

To use Ingress instead of NodePort:

```bash
# Enable ingress addon
minikube addons enable ingress

# Create ingress resource
cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: openshop-ingress
  namespace: openshop
spec:
  rules:
  - host: openshop.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-gateway
            port:
              number: 8080
EOF

# Add to /etc/hosts
echo "$(minikube ip) openshop.local" | sudo tee -a /etc/hosts

# Access via: http://openshop.local
```

## Best Practices

1. **Resource Allocation**: Ensure Minikube has adequate resources (4 CPUs, 8GB RAM minimum)
2. **Image Pull Policy**: Use `imagePullPolicy: Never` in Minikube to use local images
3. **Health Checks**: All services have liveness and readiness probes configured
4. **Secrets Management**: In production, use proper secret management (e.g., HashiCorp Vault)
5. **Logging**: Consider adding a logging solution (ELK stack, Loki, etc.)
6. **Monitoring**: Add Prometheus and Grafana for metrics visualization

## Troubleshooting Checklist

- [ ] Minikube is running: `minikube status`
- [ ] Docker environment configured: `eval $(minikube docker-env)`
- [ ] All images built: `docker images | grep service`
- [ ] Namespace exists: `kubectl get namespace openshop`
- [ ] All pods running: `kubectl get pods -n openshop`
- [ ] Services accessible: `kubectl get services -n openshop`
- [ ] No errors in logs: `kubectl logs -n openshop deployment/<service-name>`

## Support and Resources

- **Project Repository**: Check the main README.md for project details
- **Kubernetes Documentation**: https://kubernetes.io/docs/
- **Minikube Documentation**: https://minikube.sigs.k8s.io/docs/
- **Spring Boot on Kubernetes**: https://spring.io/guides/gs/spring-boot-kubernetes/

## Appendix: Service Dependencies

```
API Gateway
├── User Service → PostgreSQL (userdb)
├── Product Service → PostgreSQL (productdb) → Inventory Service
├── Order Service → PostgreSQL (orderdb) → Kafka
│   ├── Payment Service → PostgreSQL (paymentdb) → Kafka
│   └── Inventory Service → PostgreSQL (inventorydb) → Kafka
├── Cart Service → PostgreSQL (cartdb)
│   ├── Product Service
│   └── Order Service
├── Notification Service → PostgreSQL (notificationdb)
└── Shipping Service → PostgreSQL (shippingdb) → Kafka

Kafka ← Zookeeper
```

---

**Version**: 1.0  
**Last Updated**: 2025-11-25  
**Maintained by**: OpenShop Team
