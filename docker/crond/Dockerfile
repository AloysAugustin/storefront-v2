FROM alpine:latest
MAINTAINER Aloys Augustin <aloys@scalr.com>

ADD requirements.txt terminate.py /
RUN apk add --no-cache \
        python2 \
        py2-pip \
        curl \
    && pip install --upgrade pip \
    && pip install -r /requirements.txt \
    && curl https://letsencrypt.org/certs/lets-encrypt-x3-cross-signed.pem >> $(python -mrequests.certs) \
    && echo "*/15 * * * * cd / && python terminate.py >> /var/log/terminate.log 2>&1" | crontab -
ADD config/credentials.json.tmp /credentials.json
CMD crond -f -d 8
