# Setup Instructions

- Git clone this repo
- If you haven't already, you need to also install `Node.js v20.18.0`
- cd into the client folder and copy the `.env.sample`. Rename the copied file `.env`.
  - Fill in the EXPO_PUBLIC_IP_ADDRESS with your publically accessible IPv4 ip address. Windows instructions are in the `.env.sample` (someone please add the mac and linux versions if you know).
  - Fill in the rest of the information by asking someone on the dev team.
- cd into the server folder and copy `.env.sample`. Rename the copied file `.env`.
  - Fill in the information by asking someone on the dev team.
- cd into both the client and server folders and run `npm i`
- Install the Expo Go app on your phone or a mobile emulator onto your computer.

# To Run

- cd into the server folder and run `npm run buildandstart`
- In a new terminal, cd into the client folder and run `npx expo start`
   Switch to Expo Go by pressing 's' if the QR code is in development mode
- Scan the new QR code that appears in the terminal with your phone, which should open the app in Expo Go!

# To Use Simulator (Mac)

- Download simulator (macOS only) and open any device
- Download zip file from [here](https://expo.dev/accounts/katzhang/projects/husky-betterWalk/builds/ca622619-adcc-4adf-9201-5865b8a44236)
- Unzip the file and drag the app to the device in the simulator
- cd into the server folder and run `npm run buildandstart`
- cd into the client folder and run `npx expo start`
- Switch to Expo Go by pressing 's' if the QR code is in development mode
- Open your app on the device in the simulator

# To Use Simulator (Windows)

- Download Android Studio
- Add ANDROID_HOME to your system variables (see [expo docs](https://docs.expo.dev/workflow/android-studio-emulator/))
- Add platform-tools path to User variables Path
- Make an emulator on Android Studio
- Launch the emulator and download expo go on the phone
- Switch to Expo Go by pressing 's'
- Copy paste the link under Metro waiting at "exp://..." into the 'paste url manually' in the emulator's expo go (see [video](https://www.youtube.com/watch?v=uN64m3bUY6M&t=590s))

# Development

### Expo: Things to know

- If you run `npx expo start` and see errors that look like:

```
The following packages should be updated for best compatibility with the installed expo version:
  expo@52.0.20 - expected version: ~52.0.25
  expo-constants@17.0.3 - expected version: ~17.0.4
  expo-font@13.0.2 - expected version: ~13.0.3 ...
```

run a command similar to `npm i expo@52.0.25 expo-constants@17.0.4 expo-font@13.0.3...` where you update the recommended packages to the expected versions.

- If the Expo app is saying something along the lines of:

  > This is taking much longer than it should. You might want to check your internet connectivity.

  and you are connected to a stable internet, you need to make your laptop 'discoverable' on the WiFi. On Windows, you need to change your labtop WiFi connection to be a Private Network so your phone can discover your computer's host.
  To do this, go to Settings > Network & Internet > Wi-Fi > click the specific WiFi you are using > change the Network Profile Type to Private Network, which is described as:

  > Your device is discoverable on the network. Select this if you need file sharing or use apps that communicate over this network. You should know and trust the people and devices on the network.

### Websocket and Database: Things to know

- If your app is not connecting to the websocket immidiately upon arriving to the home page and the
  connection the said websocket is timing out, make sure your IP Address in the .env is correct
  (SOMETIMES YOUR IPV4 ADDRESS CHANGES!!!)
- Before testing the database, make sure the database rules are set to true not false. Otherwise,
  you will run into a permission issue. TODO: Change the rules programmatically upon authentication

```
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**PLEASE change the security rules back to ` allow read, write: if false;` after you are done testing and delete ALL added documents from the database!**

- Run `npm run prettier-fix` and `npm run lint` in any client or server code before pushing to format and lint it!
