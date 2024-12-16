import WebSocketServer from 'ws';
import { clients } from './index';
import { acceptRide, logUser, requestRide, signIn } from './routes';

export type WebSocketMessage = 
    | { directive: "CANCEL" }
    | { directive: "CONNECT", netID: string }
    | { directive: "SIGNIN", phoneNum: string, netID: string, role: 'STUDENT' | 'DRIVER' }
    | { directive: "REQUEST_RIDE", phoneNum: string, netID: string, location: string, destination: string; numRiders: bigint }
    | { directive: "ACCEPT_RIDE" }

export const handleWebSocketMessage = (wss: WebSocketServer.Server, ws: WebSocketServer, message: string) : void => {
    console.log(`WEBSOCKET: Received message => ${message}`);
    const input = JSON.parse(message) as WebSocketMessage;
    switch (input.directive) {
        case 'CONNECT': // Connect the netid to the websocket
            console.log(`WEBSOCKET: User ${input.netID} connected`);
            clients.map((client) => {
                if (client.ws == ws) {
                client.netid = input.netID;
                }
            });
            
            // Log user on connection
            logUser(input.netID);
            break;

        case 'SIGNIN' :
            signIn(input.phoneNum, input.netID, input.role);
            break;

        case 'REQUEST_RIDE' :
            requestRide(input.phoneNum, input.netID, input.location, input.destination, input.numRiders);
            break;

        case 'ACCEPT_RIDE' :
            acceptRide();
            break;

        case 'CANCEL':
            console.log('WEBSOCKET: Cancel confirmed');
            wss.clients.forEach((client: { readyState: any; send: (arg0: any) => void; }) => {
                if (client == ws && client.readyState === WebSocketServer.OPEN) {
                //eventually check for specific driver
                client.send('Cancel confirmed');
                }
            });
            break;
       
        default:
            console.log(`WEBSOCKET: Unknown directive: ${input}`);
            break;
    }
}