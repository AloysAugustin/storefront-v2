#!/bin/bash
cat instances.tmp | while read cid; do docker stop $cid; docker container rm $cid; done
echo -n '' > instances.tmp
