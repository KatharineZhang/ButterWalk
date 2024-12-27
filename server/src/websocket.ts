import WebSocketServer from 'ws';
import { clients } from './index';
import { acceptRide, addFeedback, blacklist, cancelRide, completeRide, location, query, report, requestRide, signIn, waitTime } from './routes';
import { AcceptResponse, CancelResponse } from './api';

export type WebSocketMessage = 
    | { directive: "CONNECT", netID: string }
    | { directive: "SIGNIN", phoneNum: string, netID: string, role: 'STUDENT' | 'DRIVER' }
    | { directive: "REQUEST_RIDE", phoneNum: string, netID: string, location: string, destination: string; numRiders: number }
    | { directive: "ACCEPT_RIDE" }
    | { directive: "CANCEL", netID: string, role: 'STUDENT' | 'DRIVER' }
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

export const handleWebSocketMessage = (ws: WebSocketServer, message: string) : void => {
    console.log(`WEBSOCKET: Received message => ${message}`);
    let input: WebSocketMessage;
    let resp;

    try {
        // convert from json into our custom websocket message type
        input = JSON.parse(message) as WebSocketMessage;
    } catch (e) {
        // we were not given an input of type WebSocketMessage
        console.log(`WEBSOCKET: Incorrect input type. Input: ${message} gave error: ${e}`);
        return;
    }

    switch (input.directive) {
        // call the correct function based on the directive
        case 'CONNECT': 
            // Connect the specific websocket to the netid specified in input
            console.log(`WEBSOCKET: User ${input.netID} connected`);
            clients.map((client) => {
                if (client.websocketInstance == ws) {
                    client.netid = input.netID;
                }
            });
            break;

        case 'SIGNIN' :
            resp = signIn(input.phoneNum, input.netID, input.role);
            // send response back to client (the student)
            sendWebSocketMessage(ws, JSON.stringify(resp));
            break;

        case 'REQUEST_RIDE' :
            resp = requestRide(input.phoneNum, input.netID, input.location, input.destination, input.numRiders);
            // send response back to client (the student)
            sendWebSocketMessage(ws, JSON.stringify(resp));
            break;

        case 'ACCEPT_RIDE' :
            resp = acceptRide();
            if ('driver' in resp && 'student' in resp) {
                const acceptResponse = resp as AcceptResponse;
                // send response back to client (the driver)
                sendWebSocketMessage(ws, JSON.stringify(acceptResponse.driver));

                // send response back to corresponding client (the student)
                sendMessageToNetid(acceptResponse.driver.netID, JSON.stringify(acceptResponse.student));
            } else {
                // the ErrorResponse case, send only to driver
                sendWebSocketMessage(ws, JSON.stringify(resp));
            }
            break;

        case 'CANCEL':
            resp = cancelRide(input.netID, input.role);
            const cancelResponse = resp as CancelResponse;
            // send response back to client (usually the student)
            sendWebSocketMessage(ws, JSON.stringify(resp.success)); 
            if (cancelResponse.otherNetId) { 
                // send response back to opposite client (the driver usually)
                // this could be the student if the driver cancels after a 5 minute wait
                sendMessageToNetid(cancelResponse.otherNetId, JSON.stringify(resp.success));
            }
            break;
        
        case 'COMPLETE' :
            resp = completeRide(input.requestid);
            // send response back to client (the driver)
            sendWebSocketMessage(ws, JSON.stringify(resp));
            break;

        case 'ADD_FEEDBACK':
            resp = addFeedback(input.rating, input.feedback, input.appOrRide);
            // send response back to client (the driver)
            sendWebSocketMessage(ws, JSON.stringify(resp));
            break;

        case 'REPORT':
            resp = report(input.netID, input.requestid, input.reason);
            // send response back to client (the driver)
            sendWebSocketMessage(ws, JSON.stringify(resp));
            break;

        case 'BLACKLIST':
            resp = blacklist(input.netID);
            // send response back to client (the driver)
            sendWebSocketMessage(ws, JSON.stringify(resp));
            break;

        case 'WAIT_TIME':
            resp = waitTime(input.requestid, input.pickupLocation, input.driverLocation);
            // send response back to client (the student)
            sendWebSocketMessage(ws, JSON.stringify(resp));
            break;

        case 'LOCATION':
            resp = location(input.id, input.latitude, input.longitude);
            if ('netID' in resp) {
                // send response to opposite client
                sendMessageToNetid(resp.netID as string, JSON.stringify(resp));
            } else {
                // send ErrorResponse back to original client
                sendWebSocketMessage(ws, JSON.stringify(resp));
            }
            break;
            
        case 'QUERY':
            resp = query(input.rideorApp, input.date, input.rating);
            // send response back to client (the driver)
            sendWebSocketMessage(ws, JSON.stringify(resp));
            break;       

        default:
            console.log(`WEBSOCKET: Unknown directive: ${input}`);
            break;
    }
}

// Send string message to a specific netid
export const sendMessageToNetid = (netID: string, message: string) : void => {
    const user = clients.find((client) => client.netid == netID);
    if (!user) {
        // we couldn't find the user!
        console.log(`WEBSOCKET: No user found with netid ${netID}`);
        return;
    }
    sendWebSocketMessage(user.websocketInstance, message);
}

// Send string message to a specific websocket instance
export const sendWebSocketMessage = (ws: WebSocketServer, message: string) : void => {
    ws.send(message);
}