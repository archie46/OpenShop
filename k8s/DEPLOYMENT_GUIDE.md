# Kubernetes Deployment Guide

## Overview
This guide explains how to use the enhanced `build-and-deploy.sh` script with support for step-by-step deployment and Kafka KRaft mode.

## Prerequisites
- Minikube installed and running
- kubectl configured
- Docker installed
- Maven (mvnw included in each service)
- Minimum 4 CPUs and 8GB RAM for Minikube

## Quick Start

### Full Deployment (Default)
```bash
cd k8s
./build-and-deploy.sh
```
or
```bash
cd k8s
./build-and-deploy.sh all
```

This will:
1. Build all microservices
2. Create namespace and configs
3. Deploy Kafka (KRaft mode)
4. Deploy databases
5. Deploy microservices

## Step-by-Step Deployment

The script now supports starting from specific steps, useful when troubleshooting or when you've already completed earlier steps.

### Available Steps

1. **build** - Build all microservices (default if no parameter)
2. **namespace** - Deploy namespace, secrets, and configmaps
3. **kafka** - Deploy Kafka in KRaft mode
4. **databases** - Deploy all PostgreSQL databases
5. **microservices** - Deploy all microservices
6. **all** - Full deployment (same as no parameter)

### Usage Examples

#### Skip Build, Start from Namespace
```bash
./build-and-deploy.sh namespace
```
Use this when:
- You've already built the services
- You want to redeploy everything to Kubernetes

#### Deploy Only Kafka
```bash
./build-and-deploy.sh kafka
```
Use this when:
- Namespace and configs are already deployed
- You need to fix Kafka configuration

#### Deploy Only Databases
```bash
./build-and-deploy.sh databases
```
Use this when:
- Kafka is already running
- You need to redeploy or troubleshoot databases

#### Deploy Only Microservices
```bash
./build-and-deploy.sh microservices
```
Use this when:
- All infrastructure (Kafka, databases) is ready
- You only need to deploy/update microservices

## Deployment Flow

### What Each Step Does

#### 1. Build Step (build/all)
- Runs Maven build for each service
- Creates Docker images
- Uses Minikube's Docker daemon

**Services built:**
- userservice
- productservice  
- orderservice
- paymentservice
- cartservice
- inventoryservice
- shippingservice
- apigateway

#### 2. Namespace Step (namespace/all)
- Creates `openshop` namespace
- Applies secrets (01-secrets.yaml)
- Applies configmaps (02-configmap.yaml)

#### 3. Kafka Step (kafka/all)
- Deploys Kafka in KRaft mode (no Zookeeper)
- Waits up to 300 seconds for Kafka to be ready
- Verifies Kafka can accept connections
- Shows logs if there are issues

**Kafka Configuration:**
- Mode: KRaft (self-managed, no Zookeeper)
- Cluster ID: 5L6g3nShT-eMCtK--X86sw
- Listeners: 9092 (client), 9093 (controller)
- Resources: 512Mi-1Gi memory, 250m-1000m CPU

#### 4. Databases Step (databases/all)
- Deploys 8 PostgreSQL databases
- Waits for each to be ready (300s timeout each)

**Databases:**
- postgres-user (port 5432)
- postgres-product (port 5433)
- postgres-order (port 5434)
- postgres-cart (port 5435)
- postgres-inventory (port 5436)
- postgres-payment (port 5437)
- postgres-notification (port 5438)
- postgres-shipping (port 5439)

#### 5. Microservices Step (microservices/all)
- Deploys all microservices
- Waits 30 seconds for initial startup
- Shows deployment status

## Troubleshooting

### Kafka Not Starting

If Kafka fails to start within 300 seconds:

1. **Check pod status:**
```bash
kubectl get pods -n openshop -l app=kafka
```

2. **View logs:**
```bash
kubectl logs -n openshop -f deployment/kafka
```

3. **Check events:**
```bash
kubectl describe pod -n openshop -l app=kafka
```

4. **Common fixes:**
   - Delete and redeploy: `kubectl delete -f 03-kafka-zookeeper.yaml && kubectl apply -f 03-kafka-zookeeper.yaml`
   - Check PVC: `kubectl get pvc -n openshop kafka-pvc`
   - Verify cluster ID is set in environment variables

### Redeploying Kafka

```bash
# Option 1: Use the script
cd k8s
./build-and-deploy.sh kafka

# Option 2: Manual
kubectl delete -f 03-kafka-zookeeper.yaml
kubectl apply -f 03-kafka-zookeeper.yaml
```

### Database Connection Issues

```bash
# Check database pod
kubectl get pods -n openshop -l app=postgres-<service>

# View logs
kubectl logs -n openshop deployment/postgres-<service>

# Test connection
kubectl exec -n openshop deployment/postgres-<service> -- psql -U openshop -d <dbname> -c '\l'
```

