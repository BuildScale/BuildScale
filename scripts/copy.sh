#!/usr/bin/env bash

./scripts/build.sh


path=${PWD}
echo $path

rm -rf $1/node_modules/@buildscale
cp -r build/packages $1/node_modules/@buildscale
