# Image de dev du backend : PHP 8.4 + FrankenPHP (serveur Caddy intégré)
FROM dunglas/frankenphp:1-php8.4

# Extensions en plus de celles de l'image (ctype, iconv, fileinfo, dom, xml… sont déjà là)
RUN install-php-extensions pdo_pgsql intl zip apcu

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

ENV SERVER_NAME=:80 \
    COMPOSER_ALLOW_SUPERUSER=1

WORKDIR /app

# Le code est monté en volume (compose.yaml) ; les dépendances sont installées au démarrage
CMD ["sh", "-c", "composer install --no-interaction && frankenphp run --config /etc/frankenphp/Caddyfile"]
