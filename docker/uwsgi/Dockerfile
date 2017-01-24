FROM alpine:latest
MAINTAINER Aloys Augustin <aloys@scalr.com>

ADD requirements.txt mail_server.py docker/uwsgi/storefront.ini /
RUN apk add --no-cache \
        --repository http://dl-cdn.alpinelinux.org/alpine/edge/testing \
        python2 \
        py2-pip \
        uwsgi \
        uwsgi-python \
        exim \
    && pip install --upgrade pip \
    && pip install -r /requirements.txt
ADD docker/uwsgi/exim.conf /etc/exim/exim.conf
CMD uwsgi --ini /storefront.ini
