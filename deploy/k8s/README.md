# SAARKAAR.IN - Kuberns Deployment Commands
# URL: https://saarkaarin-main-f7282a2.kuberns.cloud

## ── STEP 1: Apply Configs (Run Once) ────────────────────────────────
kubectl apply -f namespace.yaml
kubectl apply -f backend-configmap.yaml
kubectl apply -f backend-secret.yaml

## ── STEP 2: Deploy Services ─────────────────────────────────────────
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f ingress.yaml

## ── STEP 3: Verify ───────────────────────────────────────────────────
kubectl get pods -n saarkaar-prod
kubectl get ingress -n saarkaar-prod

## ── After new Docker build (update deployments) ─────────────────────
kubectl rollout restart deployment/backend -n saarkaar-prod
kubectl rollout restart deployment/frontend -n saarkaar-prod

## ── Check logs if something fails ───────────────────────────────────
kubectl logs -n saarkaar-prod deployment/backend --tail=50
kubectl logs -n saarkaar-prod deployment/frontend --tail=50
kubectl describe pod -n saarkaar-prod <pod-name>
