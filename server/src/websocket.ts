import WebSocketServer from 'ws';
import { clients } from './index';
import { acceptRide, addFeedback, blacklist, cancelRide, completeRide, location, logUser, query, report, requestRide, signIn, waitTime } from './routes';
import { response } from 'express';
import { AcceptResponse } from './api';

export type WebSocketMessage = 
    | { directive: "CONNECT", netID: string }
    | { directive: "SIGNIN", phoneNum: string, netID: string, role: 'STUDENT' | 'DRIVER' }
    | { directive: "REQUEST_RIDE", phoneNum: string, netID: string, location: string, destination: string; numRiders: number }
    | { directive: "ACCEPT_RIDE" }
    | { directive: "CANCEL", netID: string }
    | { directive: "COMPLETE", requestid: number }
    | { directive: "ADD_FEEDBACK", rating: number, feedback: string, appOrRide: 0 | 1 }
    | { directive: "REPORT", netID: string, requestid: string, reason: string }
    | { directive: "BLACKLIST", netID: string }
    | { directive: "WAIT_TIME", requestid: number, 
        pickupLocation?: [ latitude: number, longitude: number ], 
        driverLocation?: [ latitude: number, longitude: number ] }
    | { directive: "LOCATION", id: string, latitude: number, longitude: number }
    | { directive: "QUERY", rideorApp?: 0 | 1, // 0 for ride, 1 for app, default: query both
        date?: Date, rating?: number };

export const handleWebSocketMessage = (wss: WebSocketServer.Server, ws: WebSocketServer, message: string) : void => {
    console.log(`WEBSOCKET: Received message => ${message}`);
    // convert from json into our custom websocket message type
    // TODO: ERROR CHECKING NEEDED FOR MALFORMED JSON INPUT?
    const input = JSON.parse(message) as WebSocketMessage;
    let resp;
    switch (input.directive) {
        // call the correct function based on the directive
        case 'CONNECT': 
            // Connect the specific websocket to the netid speicified in input
            console.log(`WEBSOCKET: User ${input.netID} connected`);
            clients.map((client) => {
                if (client.websocketInstance == ws) {
                    client.netid = input.netID;
                }
            });
            
            // Log user on connection
            logUser(input.netID);
            break;

        case 'SIGNIN' :
            resp = signIn(input.phoneNum, input.netID, input.role);
            // send response back to client (the student)
            sendWebSocketMessage(ws, resp);
            break;

        case 'REQUEST_RIDE' :
            resp = requestRide(input.phoneNum, input.netID, input.location, input.destination, input.numRiders);
            // send response back to client (the student)
            sendWebSocketMessage(ws, resp);
            break;

        case 'ACCEPT_RIDE' :
            resp = acceptRide();
            if ('driver' in response && 'student' in response) {
                const response = resp as AcceptResponse;
                // send response back to client (the driver)
                sendWebSocketMessage(ws, response.driver);

                // send response back to corresponding client (the student)
                const student = clients.find((client) => client.netid == response.driver.netID);
                if (!student) {
                    // we couldn't find the student!
                    console.log(`WEBSOCKET: No student found with netid ${response.driver.netID}`);
                    return;
                }
                sendWebSocketMessage(student.websocketInstance, response.student);
            } else {
                // the ErrorResponse case, send only to driver
                sendWebSocketMessage(ws, resp);
            }
            break;

        case 'CANCEL':
            resp = cancelRide(input.netID);
            // send response back to client (the student)
            sendWebSocketMessage(ws, resp);
            // TODO: send response back to driver
            break;
        case 'COMPLETE' :
            resp = completeRide(input.requestid);
            // send response back to client (the driver)
            sendWebSocketMessage(ws, resp);
            break;
        case 'ADD_FEEDBACK':
            resp = addFeedback(input.rating, input.feedback, input.appOrRide);
            // send response back to client (the driver)
            sendWebSocketMessage(ws, resp);
            break;
        case 'REPORT':
            resp = report(input.netID, input.requestid, input.reason);
            // send response back to client (the driver)
            sendWebSocketMessage(ws, resp);
            break;
        case 'BLACKLIST':
            resp = blacklist(input.netID);
            // send response back to client (the driver)
            sendWebSocketMessage(ws, resp);
            break;
        case 'WAIT_TIME':
            resp = waitTime(input.requestid, input.pickupLocation, input.driverLocation);
            // send response back to client (the student)
            sendWebSocketMessage(ws, resp);
            break;
        case 'LOCATION':
            resp = location(input.id, input.latitude, input.longitude);
            // TODO: send response to opposite client
            break;
        case 'QUERY':
            resp = query(input.rideorApp, input.date, input.rating);
            // send response back to client (the driver)
            sendWebSocketMessage(ws, resp);
            break;       
        default:
            console.log(`WEBSOCKET: Unknown directive: ${input}`);
            break;
    }
}

// Any type is risky! We should be more specific about the type of message we are sending...
export const sendWebSocketMessage = (ws: WebSocketServer, message: any) : void => {
    ws.send(JSON.stringify(message));
}