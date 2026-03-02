# SAARKAAR Production Deployment (Kubernetes)

## 1) Build and Push Docker Images

```bash
# Frontend
cd frontend
docker build -t your-dockerhub-user/saarkaar-frontend:latest --build-arg VITE_API_URL=/api .
docker push your-dockerhub-user/saarkaar-frontend:latest

# Backend
cd ../backend
docker build -t your-dockerhub-user/saarkaar-backend:latest .
docker push your-dockerhub-user/saarkaar-backend:latest
```

## 2) Configure Kubernetes Files

- Update image names in:
  - `deploy/k8s/frontend-deployment.yaml`
  - `deploy/k8s/backend-deployment.yaml`
- Update domain in:
  - `deploy/k8s/ingress.yaml` (`your-domain.com`)
- Create secret file from template:
  - Copy `deploy/k8s/backend-secret.example.yaml` to `deploy/k8s/backend-secret.yaml`
  - Fill real values (`OPENAI_API_KEY`, `MONGO_URL`, admin creds)

## 3) Apply Manifests

```bash
kubectl apply -f deploy/k8s/namespace.yaml
kubectl apply -f deploy/k8s/backend-configmap.yaml
kubectl apply -f deploy/k8s/backend-secret.yaml
kubectl apply -f deploy/k8s/backend-deployment.yaml
kubectl apply -f deploy/k8s/frontend-deployment.yaml
kubectl apply -f deploy/k8s/ingress.yaml
kubectl apply -f deploy/k8s/hpa.yaml
```

## 4) Verify

```bash
kubectl get pods -n saarkaar-prod
kubectl get svc -n saarkaar-prod
kubectl get ingress -n saarkaar-prod
kubectl logs deploy/backend -n saarkaar-prod
```

## 5) Production Notes

- Ensure NGINX Ingress Controller is installed.
- Add TLS cert (cert-manager recommended).
- Use managed MongoDB for persistence.
- Keep admin credentials only in Kubernetes Secret.
- Set CORS_ORIGINS in ConfigMap to your production domain.
