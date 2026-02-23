# Docker Deployment Guide

## Quick Start

### Using Docker Compose (Recommended)

1. **Build and start the application:**
   ```bash
   docker-compose up -d --build
   ```

2. **Check the logs:**
   ```bash
   docker-compose logs -f
   ```

3. **Stop the application:**
   ```bash
   docker-compose down
   ```

4. **Stop and remove data:**
   ```bash
   docker-compose down -v
   ```

The application will be available at `http://localhost:3001`

### Using Docker directly

1. **Build the image:**
   ```bash
   docker build -t toil-tracker .
   ```

2. **Run the container:**
   ```bash
   docker run -d \
     --name toil-tracker \
     -p 3001:3001 \
     -v toil-data:/data \
     -e DATABASE_URL=file:/data/toil.db \
     toil-tracker
   ```

## Configuration

### Environment Variables

Create a `.env.production` file based on `.env.production.example`:

- `NODE_ENV` - Set to `production`
- `PORT` - Server port (default: 3001)
- `DATABASE_URL` - Database file path (default: file:/data/toil.db)
- `API_KEY` - Optional API key for authentication
- `CORS_ORIGIN` - Optional CORS origin (default: *)

### Data Persistence

The database is stored in a Docker volume named `toil-data`. To backup:

```bash
docker run --rm -v toil-data:/data -v $(pwd):/backup alpine tar czf /backup/toil-backup.tar.gz /data
```

To restore:

```bash
docker run --rm -v toil-data:/data -v $(pwd):/backup alpine tar xzf /backup/toil-backup.tar.gz -C /
```

## Production Deployment

### With Reverse Proxy (Nginx/Caddy)

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### With Docker Swarm

```bash
docker stack deploy -c docker-compose.yml toil-tracker
```

### With Kubernetes

See `k8s/` directory for Kubernetes manifests (if needed).

## Health Checks

The application provides a health check endpoint at `/health`:

```bash
curl http://localhost:3001/health
```

## Security Recommendations

1. **Enable API authentication** by setting `API_KEY` environment variable
2. **Set CORS_ORIGIN** to your domain in production
3. **Use HTTPS** with a reverse proxy
4. **Regular backups** of the database volume
5. **Update dependencies** regularly for security patches

## Monitoring

Check application logs:
```bash
docker-compose logs -f toil-tracker
```

Check container health:
```bash
docker-compose ps
```

## Troubleshooting

### Database migrations not running

```bash
docker-compose exec toil-tracker npx prisma migrate deploy
```

### Reset database

```bash
docker-compose down -v
docker-compose up -d
```

### Build cache issues

```bash
docker-compose build --no-cache
docker-compose up -d
```
