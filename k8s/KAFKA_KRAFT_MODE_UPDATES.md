# Kafka KRaft Mode Configuration Updates

## Overview
This document describes the updates made to configure Kafka in KRaft mode (Kafka Raft) for Kubernetes deployment, eliminating the need for Zookeeper.

## What is KRaft Mode?
KRaft (Kafka Raft) is Apache Kafka's built-in consensus protocol that replaces the dependency on Apache Zookeeper. Key benefits:
- **Simplified Architecture**: No need for separate Zookeeper cluster
- **Better Performance**: Reduced latency and improved scalability
- **Easier Operations**: Fewer components to manage and monitor
- **Production Ready**: Available since Kafka 2.8, production-ready since Kafka 3.3+

## Changes Made

### 1. Kafka Configuration (k8s/03-kafka-zookeeper.yaml)

#### KRaft Mode Environment Variables
```yaml
- name: KAFKA_NODE_ID
  value: "1"

- name: KAFKA_PROCESS_ROLES
  value: "broker,controller"

- name: KAFKA_CONTROLLER_QUORUM_VOTERS
  value: "1@kafka:9093"

- name: KAFKA_LISTENERS
  value: "PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093"

- name: KAFKA_ADVERTISED_LISTENERS
  value: "PLAINTEXT://kafka:9092"

- name: KAFKA_LISTENER_SECURITY_PROTOCOL_MAP
  value: "PLAINTEXT:PLAINTEXT,CONTROLLER:PLAINTEXT"

- name: KAFKA_INTER_BROKER_LISTENER_NAME
  value: "PLAINTEXT"

- name: KAFKA_CONTROLLER_LISTENER_NAMES
  value: "CONTROLLER"
```

**Key Configuration Details:**
- `KAFKA_PROCESS_ROLES`: Set to "broker,controller" for combined mode (single node)
- `KAFKA_CONTROLLER_QUORUM_VOTERS`: Defines the controller quorum
- `KAFKA_LISTENERS`: Two listeners - one for clients (9092) and one for controller (9093)
- `KAFKA_CONTROLLER_LISTENER_NAMES`: Specifies which listener is used for controller communication

#### Enhanced Health Checks
```yaml
livenessProbe:
  exec:
    command:
    - sh
    - -c
    - "kafka-broker-api-versions.sh --bootstrap-server localhost:9092 || exit 1"
  initialDelaySeconds: 90
  periodSeconds: 15
  timeoutSeconds: 10
  failureThreshold: 5

readinessProbe:
  exec:
    command:
    - sh
    - -c
    - "kafka-broker-api-versions.sh --bootstrap-server localhost:9092 || exit 1"
  initialDelaySeconds: 60
  periodSeconds: 10
  timeoutSeconds: 10
  failureThreshold: 10
```

**Improvements:**
- Uses `kafka-broker-api-versions.sh` for more accurate health checks
- Longer initial delays (60s/90s) to allow proper startup
- More retries (10 for readiness) for resilience
- Exec probes instead of TCP probes for better validation

#### Log Level Configuration
```yaml
- name: KAFKA_LOG4J_ROOT_LOGLEVEL
  value: "WARN"

- name: KAFKA_TOOLS_LOG4J_LOGLEVEL
  value: "ERROR"
```

**Benefits:**
- Reduces log verbosity
- Improves performance
- Makes troubleshooting easier by reducing noise

#### Resource Limits
```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "250m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

**Considerations:**
- Appropriate for development/testing
- Adjust for production based on workload

### 2. Deployment Script Updates (k8s/build-and-deploy.sh)

#### Removed Zookeeper Dependency
**Before:**
```bash
echo ""
print_step "Deploying Zookeeper and Kafka..."
kubectl apply -f 03-kafka-zookeeper.yaml

echo ""
# Wait for Zookeeper first
wait_for_pod "app=zookeeper" "Zookeeper" 180

# Then wait for Kafka
wait_for_pod "app=kafka" "Kafka" 240
```

**After:**
```bash
echo ""
print_step "Deploying Kafka (KRaft mode - no Zookeeper needed)..."
kubectl apply -f 03-kafka-zookeeper.yaml

