#!/bin/sh
# Démarrage de l'API en production : refuse un secret par défaut, applique les migrations, puis sert l'API.
set -e

case "${APP_SECRET:-}" in
  '' | CHANGE_ME*)
    echo "APP_SECRET doit être une valeur secrète propre à ce serveur (voir backend/README.md)." >&2
    exit 1
    ;;
esac
if [ "${#APP_SECRET}" -lt 32 ]; then
  echo "APP_SECRET doit compter au moins 32 caractères (openssl rand -hex 32)." >&2
  exit 1
fi

# Une seule instance de l'API : Doctrine Migrations ne verrouille pas, deux démarrages simultanés se gêneraient

php bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration
exec frankenphp run --config /etc/frankenphp/Caddyfile
