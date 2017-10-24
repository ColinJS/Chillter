# Build app for iOS

## 1. Requirements

## 1.1 MacOS
Need a **MacOS** with **Sierra**. Install Xcode from Mac App Store.

Execute  :
```
sudo xcode-select -s /Applications/xcode-app/Contents/Developer
```

## 1.2 NPM
Need **npm** installed :

Execute :
```
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
brew install node
```

## 1.3 Ionic, Cordova, ios-deploy
Install ionic, cordova, ios-deploy globally :
```
npm install -g cordova ionic ios-deploy
```

## 2. Get the project compiled

Clone the project, go inside the cloned folder `chillter-app` and **checkout** to develop branch :
```
git checkout develop
```
(While the work is not on master branch)

Execute in `chillter-app` folder :
```
npm install
```

Continue with :
```
ionic cordova resources
ionic cordova platform add ios
```

Continue with :
```
ionic cordova build ios (take a long time, maybe do a CTRL+C after 10 min and do it again)
```
*take a long time, maybe do a CTRL+C after 10 min and do it again. The `ionic cordova build ios` should return a BUILD FAILED.*

Continue with :
```
ionic cordova platform update ios
Execute sh cordovaplugin.sh (from chillter-app folder, only on platform/ios branch now, take time)
```
Now in Xcode, open the `Chillter.xcodeproj` in `chillter-app/platforms/ios`, click on chillter project (directory icon on the left, add the provisionning profile 'Chillter'.

Continue with :
```
ionic cordova build ios
```
Now in Xcode, open the `Chillter.xcodeproj` in `chillter-app/platforms/ios`, at the top, select wich device you want. Press the **play** button at the left. 

**Generix iOS device is to upload on itunesConnect, devices is to open simulator, your device to test on it**

## 3. Get changes :
Do a `git pull`, and in `chillter-app` folder execute :
```
ionic cordova resources && ionic cordova build ios
```
Reopen xCode if already opened.