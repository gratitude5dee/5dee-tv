# Realtime LTX Video Generation Demo

A real-time AI video generation system that creates dynamic content by listening to Twitch chat and streaming live AI-generated videos to RTMP endpoints. Built with LTX Video model, FAL serverless infrastructure, and a modern React dashboard.

## Features

- **Multiple Model Support**: Choose between LTX v1 (local HuggingFace) or LTX v2 Preview (fal.ai API)
- **Real-time AI Video Generation**: Uses LTX Video model for high-quality video synthesis
- **Twitch Chat Integration**: Listens to chat messages and generates contextual video content
- **Live RTMP Streaming**: Streams generated videos directly to Twitch or other RTMP endpoints
- **Real-time Dashboard**: Monitor generation metrics, queue status, and performance
- **Text Overlays**: Dynamic text overlays on generated videos
- **Serverless Deployment**: Runs on FAL's GPU infrastructure with auto-scaling
- **Continuous Generation**: Seamless video loops with context preservation

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Twitch Chat   │───▶│  Prompt Generator │───▶│  LTX Video Gen  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  RTMP Stream    │◀───│   Text Overlay   │◀───│  Frame Processor │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│     Twitch      │    │    Dashboard     │───▶│   Monitoring    │
│   (Live Stream) │    │   (React App)    │    │   (WebSocket)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Core Components

- **`streaming_pipeline/`**: Main Python package with all video generation logic
- **`dashboard/`**: Next.js React dashboard for monitoring and control
- **`FAL App`**: Serverless deployment configuration

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- FFmpeg installed
- FAL account and API key
- OpenAI API key
- Twitch account and stream key

### 1. Clone and Setup

```bash
git clone <repository-url>
cd realtime-ltx-video-generation-demo

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -e .
```

### 2. Environment Configuration

Create `.env` in the root directory:

```env
# Required API Keys
OPENAI_API_KEY=your_openai_api_key_here
GROQ_API_KEY=your_groq_api_key_here  # Optional, for faster inference

# Twitch Configuration
TWITCH_CHANNEL=shroud  # Channel to monitor (without #)
TWITCH_STREAM_KEY=your_twitch_stream_key_here

# FAL Configuration
FAL_KEY=your_fal_api_key_here
```

### 3. Deploy to FAL

```bash
# Deploy the streaming pipeline
fal deploy realtime-streaming
```

This will output various endpoints. Use the **Synchronous Endpoints** base URL for the dashboard.

### 4. Dashboard Setup

```bash
cd dashboard

# Install dependencies
npm install

# Create dashboard .env.local with required configuration
cat > .env.local << EOF
# FAL API configuration
NEXT_PUBLIC_FAL_API_URL=https://fal.run/your-username/realtime-streaming
FAL_KEY=your_fal_api_key_here
EOF

# Start development server
npm run dev
```

The dashboard is served at **`/admin`** (the root `/` redirects there). Open http://localhost:3000/admin.

Dashboard environment variables (`dashboard/.env.local` locally, Pages env vars in production):

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_FAL_API_URL` | public | Your deployed FAL app URL (synchronous endpoint) |
| `FAL_KEY` | **secret** | FAL API key, used only by `/api/fal/proxy` and `/api/fal/sdk-proxy` |
| `NEXT_PUBLIC_CONVEX_URL` | public | Convex deployment URL. Backs sessions, clips, recordings, prompt events and Twitch stats. Without it the panel still runs; Clips/Recordings/history persistence are disabled. |
| `TWITCH_CLIENT_ID` | server | Twitch developer app client ID (https://dev.twitch.tv/console/apps) |
| `TWITCH_CLIENT_SECRET` | **secret** | Twitch developer app secret. Only read by `/api/twitch`; never shipped to the browser. |
| `TWITCH_CHANNEL` (or `NEXT_PUBLIC_TWITCH_CHANNEL`) | server | Channel login to report analytics for |
| `CF_ACCESS_TEAM_DOMAIN`, `CF_ACCESS_AUD` | server | Enables Cloudflare Access JWT verification in `middleware.ts` (see below) |
| `ADMIN_AUTH_MODE` | server | Set to `edge-only` to skip JWT verification when Access alone guards the path. In production, if neither this nor the `CF_ACCESS_*` pair is set, `/admin` and `/api` return 401. |

#### Convex

```bash
cd dashboard
npx convex dev          # creates a project, writes NEXT_PUBLIC_CONVEX_URL to .env.local, runs codegen
npx convex deploy       # production deployment (set NEXT_PUBLIC_CONVEX_URL on Pages to the prod URL)
```

Schema and functions live in `dashboard/convex/` (`sessions`, `clips`, `recordings`, `promptEvents`, `generations` (legacy LTX history), `twitchStats`). Run `npx convex codegen` after changing the schema to refresh `convex/_generated/`.

Deployed project: `5dee-tv`. The production deployment is `sleek-opossum-939` (`https://sleek-opossum-939.convex.cloud`) and is what the live site is built against; `hallowed-hare-401` is the development deployment. `npx convex deploy` targets whichever deployment the `CONVEX_DEPLOY_KEY` belongs to (`prod:` vs `dev:` prefix).

