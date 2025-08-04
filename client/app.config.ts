import { ExpoConfig, ConfigContext } from "@expo/config";
import * as dotenv from "dotenv";


// initialize dotenv
dotenv.config();


export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Husky SafeTrip",
  slug: "husky-betterWalk",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/butterWalkLogo.png",
  scheme: "myapp",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  splash: {
    image: "./assets/images/butterWalkLogo.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.butterwalkioshiya.butterwalk",
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
    [
     'sentry-expo',
      {
        org: 'butterwalk',
        project: 'ButterWalk',
        authToken: process.env.SENTRY_AUTH_TOKEN,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: "400500de-e681-47b9-be13-14802fd28fa7",
    },
  },
});
