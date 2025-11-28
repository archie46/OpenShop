# OpenShop UI Deployment Guide

## Overview

This guide covers the deployment of the OpenShop React UI application to Kubernetes using Minikube.

## Architecture

The UI deployment consists of:
- **React Application**: Built with Vite, TypeScript, React Router, Material-UI, and Redux
- **Nginx Server**: Serves the static build files
- **Docker Image**: Multi-stage build (Node.js builder + Nginx runtime)
- **Kubernetes Service**: NodePort service exposed on port 30090

## Files Created

### 1. UI Dockerfile (`ui/Dockerfile`)
Multi-stage Docker build:
- **Stage 1 (Builder)**: 
  - Uses `node:20-alpine`
  - Installs dependencies with `npm ci`
  - Builds production bundle with `npm run build`
  
- **Stage 2 (Runtime)**:
  - Uses `nginx:alpine`
  - Copies built files to nginx html directory
  - Includes custom nginx configuration
  - Exposes port 80

### 2. Nginx Configuration (`ui/nginx.conf`)
Features:
- Single Page Application (SPA) routing support
- Gzip compression for assets
- Security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)
- Static asset caching (1 year for js/css/images)
- Health check endpoint at `/health`
- Denies access to hidden files

### 3. Kubernetes Environment File (`ui/.env.k8s`)
```bash
VITE_API_BASE_URL=http://api-gateway.openshop.svc.cluster.local:8080
```
This file is used during the Docker build to configure the UI to connect to the API Gateway within the Kubernetes cluster.

### 4. Kubernetes Deployment (`k8s/06-ui.yaml`)
Includes:
- **Deployment**:
  - 1 replica
  - Image: `openshop-ui:latest`
  - Container port: 80
  - Liveness probe: HTTP GET `/health` (10s initial delay)
  - Readiness probe: HTTP GET `/health` (5s initial delay)
  - Resources: 128Mi-256Mi memory, 100m-200m CPU

- **Service**:
  - Type: NodePort
  - Port: 80
  - NodePort: 30090

## CORS Configuration

The API Gateway has been updated to allow CORS requests from the UI:

### Updated CORS Origins (`apigateway/src/main/java/com/openshop/apigateway/config/CorsConfig.java`)
```java
corsConfig.setAllowedOriginPatterns(Arrays.asList(
    "http://localhost:5173",              // Local development
    "http://localhost:5173/",
    "http://localhost:*",                 // Any local port
    "http://openshop-ui:80",              // K8s service name
    "http://openshop-ui.openshop.svc.cluster.local:80", // Full K8s DNS
    "http://*.minikube.internal:*",       // Minikube internal URLs
    "http://*:30090"                      // NodePort access
));
```

This configuration allows:
- Local development on any port
- Kubernetes internal service communication
- Minikube NodePort access
- Flexible port mapping for different environments

## Deployment Process

### Automated Deployment (Recommended)

The `k8s/build-and-deploy.sh` script has been updated to include UI deployment:

```bash
cd k8s
./build-and-deploy.sh
```

This will:
1. Build all backend services
2. Build the UI with Kubernetes environment variables
3. Deploy all services including the UI
4. Wait for pods to be ready
5. Display access URLs

### Manual Deployment

If you need to deploy only the UI:

#### Step 1: Build the UI Docker Image

```bash
cd ui

# Copy Kubernetes environment file
cp .env.k8s .env

# Build the Docker image using Minikube's Docker daemon
eval $(minikube docker-env)
docker build -t openshop-ui:latest .

cd ..
```

#### Step 2: Deploy to Kubernetes

```bash
cd k8s
kubectl apply -f 06-ui.yaml
```

#### Step 3: Verify Deployment

```bash
# Check pod status
kubectl get pods -n openshop -l app=openshop-ui

# Check service
kubectl get svc -n openshop openshop-ui

# View logs
kubectl logs -n openshop -f deployment/openshop-ui
```

## Accessing the UI

### Method 1: Minikube Service (Recommended)

```bash
minikube service openshop-ui -n openshop
```

This will automatically open the UI in your default browser.

### Method 2: Get NodePort URL

```bash
minikube service openshop-ui -n openshop --url
```

Then visit the displayed URL in your browser.

### Method 3: Port Forward

```bash
kubectl port-forward -n openshop svc/openshop-ui 8090:80
```

Then visit `http://localhost:8090`

## Verifying the Deployment

### 1. Check Pod Status

```bash
kubectl get pods -n openshop -l app=openshop-ui

# Expected output:
# NAME                            READY   STATUS    RESTARTS   AGE
# openshop-ui-xxxxxxxxxx-xxxxx    1/1     Running   0          2m
```

### 2. Check Service

