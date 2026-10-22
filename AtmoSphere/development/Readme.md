# Development Guide

## Prerequisites

- Docker and Docker Compose installed

## 1) Create your environment file

```bash
cp .env.example .env
```

## 2) Start all services

```bash
docker compose -f docker-compose.dev.yml up --build
```

## 3) Access the services

- API: http://localhost:8080
- Frontend (Vite): http://localhost:5173

## Useful commands

```bash
# Stop services
docker compose -f docker-compose.dev.yml down

# Stop and remove volumes (clean database)
docker compose -f docker-compose.dev.yml down -v

# Rebuild only API
docker compose -f docker-compose.dev.yml up --build api
```
