module.exports = {
  "expo": {
    "name": "AEMobile",
    "slug": "AEMobile",
    "version": "1.0.3",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "dev.youtiao.aemonitor",
      "buildNumber": "3"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff",
      },
      "package": "dev.youtiao.aemonitor"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "extra": {
      "eas": {
        "projectId": "592a287e-bcc2-4ace-b3fc-efe1f73ec693"
      }
    },
    "plugins": [[
      "expo-build-properties",
      {
        "android": {
          "usesCleartextTraffic": true
        }
      }
    ]]
  }
}