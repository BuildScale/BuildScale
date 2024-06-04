#!/bin/bash
npx ng-packagr -p packages/buildscale/ng-package.json

rm -rf build
./node_modules/.bin/ngc

#BuildScale client side lib
rm -rf build/packages/buildscale
cp -r packages/buildscale/dist build/packages/buildscale
rm -rf packages/buildscale/dist

#TODO This is a temporary hack until we can publish named umds
sed -i.bak "s/define(\[/define('@buildscale\/buildscale',\[/" build/packages/buildscale/bundles/buildscale-buildscale.umd.js
sed -i.bak "s/define(\[/define('@buildscale\/buildscale',\[/" build/packages/buildscale/bundles/buildscale-buildscale.umd.min.js

rm -rf build/packages/buildscale/bundles/buildscale-buildscale.umd.js.bak
rm -rf build/packages/buildscale/bundles/buildscale-buildscale.umd.min.js.bak

sed -i.bak "s/define(\[/define('@buildscale\/buildscale\/testing',\[/" build/packages/buildscale/bundles/buildscale-buildscale-testing.umd.js
sed -i.bak "s/define(\[/define('@buildscale\/buildscale\/testing',\[/" build/packages/buildscale/bundles/buildscale-buildscale-testing.umd.min.js

rm -rf build/packages/buildscale/bundles/buildscale-buildscale-testing.umd.js.bak
rm -rf build/packages/buildscale/bundles/buildscale-buildscale-testing.umd.min.js.bak

rsync -a --exclude=*.ts packages/ build/packages

chmod +x build/packages/schematics/bin/create-buildscale-workspace.js
chmod +x build/packages/schematics/src/command-line/buildscale.js
rm -rf build/packages/install
rm -rf build/packages/buildscale/dist
rm -rf build/packages/buildscale/spec
cp README.md build/packages/schematics
cp README.md build/packages/buildscale
