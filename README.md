# Multi-Agent RAG Pipeline

A production-ready Retrieval-Augmented Generation (RAG) chatbot powered by Google Gemini, LangGraph multi-agent system, and ChromaDB vector stores. The system provides intelligent assistance for household appliances (Washing Machines, Refrigerators, and Air Conditioners) by querying product manuals.

## Architecture

- **Frontend**: Next.js 15 with React 19, TypeScript, Tailwind CSS
- **Backend**: FastAPI with LangGraph multi-agent orchestration
- **Database**: PostgreSQL (for chat history and session management)
- **Vector Store**: ChromaDB (for document embeddings)
- **LLM**: Google Gemini (gemini-2.5-flash for supervisor, gemini-2.5-pro for agents)

### System Architecture Overview

The system consists of three main components working together:

#### 1. Document Ingestion Pipeline
![Ingestion Pipeline](docs/architecture-ingestion-pipeline.png)

The ingestion system processes PDF manuals through:
- **PDF Upload UI**: User-friendly interface for uploading product manuals
- **Hybrid PDF Parser**: Extracts text, tables, and uses OCR for scanned documents
- **Gemini Embedding Model**: Creates vector embeddings for semantic search
- **ChromaDB**: Stores vectors in product-specific collections

#### 2. Multi-Agent Chat System
![Chat System Architecture](docs/architecture-chat-system.png)

The chat system uses a hierarchical multi-agent approach:
- **Supervisor Agent**: Analyzes queries and delegates to specialized experts
- **Expert Sub-Agents**: Domain-specific agents (Washing Machine, Refrigerator, AC)
- **PostgreSQL Database**: Stores conversation history and metadata
- **ChromaDB Vector Stores**: Retrieves relevant context from product manuals

#### 3. Agent Orchestration Flow
![Agent Flow](docs/architecture-agent-orchestration.png)

The supervisor coordinates multiple expert agents:
- **Parallel Execution**: Can invoke multiple experts simultaneously
- **Tool Executor**: Manages RAG tool calls to retrieve context
- **Response Synthesis**: Combines expert answers into coherent response

## Features

- **Multi-Agent System**: Supervisor agent delegates queries to specialized sub-agents
- **Real-time Streaming**: Token-by-token response streaming with live status updates
- **Session Management**: Persistent chat history with automatic session naming
- **Performance Tracking**: Response time tracking and agent attribution stored in database
- **Markdown Support**: Rich text formatting with code blocks, lists, and tables
- **Modern UI**: Collapsible sidebar, dark theme, responsive design
- **RAG System**: Context-aware responses using product manual knowledge bases
- **Docker Support**: PostgreSQL database containerized for easy setup

## Visual Overview

### User Interface

The application provides a modern, intuitive interface for interacting with the multi-agent system:

![Main Chat Interface](docs/ui-main-chat-interface.png)
*Main chat interface with session management, collapsible sidebar, and real-time streaming*

![Multi-Agent Demo](docs/ui-multi-agent-demo.png)
*Multi-agent system in action showing supervisor delegation and parallel expert execution*

![Agent Response Example](docs/ui-agent-response-example.png)
*Detailed agent response with timing information and performance metrics*

---

## Docker & PostgreSQL Setup

This project uses **Docker** to run PostgreSQL, making database setup simple and consistent across all platforms.

### What is Docker?

Docker is a platform that packages applications in containers - lightweight, standalone units that include everything needed to run the software. Think of it as a virtual machine, but much faster and more efficient.

### What is PostgreSQL?

PostgreSQL (or "Postgres") is a powerful, open-source relational database that stores:
- Chat sessions (conversations)
- Chat messages (user and AI responses)
- Metadata (agent names, response times, timestamps)

### Why Use Docker for PostgreSQL?

- **No manual installation** - No need to install PostgreSQL on your system  
- **Consistent environment** - Same setup on Windows, Mac, and Linux  
- **Easy cleanup** - Remove everything with one command  
- **Isolated** - Doesn't interfere with other PostgreSQL installations  
- **Version control** - Always uses PostgreSQL 16 Alpine

### PostgreSQL Client (psql)

`psql` is the command-line tool for interacting with PostgreSQL databases. You'll need it to:
- Run database migrations (create tables)
- Query data directly
- Backup and restore databases
- Debug database issues

**Installation instructions are in the Prerequisites section below.**

---

## Quick Start

### Prerequisites

Ensure you have the following installed:

