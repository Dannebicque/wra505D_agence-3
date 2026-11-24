#!/bin/sh
# Démarrage de l'API en production : refuse un secret par défaut, applique les migrations, puis sert l'API.
set -e

case "${APP_SECRET:-}" in
  '' | CHANGE_ME*)
    echo "APP_SECRET doit être une valeur secrète propre à ce serveur (voir backend/README.md)." >&2
    exit 1
    ;;
esac

php bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration
exec frankenphp run --config /etc/frankenphp/Caddyfile
