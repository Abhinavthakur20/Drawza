# Drawza

Drawza is a collaborative whiteboard web app with:
- Realtime drawing sync (Socket.io)
- Room-based collaboration
- JWT authentication (email/password + Google sign-in)
- Team chat and voice chat UI
- Persistent board state in MongoDB

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Zustand, Axios, Socket.io client
- Backend: Node.js, Express, Socket.io, Mongoose, JWT, Google Auth Library
- Database: MongoDB
- Deploy: Vercel (client), Render (server)

## Monorepo Structure

```txt
whiteboard/
  client/   # React + Vite frontend
  server/   # Express + Socket.io backend
```

## Features

- Whiteboard tools: select, text, rectangle, line, pencil, pan
- Element actions: move, resize, duplicate, delete
- One-click clear board from toolbar
- Undo / redo history
- Realtime cursor presence
- Room chat
- Voice chat (WebRTC signaling over Socket.io)
- JWT-protected board APIs
- Auto-save board elements to MongoDB

## Local Development

### 1) Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 2) Configure environment variables

Create `server/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_oauth_web_client_id

# Comma-separated allowed origins for CORS
CLIENT_URLS=http://localhost:5173,https://drawza.vercel.app
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_oauth_web_client_id
```

### 3) Start backend

```bash
cd server
npm run dev
```

### 4) Start frontend

```bash
cd client
npm run dev
```

Frontend runs on `http://localhost:5173` by default.

## Build

Frontend production build:

```bash
cd client
npm run build
```

Backend has no build step (runs with `node server.js`).

## API Endpoints

### Auth
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/google`

### Boards (JWT required)
- `GET /api/boards/:roomId`
- `POST /api/boards/:roomId`

### Health
- `GET /api/health`

## Realtime Socket Events (high level)

- `join-room`
- `element-create`
- `element-update`
- `element-delete`
- `element-clear`
- `cursor-move`
- `chat-message`
- `voice-join`, `voice-leave`, `voice-mute`, `voice-signal`

## Deploy

### Backend (Render)

Set these environment variables on Render:

- `PORT` (Render usually injects this)
- `MONGO_URI`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `CLIENT_URLS` (important)

Recommended:

```env
CLIENT_URLS=http://localhost:5173,https://drawza.vercel.app
```

### Frontend (Vercel)

Set:

```env
VITE_API_URL=https://your-render-service.onrender.com
VITE_SOCKET_URL=https://your-render-service.onrender.com
VITE_GOOGLE_CLIENT_ID=your_google_oauth_web_client_id
```

## Google OAuth Setup

In Google Cloud Console for your Web OAuth client:

Authorized JavaScript origins must include:
- `http://localhost:5173`
- `https://drawza.vercel.app`

If needed, also add:
- `http://127.0.0.1:5173`

`origin_mismatch` and GSI 403 errors usually mean this list is missing the exact running frontend origin.

## Troubleshooting

### CORS error from localhost to Render

If you see:
`Access-Control-Allow-Origin ... not equal to http://localhost:5173`

Then Render backend is not allowing localhost origin.
Fix `CLIENT_URLS` and redeploy backend.

### Google sign-in 403 / origin_mismatch

Add exact frontend origin in OAuth client JavaScript origins and wait a few minutes for propagation.

### Voice chat works locally but fails with remote users

Current WebRTC config is STUN-only. For reliable cross-network voice, add a TURN server in ICE config.

