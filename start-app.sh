#!/bin/bash

# Script to start the Feeder app on port 3000
# - Kills any process on port 3000 if running
# - Checks and starts Docker if not running
# - Starts Supabase if not running
# - Starts the Next.js app with .env.local

# Don't use set -e, we want to handle errors gracefully

cd "$(dirname "$0")"

PORT=3000
ENV_FILE=".env.local"

echo "🚀 Starting app setup..."

# Function to check if port is in use (Windows/Git Bash compatible)
# Only consider LISTENING (server bound to port), not TIME_WAIT/CLOSE_WAIT
check_port() {
    if command -v netstat > /dev/null 2>&1; then
        if netstat -ano 2>/dev/null | tr -d '\r' | grep "LISTENING" | grep -q ":$PORT"; then
            return 0
        fi
    fi
    if command -v lsof > /dev/null 2>&1; then
        lsof -i :$PORT > /dev/null 2>&1 && return 0
    fi
    if timeout 1 bash -c "echo > /dev/tcp/127.0.0.1/$PORT" 2>/dev/null; then
        return 0
    fi
    return 1
}

# Function to kill process on port (Windows/Git Bash compatible)
kill_port() {
    echo "🔍 Checking if port $PORT is in use..."
    
    # Clean up Next.js lock file if it exists (prevents lock conflicts)
    if [ -f ".next/dev/lock" ]; then
        echo "🧹 Removing stale Next.js lock file..."
        rm -f .next/dev/lock 2>/dev/null || true
    fi
    
    if ! check_port; then
        echo "✅ Port $PORT is available"
        return 0
    fi

    echo "⚠️  Port $PORT is in use. Attempting to kill the process..."

    # Prefer npx kill-port (reliable on Windows and Unix)
    if command -v npx > /dev/null 2>&1; then
        echo "   Trying npx kill-port $PORT..."
        npx --yes kill-port $PORT 2>/dev/null || true
        # Wait for OS to release the port (avoid TIME_WAIT false positive)
        for i in 1 2 3 4 5; do
            sleep 2
            if ! check_port; then
                echo "✅ Port $PORT is now free (kill-port)"
                # Clean up lock file again after killing process
                rm -f .next/dev/lock 2>/dev/null || true
                return 0
            fi
        done
    fi

    # Windows: netstat + taskkill
    if command -v netstat > /dev/null 2>&1; then
        # Get PIDs: normalize CRLF, match port, take last column (PID)
        PIDS=$(netstat -ano 2>/dev/null | tr -d '\r' | grep -E ":$PORT[^0-9]|[[:space:]]$PORT[[:space:]]" | grep -E "LISTENING|ESTABLISHED" | awk '{print $NF}' | grep -E '^[0-9]+$' | sort -u)
        if [ -n "$PIDS" ]; then
            for PID in $PIDS; do
                [ "$PID" = "0" ] && continue
                echo "🛑 Killing process $PID on port $PORT..."
                if command -v taskkill > /dev/null 2>&1; then
                    taskkill //F //PID $PID 2>/dev/null || true
                else
                    kill -9 $PID 2>/dev/null || true
                fi
            done
            sleep 2
            if ! check_port; then
                echo "✅ Port $PORT is now free (taskkill)"
                # Clean up lock file again after killing process
                rm -f .next/dev/lock 2>/dev/null || true
                return 0
            fi
        fi
    fi

    # Unix: lsof + kill
    if command -v lsof > /dev/null 2>&1; then
        PIDS=$(lsof -ti :$PORT 2>/dev/null)
        if [ -n "$PIDS" ]; then
            for PID in $PIDS; do
                echo "🛑 Killing process $PID on port $PORT..."
                kill -9 $PID 2>/dev/null || true
            done
            sleep 2
            if ! check_port; then
                echo "✅ Port $PORT is now free (kill)"
                # Clean up lock file again after killing process
                rm -f .next/dev/lock 2>/dev/null || true
                return 0
            fi
        fi
    fi

    echo "❌ Port $PORT is still in use. Please manually stop the process."
    echo "   Windows: netstat -ano | findstr :$PORT"
    echo "   Then: taskkill /F /PID <PID>"
    exit 1
}

