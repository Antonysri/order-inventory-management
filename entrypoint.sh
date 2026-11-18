#!/bin/sh
set -e

# Run database migrations and seeders if needed
echo "Executing database migrations..."
php artisan migrate --force || true

# Start Supervisor (Nginx + PHP-FPM)
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
