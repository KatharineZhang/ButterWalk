import WebSocketServer from "ws";
import { clients, refreshClient } from "./index";
import {
  addFeedback,
  blacklist,
  cancelRide,
  completeRide,
  snapLocation,
  location,
  query,
  report,
  requestRide,
  signIn,
  finishAccCreation,
  waitTime,
  googleAuth,
  profile,
  distanceMatrix,
  ridesExist,
  viewRide,
  handleDriverViewChoice,
  driverArrived,
  getPlaceSearchResults,
  driverDrivingToDropoff,
  checkIfDriverSignin,
} from "./routes";
import {
  CompleteResponse,
  WebSocketMessage,
  WebSocketResponse,
  GoogleResponse,
  ErrorResponse,
  RideRequest,
  SnapLocationResponse,
  ViewDecisionResponse,
  RequestRideResponse,
  RidesExistResponse,
  ViewRideRequestResponse,
  WrapperCancelResponse,
} from "./api";
import { Timestamp } from "firebase/firestore";

export const handleWebSocketMessage = async (
  ws: WebSocketServer,
  message: string
): Promise<void> => {
  let input: WebSocketMessage;
  let resp;
  let client;

  //TODO(connor): setup debug and logging utility so this can be compiled away in prod
  console.log(`WEBSOCKET: Received message => ${message}`);

  try {
    // convert from json into our custom websocket message type
    input = JSON.parse(message) as WebSocketMessage;
  } catch (e) {
    // we were not given an input of type WebSocketMessage
    console.log(
      `WEBSOCKET: Incorrect input type. Input: ${message} gave error: ${(e as Error).message}}`
    );
    return;
  }

  switch (input.directive) {
    case "CONNECT":
      // TODO: REMOVE THIS ONCE BYPASS SIGNIN IS REMOVED
      // connect the websocket to a specific netid to send messages to
      connectWebsocketToNetid(ws, input.netid, input.role);
      break;
    case "DISCONNECT":
      // the user is signing out
      // cancel any rides by this client if they close the app or signout
      client = clients.find((client) => client.websocketInstance == ws);
      if (client) {
        handleWebSocketMessage(
          ws,
          JSON.stringify({
            directive: "CANCEL",
            netid: client.netid,
            role: client.role,
          })
        );
      }
      // "remove" the client from the list by nullifying netid and role
      refreshClient(ws);
      break;

    case "SIGNIN": {
      if (input.response == null) {
        // we do not have an auth token to process
        // check if this was sent from a driver
        resp = await checkIfDriverSignin(input.role, input.netid);
        if (input.netid && resp.response == "SIGNIN" && resp.success) {
          // if there was a driverid passed in (to make typescript happy)
          // and verification was successful
          // connect the websocket to this driver
          connectWebsocketToNetid(ws, input.netid, "DRIVER");
        }
      } else {
        // the student is signing in with google auth
        // call google auth method
        const authResp: GoogleResponse = await googleAuth(input.response);
        if ("userInfo" in authResp) {
          // successfull google signin!
          const userInfo = authResp.userInfo;

          // connect to webocket
          const netid = userInfo.email.replace("@uw.edu", "");
          connectWebsocketToNetid(ws, netid, input.role);

          // call signin and set the response to whatever signin returned
          resp = await signIn(
            netid,
            userInfo.given_name,
            userInfo.family_name,
            input.role
          );
        } else {
          // authResp is GoogleResponse's error subtype
          // return its error message the response
          resp = {
            response: "ERROR",
            error: authResp.message,
            category: "SIGNIN",
          } as ErrorResponse;
        }
      }
      // send response back to client (the student)
      sendWebSocketMessage(ws, resp);
      break;
    }
    case "FINISH_ACC":
      resp = await finishAccCreation(
        input.netid,
        input.preferredName,
        input.phoneNum,
        input.studentNum
      );
      sendWebSocketMessage(ws, resp);
      break;

    case "REQUEST_RIDE": {
      const rideRequest: RideRequest = {
        netid: input.netid,
        driverid: null,
        requestedAt: Timestamp.now(),
        completedAt: null,
        locationFrom: input.location,
        locationTo: input.destination,
        numRiders: input.numRiders,
        status: "REQUESTED",
        studentLocation: {
          coords: input.studentLocation,
          lastUpdated: Timestamp.now(),
        },
        driverLocation: {
          coords: { latitude: 0, longitude: 0 },
          lastUpdated: null,
        },
      };
      resp = await requestRide(rideRequest);
      if (resp.response == "REQUEST_RIDE") {
        const requestResp = resp as RequestRideResponse;
        if (requestResp.notifyDrivers) {
          notifyDrivers(true);
        }
      }
      // send response back to client (the student)
      sendWebSocketMessage(ws, resp);
      break;
    }

    case "SNAP": {
      resp = (await snapLocation(
        input.currLat,
        input.currLong
      )) as SnapLocationResponse;
      sendWebSocketMessage(ws, resp);
      break;
    }

    // new directive for the ride request broker, which sends back a message
    // of type RidesExistResponse on success. Intended for use with driver
    // sign on: When the driver opens the app they will only be able to view
    // a ride to potentially accept when this directive gives back True.
    case "RIDES_EXIST": {
      const thereIsARide: boolean | ErrorResponse = await ridesExist();
      if (typeof thereIsARide === "boolean") {
        sendWebSocketMessage(ws, {
          response: "RIDES_EXIST",
          ridesExist: thereIsARide,
        });
      } else {
        sendWebSocketMessage(ws, thereIsARide);
      }
      break;
    }

    // new directive that will check out the highest ranking ride request to
    // a driver so they can accept/deny/report etc.
    case "VIEW_RIDE": {
      const res = await viewRide(input.driverid, input.driverLocation);
      if (res.response == "VIEW_RIDE") {
        const viewResp = res as ViewRideRequestResponse;

        // if we want to notify drivers
        if (viewResp.notifyDrivers) {
          // tell the drivers that there are no more rides
          // but don't notify this accepting driver
          notifyDrivers(false, input.driverid);
        }
      }
      sendWebSocketMessage(ws, res);
      break;
    }

    // new directive that handles the drivers decision after viewing a particular ride
    // request.
    // ACCEPT -> accept the ride. Assigns the ride to the driver, begin pick up.
    // DENY -> Deny the ride request without reporting, returns the req to the pool
    // TIMEOUT -> Driver didn't decide anything fast enough, return to pool
    // ERROR -> Unexpected problem, return request to queue
    case "VIEW_DECISION": {
      console.log(`here is the input: ${JSON.stringify(input)}`);
      if (
        input.decision !== "ACCEPT" &&
        input.decision !== "DENY" &&
        input.decision !== "ERROR" &&
        input.decision !== "TIMEOUT"
      ) {
        throw new Error(
          `input.decsion was ${input.decision}, not a legal type.`
        );
      }
      const res = await handleDriverViewChoice(
        input.driverid,
        input.netid,
        input.decision
      );
      if (res.response == "ERROR") {
        sendWebSocketMessage(ws, res);
      } else {
        const viewDecisionResponse = res as ViewDecisionResponse;
        sendWebSocketMessage(ws, viewDecisionResponse.driver);

        // if there is a message to send to the student, send it
        if (viewDecisionResponse.student !== undefined) {
          sendMessageToNetid(input.netid, viewDecisionResponse.student);
        }

        // this will only be true if we are re-adding the ride back into the pool
        // if we accept, we had already removed the ride from the queue in VIEW_RIDE so no notification needed
        // the pool was initially empty, so we need to notify drivers
        if (viewDecisionResponse.notifyDrivers) {
          notifyDrivers(true);
        }
      }
      break;
    }

    case "DRIVER_ARRIVED_AT_PICKUP": {
      const res = await driverArrived(input.studentNetid);
      sendWebSocketMessage(ws, res);
      if (res.response == "DRIVER_ARRIVED_AT_PICKUP" && res.success) {
        sendMessageToNetid(input.studentNetid, res);
      }
      break;
    }

    case "DRIVER_DRIVING_TO_DROPOFF": {
      const res = await driverDrivingToDropoff(input.studentNetid);
      sendWebSocketMessage(ws, res);
      if (res.response == "DRIVER_DRIVING_TO_DROPOFF" && res.success) {
        sendMessageToNetid(input.studentNetid, res);
      }
      break;
    }

    case "CANCEL":
      resp = await cancelRide(input.netid, input.role);
      if ("info" in resp) {
        // if there is info, we know it is a CancelResponse
        const cancelResponse = resp as WrapperCancelResponse;
        // send response back to client (usually the student)
        sendWebSocketMessage(ws, cancelResponse.info);
        if (cancelResponse.otherNetid) {
          // send response back to opposite client (the driver usually)
          // this could be the student if the driver cancels after a 5 minute wait
          sendMessageToNetid(cancelResponse.otherNetid, cancelResponse.info);
        }
        // if we want to notify drivers
        if (cancelResponse.notifyDrivers) {
          // tell the drivers that rides don't exist (false)
          notifyDrivers(false);
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
      if ("response" in resp && resp.response === "COMPLETE") {
        const completeResponse = resp as CompleteResponse;
        // send message to both the student and driver
        sendMessageToNetid(
          completeResponse.netids.student,
          completeResponse.info
        );
        sendMessageToNetid(
          completeResponse.netids.driver,
          completeResponse.info
        );
      } else {
        // the ErrorResponse case, send only to original client
        sendWebSocketMessage(ws, resp);
      }
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
        input.requestedRide,
        input.requestid,
        input.driverLocation
      );
      // send response back to client (the student)
      sendWebSocketMessage(ws, resp);
      break;

    case "LOCATION":
      resp = await location(
        input.id,
        input.role,
        input.latitude,
        input.longitude
      );
      if ("netid" in resp) {
        // send response to opposite client
        sendMessageToNetid(resp.netid as string, resp);
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

    case "PROFILE":
      resp = await profile(input.netid);
      // send response back to client (the student)
      sendWebSocketMessage(ws, resp);
      break;

    case "DISTANCE":
      resp = await distanceMatrix(
        input.origin,
        input.destination,
        input.mode,
        input.tag
      );
      // send response back to client (the student)
      sendWebSocketMessage(ws, resp);
      break;

    case "PLACE_SEARCH":
      resp = await getPlaceSearchResults(input.query);
      // send response back to client (the student)
      sendWebSocketMessage(ws, resp);
      break;

    default:
      console.log(`WEBSOCKET: Unknown directive: ${JSON.stringify(input)}`);
      break;
  }
};

// == Helper functions ==

// Send message to a specific netid
export const sendMessageToNetid = (
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

export const connectWebsocketToNetid = (
  ws: WebSocketServer,
  netid: string,
  role: "STUDENT" | "DRIVER"
) => {
  clients.map((client) => {
    if (client.websocketInstance == ws) {
      client.netid = netid;
      client.role = role;
    }
  });
};

/**
 * Notifies all currently connected drivers about the existence/lack of rides.
 * Sends a `RIDES_EXIST` response message to each driver, indicating whether rides are available.
 *
 * @param ridesExist - A boolean indicating if rides currently exist.
 * @param excludeNetid - the driver who triggered this notification will not receive it.
 */
export const notifyDrivers = (
  ridesExist: boolean,
  excludeNetid?: string
): void => {
  // the message sent to each driver is that rides exist (or don't)
  const message: RidesExistResponse = {
    response: "RIDES_EXIST",
    ridesExist,
  };

  // find all the drivers currently connected to the app
  let drivers = clients.filter((client) => client.role == "DRIVER");
  console.log(
    `WEBSOCKET: Notifying ${JSON.stringify(drivers)} drivers about ride existence: ${ridesExist}`
  );

  // if we want to exclude a netid, remove them from the list
  if (excludeNetid) {
    // keep everyone who is NOT excludeNetid
    drivers = drivers.filter((client) => client.netid != excludeNetid);
    console.log(
      `WEBSOCKET: UPDATED Notifying ${JSON.stringify(drivers)} drivers about ride existence: ${ridesExist}`
    );
  }

  // send each of them a message
  drivers.forEach((driver) => {
    sendMessageToNetid(driver.netid, message);
  });
};
