# Build, Save, and Deploy Docker Images

## Prerequisites

- Docker installed on target machine
- Project source code available for building (optional if only loading pre-built images)

---

## 1. Build Images & Save as `.tar`

Run these from the **project root**:

```bash
# DB image : Step 1
docker build --no-cache -t my-nest-api-db:latest -f docker/db/Dockerfile .
docker save -o my-nest-api-db.tar my-nest-api-db:latest

# API image : Step 2
docker build --no-cache -t my-nest-api:latest -f docker/api/Dockerfile .
docker save -o my-nest-api.tar my-nest-api:latest

```

Output: `my-nest-api.tar` and `my-nest-api-db.tar` in the project root.

---

## 2. Import & Run Containers

Copy the `.tar` files to the target machine, then follow below.

### Windows (cmd.exe not powershell)

```batch
docker load -i my-nest-api-db.tar
docker load -i my-nest-api.tar

docker run -d ^
  --name my-nest-api-db ^
  --restart unless-stopped ^
  --cpus 2 --memory 2g ^
  -p 5432:5432 ^
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=my_nest_api ^
  -e DATABASE_URL=postgresql://postgres:postgres@localhost:5432/my_nest_api?host=/var/run/postgresql ^
  -v "pgdata:/var/lib/postgresql/data" ^
  my-nest-api-db:latest

docker run -d ^
  --name my-nest-api ^
  --restart unless-stopped ^
  --cpus 2 --memory 2g ^
  -p 3000:3000 ^
  -e DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5432/my_nest_api ^
  -e NODE_ENV=production ^
  my-nest-api:latest
```

### macOS / Linux (bash)

```bash
docker load -i my-nest-api-db.tar
docker load -i my-nest-api.tar

docker run -d \
  --name my-nest-api-db \
  --restart unless-stopped \
  --cpus 2 --memory 2g \
  -p 5432:5432 \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=my_nest_api \
  -e DATABASE_URL=postgresql://postgres:postgres@localhost:5432/my_nest_api?host=/var/run/postgresql \
  -v pgdata:/var/lib/postgresql/data \
  my-nest-api-db:latest

docker run -d \
  --name my-nest-api \
  --restart unless-stopped \
  --cpus 2 --memory 2g \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5432/my_nest_api \
  -e NODE_ENV=production \
  my-nest-api:latest
```

**Notes:**

- **Windows** volume: `C:\data\pgdata` (host path, auto-created by Docker)
- **macOS** volume: `pgdata` (named Docker volume, auto-created on first run)
- Start DB container first; API connects via `host.docker.internal` once DB is accepting connections
- Resource limits match existing compose config: 2 CPU cores, 2 GB RAM
