#!/bin/bash
pushd $(dirname $0)
docker-compose down
popd
