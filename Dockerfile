FROM debian:jessie
MAINTAINER mohammed@hawari.fr
RUN apt-get update && apt-get install -y nginx supervisor uwsgi python-pip uwsgi-plugin-python cron
RUN mkdir -p /var/log/supervisor && mkdir /run/uwsgi && mkdir -p /usr/local/share/ca-certificates/letsencrypt.org/
COPY requirments.txt /apps/storefront/
RUN cd /apps/storefront/ && pip install -r requirments.txt
ADD https://letsencrypt.org/certs/lets-encrypt-x3-cross-signed.pem /usr/local/share/ca-certificates/letsencrypt.org/lets-encrypt-x3-cross-signed.crt
RUN update-ca-certificates
COPY config/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY . /apps/storefront
COPY config/nginx.conf /etc/nginx/nginx.conf
RUN echo "*/5 * * * * bash -c 'cd /apps/storefront/config && python ../terminate.py >/var/log/cron.log 2>&1' " | crontab
RUN useradd nginx || true
RUN groupadd nginx || true
RUN cd /apps/storefront/ && ls config/credentials.json.tmp && mv -f config/credentials.json.tmp config/credentials.json || true
RUN cd /apps/storefront/ && ls app/settings.js.tmp && mv -f app/settings.js.tmp app/settings.js || true
EXPOSE 80
CMD ["/usr/bin/supervisord"]
#CMD ["/bin/bash"] 
