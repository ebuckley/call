#!/bin/bash
rsync -avz \
      --exclude 'node_modules' \
      src/ \
      medivac:~/call