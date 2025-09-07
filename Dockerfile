# Multi-stage build for React frontend and Flask backend
FROM node:18-alpine AS frontend-build

# Set working directory for frontend
WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./

# Install dependencies (tolerant to lockfile drift)
RUN npm install --no-audit --no-fund

# Copy frontend source code
COPY frontend/ ./

# Build the React app
RUN npm run build

# Python backend stage
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
# Install minimal runtime deps (curl for healthcheck)
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY backend/requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ ./

# Copy built frontend from previous stage
COPY --from=frontend-build /app/frontend/build ./frontend/build

# Create non-root user
RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
USER app

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -fsS http://localhost:5000/api/health || exit 1

# Run the application
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--timeout", "120", "app:app"]