echo ""
# Wait for Kafka to be ready
wait_for_pod "app=kafka" "Kafka" 300
```

**Changes:**
- Removed Zookeeper deployment and wait steps
- Updated messaging to indicate KRaft mode
- Increased Kafka wait timeout to 300s (5 minutes) for safe startup

## Architecture Comparison

### Before (Zookeeper Mode)
```
┌──────────────┐
│  Zookeeper   │ ← Manages cluster metadata
└──────────────┘
       ↕
┌──────────────┐
│    Kafka     │ ← Message broker
└──────────────┘
       ↕
┌──────────────┐
│ Microservices│
└──────────────┘
```

### After (KRaft Mode)
```
┌──────────────┐
│    Kafka     │ ← Self-managed with built-in consensus
│  (KRaft)     │
└──────────────┘
       ↕
┌──────────────┐
│ Microservices│
└──────────────┘
```

## Benefits of This Configuration

1. **Simplified Deployment**
   - One fewer component to manage
   - Reduced resource usage
   - Faster startup times

2. **Improved Reliability**
   - No Zookeeper dependency eliminates a single point of failure
   - Built-in consensus protocol is more robust

3. **Better Performance**
   - Lower latency for metadata operations
   - Reduced network hops

4. **Easier Maintenance**
   - Fewer logs to monitor
   - Simpler troubleshooting
   - Single configuration file

## Deployment Instructions

### Initial Deployment
```bash
cd k8s
./build-and-deploy.sh
```

### Verify Kafka is Running
```bash
# Check pod status
kubectl get pods -n openshop -l app=kafka

# Check logs
kubectl logs -n openshop -f deployment/kafka

# List topics (verifies Kafka is accepting connections)
kubectl exec -n openshop deployment/kafka -- kafka-topics.sh --bootstrap-server localhost:9092 --list
```

### Expected Output
```
NAME                           READY   STATUS    RESTARTS   AGE
kafka-xxxxxxxxxx-xxxxx         1/1     Running   0          2m
```

## Troubleshooting

### Kafka Pod Not Starting
```bash
# Check pod events
kubectl describe pod -n openshop -l app=kafka

# Check logs
kubectl logs -n openshop -l app=kafka --tail=50
```

### Health Check Failures
```bash
# Manually test health check
kubectl exec -n openshop deployment/kafka -- kafka-broker-api-versions.sh --bootstrap-server localhost:9092
```

### Microservices Can't Connect
```bash
# Verify Kafka service
kubectl get svc -n openshop kafka

# Test connection from a microservice pod
kubectl exec -n openshop deployment/order-service -- nc -zv kafka 9092
```

## Migration Notes

### From Zookeeper to KRaft
If migrating from an existing Zookeeper-based deployment:

1. **Backup Data**: Ensure all data is backed up
2. **Clean Slate**: Delete existing Kafka and Zookeeper deployments
3. **Apply New Config**: Deploy with the updated KRaft configuration
4. **Verify**: Test that all services can connect and produce/consume messages

### Important Considerations
- KRaft mode uses a different metadata format
- Direct migration from Zookeeper to KRaft is not supported
- For production migrations, consult the official Kafka documentation

## Performance Tuning

### For Development
Current configuration is suitable for development:
- 512Mi memory request
- 1Gi memory limit
- Single replica

### For Production
Consider these adjustments:
```yaml
spec:
  replicas: 3  # For high availability
  resources:
    requests:
      memory: "2Gi"
      cpu: "1000m"
    limits:
      memory: "4Gi"
      cpu: "2000m"
```

## Related Files
- `k8s/03-kafka-zookeeper.yaml` - Kafka deployment configuration
- `k8s/build-and-deploy.sh` - Deployment script
- `KAFKA_STARTUP_FIX.md` - Docker Compose Kafka fixes
- `docker-compose.yml` - Local development configuration

## References
- [Kafka KRaft Documentation](https://kafka.apache.org/documentation/#kraft)
- [Apache Kafka 4.1.1 Docker Image](https://hub.docker.com/r/apache/kafka)
- [KRaft Migration Guide](https://kafka.apache.org/documentation/#kraft_migration)

## Version Information
- Kafka Version: 4.1.1 (apache/kafka:4.1.1)
- Kubernetes API Version: apps/v1
- Configuration Mode: KRaft (No Zookeeper)
- Deployment Type: Single-node (Combined broker/controller)

## Date Updated
November 28, 2025
