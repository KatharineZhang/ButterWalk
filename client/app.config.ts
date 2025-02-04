import { ExpoConfig, ConfigContext } from "@expo/config";
import * as dotenv from "dotenv";

// initialize dotenv
dotenv.config();

// This will replace out app.json on runtime
// allowing us to use api keys in the .env
// while also keeping them hidden on git
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Husky BetterWalk",
  slug: "husky-betterWalk",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/betterWalkLogo.png",
  scheme: "myapp",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  splash: {
    image: "./assets/images/betterWalkLogo.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.betterwalk.betterwalk",
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_APIKEY,
    },
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/betterWalkLogo.png",
      backgroundColor: "#ffffff",
    },
    package: "com.betterwalk.betterwalk",
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_APIKEY,
      },
    },
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/betterWalkLogo.png",
  },
  plugins: ["expo-router"],
  experiments: {
    typedRoutes: true,
  },
});