### 5. Admin panel

| Route | Contents |
|---|---|
| `/admin` | Live Control: **Director** realtime player (`minimax/h3-max/director` over WebRTC via `/api/fal/sdk-proxy`) — prompt updates, MediaRecorder capture uploaded to Convex storage |
| `/admin/clips` | Convex `clips` grid: Director chunk completions, with playback where a URL exists |
| `/admin/recordings` | Convex `recordings`: full Director session captures with playback/download/delete |
| `/admin/analytics` | Twitch Helix analytics: live status, viewers, followers, uptime, title/game, viewer chart (samples persisted to `twitchStats` when Convex is configured) |

#### Protecting `/admin`

The panel starts livestreams and spends FAL credits, so it must not be public. Recommended: **Cloudflare Access** (zero-code):

1. Zero Trust → Access → Applications → *Add an application* → Self-hosted.
2. Application domain: `stream.wzrd.tech`, path `admin` (add a second entry for path `api` to cover the FAL/Twitch routes).
3. Add an Allow policy (e.g. emails ending in your domain, or a one-time PIN list).
4. Copy the application's **Audience (AUD) tag** and your team domain into the Pages env vars `CF_ACCESS_AUD` and `CF_ACCESS_TEAM_DOMAIN`. `dashboard/middleware.ts` then verifies the `Cf-Access-Jwt-Assertion` header on every `/admin/**` and `/api/**` request and returns 401 if it is missing or invalid, so the origin can't be reached by bypassing Access. If you'd rather rely on Access alone, set `ADMIN_AUTH_MODE=edge-only` instead. Production builds with neither configured fail closed (401); local `next dev` is always allowed.

