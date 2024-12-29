import dotenv from "dotenv";
import {
  rideRequest,
  rideReqQueue,
  ErrorResponse,
  removeRideReq,
  AcceptResponse,
  CancelResponse,
  GeneralResponse,
  RequestRideResponse,
  WaitTimeResponse,
  LocationResponse,
  QueryResponse,
} from "./api";
dotenv.config();

/* Signs a specific student or driver into the app. Will check the users database for the specific id, 
and if it is not there, will add a new user. If the user is in the table, we need to make sure this user 
is not in the ProblematicUsers table with a blacklisted field of 1 before we return success : true.

- Takes in a json object formatted as: {
directive: "SIGNIN", phoneNum: string, netID: string, name: string, studentNum: number, role: 'STUDENT' | 'DRIVER' }.

- On error, returns the json object in the form:  { response: “ERROR”, success: false, error: string, category: “SIGNIN” }. 
- Returns a json object TO THE STUDENT in the form: { response: “SIGNIN”, success: true }. */
export const signIn = (
  phoneNum: string,
  netid: string,
  name: string,
  studentNum: number,
  role: "STUDENT" | "DRIVER"
): GeneralResponse | ErrorResponse => {
  if (!phoneNum || !netid || !role || !name || studentNum <= 0) {
    return {
      response: "ERROR",
      error: "Missing or invalid sign in details.",
      category: "SIGNIN",
    };
  }
  // TODO: check the users database for the specific id, and if it is not there, will add a new user.
  // TODO: make sure this user is not in the ProblematicUsers table with a blacklisted field of 1
  return { response: "SIGNIN", success: true };
};

/* Adds a new ride request object to the queue using the parameters given. 
Will add a new request to the database, populated with the fields passed in and a request status of 0.

- Takes in a json object with the following format: 
{ directive: "REQUEST_RIDE", phoneNum: string, netID: string, location: string, destination: string; numRiders: bigint }.

- On error, returns the json object in the form: { response: “ERROR”, success: false, error: string, category: “REQUEST_RIDE” }.
- Returns a json object TO THE STUDENT in the form: { response: “REQUEST_RIDE”, requestid: bigint }. */
export const requestRide = (
  phoneNum: string,
  netid: string,
  from: string,
  to: string,
  numRiders: number
): RequestRideResponse | ErrorResponse => {
  if (!phoneNum || !from || !to || numRiders <= 0) {
    return {
      response: "ERROR",
      error: "Missing or invalid ride request details.",
      category: "REQUEST_RIDE",
    };
  }

  // TODO: Based on the number of requests in the RideRequests table, the next requestID will be the number of requests + 1
  // for now, since there is no db, we will just use the size of the queue
  const requestid = rideReqQueue.size() + 1;

  // TODO: add a new request to the database, populated with the fields passed in and a request status of 0
  // on error, return { success: false, error: 'Error adding ride request to the database.'};

  // we also want to keep the requests locally in the server queue, but without too much information
  const newRideReq: rideRequest = { requestid, netid };
  rideReqQueue.add(newRideReq);
  return { response: "REQUEST_RIDE", requestid };
};

