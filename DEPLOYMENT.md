# Deployment Guide (VPS + Nginx + PM2)

This project has:
- `frontend` (Vite React build)
- `backend` (Node/Express API with JSON file storage in `backend/data`)

## 1. Server prerequisites

Install Node.js 20+, Nginx, and PM2:

```bash
sudo apt update
sudo apt install -y nginx
sudo npm i -g pm2
```

## 2. Copy project to server

```bash
cd /var/www
git clone <your-repo-url> nexora
cd nexora
```

## 3. Configure backend environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and set:
- `PORT=5000`
- `JWT_SECRET=<strong-secret>`
- `NODE_ENV=production`
- `CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com`

## 4. Configure frontend environment

```bash
cp frontend/.env.production.example frontend/.env.production
```

For same-domain deployment with Nginx proxy, keep:
- `VITE_API_URL=/api`

## 5. Install dependencies and build frontend

```bash
cd backend && npm ci
cd ../frontend && npm ci && npm run build
```

## 6. Start backend with PM2

Option A (quick):

```bash
cd /var/www/nexora/backend
pm2 start server.js --name nexora-api
pm2 save
pm2 startup
```

Option B (recommended, from template):

```bash
cp /var/www/nexora/deploy/ecosystem.config.cjs /var/www/nexora/ecosystem.config.cjs
# edit env values in ecosystem file first
pm2 start /var/www/nexora/ecosystem.config.cjs
pm2 save
pm2 startup
```

## 7. Configure Nginx

```bash
sudo cp /var/www/nexora/deploy/nginx-nexora.conf /etc/nginx/sites-available/nexora
sudo ln -s /etc/nginx/sites-available/nexora /etc/nginx/sites-enabled/nexora
sudo nginx -t
sudo systemctl reload nginx
```

Edit `server_name` and `root` path in the Nginx file before reload.

## 8. Enable HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 9. Verify

- Frontend: `https://yourdomain.com`
- API health: `https://yourdomain.com/api/health`
- PM2 logs: `pm2 logs nexora-api`

## Notes

- JSON data is stored in `backend/data`. Keep server backups for this directory.
- If backend runs on a separate domain, set `VITE_API_URL` to full API URL and update `CORS_ORIGINS` accordingly.
