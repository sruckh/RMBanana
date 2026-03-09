# 🍌 RM Banana Web UI

A Dockerized web interface for removing invisible AI watermarks from Google Gemini-generated images.

> **💝 Credit:** This project is a Dockerized Web UI wrapper around the excellent [removebanana](https://github.com/denuwanpro/removebanana) npm package by [Denuwan Thilakarathna](https://github.com/denuwanpro). All watermark removal logic and algorithms are from the upstream project.

**Upstream Project:** https://github.com/denuwanpro/removebanana

## Prerequisites

- Docker & Docker Compose installed
- Existing Nginx Proxy Manager on the `shared_net` Docker network

## Features

- 🖼️ **Drag & Drop Interface** - Easy image upload with drag and drop support
- 🔒 **Privacy First** - All processing happens locally in your Docker environment
- 🚀 **Fast Processing** - Uses mathematical inverse of Google's alpha blending (no AI guessing)
- 📱 **Responsive Design** - Works on desktop and mobile
- 🔗 **External NPM Integration** - Works with your existing Nginx Proxy Manager

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Existing Infrastructure                  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Nginx Proxy Manager (Existing)              │   │
│  │              Ports 80, 443 exposed                    │   │
│  └─────────────────────┬────────────────────────────────┘   │
│                        │                                     │
│                        ▼                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              shared_net (External Network)            │   │
│  │                                                      │   │
│  │   ┌─────────────────┐    ┌──────────────────────┐   │   │
│  │   │  removebanana   │◄───┤  Other services...   │   │   │
│  │   │  Port: 3000     │    │                      │   │   │
│  │   │  (no host port) │    └──────────────────────┘   │   │
│  │   └─────────────────┘                               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Start the Container

```bash
cd /opt/docker/rmbanana
docker-compose up -d
```

### 2. Configure in Nginx Proxy Manager

In your existing Nginx Proxy Manager admin panel:

1. Go to **Hosts** → **Proxy Hosts** → **Add Proxy Host**
2. Configure:
   - **Domain Names**: `removebanana.yourdomain.com` (or your preferred domain)
   - **Scheme**: `http`
   - **Forward Hostname / IP**: `removebanana`
   - **Forward Port**: `3000`
3. **Save**
4. (Optional) Enable SSL under the **SSL** tab

### 3. Access the Application

Visit your configured domain: `https://removebanana.yourdomain.com`

## Usage

1. **Upload Image**: Drag and drop or click to select a PNG, JPEG, or WebP image
2. **Remove Watermark**: Click the "✨ Remove Watermark" button
3. **Download**: Once processing is complete, click "⬇️ Download" to save the cleaned image

## Supported AI Image Sources

- ✅ Google Gemini (all versions)
- ✅ Imagen 2
- ✅ Imagen 3
- ✅ Nano Banana AI

## How It Works

```
Google's watermarking:
  watermarked = α × logo + (1 - α) × original

RemoveBanana reversal:
  original = (watermarked - α × logo) / (1 - α)
```

No AI guessing - pure mathematical reconstruction of the original pixels.

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Node environment |
| `PORT` | `3000` | API server port |

### Volumes

| Path | Description |
|------|-------------|
| `./backend/uploads` | Temporary upload storage |
| `./backend/outputs` | Temporary output storage |

### Network

Uses the external `shared_net` Docker network (must already exist). The container has **no exposed ports** on the host - all access goes through your existing Nginx Proxy Manager.

## File Structure

```
rmbanana/
├── backend/
│   ├── package.json      # Node dependencies
│   ├── server.js         # Express API server
│   ├── uploads/          # Temp uploads (auto-cleaned)
│   └── outputs/          # Temp outputs (auto-cleaned)
├── frontend/
│   ├── index.html        # Main HTML
│   ├── styles.css        # Styles
│   └── app.js            # Frontend logic
├── Dockerfile            # Container build
├── docker-compose.yml    # Service orchestration
└── README.md             # This file
```

## Maintenance

### View Logs

```bash
# RemoveBanana app logs
docker logs -f removebanana

# All services
docker-compose logs -f
```

### Update

```bash
docker-compose pull
docker-compose up -d
```

### Restart

```bash
docker-compose restart
```

### Clean Up

```bash
# Stop and remove container
docker-compose down

# Remove container and volumes
docker-compose down -v
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs removebanana

# Ensure shared_net exists
docker network ls

# Rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Cannot connect from Nginx Proxy Manager

- Verify both containers are on `shared_net`:
  ```bash
  docker network inspect shared_net
  ```
- Check the container is healthy:
  ```bash
  docker ps
  ```
- Test from NPM container:
  ```bash
  docker exec <npm_container_name> curl http://removebanana:3000/api/health
  ```

### Images not processing

- Ensure the image is PNG, JPEG, or WebP format
- Check file size is under 10MB
- Check container logs: `docker logs -f removebanana`

## Security Notes

- The removebanana container has **no exposed ports** on the host
- All external traffic goes through your existing Nginx Proxy Manager
- Temporary files are auto-deleted after 5 minutes
- No data persists between restarts

## Credits

- **Watermark Removal Engine:** [removebanana](https://github.com/denuwanpro/removebanana) by [Denuwan Thilakarathna](https://github.com/denuwanpro)
- **Web UI & Dockerization:** This project (RM Banana)

## License

MIT © [RemoveBanana](https://github.com/denuwanpro/removebanana)

---

**🍌 Made with love by the RemoveBanana community**
