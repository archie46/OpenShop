# Build and Deploy Script - Label Selector Fixes

## Issue Summary

The `build-and-deploy.sh` script was hanging during Kafka and UI deployment because it was using **incorrect label selectors** to wait for pods to be ready.

## Root Causes

### 1. Kafka Broker Label Mismatch

**Problem:** The script was looking for Kafka broker pods with incorrect labels.

**Incorrect label selector used:**
```bash
strimzi.io/cluster=openshop-kafka,strimzi.io/kind=Kafka,strimzi.io/name=openshop-kafka-broker
```

**Actual labels on Kafka broker pod (`openshop-kafka-broker-0`):**
```
app.kubernetes.io/instance=openshop-kafka
app.kubernetes.io/managed-by=strimzi-cluster-operator
app.kubernetes.io/name=kafka
strimzi.io/broker-role=true
strimzi.io/cluster=openshop-kafka
strimzi.io/component-type=kafka
strimzi.io/controller=strimzipodset
strimzi.io/controller-name=openshop-kafka-broker
strimzi.io/controller-role=true
strimzi.io/kind=Kafka
strimzi.io/name=openshop-kafka-kafka  ← Note: kafka-kafka, NOT kafka-broker
strimzi.io/pod-name=openshop-kafka-broker-0
strimzi.io/pool-name=broker
```

**Fix:** Changed to use `strimzi.io/pool-name=broker` which uniquely identifies the broker pod.

### 2. Kafka Entity Operator Label Mismatch

**Problem:** Similar issue with Entity Operator pod labels.

**Incorrect label selector used:**
```bash
strimzi.io/cluster=openshop-kafka,strimzi.io/kind=Kafka,strimzi.io/name=openshop-kafka-entity-operator
```

**Fix:** Changed to use `app.kubernetes.io/name=entity-operator,strimzi.io/cluster=openshop-kafka`

### 3. UI Pod Status

**Status:** The UI pod label selector `app=openshop-ui` was already correct. The pod is configured with proper health checks at `/health` endpoint and should become ready within the timeout period.

## Changes Made to build-and-deploy.sh

### Before (Lines 254-258):
```bash
print_info "Waiting for Kafka cluster to be ready..."
# Wait for Kafka broker pod
wait_for_pod "strimzi.io/cluster=openshop-kafka,strimzi.io/kind=Kafka,strimzi.io/name=openshop-kafka-broker" "Kafka Broker" 300

# Wait for Entity Operator
wait_for_pod "strimzi.io/cluster=openshop-kafka,strimzi.io/kind=Kafka,strimzi.io/name=openshop-kafka-entity-operator" "Kafka Entity Operator" 180
```

### After:
```bash
print_info "Waiting for Kafka cluster to be ready..."
# Wait for Kafka broker pod
wait_for_pod "strimzi.io/cluster=openshop-kafka,strimzi.io/pool-name=broker" "Kafka Broker" 300

# Wait for Entity Operator
wait_for_pod "app.kubernetes.io/name=entity-operator,strimzi.io/cluster=openshop-kafka" "Kafka Entity Operator" 180
```

## Verification Commands

To verify the pods and their labels:

```bash
# Check Kafka broker pod and labels
kubectl get pods -n openshop -l strimzi.io/pool-name=broker
kubectl describe pod openshop-kafka-broker-0 -n openshop | grep -A 20 "Labels:"

# Check Entity Operator pod and labels
kubectl get pods -n openshop -l app.kubernetes.io/name=entity-operator
kubectl describe pod -n openshop -l app.kubernetes.io/name=entity-operator | grep -A 20 "Labels:"

# Check UI pod and labels
kubectl get pods -n openshop -l app=openshop-ui
kubectl describe pod -n openshop -l app=openshop-ui | grep -A 20 "Labels:"

# Check if pods are Ready
kubectl get pods -n openshop -l strimzi.io/pool-name=broker -o jsonpath='{.items[0].status.conditions[?(@.type=="Ready")].status}'
kubectl get pods -n openshop -l app.kubernetes.io/name=entity-operator -o jsonpath='{.items[0].status.conditions[?(@.type=="Ready")].status}'
kubectl get pods -n openshop -l app=openshop-ui -o jsonpath='{.items[0].status.conditions[?(@.type=="Ready")].status}'
```

## Expected Behavior After Fix

The `build-and-deploy.sh` script should now:

1. ✅ Wait for Kafka broker pod to be ready (using correct label selector)
2. ✅ Wait for Kafka Entity Operator to be ready (using correct label selector)
3. ✅ Wait for UI pod to be ready (label selector was already correct)
4. ✅ Continue with deployment without hanging

## Why This Happened

When using Strimzi Operator with KRaft mode and KafkaNodePool:
- Strimzi creates pods with specific naming and labeling conventions
- The pod name includes the node pool name (e.g., `openshop-kafka-broker-0`)
- But the `strimzi.io/name` label is different (e.g., `openshop-kafka-kafka`)
- The most reliable selector is `strimzi.io/pool-name` which matches the KafkaNodePool name

## Testing

To test the fix:

```bash
# Clean up existing deployment (optional)
kubectl delete namespace openshop

# Run the build and deploy script
cd k8s
./build-and-deploy.sh all

# Or run from specific step
./build-and-deploy.sh kafka
```

The script should now complete successfully without hanging at the Kafka or UI readiness checks.

## Additional Notes

- The UI deployment includes proper liveness and readiness probes pointing to `/health` endpoint
- The nginx configuration includes the `/health` endpoint that returns HTTP 200
- All label selectors now use labels that are actually present on the pods
- The timeout values remain unchanged (300s for Kafka, 180s for Entity Operator and UI)
