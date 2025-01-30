import WebSocketServer from "ws";
import { clients } from "./index";
import {
  acceptRide,
  addFeedback,
  blacklist,
  cancelRide,
  completeRide,
  location,
  query,
  report,
  requestRide,
  signIn,
  waitTime,
} from "./routes";
import {
  AcceptResponse,
  CancelResponse,
  WebSocketMessage,
  WebSocketResponse,
} from "./api";

export const handleWebSocketMessage = async (
  ws: WebSocketServer,
  message: string
): Promise<void> => {
  let input: WebSocketMessage;
  let resp;

  console.log(`WEBSOCKET: Received message => ${message}`);

  try {
    // convert from json into our custom websocket message type
    input = JSON.parse(message) as WebSocketMessage;
  } catch (e) {
    // we were not given an input of type WebSocketMessage
    console.log(
      `WEBSOCKET: Incorrect input type. Input: ${message} gave error: ${e}`
    );
    return;
  }

  switch (input.directive) {
    // call the correct function based on the directive
    case "CONNECT":
      // Connect the specific websocket to the netid specified in input
      console.log(`WEBSOCKET: User ${input.netid} connected`);
      clients.map((client) => {
        if (client.websocketInstance == ws) {
          client.netid = input.netid;
        }
      });
      break;

    case "SIGNIN":
      resp = await signIn(
        input.netid,
        input.name,
        input.phoneNum,
        input.studentNum,
        input.role
      );
      // send response back to client (the student)
      sendWebSocketMessage(ws, resp);
      break;

    case "REQUEST_RIDE":
      resp = await requestRide(
        input.phoneNum,
        input.netid,
        input.location,
        input.destination,
        input.numRiders
      );
      // send response back to client (the student)
      sendWebSocketMessage(ws, resp);
      break;

    case "ACCEPT_RIDE":
      resp = await acceptRide(input.driverid);
      if ("driver" in resp && "student" in resp) {
        const acceptResponse = resp as AcceptResponse;
        // send response back to client (the driver)
        sendWebSocketMessage(ws, acceptResponse.driver);

        // send response back to corresponding client (the student)
        sendMessageToNetidnetid(
          acceptResponse.driver.netid,
          acceptResponse.student
        );
      } else {
        // the ErrorResponse case, send only to driver
        sendWebSocketMessage(ws, resp);
      }
      break;

    case "CANCEL":
      resp = await cancelRide(input.netid, input.role);
      if ("info" in resp) {
        // if there is info, we know it is a CancelResponse
        const cancelResponse = resp as CancelResponse;
        // send response back to client (usually the student)
        sendWebSocketMessage(ws, cancelResponse.info);
        if (cancelResponse.otherNetid) {
          // send response back to opposite client (the driver usually)
          // this could be the student if the driver cancels after a 5 minute wait
          sendMessageToNetidnetid(
            cancelResponse.otherNetid,
            cancelResponse.info
          );
        }
      } else {
        // the ErrorResponse case, send only to original client
        sendWebSocketMessage(ws, resp);
      }
      break;

    case "COMPLETE":
      resp = await completeRide(input.requestid);
      // send response back to client (the driver)
      sendWebSocketMessage(ws, resp);
      break;

    case "ADD_FEEDBACK":
      resp = await addFeedback(input.rating, input.feedback, input.rideOrApp);
      // send response back to client (the driver)
      sendWebSocketMessage(ws, resp);
      break;

    case "REPORT":
      resp = await report(input.netid, input.requestid, input.reason);
      // send response back to client (the driver)
      sendWebSocketMessage(ws, resp);
      break;

    case "BLACKLIST":
      resp = await blacklist(input.netid);
      // send response back to client (the driver)
      sendWebSocketMessage(ws, resp);
      break;

    case "WAIT_TIME":
      resp = await waitTime(
        input.requestid,
        input.pickupLocation,
        input.driverLocation
      );
      // send response back to client (the student)
      sendWebSocketMessage(ws, resp);
      break;

    case "LOCATION":
      resp = await location(input.id, input.latitude, input.longitude);
      if ("netid" in resp) {
        // send response to opposite client
        sendMessageToNetidnetid(resp.netid as string, resp);
      } else {
        // send ErrorResponse back to original client
        sendWebSocketMessage(ws, resp);
      }
      break;

    case "QUERY":
      resp = await query(input.rideOrApp, input.date, input.rating);
      // send response back to client (the driver)
      sendWebSocketMessage(ws, resp);
      break;

    default:
      console.log(`WEBSOCKET: Unknown directive: ${input}`);
      break;
  }
};

// == Helper functions ==

// Send message to a specific netid
export const sendMessageToNetidnetid = (
  netid: string,
  message: WebSocketResponse
): void => {
  const user = clients.find((client) => client.netid == netid);
  if (!user) {
    // we couldn't find the user!
    console.log(`WEBSOCKET: No user found with netid ${netid}`);
    return;
  }
  sendWebSocketMessage(user.websocketInstance, message);
};

// Send string message to a specific websocket instance
export const sendWebSocketMessage = (
  ws: WebSocketServer,
  message: WebSocketResponse
): void => {
  ws.send(JSON.stringify(message));
};