Note: the Convex deployment itself has no auth — anyone with `NEXT_PUBLIC_CONVEX_URL` can call its public functions. Treat clip/recording data as non-sensitive, or add [Convex auth](https://docs.convex.dev/auth) as a follow-up.

If you'd rather use app-level auth (Clerk/Auth.js), replace the check in `middleware.ts`.

Caveat: a Pages project is also reachable on its `*.pages.dev` hostname, which an Access app scoped to the custom domain doesn't cover. Either add `5dee-tv-admin.pages.dev` as a second hostname in the Access application, or prefer the `CF_ACCESS_*` JWT-verification mode (which protects every origin path regardless of hostname).

### 6. Deploy the dashboard to Cloudflare Pages (`stream.wzrd.tech`)

The dashboard uses server API routes (`/api/fal/proxy`, `/api/fal/sdk-proxy`, `/api/twitch`) so it is deployed with `@cloudflare/next-on-pages`; all API routes and the middleware run on the edge runtime.

```bash
cd dashboard
npm run pages:build     # next build + next-on-pages -> .vercel/output/static
npm run pages:preview   # local preview with wrangler
npm run pages:deploy    # wrangler pages deploy (or connect the repo in the Pages dashboard)
```

Pages project settings (also in `dashboard/wrangler.toml`):

- Root directory: `dashboard`
- Build command: `npm run pages:build`
- Build output directory: `.vercel/output/static`
- Compatibility flags: `nodejs_compat`, `nodejs_compat_populate_process_env`
- Environment variables: `NEXT_PUBLIC_FAL_API_URL`, `NEXT_PUBLIC_CONVEX_URL`, `TWITCH_CLIENT_ID`, `TWITCH_CHANNEL`, `CF_ACCESS_TEAM_DOMAIN`, `CF_ACCESS_AUD` as plain vars in `[vars]`; `FAL_KEY` and `TWITCH_CLIENT_SECRET` as **encrypted secrets** on the Pages project (`wrangler pages secret put FAL_KEY`). Never commit the secrets.

Plain (non-secret) variables live in `wrangler.toml`'s `[vars]` block, and secrets live in the Pages project. That split is forced by direct upload: `wrangler pages deploy` replaces the project's **plain-text** variables with whatever `[vars]` contains, so vars set only in the dashboard disappear on the next deploy — while `secret_text` variables survive it. Keep `FAL_KEY`/`TWITCH_CLIENT_SECRET` out of the repo, in the project, and keep the public identifiers (`CF_ACCESS_*`, `TWITCH_CLIENT_ID`, `TWITCH_CHANNEL`, `NEXT_PUBLIC_CONVEX_URL`) in `[vars]`.

Server code must read env through `dashboard/lib/runtimeEnv.ts`, not `process.env` directly. On Pages the values arrive as request-context bindings, and Next inlines `process.env.*` in middleware at build time — so `process.env.CF_ACCESS_TEAM_DOMAIN` in `middleware.ts` is baked to `undefined` and the gate silently 401s everything. `runtimeEnv()` reads `getRequestContext().env` first and falls back to `process.env` for `next dev`. `nodejs_compat_populate_process_env` is also set, which is what makes `process.env` work in the edge API routes.

Client-side `NEXT_PUBLIC_*` vars are a separate build-time inline. `dashboard/.env.production` holds the non-secret defaults (`NEXT_PUBLIC_CONVEX_URL`) so a clean `pages:build` produces a working bundle — the `[vars]` binding exists only at runtime and can't rescue a bundle that was compiled without it.

Custom domain: Pages project → Custom domains → add `stream.wzrd.tech`. Cloudflare creates the CNAME to `<project>.pages.dev` automatically if the zone is on Cloudflare; otherwise add `CNAME stream -> <project>.pages.dev`. No `basePath` is configured — the app's `/admin` folder maps directly to `stream.wzrd.tech/admin`.

#### Live deployment

| | |
|---|---|
| Pages project | `5dee-tv-admin` (production branch `main`) |
| Default hostname | `https://5dee-tv-admin.pages.dev` |
| Custom domain | `https://stream.wzrd.tech` (proxied `CNAME stream → 5dee-tv-admin.pages.dev`) |
| Convex | `https://sleek-opossum-939.convex.cloud` (production deployment) |
| Access team | `shrill-cherry-ba30.cloudflareaccess.com` |
| Access app | `5dee-tv admin (stream.wzrd.tech)`, allow policy on `gratitude@5-dee.com` (one-time PIN) + a non-identity policy for the `devin-admin-test` service token |

Both layers are active: `stream.wzrd.tech/admin` 302-redirects to the Access login, and the bare `5dee-tv-admin.pages.dev` hostname — which the Access app does not cover — still returns 401 because the middleware verifies the Access JWT at the origin. That is the reason to prefer `CF_ACCESS_*` over `ADMIN_AUTH_MODE=edge-only`.

To grant someone else access, add their email to the Access application's allow policy; no redeploy is needed.

For headless checks, the `devin-admin-test` service token is accepted by a non-identity policy on the same app:

```bash
curl -H "CF-Access-Client-Id: <id>.access" -H "CF-Access-Client-Secret: <secret>" https://stream.wzrd.tech/admin
```

## Usage Guide

### Starting a Stream

1. **Deploy to FAL**: `fal deploy realtime-streaming`
2. **Start Dashboard**: `cd dashboard && npm run dev`
3. **Configure Stream**: Use the dashboard to set generation parameters
4. **Start Streaming**: Click "Start Stream" in the dashboard

### API Endpoints

The FAL app exposes these endpoints:

- `POST /start_stream` - Start video generation and streaming
- `POST /stop_stream` - Stop the streaming pipeline
- `GET /metrics` - Get current performance metrics
- `WebSocket /metrics/ws` - Real-time metrics stream

### Authentication

All API requests to FAL endpoints require authentication. The dashboard handles this automatically:

**How it works:**
1. All HTTP requests route through `/api/fal/proxy` (Next.js API route)
2. The proxy adds `Authorization: Key ${FAL_KEY}` header server-side
3. WebSocket connections use temporary JWT tokens (auto-refreshed every 5 minutes)

**Using the helper functions:**
```typescript
import { startStream, stopStream, getMetrics } from '@/utils/falApi';

// Start streaming
await startStream(apiUrl, config);

// Stop streaming
await stopStream(apiUrl);

// Get metrics
const response = await getMetrics(apiUrl);
const metrics = await response.json();
```

All authentication is handled automatically - you never need to manually add the FAL_KEY header in client-side code.

### Request Format

**LTX v1 (Local Pipeline):**
```json
{
  "model": "ltxv1",
  "initial_prompt": "A peaceful digital landscape",
  "initial_image_url": "https://example.com/image.jpg",
  "num_frames": 240,
  "width": 640,
  "height": 480,
  "guidance_scale": 3.0,
  "target_fps": 9.0,
  "mode": "regular"
}
```

**LTX 2.3 Fast (fal.ai API):**
```json
{
  "model": "ltx-2.3",
  "initial_prompt": "A cinematic video with smooth camera movement",
  "initial_image_url": "https://example.com/image.jpg",
  "duration": 6,
  "resolution": "1080p",
  "aspect_ratio": "16:9"
}
```

## Configuration

### Model Selection

Choose between two video generation backends:

- **`ltxv1`** (default): Local HuggingFace LTX pipeline with full customization
- **`ltx-2.3`**: fal.ai hosted LTX 2.3 Fast (22B model) with sharper output and faster inference

### Video Generation Parameters

**LTX v1 (Local Pipeline):**
- **`num_frames`**: Number of frames to generate (default: 240)
- **`width/height`**: Video resolution (default: 640x480)
- **`guidance_scale`**: How closely to follow prompts (default: 3.0)
- **`strength`**: Image-to-video influence (default: 1.0)
- **`target_fps`**: Streaming frame rate (default: 9.0)
- **`timesteps`**: Custom timesteps for diffusion process

**LTX 2.3 Fast (fal.ai API):**
- **`duration`**: Video duration - 6 to 20 seconds (>10s requires 25fps and 1080p)
- **`resolution`**: Output resolution - 1080p, 1440p, or 2160p
- **`aspect_ratio`**: Video aspect ratio - auto, 16:9, or 9:16

### Streaming Configuration

- **`TWITCH_CHANNEL`**: Twitch channel to monitor for chat
- **`TWITCH_STREAM_KEY`**: Your Twitch stream key for RTMP output

### Generation Modes

- **`regular`**: Standard generation with chat influence
- **`nightmare`**: More chaotic, experimental generation

## Project Structure

```
realtime-ltx-video-generation-demo/
├── streaming_pipeline/           # Main Python package
│   ├── app.py                   # FAL app entry point
│   ├── streaming_service.py     # Core streaming logic
│   ├── models.py                # Pydantic models and types
│   ├── core/
│   │   └── streaming_engine.py  # Main generation loop
│   ├── video_generation/
│   │   └── video_generator.py   # LTX model wrapper
│   ├── input/
│   │   └── twitch_listener.py   # Twitch chat integration
│   ├── output/
│   │   └── rtmp_streamer.py     # RTMP streaming via FFmpeg
│   ├── prompt_generation/
│   │   └── prompt_generator.py  # AI prompt generation
│   ├── postprocessing/
│   │   └── text_overlay.py     # Video text overlays
│   ├── utils/
│   │   ├── logger_config.py    # Logging configuration
│   │   └── monitoring.py       # Performance monitoring
│   └── prompts/
│       ├── system_prompt.txt   # Base system prompt
│       └── system_prompt_visual.txt  # Visual mode prompt
├── dashboard/                   # React monitoring dashboard
│   ├── app/                    # Next.js app directory
│   ├── components/             # React components
│   ├── hooks/                  # Custom React hooks
│   └── utils/                  # Utility functions
├── logs/                       # Application logs
├── pyproject.toml             # Python package configuration
├── requirements.txt           # Python dependencies
└── README.md                  # This file
```

## Monitoring & Debugging

### Logs

The system creates separate log files in `logs/`:

- **`server.log`**: API startup, configuration, health checks
- **`generation.log`**: Video generation pipeline events
- **`queue.log`**: RTMP streaming and queue monitoring

### Dashboard Metrics

The React dashboard shows:

- **Generation Performance**: FPS, latency, success rates
- **Queue Status**: Frame buffer levels, processing rates
- **System Health**: Memory usage, error rates
- **Chat Activity**: Recent messages and processing status

### WebSocket Monitoring

Real-time metrics are available via WebSocket at `/metrics/ws`:

```javascript
const ws = new WebSocket('wss://your-fal-url/metrics/ws');
ws.onmessage = (event) => {
  const metrics = JSON.parse(event.data);
  console.log('Current metrics:', metrics);
};
```

## Development

### Local Development

```bash
# Install in development mode
pip install -e .

# Run the streaming pipeline for development
fal run realtime-streaming
```

This will output various endpoints. For development, copy the **Synchronous Endpoints** base URL and update your dashboard's `.env.local`:

```bash
# Update dashboard with the development URL (copy the unique ID from terminal output)
cd dashboard
echo "NEXT_PUBLIC_FAL_API_URL=https://fal.run/unique-id-from-terminal/realtime-streaming" > .env.local
```

**Note**: The URL from `fal run` is temporary and will change each time you run the command. For persistent deployment, use `fal deploy realtime-streaming` instead.

### Adding New Features

1. **Video Effects**: Extend `postprocessing/text_overlay.py`
2. **Chat Sources**: Add new input sources in `input/`
3. **Generation Models**: Extend `video_generation/video_generator.py`
4. **Streaming Outputs**: Add new outputs in `output/`

### Code Structure Guidelines

- **Models**: Define all data structures in `models.py`
- **Logging**: Use the configured loggers from `utils/logger_config.py`
- **Monitoring**: Implement `Monitorable` interface for new components
- **Error Handling**: Use structured logging and graceful degradation

## Troubleshooting

### Common Issues

**Dashboard Can't Connect to FAL App**
- Check that `NEXT_PUBLIC_FAL_API_URL` in `dashboard/.env.local` matches your current FAL app URL
- The FAL URL changes with each deployment - update it after running `fal run realtime-streaming`
- Ensure the FAL app is running before starting the dashboard

**Import Errors**
```bash
# Reinstall in editable mode
pip install -e .
```

**FFmpeg Not Found**
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg
```

**RTMP Connection Failed**
- Verify `TWITCH_STREAM_KEY` is correct
- Check firewall settings
- Ensure FFmpeg has network permissions

**Generation Timeouts**
- Reduce `target_fps` for more manageable streaming rates
- Check GPU availability in FAL logs
- Monitor memory usage

### Performance Optimization

- **Reduce Resolution**: Lower `width`/`height` for faster processing
- **Optimize Frame Rate**: Lower `target_fps` to reduce processing load
- **Use Groq**: Add `GROQ_API_KEY` for faster prompt generation
- **Monitor Queues**: Watch dashboard for bottlenecks

## License

This project is licensed under the MIT License - see the LICENSE file for details.



## Acknowledgments

- **LTX Video Model**: Advanced video generation capabilities
- **FAL**: Serverless GPU infrastructure
- **Diffusers**: Hugging Face diffusion models library
- **FFmpeg**: Video processing and streaming



