#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd ${DIR} || exit

echo "Pulling from GitHub"
## Get latest from GitHub
cd ..
git pull origin master
cd ${DIR}

echo "Cleaning up"
## Delete temp directories
rm -rf tmp
rm -rf out
rm -rf phonegap_tmp

## Create temp directories
mkdir tmp
mkdir phonegap_tmp
mkdir out
mkdir out/android
mkdir out/iOS
mkdir out/windows
mkdir out/windows8
mkdir out/mac
mkdir out/web

## Copy existing source
cd ${DIR}
cd tmp
cp -r ../../src/myProducts.Web/app .
cp -r ../../src/myProducts.Web/images .
#cp ../../src/myProducts.Web/index.html .
cp ../node-webkit-sharedsource/* .

## Download generated index.html page
echo "GETting index.html"
curl -k https://windows8vm/ngmd/app > index.html
perl -pi -w -e 's/\/ngmd\///g;' index.html

## ZIP directory into .nw for node-webkit
zip -qr ../out/app.nw *

## Build for node-webkit
echo "Building for Mac"
cp -r ../node-webkit-osx/ ../out/mac
cp -r ../out/app.nw ../out/mac/node-webkit.app/Contents/Resources/
mv ../out/mac/node-webkit.app "../out/mac/myProducts.app"

echo "Building for Windows"
cp -r ../node-webkit-win32/ ../out/windows
cat ../out/windows/nw.exe ../out/app.nw > "../out/windows/myProducts.exe"
rm ../out/windows/nw.exe
rm ../out/app.nw

## Build for Windows8
echo "Building for Windows 8"
cp -r ../windows8/projectTemplate/ ../out/windows8
cp -r . ../out/windows8
rm ../out/windows8/package.json
rm ../out/windows8/app/index.cshtml
cp -r ../windows8/replacement/ ../out/windows8
cat "../windows8/projectFile/myProducts.WindowsStore.jsproj_PART1" > "../out/windows8/myProducts.WindowsStore.jsproj"
cd ../out/windows8
find . -type f|sed 's/\//\\/'g |sed 's/.\\/<Content Include="/' |sed 's/$/" \/>/' |grep -v '\." /' |grep -v ".DS_Store" |grep -v ".appxmanifest" |grep -v ".jsproj" |grep -v ".pfx" >> "./myProducts.WindowsStore.jsproj"
cat "../../windows8/projectFile/myProducts.WindowsStore.jsproj_PART2" >> "./myProducts.WindowsStore.jsproj"
perl -e 's/\xef\xbb\xbf//;' -pi~ "./myProducts.WindowsStore.jsproj"

## Create phonegap project
cd ${DIR}
cd phonegap_tmp
cordova create myProducts com.tt.apps.ngmd myProducts
rm -rf myProducts/www

## Copy existing application elements
cp -r ../tmp/ myProducts/www
cp -r ../phonegap-sharedsource/ myProducts/

echo "Creating PhoneGap projects"

cd myProducts

cordova platform add ios
cordova platform add android

### Windows 8...
#cordova platform add windows8

## Build for iOS
cp -r ../../phonegap-ios/ ./platforms/ios/myProducts
cp ./www/config.xml ./platforms/ios/myProducts

echo "Building for iOS"
cordova build ios

cd platforms/ios/build/emulator/
mv myProducts.app "../../../../../../out/ios/myProducts.app"
cd ../../../..

## Build Android
cp -r ../../phonegap-android/ ./platforms/android
cp ./www/config.xml ./platforms/android

echo "Building for Android"
cordova build android

cd platforms/android/ant-build/
cp myProducts-debug.apk ../../../../../out/android/

#adb install myProducts-debug.apk

## Copy for web deployment
cd ${DIR}
cp -r tmp/ out/web/
rm out/web/package.json

## Remove tmp directory
cd ${DIR}
rm -rf tmp
