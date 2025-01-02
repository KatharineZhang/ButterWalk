# Setup Instructions

- Git clone this repo
- If you haven't already, you need to also install `Node.js v20.18.0`
- cd into the client folder and copy the `.env.sample`. Rename the copied file `.env`.
  - Fill in the EXPO_PUBLIC_IP_ADDRESS with your publically accessible IPv4 ip address. Windows instructions are in the `.env.sample` (someone please add the mac and linux versions if you know).
  - Fill in the EXPO_PUBLIC_GOOGLE_MAPS_APIKEY. Ask someone on the dev team for this key.
- cd into both the client and server folders and run `npm i`
- Install the Expo Go app on your phone or a mobile emulator onto your computer.

# To Run

- cd into the server folder and run `npm run buildandstart`
- cd into the client folder and run `npx expo start`
- Scan the QR code that appears in the terminal with your phone, which should open the app in Expo Go!

# Development

### Websocket and Database: Things to know

- If your app is not connecting to the websocket immidiately upon arriving to the home page and the
  connection the said websocket is timing out, make sure your IP Address in the .env is correct
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

- Run `npm run prettier-fix` and `npm run lint` in any client or server code before pushing to format and lint it!