/* Pops the next ride request in the queue and assigns it to the driver. 
This call will update the database to add the driver id to the specific request 
and change the status of the request to 1 (accepted). 

- Takes in a json object in the form { directive: "ACCEPT_RIDE" }.
- On error, returns the json object in the form:  { response: “ERROR”, success: false, error: string, category: “ACCEPT_RIDE” }.
- Returns a json object in the form: 
{ student: { response: "ACCEPT_RIDE", success: true }, 
 driver: { response: "ACCEPT_RIDE", netID: string, location: string, destination: string, numRiders: number, requestid: number }}
Where the object that should be returned TO THE STUDENT is in the form: { response: "ACCEPT_RIDE", success: true }
and the object that should be returned TO THE DRIVER is in the format: 
{ response: "ACCEPT_RIDE", netID: string, location: string, destination: string, numRiders: number, requestid: number } */
export const acceptRide = (): AcceptResponse | ErrorResponse => {
  if (!rideReqQueue.peek()) {
    return {
      response: "ERROR",
      error: "No ride requests in the queue.",
      category: "ACCEPT_RIDE",
    };
  }

  // get the next request in the queue
  const nextRide = rideReqQueue.pop() as rideRequest;
  // TODO: look up the request in the database
  // TODO: update the request in database to add the driver id and change the status of the request to 1 (accepted)
  // if there is an error, return { success: false, error: 'Error accepting ride request.'};

  return {
    student: { response: "ACCEPT_RIDE", success: true },
    driver: {
      response: "ACCEPT_RIDE",
      netid: nextRide.netid,
      location: "DUMMY",
      destination: "DUMMY",
      numRiders: 100,
      requestid: nextRide.requestid,
    },
  };
};

/* Allows the student to cancel a ride and updates the server and notifies the user. 
This route will also be called when the (STUDENT OR DRIVER) websocket is disconnected 
and there is a request stored locally on the client. This route will look through all 
the ride requests made by this specific user in the database and will change any active 
(status: 0 or 1) request to canceled (status: -1). It will also remove any active requests 
from the local server request queue.

For the driver to “cancel” a ride, it will happen after the driver has arrived at the 
pickup location and the student never showed up. It will call cancelRide, 
where we would get the driverId and look in the database for the driverId and 
any accepted rides under that driverId. Then we will change any active (status: 1) 
request to canceled (status: -1). We’re assuming that there will never be a case in the 
database where the activity status is 0 and the ride request has a driver id connected to that ride request.

In the case that a request has a status of 1, we want to notify the corresponding driver or student. 
This is done by returning their netid under otherNetId.

- Takes in a json object in the form: { directive: "CANCEL", netid: string }.
- On error, returns the json object in the form: 
{ response: “ERROR”, success: false, error: string, category: “CANCEL” }.
- Returns a json object in the format: { info: { response: "CANCEL", success: true }, otherNetId?: string }
Where the object that should be returned  TO THE STUDENT is in the format: { response: "CANCEL", success: true }
And if there driver needs to be notified, the json object returned TO THE DRIVER is in the format: 
{ response: "CANCEL", success: true } */
export const cancelRide = (
  netid: string,
  role: "STUDENT" | "DRIVER"
): CancelResponse | ErrorResponse => {
  if (!netid) {
    return {
      response: "ERROR",
      error: "Missing required fields.",
      category: "CANCEL",
    };
  }

  let status: "0 or 1" | "1";
  if (role === "STUDENT") {
    // get rid of any pending requests in the local queue that have the same netid
    removeRideReq(netid);
    // look from either accepted or pending requests
    status = "0 or 1";
  } else {
    // for drivers, we only want to look for requests with a status of 1 (accepted)
    // since drivers will only be attached to accepted requests
    status = "1";
  }

  // TODO: look through all the ride requests made by this specific user using the status
  // TODO: change any active (based on status) request to canceled (status: -1)

  // TODO: if a request has a status of 1, notify the corresponding driver
  const accepted = false; // dummy value
  if (accepted) {
    // TODO: figure out what driver to sent to from the ride request
    return { info: { response: "CANCEL", success: true }, otherNetid: "DUMMY" };
  }

  // TODO: if there is an error, return { success: false, error: 'Error canceling ride request.'};

  // no driver specified in this pending request case!
  return { info: { response: "CANCEL", success: true } };
};