### Microservice Not Starting

```bash
# Check pod status
kubectl get pods -n openshop

# View logs for specific service
kubectl logs -n openshop -f deployment/<service-name>

# Check events
kubectl describe pod -n openshop <pod-name>

# Common issues:
# - Database not ready
# - Kafka not ready
# - Image pull errors
# - Resource constraints
```

## Monitoring Deployment

### Watch All Pods
```bash
kubectl get pods -n openshop -w
```

### Check Specific Service
```bash
kubectl get pods -n openshop -l app=<service-name>
```

### View All Resources
```bash
kubectl get all -n openshop
```

### Check Resource Usage
```bash
kubectl top pods -n openshop
```

## Accessing Services

### API Gateway
```bash
# Get URL
minikube service api-gateway -n openshop --url

# Or open in browser
minikube service api-gateway -n openshop
```

### Port Forwarding
```bash
# Forward specific service
kubectl port-forward -n openshop svc/<service-name> <local-port>:<service-port>

# Example: Forward API Gateway to localhost:8080
kubectl port-forward -n openshop svc/api-gateway 8080:8080
```

### Kafka Topics
```bash
# List topics
kubectl exec -n openshop deployment/kafka -- kafka-topics.sh --bootstrap-server localhost:9092 --list

# Create topic
kubectl exec -n openshop deployment/kafka -- kafka-topics.sh --bootstrap-server localhost:9092 --create --topic test --partitions 1 --replication-factor 1

# Describe topic
kubectl exec -n openshop deployment/kafka -- kafka-topics.sh --bootstrap-server localhost:9092 --describe --topic test
```

## Cleanup

### Delete Everything
```bash
cd k8s
kubectl delete namespace openshop
```

### Delete Specific Resources
```bash
# Delete microservices only
kubectl delete -f 05-microservices.yaml

# Delete databases only
kubectl delete -f 04-databases.yaml

# Delete Kafka only
kubectl delete -f 03-kafka-zookeeper.yaml
```

### Clean and Redeploy
```bash
# Full cleanup
kubectl delete namespace openshop

# Wait a moment
sleep 10

# Redeploy
./build-and-deploy.sh
```

## Performance Tips

### Speed Up Builds
```bash
# Build without tests
# (Already default in script)

# Use cached Maven dependencies
# Maven caches are automatically used
```

### Faster Kafka Startup
- Kafka is configured with optimized settings
- Uses KRaft mode (no Zookeeper = faster)
- Health checks tuned for quick detection

### Resource Optimization
- Adjust resource limits in YAML files if needed
- Current settings are optimized for development

## Advanced Usage

### Custom Kafka Configuration
Edit `k8s/03-kafka-zookeeper.yaml` and modify environment variables:
```yaml
- name: KAFKA_LOG_RETENTION_HOURS
  value: "168"  # Adjust as needed
```

### Database Persistence
Data persists in PVCs. To reset:
```bash
kubectl delete pvc -n openshop <pvc-name>
```

### Scaling Services
```bash
kubectl scale deployment -n openshop <service-name> --replicas=3
```

## Integration with CI/CD

### Jenkins Pipeline Example
```groovy
stage('Deploy to K8s') {
    steps {
        sh 'cd k8s && ./build-and-deploy.sh all'
    }
}
```

### GitHub Actions Example
```yaml
- name: Deploy to Minikube
  run: |
    cd k8s
    ./build-and-deploy.sh all
```

## Environment-Specific Deployments

### Development
```bash
# Full deployment with monitoring
./build-and-deploy.sh all
kubectl get pods -n openshop -w
```

### Testing
```bash
# Deploy only what changed
./build-and-deploy.sh microservices
```

### Production Considerations
For production, consider:
- Using managed Kafka (Confluent, AWS MSK)
- Managed databases (RDS, Cloud SQL)
- Horizontal pod autoscaling
- Resource quotas and limits
- Network policies
- Ingress controllers

## Related Documentation
- [Kafka KRaft Mode Updates](KAFKA_KRAFT_MODE_UPDATES.md)
- [Minikube Deployment Guide](MINIKUBE-DEPLOYMENT-GUIDE.md)
- [Build and Deploy Fixes](BUILD-DEPLOY-FIXES.md)

## Support

For issues or questions:
1. Check the logs using commands above
2. Review the troubleshooting section
3. Check pod events and descriptions
4. Verify all prerequisites are met

## Version Information
- Script Version: 2.0
- Kafka: 4.1.1 (KRaft Mode)
- Kubernetes: Compatible with 1.24+
- Minikube: Tested with 1.30+

Last Updated: November 28, 2025
