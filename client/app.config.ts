import { ExpoConfig, ConfigContext } from "@expo/config";
import * as dotenv from "dotenv";

// initialize dotenv
dotenv.config();

// This will replace out app.json on runtime
// allowing us to use api keys in the .env
// while also keeping them hidden on git
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "SafeTrip",
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
    bundleIdentifier: "com.butterwalk.butterwalk",
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_APIKEY,
    },
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
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
  plugins: ["expo-router"],
  experiments: {
    typedRoutes: true,
  },
});
