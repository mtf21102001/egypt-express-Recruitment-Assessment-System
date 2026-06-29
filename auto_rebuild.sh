#!/bin/bash

# Wait for Docker daemon and containers to start up
sleep 15

echo "Looking for backend tunnel URL..."
# Fetch the backend tunnel URL (retry up to 10 times)
BACKEND_URL=""
for i in {1..10}; do
    BACKEND_URL=$(docker logs recruitment_tunnel 2>&1 | grep -Eo 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' | tail -n 1)
    if [ -n "$BACKEND_URL" ]; then
        break
    fi
    sleep 5
done

if [ -z "$BACKEND_URL" ]; then
    echo "Could not find backend URL from tunnel logs. Exiting."
    exit 1
fi

echo "Found Backend URL: $BACKEND_URL"

# Go to frontend directory
cd /home/ahmed/egypt-express-Recruitment-Assessment-System/frontend || exit 1

# Check if the URL is already set to the current one (to avoid unnecessary rebuilds)
CURRENT_URL=$(grep "NEXT_PUBLIC_API_URL:" docker-compose.yml | awk '{print $2}')
if [ "$CURRENT_URL" = "$BACKEND_URL" ]; then
    echo "Frontend is already using the correct URL. No rebuild needed."
    exit 0
fi

# Update docker-compose.yml with the new URL using sed
sed -i "s|NEXT_PUBLIC_API_URL: .*|NEXT_PUBLIC_API_URL: $BACKEND_URL|" docker-compose.yml

# Rebuild and start the frontend container
echo "Rebuilding frontend with new Backend URL..."
docker compose up -d --build frontend

# Wait a few seconds for the frontend tunnel to establish
echo "Waiting for frontend tunnel..."
sleep 10

# Fetch the frontend tunnel URL
FRONTEND_URL=$(docker logs recruitment_frontend_tunnel 2>&1 | grep -Eo 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' | tail -n 1)

if [ -n "$FRONTEND_URL" ]; then
    echo "Found Frontend URL: $FRONTEND_URL"
    echo "Sending email notification..."
    python3 /home/ahmed/egypt-express-Recruitment-Assessment-System/mailer.py "$BACKEND_URL" "$FRONTEND_URL"
else
    echo "Could not find frontend URL to send email."
fi

echo "Done!"
