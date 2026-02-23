# TOIL Tracker - Quick Start

## Local Development

```bash
# Install dependencies
npm install

# Initialize database
npm run db:init

# Seed sample data (optional)
npm run db:seed

# Start development servers
npm run dev
```

Open http://localhost:5173 for the web UI
API runs at http://localhost:3001

## Docker Production Deployment

```bash
# Quick start with Docker Compose
npm run docker:up

# View logs
npm run docker:logs

# Stop containers
npm run docker:down
```

App available at http://localhost:3001

## Manual Docker Commands

```bash
# Build image
npm run build:docker

# Or manually:
docker build -t toil-tracker .

# Run container
docker run -d \
  --name toil-tracker \
  -p 3001:3001 \
  -v toil-data:/data \
  -e DATABASE_URL=file:/data/toil.db \
  -e API_KEY=your-secret-key \
  toil-tracker
```

## Environment Setup

1. Copy `.env.production.example` to create your production config
2. Set a secure `API_KEY` (use `openssl rand -hex 32`)
3. Configure `CORS_ORIGIN` for your domain
4. Deploy using Docker Compose or manual Docker commands

## Key Features

- ✅ Single-container deployment
- ✅ Persistent SQLite database with volumes
- ✅ Automatic migrations on startup
- ✅ Health checks built-in
- ✅ Static frontend served from API server
- ✅ Production-ready configuration

## Security Checklist

- [ ] Set a strong `API_KEY`
- [ ] Configure `CORS_ORIGIN` to your domain
- [ ] Use HTTPS with a reverse proxy (nginx/Caddy)
- [ ] Regular database backups
- [ ] Keep dependencies updated

## Useful Commands

```bash
# Development
npm run dev          # Start both server and client
npm run dev:server   # Start server only
npm run dev:client   # Start client only

# Database
npm run db:init      # Initialize database
npm run db:seed      # Seed sample data

# Docker
npm run docker:up    # Start containers
npm run docker:down  # Stop containers
npm run docker:logs  # View logs

# Build
npm run build        # Build both server and client
npm run build:docker # Build Docker image
```

## Documentation

- [README.md](README.md) - Full documentation
- [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed deployment guide
- `.env.production.example` - Production environment template

## Support

For issues, questions, or contributions, visit:
https://github.com/NicholasPagonis/TOIL-Tracker
