# Backend : PHP 8.4 + FrankenPHP (serveur Caddy intégré). Deux cibles :
# - dev  (compose.yaml)      : code monté en volume, dépendances installées au démarrage ;
# - prod (compose.prod.yaml) : code et dépendances dans l'image, opcache, migrations au démarrage.
FROM dunglas/frankenphp:1-php8.4 AS base

# Extensions en plus de celles de l'image (ctype, iconv, fileinfo, dom, xml… sont déjà là)
# gd et exif : images des traces réencodées sans leurs métadonnées (position GPS…), dans le bon sens
RUN install-php-extensions pdo_pgsql intl zip apcu gd exif opcache

# Fichiers des traces : PDF jusqu'à 10 Mo (2 Mo par défaut), plus la marge du formulaire multipart
RUN printf 'upload_max_filesize = 10M\npost_max_size = 11M\nmemory_limit = 256M\n' > "$PHP_INI_DIR/conf.d/uploads.ini"

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

ENV SERVER_NAME=:80 \
    COMPOSER_ALLOW_SUPERUSER=1

WORKDIR /app

FROM base AS dev

RUN cp "$PHP_INI_DIR/php.ini-development" "$PHP_INI_DIR/php.ini"

# Le code est monté en volume (compose.yaml) ; les dépendances sont installées au démarrage
CMD ["sh", "-c", "composer install --no-interaction && frankenphp run --config /etc/frankenphp/Caddyfile"]

FROM base AS prod

ENV APP_ENV=prod \
    APP_DEBUG=0

# php.ini de production (erreurs jamais affichées) ; le code ne change pas dans l'image : opcache ne relit pas les fichiers
RUN cp "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini" \
    && printf 'opcache.enable=1\nopcache.validate_timestamps=0\nopcache.memory_consumption=256\nopcache.max_accelerated_files=20000\nrealpath_cache_size=4096K\nrealpath_cache_ttl=600\n' > "$PHP_INI_DIR/conf.d/opcache-prod.ini"

# Dépendances d'abord (couche mise en cache tant que composer.lock ne change pas), sans celles de dev
COPY composer.json composer.lock symfony.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

COPY . .
# Aucun fichier de secrets ne doit être figé par dump-env (ceinture et bretelles avec .dockerignore)
RUN rm -rf tests var .env.local .env.*.local .env.prod .env.prod.* \
    && composer dump-autoload --classmap-authoritative --no-dev \
    && composer dump-env prod \
    && bin/console cache:warmup \
    && mkdir -p var/fichiers/prod

COPY docker/entrypoint-prod.sh /usr/local/bin/entrypoint-prod
RUN chmod +x /usr/local/bin/entrypoint-prod
CMD ["entrypoint-prod"]
