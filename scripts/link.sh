#!/usr/bin/env bash

if [ "$1" = "fast" ]; then
  ./scripts/build_for_test.sh
fi
if [ "$1" != "fast" ]; then
  ./scripts/build.sh
fi

rm -rf node_modules/@buildscale
cp -r build/packages node_modules/@buildscale
