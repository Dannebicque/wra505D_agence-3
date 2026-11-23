# Image de dev du backend : PHP 8.4 + FrankenPHP (serveur Caddy intégré)
FROM dunglas/frankenphp:1-php8.4

# Extensions en plus de celles de l'image (ctype, iconv, fileinfo, dom, xml… sont déjà là)
RUN install-php-extensions pdo_pgsql intl zip apcu

RUN cp "$PHP_INI_DIR/php.ini-development" "$PHP_INI_DIR/php.ini" \
    # Fichiers des traces : PDF jusqu'à 10 Mo (2 Mo par défaut), plus la marge du formulaire multipart
    && printf 'upload_max_filesize = 10M\npost_max_size = 11M\n' > "$PHP_INI_DIR/conf.d/uploads.ini"

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

ENV SERVER_NAME=:80 \
    COMPOSER_ALLOW_SUPERUSER=1

WORKDIR /app

# Le code est monté en volume (compose.yaml) ; les dépendances sont installées au démarrage
CMD ["sh", "-c", "composer install --no-interaction && frankenphp run --config /etc/frankenphp/Caddyfile"]
