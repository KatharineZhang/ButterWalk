# Setup Instructions
- Git clone this repo
- If you haven't already, you need to also install `Node.js v20.18.0`
- cd into both the client and server folders and run ```npm i```
- cd into the client folder and copy the ```.env.sample```. Rename the copied file ```.env``` and fill in the EXPO_PUBLIC_IP_ADDRESS with your publically accessible IPv4 ip address. Windows instructions are in the ```.env.sample``` (someone please add the mac and linux versions if you know).
- Install the Expo Go app on your phone or a mobile emulator onto your computer.
- If you do not have axios, download by `npm install axios` (what is this needed for? I don't have it installed -Snigdha)

# To Run
- cd into the server folder and run ```npm run buildandstart```
- cd into the client folder and run ```npx expo start```
- Scan the QR code that appears in the terminal with your phone, which should open the app in Expo Go!
