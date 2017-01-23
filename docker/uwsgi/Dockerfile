FROM alpine:latest
MAINTAINER Aloys Augustin <aloys@scalr.com>

ADD requirements.txt mail_server.py docker/uwsgi/storefront.ini /
RUN apk add --no-cache \
        python2 \
        py2-pip \
        uwsgi \
        uwsgi-python \
    && pip install --upgrade pip \
    && pip install -r /requirements.txt
CMD uwsgi --ini /storefront.ini