/* Once a ride is finished, the driver will set that specific request status to 2 in the database. 
(Both the student and driver will still get a notification that the ride is completed)

- Takes in a json object in the form: { directive: "COMPLETE", requestid: bigint }.

- On error, returns the json object in the form: 
{ response: “ERROR”, success: false, error: string, category: “COMPLETE” }.
- Returns a json object TO THE DRIVER in the format: { response: “COMPLETE”, success: true } */
export const completeRide = (
  requestid: number
): GeneralResponse | ErrorResponse => {
  if (!requestid) {
    return {
      response: "ERROR",
      error: "Missing required fields.",
      category: "COMPLETE",
    };
  }
  // TODO: set the specific request status to 2 in the database
  // if there is an error, return { success: false, error: 'Error completing ride request.'};
  return { response: "COMPLETE", success: true };
};

/* The student can give us feedback on a specific ride they just took. 
This feedback is added to the Feedback table using the fields passed in. Feedback is anonymous. 

- Takes in: { directive: "ADD_FEEDBACK”, rating: bigint, feedback: string, appOrRide: bigint (1 or 0) }

- On error, returns the json object in the form: { response: “ERROR”, success: false, error: string, category: “ADD_FEEDBACK” }.
- Returns a json object TO THE STUDENT in the format: { response: “ADD_FEEDBACK”, success: true } */
export const addFeedback = (
  rating: number,
  feedback: string,
  appOrRide: 0 | 1
): GeneralResponse | ErrorResponse => {
  if (!rating || !feedback || !appOrRide) {
    return {
      response: "ERROR",
      error: "Missing required fields.",
      category: "ADD_FEEDBACK",
    };
  }
  // TODO: add feedback to the Feeback table using the fields passed in
  // if there is an error, return { success: false, error: 'Error adding feedback to the database.'};
  return { response: "ADD_FEEDBACK", success: true };
};

/* Driver needs to be able to report a specific student they just dropped off for bad behavior. 
This will add a new student entry to the ProblematicUsers table with a blacklisted field of 0.
- Takes in: { directive: "REPORT”, netID: string, requestid: string, reason: string }

- On error, returns the json object in the form: { response: “ERROR”, success: false, error: string, category: “REPORT” }.
- Returns a json object TO THE DRIVER in the format: { response: “REPORT”, success: true } */
export const report = (
  netid: string,
  requestid: string,
  reason: string
): GeneralResponse | ErrorResponse => {
  if (!netid || !requestid || !reason) {
    return {
      response: "ERROR",
      error: "Missing required fields.",
      category: "REPORT",
    };
  }
  // TODO: add a new student entry to the ProblematicUsers table with a blacklisted field of 0
  // if there is an error, return { success: false, error: 'Error reporting student.'};
  return { response: "REPORT", success: true };
};

/* UWPD needs to be able to manually blacklist a specific student they’ve reported. 
Will use netid to modify the ‘ProblematicUsers’ table so that the blacklisted field is 1.

- Takes in: { directive: "BLACKLIST”, netID: string }

- On error, returns the json object in the form: 
{ response: “ERROR”, success: false, error: string, category: “BLACKLIST” }.
- Returns a json object TO THE DRIVER in the format: { response: “BLACKLIST”, success: true } */
export const blacklist = (netid: string): GeneralResponse | ErrorResponse => {
  if (!netid) {
    return {
      response: "ERROR",
      error: "Missing required fields.",
      category: "BLACKLIST",
    };
  }
  // TODO: modify the ‘ProblematicUsers’ table so that the blacklisted field is 1
  // if there is an error, return { success: false, error: 'Error blacklisting student.'};
  return { response: "BLACKLIST", success: true };
};

/* A specific user needs to know when approximately the driver will accept their ride.

Once the request has been accepted, we will start calling GetUserLocation from 
BOTH the student and driver to display those locations on the map. This means that 
we can tell if a request has been accepted based on if we have the location information of 
the opposite user. We will use that information in this route (accepted or not) to calculate the wait time. 
In the case that the request is not yet accepted, none of the optional fields 
(pickupLocation and driverLocation) will be passed in. 

Wait time will be the requestid’s position in the local server queue * 15 minutes.
If the user’s request has been accepted, both pickupLocation and driverLocation will be passed in. 
Wait time will be the ETA of the corresponding driverid to the user’s pick up location. 
We do this by calculating the ETA from driverLocation to pickupLocation.

- Takes in: { directive: "WAIT_TIME”, requestid: bigint, pickupLocation?: 
    [ latitude: number, longitude: number ], driverLocation?: [ latitude: number, longitude: number ] }

    - On error, returns the json object in the form: { response: “ERROR”, success: false, error: string, category: “WAIT_TIME” }.
- Returns a json object TO THE STUDENT in the format: { response: “WAIT_TIME”, waitTime: bigint //in minutes }	
 */
