#!/usr/bin/env bash

SCHEMATICS_VERSION=$1
BUILDSCALE_VERSION=$2

./scripts/build.sh

cd build/packages
sed -i "" "s|exports.buildscaleVersion = '\*';|exports.buildscaleVersion = '$BUILDSCALE_VERSION';|g" schematics/src/lib-versions.js
sed -i "" "s|exports.schematicsVersion = '\*';|exports.schematicsVersion = '$SCHEMATICS_VERSION';|g" schematics/src/lib-versions.js


tar -czf buildscale.tgz buildscale
tar -czf schematics.tgz schematics
