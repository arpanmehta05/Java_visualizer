# Java Visualizer

A real-time Java code execution visualizer that uses JDI (Java Debug Interface) to step through Java programs and display call stack, variables, heap objects, and program output — all in an interactive web UI.

![Java](https://img.shields.io/badge/Java-17-orange?logo=openjdk)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-20-green?logo=node.js)
![Docker](https://img.shields.io/badge/Docker-Required-blue?logo=docker)

---

## Features

- **Step-by-step execution** — Walk through Java code line by line
- **Call stack view** — See the live call stack at each step
- **Variable inspector** — Track local variables and their values in real time
- **Heap visualization** — Visualize objects, arrays, and references on the heap
- **Execution timeline** — Scrub through execution history forward and backward
- **Output console** — See `System.out` / `System.err` output
- **Preloaded examples** — Select from built-in code examples to get started quickly
- **Dark / Light theme** — Toggle between themes
- **Monaco Editor** — Full-featured code editor with Java syntax highlighting

---

## Architecture

```
┌──────────────┐        WebSocket         ┌──────────────┐       Docker       ┌──────────────────┐
│   Frontend   │  ◄──────────────────►    │   Backend    │  ◄──────────────►  │  Engine (JDI)    │
│  React/Vite  │       REST API           │  Express.js  │    Container       │  JDI Debugger    │
│  Port 3000   │                          │  Port 3001   │                    │  Java 17         │
└──────────────┘                          └──────────────┘                    └──────────────────┘
```

| Component    | Tech                                | Description                                               |
| ------------ | ----------------------------------- | --------------------------------------------------------- |
| **Frontend** | React 18, Vite, Monaco Editor       | Interactive UI with code editor, visualizations           |
| **Backend**  | Node.js 20, Express, WebSocket      | API server, manages Docker containers, streams debug data |
| **Engine**   | Java 17, JDI (Java Debug Interface) | Runs inside Docker, debugs user code step-by-step         |
| **Database** | MongoDB (optional)                  | Persists saved snippets and user preferences              |

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- [Node.js 20+](https://nodejs.org/) (for local development without Docker)
- [Java 17+](https://adoptium.net/) (only if running the engine locally)

---

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Clone the repo
git clone https://github.com/<your-username>/java-visualizer.git
cd java-visualizer

# Start all services
docker-compose up --build
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health check**: http://localhost:3001/api/health

### Local Development

```bash
# 1. Build the engine Docker image
docker build -t java-visualizer-engine .

# 2. Start the backend
cd backend
npm install
npm run dev      # runs on port 3001

# 3. Start the frontend (new terminal)
cd frontend
npm install
npm run dev      # runs on port 3000
```

---

## Project Structure

```
java-visualizer/
├── docker-compose.yml          # Orchestrates all services
├── Dockerfile                  # Builds the JDI engine image
├── backend/
│   ├── server.js               # Express + WebSocket server
│   ├── services/
│   │   ├── dockerManager.js    # Spawns & manages engine containers
│   │   └── wsManager.js        # WebSocket session management
│   ├── routes/
│   │   ├── snippets.js         # Saved code snippets API
│   │   └── preferences.js      # User preferences API
│   ├── models/                 # Mongoose schemas
│   └── examples/
│       └── preloaded.js        # Built-in example programs
├── engine/
│   └── src/visualizer/
│       ├── Main.java           # Entry point for the debug engine
│       └── JDIDebugger.java    # Core JDI debugger implementation
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx             # Main application component
        ├── components/
        │   ├── MonacoEditor.jsx      # Code editor
        │   ├── CallStackView.jsx     # Call stack panel
        │   ├── MemoryView.jsx        # Variables / memory panel
        │   ├── HeapGraph.jsx         # Heap visualization
        │   ├── ExecutionTimeline.jsx  # Step timeline slider
        │   ├── OutputConsole.jsx     # stdout/stderr display
        │   ├── ExampleSelector.jsx   # Example picker dropdown
        │   └── ThemeSwitcher.jsx     # Dark/light toggle
        ├── hooks/
        │   ├── useWebSocket.js       # WebSocket connection hook
        │   └── useExecution.js       # Execution state management
        └── themes/
            ├── ThemeContext.jsx       # Theme provider
            └── definitions.js        # Theme color definitions
```

---

## Environment Variables

| Variable            | Default                                    | Description                          |
| ------------------- | ------------------------------------------ | ------------------------------------ |
| `PORT`              | `3001`                                     | Backend server port                  |
| `MONGO_URI`         | `mongodb://localhost:27017/jdi-visualizer` | MongoDB connection string (optional) |
| `DOCKER_IMAGE`      | `java-visualizer-engine`                   | Docker image name for the engine     |
| `REACT_APP_API_URL` | `http://localhost:3001`                    | Backend API URL (frontend)           |
| `REACT_APP_WS_URL`  | `ws://localhost:3001/ws`                   | WebSocket URL (frontend)             |

---

## API Endpoints

| Method     | Endpoint           | Description                               |
| ---------- | ------------------ | ----------------------------------------- |
| `GET`      | `/api/health`      | Health check                              |
| `GET`      | `/api/examples`    | Get preloaded example programs            |
| `POST`     | `/api/execute`     | Execute Java code (`{ code, sessionId }`) |
| `GET/POST` | `/api/snippets`    | Saved snippets CRUD                       |
| `GET/POST` | `/api/preferences` | User preferences CRUD                     |

---

## Deployment

### AWS EC2

```bash
# On your EC2 instance (Ubuntu)
sudo apt update && sudo apt install -y docker.io docker-compose
sudo usermod -aG docker $USER

git clone https://github.com/<your-username>/java-visualizer.git
cd java-visualizer
docker-compose up -d --build
```

### Azure Container Apps

```bash
# Build & push image to Azure Container Registry
az acr build --registry <your-acr> --image java-visualizer .

# Deploy to Container Apps
az containerapp up \
  --name java-visualizer \
  --resource-group <your-rg> \
  --image <your-acr>.azurecr.io/java-visualizer \
  --target-port 3001 \
  --ingress external
```

---

## License

MIT

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