export const waitTime = (
  requestid: number,
  pickupLocation?: [latitude: number, longitude: number],
  driverLocation?: [latitude: number, longitude: number]
): WaitTimeResponse | ErrorResponse => {
  if (!requestid) {
    return {
      response: "ERROR",
      error: "Missing required fields.",
      category: "WAIT_TIME",
    };
  }
  let ETA = 0;
  // if the request has been accepted, both pickupLocation and driverLocation will be passed in
  // calculate the ETA from driverLocation to pickupLocation
  if (pickupLocation && driverLocation) {
    // TODO: calculate the ETA from driverLocation to pickupLocation
    ETA = 100; // dummy value
  } else {
    // else if the request has not been accepted,
    // wait time will be the requestid’s position in the local server queue * 15 minutes
    const index = rideReqQueue
      .get()
      .findIndex((request) => request.requestid === requestid);
    if (index === -1) {
      return {
        response: "ERROR",
        error: "Request not found in the queue.",
        category: "WAIT_TIME",
      };
    }
    ETA = index * 15;
  }
  return { response: "WAIT_TIME", waitTime: ETA };
};

/* We need to know where either the student or driver is at any given time to update map ui. 
On refresh, each user will send its own location to the websocket, which will pass that 
information to the opposite user (student → driver, driver → student).

- Takes in: { directive: "LOCATION”, id: string, latitude: number, longitude: number }

- On error, returns the json object in the form: { response: “ERROR”, success: false, error: string, category: “LOCATION” }.
- Returns a json object TO THE OPPOSITE USER (STUDENT OR DRIVER) in the format: 
{ response: “LOCATION”, netid: string, latitude: number, longitude: number } where netid is the id of the opposite user. */

// TODO: THIS MAY NOT NEED TO BE A FUNCTION AND CAN BE HANDLED IN THE WEBSOCKET??
export const location = (
  id: string,
  latitude: number,
  longitude: number
): LocationResponse | ErrorResponse => {
  if (!id || !latitude || !longitude) {
    return {
      response: "ERROR",
      error: "Missing required fields.",
      category: "LOCATION",
    };
  }
  // TODO: Look for an accepted request with the netid passed in and extract the opposite user netid
  // pass the location information to the opposite user
  return { response: "LOCATION", netid: "DUMMY", latitude, longitude };
};

/* We need to get some basic stats about our current feedback table back to the client. 
The types of canned queries we will return are: number of feedback entries, filter ride or app feedback, 
all feedback from a date, all feedback from a specific rating.

- Takes in: { directive: "QUERY”, rideorApp?: bigint // 0 for ride, 1 for app, default: query both, date?: Date, rating?: bigint }
- On error, returns the json object in the form: { response: “ERROR”, success: false, error: string, category: “QUERY” }.
- Returns a json object TO THE DRIVER in the format: 
{ response: “QUERY”, numberOfEntries: bigint, feedback: [ { rating: bigint, textFeeback: string } ] } */
export const query = (
  rideorApp?: 0 | 1,
  date?: Date,
  rating?: number
): QueryResponse | ErrorResponse => {
  // TODO: get some basic stats about our current feedback table back to the client
  // types of canned queries we will return are: number of feedback entries,
  // filter ride or app feedback, all feedback from a date, all feedback from a specific rating
  return { response: "QUERY", numberOfEntries: 0, feedback: [] };
};
