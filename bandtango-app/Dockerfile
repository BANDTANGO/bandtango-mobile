# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Suppress interactive Expo prompts
ENV CI=1
ENV EXPO_NO_TELEMETRY=1

# Install dependencies first (cached layer)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

# Export the Expo web bundle to dist/
RUN npx expo export -p web

# ── Stage 2: serve ────────────────────────────────────────────────────────────
FROM nginx:stable-alpine AS runner

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy the built web output
COPY --from=builder /app/dist /usr/share/nginx/html

# Serve a SPA: redirect all 404s back to index.html for client-side routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
