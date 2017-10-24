# Build app for Android

Need to have JAVA JDK and ANDROID SDK with PATH provided.

##Disable the debug plugin : 
```
ionic cordova plugin rm cordova-plugin-console
Don't push with the plugin disable. Discard change before commiting later !
```

## Build the app :
```
cordova build --prod --release
```

## Create a private key to sign the APK :
```
keytool -genkey -v -keystore my-release-key.keystore -alias alias_name -keyalg RSA -keysize 2048 -validity 10000
Give all information and provide a password !
```
*This command should be executed one time, after that always sign the app with that key to have a working Playstore version*

## Sign the app :
```
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore android-release-unsigned.apk alias_name
zipalign -v 4 android-release-unsigned.apk APP-NAME.apk
```

Now the signed APK should be where the command is executed. Push this APK to the Developer Console.

http://ionicframework.com/docs/v1/guide/publishing.html