- **Python 3.11+** ([Download](https://www.python.org/downloads/))
- **Node.js 18+** and **npm** ([Download](https://nodejs.org/))
- **Docker & Docker Compose** ([Download](https://www.docker.com/get-started))
- **PostgreSQL Client Tools** (psql) - See installation below
- **Google API Key** ([Get one here](https://ai.google.dev/))

#### Installing PostgreSQL Client (psql)

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql-client
```

**macOS (using Homebrew):**
```bash
brew install postgresql
```

**Windows:**
Download from [PostgreSQL official site](https://www.postgresql.org/download/windows/) or use WSL with Ubuntu instructions.

**Verify Installation:**
```bash
psql --version
# Should output: psql (PostgreSQL) 14.x or higher
```

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/A5CENSION-SRT/Multi-Agent-RAG-Pipeline.git
cd Multi-Agent-RAG-Pipeline
```

---

### 2. Backend Setup

#### 2.1 Create Python Virtual Environment

```bash
cd backend
python3 -m venv .venv

# Activate virtual environment
# On Linux/Mac:
source .venv/bin/activate

# On Windows:
.venv\Scripts\activate

# Verify activation (should show .venv in path):
which python
```

#### 2.2 Upgrade pip and Install Dependencies

```bash
# Upgrade pip to latest version
pip install --upgrade pip

# Install all required packages (recommended for fresh start)
pip install -r requirements_minimal.txt

# Verify installation
pip list | grep langchain
# Should show langchain==1.0.2, langchain-core==1.0.0, etc.
```

**Note:** We use `requirements_minimal.txt` which contains the exact tested versions. If you encounter dependency conflicts, delete the virtual environment and recreate it:

```bash
deactivate
rm -rf .venv
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements_minimal.txt
```

#### 2.3 Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
# Copy the example file and edit it
cp .env.example .env

# Edit the .env file and add your Google API key
nano .env  # or use your preferred editor
```

**Or create it manually:**

```bash
# backend/.env
GOOGLE_API_KEY=your_google_api_key_here

# Database credentials
POSTGRES_USER=postgres
POSTGRES_PASSWORD=testpassword123
POSTGRES_DB=rag_db
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# LLM models
SUPERVISOR_MODEL=gemini-2.5-flash
SUB_AGENT_MODEL=gemini-2.5-pro
```

**Quick setup (one command):**

```bash
cat > .env << 'EOF'
GOOGLE_API_KEY=your_google_api_key_here
POSTGRES_USER=postgres
POSTGRES_PASSWORD=testpassword123
POSTGRES_DB=rag_db
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
SUPERVISOR_MODEL=gemini-2.5-flash
SUB_AGENT_MODEL=gemini-2.5-pro
EOF
```

⚠️ **Important:** 
- Replace `your_google_api_key_here` with your actual Google API key from [Google AI Studio](https://ai.google.dev/)
- Change `POSTGRES_PASSWORD` to a secure password for production use

📄 **Reference:** See `backend/.env.example` for all available configuration options.

#### 2.4 Start PostgreSQL Database with Docker

```bash
# Make sure you're in the backend directory
cd backend

# Navigate to database directory
cd app/database

# Start PostgreSQL container in detached mode
# Docker Compose will automatically use the environment variables from backend/.env
docker compose up -d

# Go back to backend root
cd ../..
```

**Note:** The `docker-compose.yml` file is configured to read database credentials from your `.env` file. If you change the password or other settings, make sure to recreate the container:

```bash
cd app/database
docker compose down
docker volume rm database_postgres_data  # Only if you want to reset the database
docker compose up -d
cd ../..
```

**Verify the database is running:**

```bash
# Check container status
docker ps

# You should see output like:
# CONTAINER ID   IMAGE                  STATUS         PORTS                    NAMES
# abc123def456   postgres:16-alpine     Up 10 seconds  0.0.0.0:5432->5432/tcp   rag_postgres_db

# Check database logs
docker logs rag_postgres_db

# Should show: "database system is ready to accept connections"
```

**Test database connection:**

```bash
# Connect to PostgreSQL using psql client
docker exec -it rag_postgres_db psql -U postgres -d rag_db

# Inside psql, run:
# \dt                  # List tables (should be empty initially)
# \l                   # List databases
# \q                   # Quit
```

#### 2.5 Run Database Migrations

Apply the schema migrations to create necessary tables:

```bash
# Make sure you're in the backend directory
cd backend

# Method 1: Using psql client directly (will prompt for password from .env)
psql -h localhost -U postgres -d rag_db -f migrations/add_message_metadata.sql

# You'll be prompted for password (use the value from POSTGRES_PASSWORD in your .env)

# Method 2: Using Docker exec (recommended - no password prompt)
docker exec -i rag_postgres_db psql -U postgres -d rag_db < migrations/add_message_metadata.sql

# Verify tables were created:
docker exec -it rag_postgres_db psql -U postgres -d rag_db -c "\dt"

# Should show:
#              List of relations
#  Schema |      Name       | Type  |  Owner
# --------+-----------------+-------+----------
#  public | chat_messages   | table | postgres
#  public | chat_sessions   | table | postgres
```

#### 2.6 (Optional) Ingest Product Manuals

If you want to populate the vector stores with product manuals:

```bash
# Ensure you're in backend/ directory with venv activated
# Place PDF manuals in these directories:
# - data/manuals/washing_machine/
# - data/manuals/refrigerator/
# - data/manuals/air_conditioner/

# Run the ingestion script
python -m scripts.ingest_manuals

# Or test with the agent flow:
python -m scripts.test_agent_flow
```

**Note:** The system will auto-create required directories with proper permissions during ingestion.

---

### 3. Frontend Setup

Open a **new terminal** window (keep the backend terminal open):

```bash
# From project root
cd frontend

# Install dependencies
npm install

# Verify installation
npm list next react react-dom
# Should show: next@15.x, react@19.x, react-dom@19.x
```

#### 3.1 Configure Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```bash
# Copy the example file and edit it
cp .env.local.example .env.local

# Edit if needed (default values work for local development)
nano .env.local  # or use your preferred editor
```

**Or create it manually:**

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Quick setup (one command):**

```bash
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF
```

📄 **Reference:** See `frontend/.env.local.example` for all available configuration options.

---

## Running the Application

### Quick Start (3 Commands)

Open three separate terminal windows and run these commands:

**Terminal 1 - Database:**
```bash
cd backend/app/database && docker compose up
```

**Terminal 2 - Backend:**
```bash
cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Terminal 3 - Frontend:**
```bash
cd frontend && npm run dev
```

### Detailed Instructions

#### Terminal 1: PostgreSQL Database

```bash
cd backend/app/database
docker compose up
```

**Keep this terminal running.** Database logs will appear here showing connection attempts and queries.

**Expected output:**
```
rag_postgres_db  | database system is ready to accept connections
```

**To run in background (detached mode):**
```bash
docker compose up -d
```

#### Terminal 2: Backend FastAPI Server

```bash
# Navigate to backend directory
cd backend

# Activate virtual environment
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Start FastAPI server with auto-reload
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Expected output:**
```
INFO:     Will watch for changes in these directories: ['/path/to/backend']
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using StatReload
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Backend API Documentation:**
- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

**To verify backend is running:**
```bash
curl http://127.0.0.1:8000/api/v1/health
# Should return: {"status":"healthy"}
```

#### Terminal 3: Frontend Next.js Development Server

```bash
# Navigate to frontend directory
cd frontend

# Start Next.js development server
npm run dev
```

**Expected output:**
```
  ▲ Next.js 15.5.3
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

 ✓ Starting...
 ✓ Ready in 2.5s
```

---

## Access the Application

Once all three services are running, open your browser and navigate to:

### **http://localhost:3000**

You should see the chat interface with:
- Collapsible sidebar on the left
- "New Chat" button at the top
- Chat history list
- Main chat area with message input

![Application Interface](docs/ui-main-chat-interface.png)

### Testing Your Setup

1. **Click "New Chat"** in the sidebar
2. **Type a test message**: "Hello, can you help me?"
3. **Watch for status updates**:
   - "Supervisor analyzing your question..."
   - "Delegating to [Agent] Expert..."
   - "[Agent] searching knowledge base..."
4. **Verify response** appears with elapsed time
5. **Check sidebar** - chat should auto-save with generated title

### Example Queries

Try asking the system about household appliances:

**Washing Machine Questions:**
- "How do I clean my washing machine?"
- "What does error code U11 mean?"
- "How do I use the quick wash cycle?"

**Refrigerator Questions:**
- "What is the optimal temperature for my refrigerator?"
- "How do I defrost my refrigerator?"
- "What is wet mode in the refrigerator?"

**Air Conditioner Questions:**
- "How do I clean my AC filter?"
- "What temperature should I set for energy efficiency?"
- "How do I use the sleep mode?"

![Example Response](docs/ui-agent-response-example.png)

The system will:
1. **Analyze** your question using the Supervisor agent
2. **Delegate** to the appropriate expert (Washing Machine, Refrigerator, or AC)
3. **Search** the relevant knowledge base using RAG
4. **Synthesize** a comprehensive answer with citations
5. **Display** response time and agent attribution

---

## Docker Commands Reference

### Database Container Management

```bash
# Start database (detached mode)
docker compose -f backend/app/database/docker-compose.yml up -d

# Start database (with logs in terminal)
docker compose -f backend/app/database/docker-compose.yml up

# Stop database
docker compose -f backend/app/database/docker-compose.yml down

# Stop and remove volumes (WARNING: deletes all data)
docker compose -f backend/app/database/docker-compose.yml down -v

# Restart database
docker compose -f backend/app/database/docker-compose.yml restart

# View logs
docker logs rag_postgres_db

# Follow logs (live)
docker logs -f rag_postgres_db

# Check container status
docker ps

# View all containers (including stopped)
docker ps -a

# Inspect container details
docker inspect rag_postgres_db
```

### PostgreSQL Client Commands

```bash
# Connect to database using psql
docker exec -it rag_postgres_db psql -U postgres -d rag_db

# Run single SQL command
docker exec -it rag_postgres_db psql -U postgres -d rag_db -c "SELECT * FROM chat_sessions;"

# Execute SQL file
docker exec -i rag_postgres_db psql -U postgres -d rag_db < migrations/add_message_metadata.sql

# Backup database
docker exec rag_postgres_db pg_dump -U postgres rag_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database from backup
docker exec -i rag_postgres_db psql -U postgres rag_db < backup_20241022_143000.sql

# Export specific table
docker exec rag_postgres_db pg_dump -U postgres -d rag_db -t chat_sessions > chat_sessions.sql

# Check database size
docker exec -it rag_postgres_db psql -U postgres -d rag_db -c "\l+"

# List all tables
docker exec -it rag_postgres_db psql -U postgres -d rag_db -c "\dt"

# Describe table structure
docker exec -it rag_postgres_db psql -U postgres -d rag_db -c "\d chat_messages"

# Count rows in table
docker exec -it rag_postgres_db psql -U postgres -d rag_db -c "SELECT COUNT(*) FROM chat_messages;"
```

### Useful psql Commands (Inside Container)

When connected via `docker exec -it rag_postgres_db psql -U postgres -d rag_db`:

```sql
-- List all databases
\l

-- List all tables in current database
\dt

-- Describe table structure
\d chat_messages
\d+ chat_sessions

-- List all schemas
\dn

-- List all users/roles
\du

-- Show current database and user
\conninfo

-- Execute SQL from file
\i /path/to/file.sql

-- Toggle expanded display (useful for wide tables)
\x

-- Quit psql
\q
```

### Docker Troubleshooting

```bash
# Check if port 5432 is in use
lsof -i :5432  # Linux/Mac
netstat -ano | findstr :5432  # Windows

# Stop container by ID
docker stop <container_id>

# Remove container
docker rm rag_postgres_db

# Remove volume
docker volume rm database_postgres_data

# View Docker disk usage
docker system df

# Clean up unused containers, images, volumes
docker system prune -a

# Rebuild container from scratch
docker compose -f backend/app/database/docker-compose.yml down -v
docker compose -f backend/app/database/docker-compose.yml up --build
```

---

## Testing the System

### Manual Ingestion Test

To test the document ingestion system, you can upload PDF manuals through the API or UI:

![Manual Upload Interface](docs/manual-upload-interface.png)

1. Navigate to the "Add Manuals" interface
2. Select product type (washing_machine, refrigerator, or air_conditioner)
3. Upload PDF files
4. Monitor the ingestion process
5. Verify documents are processed and stored in ChromaDB

### Interactive Chat Testing

![Chat Interface Testing](docs/architecture-agent-orchestration.png)

1. **Click "New Chat"** in the sidebar
2. **Ask a question** about an appliance, for example:
   - "How do I clean my washing machine?"
   - "What is the wet mode in my refrigerator?"
   - "How do I change the AC filter?"
3. **Watch the live status** above the response:
   - "Supervisor analyzing your question..."
   - "Delegating to Washing Machine Expert..."
   - "Washing Machine Agent searching knowledge base..."
   - "Running Washing Machine Agent..."
4. **See the response** with elapsed time badge
5. **Check the sidebar** - the chat should appear with auto-generated title

### Agent Flow Visualization

The system provides real-time feedback on the agent execution flow:

![Agent Execution Flow](docs/ui-agent-response-example.png)

You'll see:
- **Status Updates**: Real-time progress of query processing
- **Agent Attribution**: Which expert handled your query
- **Response Time**: How long the agent took to respond
- **Streaming Tokens**: Live token-by-token response generation

---

## � Screenshots & Visual Guide

### Application Interface

**Main Chat Interface**
![Main Interface](docs/ui-main-chat-interface.png)
The main chat interface features a collapsible sidebar with chat history, real-time streaming responses, and status indicators.

**Agent Processing Status**
![Agent Status](docs/ui-agent-response-example.png)
Watch as the supervisor delegates to expert agents and retrieves context from knowledge bases.

**Multi-Agent Response**
![Agent Response](docs/ui-multi-agent-demo.png)
The system can invoke multiple expert agents to provide comprehensive answers.

### Architecture Diagrams

**Document Ingestion Flow**
![Ingestion Pipeline](docs/architecture-ingestion-pipeline.png)
Shows how PDFs are processed, embedded, and stored in ChromaDB.

**Chat System Architecture**
![Chat Architecture](docs/architecture-chat-system.png)
Complete flow from user query to AI response, including database persistence.

**Agent Orchestration**
![Agent Flow](docs/architecture-agent-orchestration.png)
Supervisor coordinates multiple expert agents in parallel.

**Database Schema**
![Database Schema](docs/database-schema-diagram.png)
PostgreSQL tables for sessions and messages with metadata tracking.

**Manual Upload Interface**
![Upload Interface](docs/manual-upload-interface.png)
User interface for uploading product manuals to the system.

---

## �📁 Project Structure

```
Multi-Agent-RAG-Pipeline/
├── backend/
│   ├── app/
│   │   ├── agents/           # Multi-agent system
│   │   │   ├── agent_manager.py
│   │   │   ├── state.py
│   │   │   └── sub_agents/   # Specialized agents
│   │   ├── core/             # Configuration
│   │   ├── database/         # Database setup
│   │   ├── models/           # SQLAlchemy models
│   │   ├── rag/              # RAG components
│   │   ├── routers/          # API endpoints
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── services/         # Business logic
│   │   ├── tools/            # LangGraph tools
│   │   └── main.py           # FastAPI app
│   ├── chroma_dbs/           # Vector store databases
│   ├── data/
│   │   ├── manuals/          # PDF product manuals
│   │   └── processed/        # Processed text files
│   ├── migrations/           # Database migrations
│   ├── scripts/              # Utility scripts
│   ├── requirements.txt
│   └── .env                  # Environment variables
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js pages
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom hooks
│   │   └── lib/              # Utilities & services
│   ├── public/               # Static assets
│   ├── package.json
│   └── .env.local            # Environment variables
└── README.md
```

---

## Configuration

### Backend Environment Variables

```bash
# backend/.env
GOOGLE_API_KEY=your_api_key_here
DATABASE_URL=postgresql://postgres:testpassword123@localhost:5432/rag_db
SUPERVISOR_MODEL=gemini-2.5-flash
SUB_AGENT_MODEL=gemini-2.5-pro
```

### Frontend Environment Variables

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Database Configuration

Edit `backend/app/database/docker-compose.yml` to change database credentials:

```yaml
environment:
  POSTGRES_PASSWORD: your_password
  POSTGRES_DB: rag_db
  POSTGRES_USER: postgres
```

**Remember to update `DATABASE_URL` in `.env` accordingly!**

---

## Development Commands

### Backend Commands

```bash
# Activate virtual environment (always do this first)
cd backend
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Start backend with auto-reload
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Start backend with custom host/port
uvicorn app.main:app --reload --host 0.0.0.0 --port 8080

# Run specific scripts
python -m scripts.ingest_manuals
python -m scripts.test_agent_flow

# Check installed packages
pip list

# Check specific package version
pip show langchain

# Update specific package
pip install --upgrade langchain

# Freeze current dependencies
pip freeze > requirements_frozen.txt

# Run Python in interactive mode
python
>>> from app.core.config import settings
>>> print(settings.DATABASE_URL)
>>> exit()
```

### Frontend Commands

```bash
cd frontend

# Start development server (with Turbopack)
npm run dev

# Start development server (legacy)
npm run dev -- --no-turbopack

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Fix linting issues
npm run lint -- --fix

# Check for outdated packages
npm outdated

# Update all packages to latest
npm update

# Install specific package
npm install <package-name>

# Uninstall package
npm uninstall <package-name>

# Clear Next.js cache
rm -rf .next

# Clean reinstall
rm -rf node_modules package-lock.json
npm install
```

### Database Commands

```bash
# Start database (detached)
docker compose -f backend/app/database/docker-compose.yml up -d

# Start database (foreground with logs)
docker compose -f backend/app/database/docker-compose.yml up

# Stop database (preserves data)
docker compose -f backend/app/database/docker-compose.yml down

# Stop and remove all data
docker compose -f backend/app/database/docker-compose.yml down -v

# Restart database
docker compose -f backend/app/database/docker-compose.yml restart

# View logs (last 100 lines)
docker logs rag_postgres_db --tail 100

# Follow logs (live)
docker logs -f rag_postgres_db

# Access database shell
docker exec -it rag_postgres_db psql -U postgres -d rag_db

# Run SQL query directly
docker exec -it rag_postgres_db psql -U postgres -d rag_db -c "SELECT COUNT(*) FROM chat_sessions;"

# Backup database
docker exec rag_postgres_db pg_dump -U postgres rag_db > backup_$(date +%Y%m%d).sql

# Restore database
docker exec -i rag_postgres_db psql -U postgres rag_db < backup_20241022.sql

# Export table as CSV
docker exec -it rag_postgres_db psql -U postgres -d rag_db -c "\copy chat_messages TO '/tmp/messages.csv' CSV HEADER"

# Check database disk usage
docker exec -it rag_postgres_db psql -U postgres -c "SELECT pg_database.datname, pg_size_pretty(pg_database_size(pg_database.datname)) AS size FROM pg_database;"
```

### Git Commands

```bash
# Check status
git status

# Create feature branch
git checkout -b feature/new-feature

# Stage changes
git add .

# Commit changes
git commit -m "Add new feature"

# Push to remote
git push origin feature/new-feature

# Pull latest changes
git pull origin main

# View commit history
git log --oneline --graph --all

# View changes
git diff

# Discard local changes
git checkout -- .

# Create and apply stash
git stash
git stash pop
```

### Docker System Management

```bash
# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# Stop all running containers
docker stop $(docker ps -q)

# Remove all stopped containers
docker container prune

# View images
docker images

# Remove unused images
docker image prune -a

# View volumes
docker volume ls

# Remove unused volumes
docker volume prune

# View system-wide information
docker system df

# Clean up everything (WARNING: careful!)
docker system prune -a --volumes

# View container resource usage
docker stats rag_postgres_db

# Inspect container
docker inspect rag_postgres_db | jq '.[0].Config'
```

---

## Database Schema

The application uses PostgreSQL for persistent storage with the following schema:

![Database Schema](docs/database-schema-diagram.png)

### `chat_sessions` Table

Stores conversation sessions with auto-generated titles.

| Column      | Type      | Description                    |
|-------------|-----------|--------------------------------|
| id          | UUID (PK) | Primary key (UUID)             |
| title       | String    | Chat session title             |
| created_at  | Timestamp | When session was created       |
| updated_at  | Timestamp | Last message timestamp         |

### `chat_messages` Table

Stores individual messages with metadata for tracking and analysis.

| Column         | Type      | Description                          |
|----------------|-----------|--------------------------------------|
| id             | BigSerial (PK) | Primary key (auto-increment)   |
| session_id     | UUID (FK) | Foreign key to chat_sessions         |
| sender         | String    | 'human' or 'ai'                      |
| content        | Text      | Message content                      |
| agent_name     | String    | Agent that handled the message       |
| time_consumed  | Integer   | Response time in milliseconds        |
| created_at     | Timestamp | When message was created             |

**Relationship**: One session can have many messages (1:N relationship)

---

## API Endpoints

### Chat Endpoints

- `POST /api/v1/chats/` - Create new chat session
- `GET /api/v1/chats/` - Get all chat sessions
- `GET /api/v1/chats/{session_id}` - Get chat history
- `POST /api/v1/chats/{session_id}/messages/stream` - Send message (streaming)
- `PATCH /api/v1/chats/{session_id}/title` - Update session title
- `PATCH /api/v1/chats/{session_id}/messages/{message_id}/metadata` - Update message metadata

### Knowledge Endpoints

- `POST /api/v1/knowledge/ingest` - Ingest product manuals
- `GET /api/v1/knowledge/product-types` - List available product types

### Health Check

- `GET /api/v1/health` - Check API health status

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Database Connection Issues

**Problem:** Backend can't connect to PostgreSQL

```bash
# Check if PostgreSQL container is running
docker ps | grep rag_postgres_db

# If not running, start it:
cd backend/app/database
docker compose up -d

# Check database logs for errors
docker logs rag_postgres_db

# Test connection with psql
docker exec -it rag_postgres_db psql -U postgres -d rag_db -c "\conninfo"

# Verify DATABASE_URL in .env file
cat backend/.env | grep DATABASE_URL
# Should be: postgresql://postgres:testpassword123@localhost:5432/rag_db

# Restart database if needed
docker compose -f backend/app/database/docker-compose.yml restart
```

**Problem:** Port 5432 already in use

```bash
# Find what's using port 5432
lsof -i :5432  # Linux/Mac
netstat -ano | findstr :5432  # Windows

# Stop existing PostgreSQL service (Linux)
sudo systemctl stop postgresql

# Or change port in docker-compose.yml:
# ports:
#   - "5433:5432"
# Then update DATABASE_URL to use port 5433
```

#### 2. Backend Server Issues

**Problem:** Backend won't start or crashes

```bash
# Check if virtual environment is activated
which python  # Should show path to .venv/bin/python

# If not activated:
cd backend
source .venv/bin/activate

# Check if port 8000 is in use
lsof -i :8000  # Linux/Mac
netstat -ano | findstr :8000  # Windows

# Kill process using port 8000
kill -9 <PID>  # Linux/Mac
taskkill /PID <PID> /F  # Windows

# Verify all dependencies are installed
pip list | grep -E "langchain|fastapi|uvicorn"

# Reinstall dependencies if needed
pip install -r requirements_minimal.txt

# Check for Python errors
python -c "from app.main import app; print('Import successful')"

# Start with verbose logging
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 --log-level debug
```

**Problem:** Import errors (ModuleNotFoundError)

```bash
# Ensure you're in the correct directory
pwd  # Should be: /path/to/Multi-Agent-RAG-Pipeline/backend

# Reinstall specific package
pip install --upgrade --force-reinstall langchain

# Clear Python cache
find . -type d -name "__pycache__" -exec rm -rf {} +
find . -type f -name "*.pyc" -delete

# Recreate virtual environment
deactivate
rm -rf .venv
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements_minimal.txt
```

#### 3. Frontend Issues

**Problem:** Frontend won't start

```bash
# Check Node.js version
node --version  # Should be v18 or higher

# Check if port 3000 is in use
lsof -i :3000  # Linux/Mac
netstat -ano | findstr :3000  # Windows

# Clear cache and reinstall
cd frontend
rm -rf .next node_modules package-lock.json
npm install
npm run dev

# Try different port
npm run dev -- -p 3001
```

**Problem:** API connection errors (CORS, network)

```bash
# Verify backend is running
curl http://127.0.0.1:8000/api/v1/health
# Should return: {"status":"healthy"}

# Check NEXT_PUBLIC_API_URL in .env.local
cat frontend/.env.local
# Should be: NEXT_PUBLIC_API_URL=http://localhost:8000

# Check CORS settings in backend (app/main.py)
# Should include:
# origins = ["http://localhost:3000", "http://127.0.0.1:3000"]

# Test API from browser console
# Open http://localhost:3000 and run in console:
# fetch('http://localhost:8000/api/v1/health').then(r => r.json()).then(console.log)
```

#### 4. Database Migration Issues

**Problem:** Tables not created or migration fails

```bash
# Check if migration file exists
ls -la backend/migrations/add_message_metadata.sql

# Run migration manually
docker exec -i rag_postgres_db psql -U postgres -d rag_db < backend/migrations/add_message_metadata.sql

# Verify tables were created
docker exec -it rag_postgres_db psql -U postgres -d rag_db -c "\dt"

# Check table structure
docker exec -it rag_postgres_db psql -U postgres -d rag_db -c "\d chat_messages"

# If tables exist but have wrong schema, drop and recreate
docker exec -it rag_postgres_db psql -U postgres -d rag_db -c "DROP TABLE IF EXISTS chat_messages CASCADE; DROP TABLE IF EXISTS chat_sessions CASCADE;"
docker exec -i rag_postgres_db psql -U postgres -d rag_db < backend/migrations/add_message_metadata.sql
```

#### 5. ChromaDB / Vector Store Issues

**Problem:** RAG queries return no results or error

```bash
# Check if ChromaDB directories exist
ls -la backend/chroma_dbs/

# Check permissions
ls -ld backend/chroma_dbs/*/

# Fix permissions if needed
chmod -R 755 backend/chroma_dbs/
find backend/chroma_dbs/ -type f -name "*.sqlite3" -exec chmod 644 {} \;

# Verify ChromaDB is installed
pip show chromadb

# Test ChromaDB directly
python -c "import chromadb; print('ChromaDB version:', chromadb.__version__)"

# Clear and rebuild vector stores
rm -rf backend/chroma_dbs/*
python -m scripts.ingest_manuals
```

**Problem:** "attempt to write a readonly database" error

```bash
# This happens when ChromaDB directory has wrong permissions
# Fix all directory permissions:
find backend/chroma_dbs/ -type d -exec chmod 755 {} \;
find backend/chroma_dbs/ -type f -exec chmod 644 {} \;

# Or delete and let the system recreate with correct permissions
rm -rf backend/chroma_dbs/
# System will auto-create directories during next ingestion
```

#### 6. LangChain / API Issues

**Problem:** Google API key errors

```bash
# Verify API key is set
cat backend/.env | grep GOOGLE_API_KEY

# Test API key
python -c "
import os
from dotenv import load_dotenv
load_dotenv('backend/.env')
print('API Key:', os.getenv('GOOGLE_API_KEY')[:10] + '...')
"

# Test Google Gemini connection
python << 'EOF'
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
load_dotenv('backend/.env')

llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash")
response = llm.invoke("Hello, are you working?")
print(response.content)
EOF
```

**Problem:** Agent not responding or timeout

```bash
# Check recursion limit in chat.py
grep -n "recursion_limit" backend/app/routers/chat.py

# Increase if needed (default is usually 50)
# In chat.py, look for: config={"recursion_limit": 50}

# Check agent logs
# In backend terminal, you should see:
# [EVENT] Kind: on_chain_start, Node: supervisor
# [STATUS] Supervisor analyzing your question...

# Test agent directly
python -m scripts.test_agent_flow
```

#### 7. Docker Issues

**Problem:** Docker commands not found

```bash
# Check Docker installation
docker --version
docker compose version

# If not installed, install Docker:
# Ubuntu: sudo apt-get install docker.io docker-compose-plugin
# Mac: brew install --cask docker
# Windows: Download from docker.com

# Add user to docker group (Linux)
sudo usermod -aG docker $USER
newgrp docker
```

**Problem:** Permission denied errors

```bash
# Linux: Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Or run with sudo (not recommended for production)
sudo docker compose up

# Check Docker daemon is running
sudo systemctl status docker
sudo systemctl start docker
```

**Problem:** Container keeps restarting

```bash
# Check container status
docker ps -a | grep rag_postgres_db

# View container logs
docker logs rag_postgres_db

# Check for port conflicts
docker port rag_postgres_db

# Remove and recreate container
docker compose -f backend/app/database/docker-compose.yml down
docker compose -f backend/app/database/docker-compose.yml up --force-recreate
```

#### 8. Performance Issues

**Problem:** Slow responses or timeouts

```bash
# Check if embeddings model is downloaded
ls -la ~/.cache/huggingface/hub/

# Monitor system resources
docker stats rag_postgres_db
top  # or htop on Linux

# Check backend memory usage
ps aux | grep uvicorn

# Reduce chunk size in parsers.py if needed
# Look for: chunk_size=1000, chunk_overlap=200

# Use faster Gemini model for supervisor
# In .env: SUPERVISOR_MODEL=gemini-2.5-flash
```

### Getting Help

If you still have issues:

1. **Check existing GitHub issues**: Search for similar problems
2. **Enable debug logging**: Add `--log-level debug` to uvicorn command
3. **Check all logs**:
   - Backend terminal output
   - Frontend terminal output  
   - Docker logs: `docker logs rag_postgres_db`
4. **Create a GitHub issue** with:
   - Operating System and version
   - Python version: `python --version`
   - Node.js version: `node --version`
   - Docker version: `docker --version`
   - Full error message and stack trace
   - Steps to reproduce

### Quick Reset (Nuclear Option)

If everything is broken and you want to start fresh:

```bash
# Stop all services
docker compose -f backend/app/database/docker-compose.yml down -v
pkill -f uvicorn
pkill -f next-server

# Clean backend
cd backend
deactivate
rm -rf .venv chroma_dbs/* __pycache__ app/__pycache__
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements_minimal.txt

# Clean frontend
cd ../frontend
rm -rf .next node_modules package-lock.json
npm install

# Restart database and run migrations
cd ../backend/app/database
docker compose up -d
cd ../..
docker exec -i rag_postgres_db psql -U postgres -d rag_db < migrations/add_message_metadata.sql

# Start services
# Terminal 1: cd backend/app/database && docker compose up
# Terminal 2: cd backend && source .venv/bin/activate && uvicorn app.main:app --reload
# Terminal 3: cd frontend && npm run dev
```

---

## Performance Tips

- **Use gemini-2.5-flash for supervisor**: Faster routing decisions
- **Use gemini-2.5-pro for agents**: Better quality responses
- **Increase recursion_limit**: Edit `backend/app/routers/chat.py` if needed
- **Optimize vector store**: Reduce chunk size or increase top_k parameter

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is part of an educational/research initiative. Please check with the repository owner for specific licensing terms.

---

## Acknowledgments

- **LangChain** for the agent orchestration framework
- **Google Gemini** for the powerful LLM capabilities
- **FastAPI** for the high-performance backend
- **Next.js** for the modern React framework
- **ChromaDB** for the efficient vector store

---

## Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Search existing issues on GitHub
3. Create a new issue with:
   - Error messages
   - Steps to reproduce
   - Your environment (OS, Python version, Node version)

---

## Additional Documentation

For more detailed information, check out these comprehensive guides:

### [Visual Guide - Complete System Walkthrough](VISUAL_GUIDE.md)
**Comprehensive visual documentation** with detailed explanations of:
- User interface screenshots with feature annotations
- System architecture diagrams with component descriptions
- Complete workflow visualizations
- Database schema explanations
- Agent orchestration flows
- Technical implementation details
- Color coding and design principles

### [Docker & PostgreSQL Complete Guide](DOCKER_GUIDE.md)
In-depth documentation covering:
- Docker installation and setup
- PostgreSQL container management
- psql client usage and commands
- Database operations (backup, restore, migrations)
- Troubleshooting Docker issues
- Advanced configurations and best practices
- Security hardening
- CI/CD integration

### [Frontend Features](FRONTEND_FEATURES.md)
Detailed frontend documentation (if available)

### [Retrieval Improvements](backend/RETRIEVAL_IMPROVEMENTS.md)
RAG system enhancements and optimization strategies

### Architecture Diagrams
All system architecture diagrams are available in the `docs/` folder:
- `architecture-ingestion-pipeline.png` - Document Ingestion Pipeline
- `architecture-chat-system.png` - Chat System Architecture
- `architecture-agent-orchestration.png` - Agent Orchestration Flow
- `database-schema-diagram.png` - Database Schema
- `ui-main-chat-interface.png` - Application Interface
- `ui-multi-agent-demo.png` - Multi-Agent System Demo
- `ui-agent-response-example.png` - Agent Response Example
- `manual-upload-interface.png` - Manual Upload Interface

---

## You're All Set!

Your Multi-Agent RAG Pipeline is now ready to use. Here's a quick checklist:

- **Database running**: `docker ps` shows `rag_postgres_db`
- **Backend running**: http://127.0.0.1:8000/docs accessible
- **Frontend running**: http://localhost:3000 shows chat interface
- **API connection**: Status updates appear when sending messages
- **Database persisting**: Chat history saved in sidebar

### Quick Links

- **Frontend**: http://localhost:3000
- **Backend API**: http://127.0.0.1:8000
- **API Docs**: http://127.0.0.1:8000/docs
- **Docker Guide**: [DOCKER_GUIDE.md](DOCKER_GUIDE.md)

### What's Next?

1. **Upload Product Manuals**: Use the "Add Manuals" feature to build your knowledge base
2. **Test Different Queries**: Try asking about various household appliances
3. **Monitor Performance**: Check response times and agent attribution in chat history
4. **Customize Agents**: Modify sub-agent prompts in `backend/app/agents/sub_agents/`
5. **Extend Features**: Add new product types or enhance RAG retrieval

Start chatting and explore the intelligent multi-agent system!

---

## Contributing

We welcome contributions! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

Please ensure:
- Code follows existing style conventions
- All tests pass
- Documentation is updated
- Screenshots added for UI changes

---

## License

This project is part of an educational/research initiative. Please check with the repository owner for specific licensing terms.

---

## Acknowledgments

- **LangChain** & **LangGraph** for the agent orchestration framework
- **Google Gemini** for the powerful LLM capabilities
- **FastAPI** for the high-performance backend
- **Next.js** & **React** for the modern frontend framework
- **ChromaDB** for the efficient vector store
- **PostgreSQL** for reliable data persistence

---

## Support

If you encounter issues:

1. **Check Documentation**:
   - [Troubleshooting Section](#troubleshooting)
   - [Docker Guide](DOCKER_GUIDE.md)
   - [Backend README](backend/README.md)

2. **Search Existing Issues**: Check GitHub issues for similar problems

3. **Create New Issue**: Include:
   - Operating System and version
   - Python version: `python --version`
   - Node.js version: `node --version`
   - Docker version: `docker --version`
   - Full error message and stack trace
   - Steps to reproduce
   - Screenshots (if UI-related)

4. **Check Logs**:
   - Backend: Terminal output or `uvicorn` logs
   - Frontend: Browser console (F12)
   - Database: `docker logs rag_postgres_db`

---

**Built with LangGraph, Google Gemini, FastAPI, and Next.js**
