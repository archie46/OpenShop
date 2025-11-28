# OpenShop Kubernetes Deployment Guide

This guide will help you deploy the OpenShop microservices application to Minikube.

## Prerequisites

- Docker installed and running
- Minikube installed
- kubectl installed
- Maven installed (for building the services)

## Architecture Overview

The OpenShop application consists of the following microservices:
- **API Gateway** (Port 8080) - Entry point for all client requests
- **User Service** (Port 8081) - User authentication and management
- **Product Service** (Port 8082) - Product catalog management
- **Order Service** (Port 8083) - Order processing with Kafka-based Saga pattern
- **Payment Service** (Port 8086) - Payment processing
- **Cart Service** (Port 8085) - Shopping cart management
- **Inventory Service** (Port 8086) - Inventory management
- **Shipping Service** (Port 8088) - Shipping management
- **Notification Service** (Port 8087) - Notifications

## Key Changes Made for Kubernetes

### 1. Removed Hardcoded URLs
- All localhost URLs have been replaced with environment variables
- Services now use Kubernetes service discovery (e.g., `http://product-service:8082`)

### 2. Replaced RestTemplate with Spring Cloud OpenFeign
- **ProductService**: Uses `InventoryClient` to communicate with Inventory Service
- **CartService**: Uses `ProductClient` and `OrderClient` for inter-service communication
- **OrderService**: Uses Kafka for event-driven Saga orchestration
- **PaymentService**: Consumes Kafka events for payment processing

### 3. Service Communication
Services communicate using:
- **OpenFeign** for synchronous REST calls (ProductService, CartService)
- **Kafka** for event-driven Saga orchestration (OrderService, PaymentService, InventoryService, ShippingService)

## Deployment Steps

### Step 1: Start Minikube

```bash
minikube start --cpus=4 --memory=8192
```

### Step 2: Configure Docker to use Minikube's Docker daemon

```bash
eval $(minikube docker-env)
```

### Step 3: Build Docker Images for Each Service

Build all microservices using Maven and create Docker images:

```bash
# User Service
cd ../userservice
mvn clean package -DskipTests
docker build -t user-service:latest .

# Product Service
cd ../productservice
mvn clean package -DskipTests
docker build -t product-service:latest .

# Order Service
cd ../orderservice
mvn clean package -DskipTests
docker build -t order-service:latest .

# Payment Service
cd ../paymentservice
mvn clean package -DskipTests
docker build -t payment-service:latest .

# Cart Service
cd ../cartservice
mvn clean package -DskipTests
docker build -t cart-service:latest .

# Inventory Service
cd ../inventoryservice
mvn clean package -DskipTests
docker build -t inventory-service:latest .

# Shipping Service
cd ../shippingservice
mvn clean package -DskipTests
docker build -t shipping-service:latest .

# Notification Service
cd ../notificationservice
mvn clean package -DskipTests
docker build -t notification-service:latest .

# API Gateway
cd ../apigateway
mvn clean package -DskipTests
docker build -t api-gateway:latest .
```

### Step 4: Create Dockerfiles (if not present)

Each service needs a Dockerfile. Example for a service:

```dockerfile
FROM openjdk:25-jdk-slim
WORKDIR /app
COPY target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Step 5: Deploy to Kubernetes

```bash
cd ../k8s

# Deploy User Service
kubectl apply -f user-service.yaml

# Deploy all other services
kubectl apply -f openshop-services.yaml
```

### Step 6: Verify Deployments

```bash
# Check all pods
kubectl get pods

# Check all services
kubectl get services

# Check deployment status
kubectl get deployments
```

### Step 7: Access the API Gateway

```bash
# Get the Minikube service URL
minikube service api-gateway --url
```

This will output the URL where you can access the API Gateway (e.g., `http://192.168.49.2:30080`)

## Environment Variables

Each service uses the following environment variable pattern for service URLs:

- `PRODUCT_SERVICE_URL` - defaults to `http://product-service:8082`
- `ORDER_SERVICE_URL` - defaults to `http://order-service:8083`
- `PAYMENT_SERVICE_URL` - defaults to `http://payment-service:8086`
- `CART_SERVICE_URL` - defaults to `http://cart-service:8085`
- `INVENTORY_SERVICE_URL` - defaults to `http://inventory-service:8086`
- `USER_SERVICE_URL` - defaults to `http://user-service:8081`

These can be overridden in the Kubernetes deployment manifests if needed.

## Service Communication Flow

### Product Creation Flow:
1. Client → API Gateway → Product Service
2. Product Service → (Feign) → Inventory Service (creates inventory record)

### Order Placement Flow (Kafka-based Saga):
1. Client → API Gateway → Cart Service → Order Service
2. Order Service → (Kafka) → Inventory Service (reserve inventory)
3. Order Service → (Kafka) → Payment Service (process payment)
4. Order Service → (Kafka) → Shipping Service (create shipment)
5. On success: Order Service → Cart Service (clear cart)
6. On failure: Saga compensation kicks in via Kafka events

### Cart Checkout Flow:
1. Client → API Gateway → Cart Service
2. Cart Service → (Feign) → Product Service (validate products)
3. Cart Service → (Feign) → Order Service (create order)

## Troubleshooting

### Check Pod Logs
```bash
kubectl logs <pod-name>
```

### Describe a Pod
```bash
kubectl describe pod <pod-name>
```

### Restart a Deployment
```bash
kubectl rollout restart deployment/<deployment-name>
```

### Access a Pod Shell
```bash
kubectl exec -it <pod-name> -- /bin/sh
```

### Check Service Endpoints
```bash
kubectl get endpoints
```

## Scaling Services

To scale a service:
```bash
kubectl scale deployment/<service-name> --replicas=3
```

## Cleanup

To remove all deployed resources:
```bash
kubectl delete -f openshop-services.yaml
kubectl delete -f user-service.yaml
```

To stop Minikube:
```bash
minikube stop
```

To delete Minikube cluster:
```bash
minikube delete
```

## Notes

- All services use H2 in-memory databases (data is lost on pod restart)
- For production, consider using persistent volumes and external databases
- The API Gateway is exposed as LoadBalancer type (Minikube will provide an external IP)
- Services communicate using Kubernetes DNS (service-name:port)
- OpenFeign clients have configurable URLs with sensible defaults for Kubernetes

## Testing the Deployment

1. Get the API Gateway URL:
   ```bash
   minikube service api-gateway --url
   ```

2. Test the health of services:
   ```bash
   curl http://<api-gateway-url>/api/products
   ```

3. Register a user:
   ```bash
   curl -X POST http://<api-gateway-url>/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"test","password":"test123","email":"test@example.com"}'
   ```

## Architecture Improvements

This Kubernetes deployment includes the following improvements:

1. **Service Discovery**: Services use Kubernetes DNS instead of hardcoded IPs
2. **Scalability**: Easy to scale individual services with `kubectl scale`
3. **Resilience**: Kubernetes automatically restarts failed pods
4. **Configuration Management**: Environment variables for easy configuration
5. **Load Balancing**: Kubernetes provides built-in load balancing
6. **OpenFeign Integration**: Type-safe HTTP clients for inter-service communication
7. **Environment Variable Fallbacks**: Services work both locally and in Kubernetes