# Function to check if Docker is running
# Pass "quiet" as first arg to suppress output (used inside wait loops)
check_docker() {
    local quiet="${1:-}"
    [ -z "$quiet" ] && echo "🔍 Checking if Docker is running..."

    if command -v docker > /dev/null 2>&1; then
        if docker ps > /dev/null 2>&1; then
            [ -z "$quiet" ] && echo "✅ Docker is running"
            return 0
        else
            [ -z "$quiet" ] && echo "⚠️  Docker is not running"
            return 1
        fi
    else
        [ -z "$quiet" ] && echo "⚠️  Docker command not found. Install: https://www.docker.com/products/docker-desktop/"
        return 1
    fi
}

# Function to launch an executable in the background on Windows
win_launch() {
    local exe_path="$1"
    # cmd.exe /c start works from Git Bash / MSYS2 (start is a CMD built-in)
    if cmd.exe /c start "" "$exe_path" 2>/dev/null; then
        return 0
    fi
    # PowerShell fallback
    if command -v powershell.exe > /dev/null 2>&1; then
        powershell.exe -NoProfile -Command "Start-Process '$exe_path'" 2>/dev/null && return 0
    fi
    return 1
}

# Function to start Docker (Windows-specific, with Unix fallback)
start_docker() {
    echo "🚀 Starting Docker Desktop..."

    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || -n "$WINDIR" ]]; then
        # Method 1: docker desktop start (Docker Desktop 4.37+)
        echo "   Trying 'docker desktop start'..."
        if docker desktop start 2>/dev/null; then
            echo "✅ Docker Desktop start command executed"
            return 0
        fi

        # Method 2: Launch the .exe directly
        DOCKER_PATHS=(
            "C:/Program Files/Docker/Docker/Docker Desktop.exe"
            "/c/Program Files/Docker/Docker/Docker Desktop.exe"
        )
        # Expand $PROGRAMFILES if set
        if [ -n "$PROGRAMFILES" ]; then
            DOCKER_PATHS+=("$PROGRAMFILES/Docker/Docker/Docker Desktop.exe")
        fi

        for DOCKER_PATH in "${DOCKER_PATHS[@]}"; do
            if [ -f "$DOCKER_PATH" ] 2>/dev/null; then
                echo "   Found Docker Desktop at: $DOCKER_PATH"
                if win_launch "$DOCKER_PATH"; then
                    echo "✅ Docker Desktop is launching..."
                    return 0
                fi
            fi
        done

        # Method 3: PowerShell search for Docker Desktop
        if command -v powershell.exe > /dev/null 2>&1; then
            echo "   Searching for Docker Desktop via PowerShell..."
            local found
            found=$(powershell.exe -NoProfile -Command "(Get-Command 'Docker Desktop' -ErrorAction SilentlyContinue).Source" 2>/dev/null | tr -d '\r')
            if [ -n "$found" ] && [ -f "$found" ] 2>/dev/null; then
                echo "   Found Docker Desktop at: $found"
                win_launch "$found" && echo "✅ Docker Desktop is launching..." && return 0
            fi
        fi

        echo "⚠️  Could not find or launch Docker Desktop"
        echo "   Please start Docker Desktop manually and run this script again"
        echo "   Download: https://www.docker.com/products/docker-desktop/"
        return 1
    else
        # macOS: open Docker.app
        if [[ "$OSTYPE" == "darwin"* ]]; then
            if [ -d "/Applications/Docker.app" ]; then
                echo "   Opening Docker.app..."
                open -a Docker 2>/dev/null && return 0
            fi
        fi

        # Linux: systemctl
        if command -v systemctl > /dev/null 2>&1; then
            echo "   Starting Docker service..."
            sudo systemctl start docker 2>/dev/null || {
                echo "⚠️  Could not start Docker service. Please start it manually."
                return 1
            }
            return 0
        fi

        echo "⚠️  Please start Docker manually and run this script again"
        return 1
    fi
}

