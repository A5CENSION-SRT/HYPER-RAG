# Docker & PostgreSQL Complete Guide

This guide provides comprehensive information about Docker usage in the Multi-Agent RAG Pipeline project.

## Table of Contents

1. [Docker Overview](#docker-overview)
2. [PostgreSQL Container Setup](#postgresql-container-setup)
3. [Docker Compose Configuration](#docker-compose-configuration)
4. [PostgreSQL Client (psql) Usage](#postgresql-client-psql-usage)
5. [Common Operations](#common-operations)
6. [Troubleshooting](#troubleshooting)
7. [Advanced Topics](#advanced-topics)

---

## Docker Overview

### What is Docker?

Docker is a containerization platform that allows you to package applications and their dependencies into isolated containers. Containers are:

- **Lightweight**: Share the host OS kernel, unlike virtual machines
- **Portable**: Run consistently across different environments
- **Isolated**: Don't interfere with other applications
- **Version-controlled**: Use specific versions of software

### Docker Components Used in This Project

1. **Docker Engine**: The runtime that executes containers
2. **Docker Compose**: Tool for defining multi-container applications
3. **Docker Images**: Read-only templates (we use `postgres:16-alpine`)
4. **Docker Containers**: Running instances of images
5. **Docker Volumes**: Persistent storage for database data

### Installation

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install docker.io docker-compose-plugin
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
newgrp docker
```

**macOS (using Homebrew):**
```bash
brew install --cask docker
# Open Docker Desktop application after installation
```

**Windows:**
1. Download Docker Desktop from https://www.docker.com/products/docker-desktop
2. Install and restart your computer
3. Ensure WSL 2 is installed (Docker will prompt if needed)

**Verify Installation:**
```bash
docker --version
docker compose version
docker run hello-world
```

---

## PostgreSQL Container Setup

### Directory Structure

```
backend/app/database/
├── docker-compose.yml    # Container configuration
└── (runtime files)       # Created automatically
```

### docker-compose.yml Explanation

```yaml
version: '3.8'  # Docker Compose file format version

services:
  db:  # Service name (internal reference)
    image: postgres:16-alpine  # PostgreSQL 16 on Alpine Linux (lightweight)
    container_name: rag_postgres_db  # External name for docker commands
    restart: "no"  # Don't auto-restart (set to "always" for production)
    
    environment:  # Environment variables passed to container
      POSTGRES_PASSWORD: testpassword123  # Database password
      POSTGRES_DB: rag_db  # Database name to create
      POSTGRES_USER: postgres  # Database user (superuser)
    
    ports:
      - "5432:5432"  # Map host port 5432 to container port 5432
    
    volumes:
      - postgres_data:/var/lib/postgresql/data  # Persistent storage

volumes:
  postgres_data:  # Named volume for database files
    driver: local  # Store on local filesystem
```

### Starting the Container

```bash
# Navigate to database directory
cd backend/app/database

# Start in foreground (see logs)
docker compose up

# Start in background (detached)
docker compose up -d

# Check if running
docker ps
```

**Expected Output:**
```
CONTAINER ID   IMAGE                  STATUS         PORTS                    NAMES
abc123def456   postgres:16-alpine     Up 10 seconds  0.0.0.0:5432->5432/tcp   rag_postgres_db
```

### Stopping the Container

```bash
# Stop but keep data
docker compose down

# Stop and remove all data (⚠️ destructive)
docker compose down -v
```

---

## Docker Compose Configuration

### Customizing the Configuration

#### Change Database Password

Edit `docker-compose.yml`:
```yaml
environment:
  POSTGRES_PASSWORD: your_secure_password_here
  POSTGRES_DB: rag_db
  POSTGRES_USER: postgres
```

**Remember to update** `backend/.env`:
```bash
DATABASE_URL=postgresql://postgres:your_secure_password_here@localhost:5432/rag_db
```

#### Change Port (if 5432 is in use)

Edit `docker-compose.yml`:
```yaml
ports:
  - "5433:5432"  # Use port 5433 on host, 5432 in container
```

Update `backend/.env`:
```bash
DATABASE_URL=postgresql://postgres:testpassword123@localhost:5433/rag_db
```

#### Enable Auto-Restart

Edit `docker-compose.yml`:
```yaml
restart: always  # Container restarts automatically on system reboot
```

#### Add Resource Limits

Edit `docker-compose.yml`:
```yaml
services:
  db:
    # ... existing config ...
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

---

## PostgreSQL Client (psql) Usage

### Installing psql

**Ubuntu/Debian:**
```bash
sudo apt-get install postgresql-client
```

**macOS:**
```bash
brew install postgresql
```

**Windows:**
- Install from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)
- Or use WSL with Ubuntu instructions

**Verify Installation:**
```bash
psql --version
# Output: psql (PostgreSQL) 14.x or higher
```

### Connecting to Database

#### Method 1: Direct Connection (requires psql on host)

```bash
psql -h localhost -U postgres -d rag_db
# Enter password when prompted: testpassword123
```

#### Method 2: Docker Exec (no password needed, recommended)

```bash
docker exec -it rag_postgres_db psql -U postgres -d rag_db
```

### Basic psql Commands

Once connected, you can use these commands:

```sql
-- List all databases
\l
\l+  -- with size information

-- List all tables in current database
\dt
\dt+  -- with size information

-- Describe table structure
\d chat_sessions
\d+ chat_messages  -- with more details

-- List all schemas
\dn

-- List all users/roles
\du

-- Show current connection info
\conninfo

-- Switch database
\c rag_db

-- Execute SQL from file
\i /path/to/file.sql

-- Toggle expanded display (better for wide tables)
\x

-- Get help
\?  -- psql commands
\h  -- SQL commands
\h SELECT  -- help on specific SQL command

-- Timing queries
\timing on
SELECT COUNT(*) FROM chat_messages;
\timing off

-- Save query output to file
\o output.txt
SELECT * FROM chat_sessions;
\o  -- stop output redirect

-- Quit psql
\q
```

### Running SQL Queries

```sql
-- Count chat sessions
SELECT COUNT(*) FROM chat_sessions;

-- View recent messages
SELECT id, session_id, sender, LEFT(content, 50) as content_preview, created_at 
FROM chat_messages 
ORDER BY created_at DESC 
LIMIT 10;

-- Find sessions with most messages
SELECT session_id, COUNT(*) as message_count 
FROM chat_messages 
GROUP BY session_id 
ORDER BY message_count DESC 
LIMIT 5;

-- Get average response time by agent
SELECT agent_name, AVG(time_consumed) as avg_time_ms 
FROM chat_messages 
WHERE agent_name IS NOT NULL 
GROUP BY agent_name;

-- Delete old sessions (older than 30 days)
DELETE FROM chat_sessions 
WHERE created_at < NOW() - INTERVAL '30 days';
```

---

## Common Operations

### Container Management

```bash
# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# Stop container
docker stop rag_postgres_db

# Start stopped container
docker start rag_postgres_db

# Restart container
docker restart rag_postgres_db

# Remove container (must be stopped first)
docker stop rag_postgres_db
docker rm rag_postgres_db

# View container logs
docker logs rag_postgres_db

# Follow logs (live, like tail -f)
docker logs -f rag_postgres_db

# View last 50 log lines
docker logs --tail 50 rag_postgres_db

# View logs from last 10 minutes
docker logs --since 10m rag_postgres_db

# Inspect container configuration
docker inspect rag_postgres_db

# View container stats (CPU, memory, network)
docker stats rag_postgres_db

# Execute command in running container
docker exec -it rag_postgres_db bash

# Copy files to/from container
docker cp file.sql rag_postgres_db:/tmp/
docker cp rag_postgres_db:/tmp/output.txt .
```

### Database Operations

```bash
# Run SQL query directly
docker exec -it rag_postgres_db psql -U postgres -d rag_db -c "SELECT version();"

# Execute SQL file
docker exec -i rag_postgres_db psql -U postgres -d rag_db < migrations/add_message_metadata.sql

# Backup database
docker exec rag_postgres_db pg_dump -U postgres rag_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup with compression
docker exec rag_postgres_db pg_dump -U postgres -Fc rag_db > backup.dump

# Restore from backup
docker exec -i rag_postgres_db psql -U postgres rag_db < backup_20241022_143000.sql

# Restore from compressed backup
docker exec -i rag_postgres_db pg_restore -U postgres -d rag_db < backup.dump

# Export specific table
docker exec rag_postgres_db pg_dump -U postgres -d rag_db -t chat_sessions > chat_sessions.sql

# Import specific table
docker exec -i rag_postgres_db psql -U postgres -d rag_db < chat_sessions.sql

# Export table as CSV
docker exec -it rag_postgres_db psql -U postgres -d rag_db -c "\copy chat_messages TO '/tmp/messages.csv' CSV HEADER"
docker cp rag_postgres_db:/tmp/messages.csv .

# Import CSV to table
docker cp data.csv rag_postgres_db:/tmp/
docker exec -it rag_postgres_db psql -U postgres -d rag_db -c "\copy chat_messages FROM '/tmp/data.csv' CSV HEADER"

# Check database size
docker exec -it rag_postgres_db psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('rag_db'));"

# Check table sizes
docker exec -it rag_postgres_db psql -U postgres -d rag_db -c "SELECT tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"

# Vacuum database (reclaim space)
docker exec -it rag_postgres_db psql -U postgres -d rag_db -c "VACUUM FULL;"

# Analyze database (update statistics)
docker exec -it rag_postgres_db psql -U postgres -d rag_db -c "ANALYZE;"
```

### Volume Management

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect database_postgres_data

# View volume size
docker system df -v | grep postgres_data

# Remove volume (⚠️ deletes all data!)
docker compose down -v

# Backup volume
docker run --rm -v database_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data

# Restore volume
docker run --rm -v database_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /
```

---

## Troubleshooting

### Container Won't Start

**Problem:** Container exits immediately

```bash
# Check container logs
docker logs rag_postgres_db

# Common causes:
# 1. Port 5432 already in use
lsof -i :5432
sudo systemctl stop postgresql  # Stop system PostgreSQL

# 2. Permission issues with volume
docker volume rm database_postgres_data
docker compose up --force-recreate

# 3. Corrupted data
docker compose down -v  # ⚠️ Deletes all data
docker compose up
```

**Problem:** Permission denied errors

```bash
# Add user to docker group (Linux)
sudo usermod -aG docker $USER
newgrp docker

# Or run with sudo (not recommended)
sudo docker compose up
```

### Connection Issues

**Problem:** Can't connect from host

```bash
# Check if container is running
docker ps | grep rag_postgres_db

# Check port binding
docker port rag_postgres_db

# Test connection
telnet localhost 5432
nc -zv localhost 5432

# Check firewall
sudo ufw status
sudo ufw allow 5432/tcp

# Try connecting with explicit host
psql -h 127.0.0.1 -U postgres -d rag_db
```

**Problem:** Password authentication failed

```bash
# Verify password in docker-compose.yml
grep POSTGRES_PASSWORD backend/app/database/docker-compose.yml

# Verify password in .env
grep DATABASE_URL backend/.env

# Reset database with new password
docker compose down -v
# Edit docker-compose.yml and .env with new password
docker compose up -d
```

### Performance Issues

**Problem:** Database is slow

```bash
# Check container resources
docker stats rag_postgres_db

# Check database size
docker exec -it rag_postgres_db psql -U postgres -c "\l+"

# Vacuum database
docker exec -it rag_postgres_db psql -U postgres -d rag_db -c "VACUUM FULL;"

# Increase shared memory (edit docker-compose.yml)
services:
  db:
    shm_size: 256mb
```

### Data Recovery

**Problem:** Accidentally deleted data

```bash
# If you have a backup:
docker exec -i rag_postgres_db psql -U postgres rag_db < backup.sql

# If no backup but container still exists:
# Data is in volume, don't run 'down -v'
docker compose stop
docker compose start

# If volume was deleted:
# Data is permanently lost, restore from backup or start fresh
```

---

## Advanced Topics

### Custom PostgreSQL Configuration

Create `postgresql.conf`:

```bash
# backend/app/database/postgresql.conf
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

Update `docker-compose.yml`:

```yaml
services:
  db:
    # ... existing config ...
    command: postgres -c config_file=/etc/postgresql/postgresql.conf
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./postgresql.conf:/etc/postgresql/postgresql.conf:ro
```

### Multiple Database Instances

Edit `docker-compose.yml`:

```yaml
services:
  db_dev:
    image: postgres:16-alpine
    container_name: rag_postgres_db_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data_dev:/var/lib/postgresql/data
  
  db_test:
    image: postgres:16-alpine
    container_name: rag_postgres_db_test
    ports:
      - "5433:5432"
    volumes:
      - postgres_data_test:/var/lib/postgresql/data

volumes:
  postgres_data_dev:
  postgres_data_test:
```

### Monitoring and Logging

```bash
# Enable query logging (edit docker-compose.yml)
services:
  db:
    environment:
      POSTGRES_PASSWORD: testpassword123
      POSTGRES_DB: rag_db
      POSTGRES_USER: postgres
    command: postgres -c log_statement=all -c log_duration=on

# View query logs
docker logs -f rag_postgres_db | grep "duration:"

# Monitor active connections
docker exec -it rag_postgres_db psql -U postgres -d rag_db -c "SELECT count(*) FROM pg_stat_activity;"

# View slow queries
docker exec -it rag_postgres_db psql -U postgres -d rag_db -c "SELECT query, calls, total_time, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

### Security Hardening

```bash
# Use secrets for passwords (docker-compose.yml)
services:
  db:
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password

secrets:
  db_password:
    file: ./db_password.txt

# Create password file
echo "your_secure_password" > backend/app/database/db_password.txt
chmod 600 backend/app/database/db_password.txt

# Bind to localhost only
services:
  db:
    ports:
      - "127.0.0.1:5432:5432"

# Use read-only root filesystem
services:
  db:
    read_only: true
    tmpfs:
      - /tmp
      - /run/postgresql
```

### CI/CD Integration

```bash
# GitHub Actions example (.github/workflows/test.yml)
services:
  postgres:
    image: postgres:16-alpine
    env:
      POSTGRES_PASSWORD: testpassword123
      POSTGRES_DB: rag_db
    ports:
      - 5432:5432
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
```

---

## Best Practices

1. **Always use volumes** for data persistence
2. **Backup regularly** - automate with cron jobs
3. **Use environment-specific configs** (dev, test, prod)
4. **Monitor resource usage** - set limits if needed
5. **Keep images updated** - `docker compose pull` periodically
6. **Don't commit passwords** - use .env files (add to .gitignore)
7. **Test backups** - restore to verify they work
8. **Use connection pooling** in production (pgBouncer)
9. **Enable SSL** for production databases
10. **Monitor logs** for errors and slow queries

---

## Additional Resources

- **Docker Documentation**: https://docs.docker.com/
- **Docker Compose Reference**: https://docs.docker.com/compose/compose-file/
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **psql Manual**: https://www.postgresql.org/docs/current/app-psql.html
- **Docker Hub Postgres Image**: https://hub.docker.com/_/postgres

---

## Quick Reference Card

```bash
# Start
docker compose up -d

# Stop
docker compose down

# Logs
docker logs -f rag_postgres_db

# Connect
docker exec -it rag_postgres_db psql -U postgres -d rag_db

# Backup
docker exec rag_postgres_db pg_dump -U postgres rag_db > backup.sql

# Restore
docker exec -i rag_postgres_db psql -U postgres rag_db < backup.sql

# Clean slate
docker compose down -v && docker compose up -d
```

---

For project-specific issues, refer to the main [README.md](README.md) troubleshooting section.