```bash
kubectl get svc -n openshop openshop-ui

# Expected output:
# NAME          TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
# openshop-ui   NodePort   10.xx.xxx.xxx   <none>        80:30090/TCP   2m
```

### 3. Test Health Endpoint

```bash
# Get the URL
UI_URL=$(minikube service openshop-ui -n openshop --url)

# Test health endpoint
curl $UI_URL/health

# Expected output: healthy
```

### 4. View Logs

```bash
kubectl logs -n openshop -f deployment/openshop-ui
```

## Troubleshooting

### UI Pod Not Starting

1. Check pod description:
   ```bash
   kubectl describe pod -n openshop -l app=openshop-ui
   ```

2. Check if image exists in Minikube:
   ```bash
   eval $(minikube docker-env)
   docker images | grep openshop-ui
   ```

3. Rebuild if necessary:
   ```bash
   cd ui
   cp .env.k8s .env
   docker build -t openshop-ui:latest .
   ```

### UI Shows Blank Page

1. Check browser console for errors
2. Verify API Gateway is accessible:
   ```bash
   kubectl get pods -n openshop -l app=api-gateway
   ```

3. Check nginx logs:
   ```bash
   kubectl logs -n openshop -f deployment/openshop-ui
   ```

### CORS Errors

1. Verify CORS configuration in API Gateway:
   ```bash
   kubectl logs -n openshop -f deployment/api-gateway | grep -i cors
   ```

2. Rebuild API Gateway with updated CORS config:
   ```bash
   cd apigateway
   ./mvnw clean package -DskipTests
   docker build -t api-gateway:latest .
   kubectl rollout restart deployment/api-gateway -n openshop
   ```

### Cannot Access UI from Browser

1. Verify Minikube is running:
   ```bash
   minikube status
   ```

2. Check NodePort service:
   ```bash
   kubectl get svc -n openshop openshop-ui
   ```

3. Try accessing via Minikube IP:
   ```bash
   echo "http://$(minikube ip):30090"
   ```

## Environment Variables

### Development (.env or .env.local)
```bash
VITE_API_BASE_URL=http://localhost:8080
```

### Kubernetes (.env.k8s)
```bash
VITE_API_BASE_URL=http://api-gateway.openshop.svc.cluster.local:8080
```

### Production (.env.production)
```bash
VITE_API_BASE_URL=https://openshop-backend.cfapps.eu12.hana.ondemand.com
```

## Updating the UI

### Update Code and Redeploy

```bash
# 1. Update your code in ui/src

# 2. Rebuild and redeploy
cd k8s
./build-and-deploy.sh build

# Or manually:
cd ui
cp .env.k8s .env
eval $(minikube docker-env)
docker build -t openshop-ui:latest .
kubectl rollout restart deployment/openshop-ui -n openshop
```

### Watch Rollout Status

```bash
kubectl rollout status deployment/openshop-ui -n openshop
```

## Resource Management

### Scale UI Replicas

```bash
# Scale to 2 replicas
kubectl scale deployment/openshop-ui -n openshop --replicas=2

# Scale back to 1
kubectl scale deployment/openshop-ui -n openshop --replicas=1
```

### Update Resource Limits

Edit `k8s/06-ui.yaml` and update the resources section:

```yaml
resources:
  requests:
    memory: "128Mi"
    cpu: "100m"
  limits:
    memory: "256Mi"
    cpu: "200m"
```

Then apply:
```bash
kubectl apply -f k8s/06-ui.yaml
```

## Clean Up

### Delete UI Deployment

```bash
kubectl delete -f k8s/06-ui.yaml
```

### Delete UI Image

```bash
eval $(minikube docker-env)
docker rmi openshop-ui:latest
```

## Performance Optimization

### Nginx Configuration

The nginx configuration includes:
- **Gzip compression**: Reduces file sizes for faster transfers
- **Static asset caching**: 1-year cache for js/css/images
- **Security headers**: Protects against common web vulnerabilities

### Docker Image Optimization

- **Multi-stage build**: Keeps final image small (~50MB)
- **Alpine base images**: Minimal footprint
- **Production build**: Optimized React bundle

## Security Considerations

1. **CORS**: Properly configured to allow only expected origins
2. **Security Headers**: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
3. **Hidden Files**: Access to dotfiles is blocked
4. **No Directory Listing**: Nginx configured to prevent directory browsing

## Next Steps

1. Set up Ingress for production-like routing
2. Add SSL/TLS certificates
3. Configure horizontal pod autoscaling
4. Set up monitoring and logging
5. Implement CI/CD pipeline for automated deployments

## References

- [OpenShop Repository](https://github.com/archie46/openshop-backend)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Minikube Documentation](https://minikube.sigs.k8s.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Vite Documentation](https://vitejs.dev/)
