# Build and Deploy Script Fixes

## Issues Fixed

### 1. ❌ Database Count Issue
**Problem:** Script was only checking 3 databases, but the system has 8 databases

**Solution:** Updated script to wait for all 8 databases:
- User DB (postgres-user)
- Product DB (postgres-product)
- Order DB (postgres-order)
- Cart DB (postgres-cart)
- Inventory DB (postgres-inventory)
- Payment DB (postgres-payment)
- Notification DB (postgres-notification)
- Shipping DB (postgres-shipping)

### 2. ❌ Kafka Readiness Issue
**Problem:** Kafka was not properly verified as ready before proceeding

**Solution:** Implemented multi-stage Kafka readiness check:
1. Wait for Zookeeper pod to be ready first (180s timeout)
2. Wait for Kafka pod to be ready (240s timeout)
3. Verify Kafka is accepting connections by attempting to list topics
4. Show detailed logs if Kafka fails readiness checks

### 3. ❌ Missing Logging During Deployment
**Problem:** Script didn't show what was happening during deployment, making troubleshooting difficult

**Solution:** Added comprehensive logging features:
- Real-time pod status updates every 5 seconds
- Automatic log display every 15 seconds during waits
- Color-coded status messages (INFO, WARN, ERROR, STATUS)
- Pod phase and readiness status tracking
- Final summary of any problematic pods with commands to check logs

## New Features

### Enhanced Wait Functions
- `wait_for_pod()`: Waits for pods with detailed status updates and automatic log display
- `check_kafka_ready()`: Verifies Kafka can actually accept connections (not just pod running)
- `show_pod_logs()`: Displays last 20 lines of pod logs for troubleshooting

### Color-Coded Output
- 🟢 **GREEN** - Success messages and info
- 🟡 **YELLOW** - Warnings
- 🔴 **RED** - Errors
- 🔵 **BLUE** - Step headers
- 🔷 **CYAN** - Status updates and logs

### Improved Error Handling
- Maven build failures now exit immediately with clear error messages
- Docker build failures now exit immediately with clear error messages
- Silent builds (output suppressed) with success/failure indicators
- Detailed status for pods that don't become ready

### Deployment Progress Tracking
Shows status every 5 seconds:
```
[STATUS] Kafka status: Running (Ready: False) - 15s elapsed
[STATUS] Fetching logs for Kafka...
--- Last 20 lines of Kafka logs ---
[log output]
--- End of logs ---
```

### Post-Deployment Summary
The script now provides:
- Detailed pod status with node information
- Service endpoints
- Persistent Volume Claims status
- Helpful commands for monitoring and troubleshooting
- List of any pods not running with commands to check their logs

## Usage

```bash
# Make executable (already done)
chmod +x k8s/build-and-deploy.sh

# Run the deployment
./k8s/build-and-deploy.sh
```

## Useful Commands (from script output)

### View Logs
```bash
# Microservice logs
kubectl logs -n openshop -f deployment/user-service

# Kafka logs
kubectl logs -n openshop -f deployment/kafka

# Database logs
kubectl logs -n openshop -f deployment/postgres-user
```

### Monitor Status
```bash
# Watch pods in real-time
kubectl get pods -n openshop -w

# Check specific pod details
kubectl describe pod -n openshop <pod-name>

# Check services
kubectl get services -n openshop
```

### Access Services
```bash
# Open API Gateway in browser
minikube service api-gateway -n openshop

# Port forward to specific service
kubectl port-forward -n openshop svc/user-service 8080:8080
```

### Kafka Operations
```bash
# List Kafka topics
kubectl exec -n openshop -it deployment/kafka -- kafka-topics --bootstrap-server localhost:9092 --list

# Create topic
kubectl exec -n openshop -it deployment/kafka -- kafka-topics --bootstrap-server localhost:9092 --create --topic test-topic --partitions 1 --replication-factor 1

# Describe topic
kubectl exec -n openshop -it deployment/kafka -- kafka-topics --bootstrap-server localhost:9092 --describe --topic order-created
```

## What to Expect

### Build Phase
Each service will show:
- Maven build status (✓ or ✗)
- Docker image build status (✓ or ✗)
- Clear error messages if builds fail

### Deployment Phase
1. **Infrastructure** (Namespace, Secrets, ConfigMaps) - immediate
2. **Zookeeper** - ~30-60s to be ready
3. **Kafka** - ~60-120s to be ready + connection verification
4. **Databases** (all 8) - ~2-5 minutes total
5. **Microservices** - ~2-3 minutes to start

Total deployment time: **~5-10 minutes** depending on system resources

### Real-Time Feedback
You'll see status updates like:
```
[INFO] ✓ Zookeeper is ready!
[STATUS] Kafka status: Running (Ready: False) - 45s elapsed
[STATUS] User DB status: Running (Ready: True) - 25s elapsed
[INFO] ✓ All 8 databases are ready!
```

## Troubleshooting

If deployment fails, the script will:
1. Show which component failed
2. Display recent logs automatically
3. Provide commands to investigate further
4. List all non-running pods with log commands

Common issues:
- **Minikube not started**: Run `minikube start --cpus=4 --memory=8192`
- **Insufficient resources**: Increase CPU/memory for Minikube
- **Kafka timeout**: May need to wait longer; check logs manually
- **Database not ready**: PVC may be slow to provision; check `kubectl get pvc -n openshop`

## Changes Summary

| Component | Before | After |
|-----------|--------|-------|
| Database checks | 3 databases | 8 databases (all services) |
| Kafka readiness | Basic pod check | Multi-stage with connection verification |
| Logging | Minimal | Comprehensive with auto-display |
| Error handling | Generic | Detailed with immediate feedback |
| Status updates | Static | Real-time every 5s |
| Build feedback | Verbose output | Clean with status indicators |
| Troubleshooting | Manual | Automated suggestions |

## Files Modified

- `k8s/build-and-deploy.sh` - Complete rewrite with enhanced features
- This file created for documentation

## Testing Recommendations

1. Test with clean Minikube: `minikube delete && minikube start --cpus=4 --memory=8192`
2. Run script and monitor output
3. Verify all 8 databases appear in pod list
4. Check Kafka connection verification succeeds
5. Confirm logs display automatically during waits
6. Verify final status shows all pods running

## Next Steps

The script is now ready to use with:
- ✅ All 8 databases properly checked
- ✅ Kafka readiness properly verified
- ✅ Comprehensive logging throughout deployment
- ✅ Clear error messages and troubleshooting guidance
