import { ExpoConfig, ConfigContext } from "@expo/config";
import * as dotenv from "dotenv";




// initialize dotenv
dotenv.config();




export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "SafeTrip",
  slug: "husky-betterWalk",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/butterWalkLogo.png",
  scheme: "com.butterwalk.butterwalk",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  splash: {
    image: "./assets/images/butterWalkLogo.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.butterwalk.butterwalk",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSLocationWhenInUseUsageDescription:
        "We need your location to show your position on the map.",
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/butterWalkLogo.png",
      backgroundColor: "#ffffff",
    },
    package: "com.butterwalk.butterwalk",
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_APIKEY,
      },
    },
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/butterWalkLogo.png",
  },
  plugins: [
    "expo-router",
    // [
    //  'sentry-expo',
    //   {
    //     org: 'butterwalk',
    //     project: 'ButterWalk',
    //     authToken: process.env.SENTRY_AUTH_TOKEN,
    //   },
    // ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: "24a5e20c-9f0d-4a09-9f2d-49ae53b470e5",
    },
  },
});