# Function to check if Supabase is running
# Pass "quiet" as first arg to suppress output (used inside wait loops)
check_supabase() {
    local quiet="${1:-}"
    [ -z "$quiet" ] && echo "🔍 Checking if Supabase is running..."

    if command -v npx > /dev/null 2>&1; then
        if npx supabase status > /dev/null 2>&1; then
            if command -v curl > /dev/null 2>&1; then
                if curl -s http://127.0.0.1:54321/rest/v1/ > /dev/null 2>&1; then
                    [ -z "$quiet" ] && echo "✅ Supabase is running"
                    return 0
                fi
            else
                [ -z "$quiet" ] && echo "✅ Supabase is running"
                return 0
            fi
        fi
    fi

    if command -v docker > /dev/null 2>&1; then
        if docker ps --format '{{.Names}}' 2>/dev/null | grep -qE "supabase|supabase_db|supabase_kong"; then
            [ -z "$quiet" ] && echo "✅ Supabase containers are running"
            return 0
        fi
    fi

    [ -z "$quiet" ] && echo "⚠️  Supabase is not running"
    return 1
}

# Function to start Supabase
start_supabase() {
    echo "🚀 Starting Supabase..."
    if command -v npx > /dev/null 2>&1; then
        npx supabase start
        echo "✅ Supabase start command completed"
    else
        echo "❌ npx not found. Cannot start Supabase."
        exit 1
    fi
}

# Main execution
echo ""
echo "=========================================="
echo "  Feeder App Startup Script"
echo "=========================================="
echo ""

# Step 1: Kill port if in use
kill_port

# Step 2: Check and start Docker
if ! check_docker; then
    if ! start_docker; then
        echo "❌ Failed to start Docker. Please start Docker Desktop manually and run this script again."
        exit 1
    fi

    # Wait for Docker to be ready (check every 3 seconds, max 90 seconds)
    echo "⏳ Waiting for Docker to be ready (this can take a minute on Windows)..."
    MAX_WAIT=90
    WAITED=0
    while [ $WAITED -lt $MAX_WAIT ]; do
        sleep 3
        WAITED=$((WAITED + 3))
        if check_docker quiet; then
            echo "✅ Docker is ready!"
            break
        fi
        echo "   Still waiting for Docker... (${WAITED}s/${MAX_WAIT}s)"
    done

    if ! check_docker quiet; then
        echo "❌ Docker did not start within ${MAX_WAIT} seconds. Please start Docker Desktop manually and run this script again."
        exit 1
    fi
else
    echo "✅ Docker is already running"
fi

# Step 3: Check and start Supabase
if ! check_supabase; then
    start_supabase
    # Wait for Supabase to fully start (check every 2 seconds, max 60 seconds)
    echo "⏳ Waiting for Supabase to be ready..."
    MAX_WAIT=60
    WAITED=0
    while [ $WAITED -lt $MAX_WAIT ]; do
        sleep 2
        WAITED=$((WAITED + 2))
        if check_supabase quiet; then
            echo "✅ Supabase is ready!"
            break
        fi
        echo "   Still waiting... (${WAITED}s/${MAX_WAIT}s)"
    done

    if ! check_supabase quiet; then
        echo "⚠️  Warning: Supabase may not be fully ready, but continuing..."
    fi
else
    echo "✅ Supabase is already running"
fi

# Step 4: Check for .env.local
if [ ! -f "$ENV_FILE" ]; then
    echo "⚠️  Warning: $ENV_FILE not found"
    echo "   The app will use default environment variables"
    echo "   Make sure to create $ENV_FILE with your Supabase configuration"
    echo ""
fi

# Step 5: Start the app
echo "🚀 Starting Next.js app on port $PORT..."
echo ""

# Next.js automatically loads .env.local, so we don't need to manually export
# Just start the dev server in the background
npm run dev &
DEV_PID=$!

# Wait for the dev server to be ready
echo "⏳ Waiting for dev server to be ready on port $PORT..."
MAX_WAIT=60
WAITED=0
OPENED=false
while [ $WAITED -lt $MAX_WAIT ]; do
    sleep 2
    WAITED=$((WAITED + 2))
    if check_port; then
        echo "✅ Dev server is ready! → http://localhost:$PORT"
        OPENED=true
        break
    fi
    echo "   Still waiting... (${WAITED}s/${MAX_WAIT}s)"
done

if [ "$OPENED" = false ]; then
    echo "⚠️  Dev server did not respond within ${MAX_WAIT}s"
fi

# Keep script alive until dev server exits
wait $DEV_PID
