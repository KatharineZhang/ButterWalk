import dotenv from "dotenv";
import {
  localRideRequest,
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
  RideRequest,
  Feedback,
  ProblematicUser,
} from "./api";
import {
  acceptRideRequest,
  addFeedbackToDb,
  addProblematic,
  addRideRequest,
  blacklistUser,
  cancelRideRequest,
  completeRideRequest,
  createUser,
  getOtherNetId,
  isProblematic,
  queryFeedback,
} from "./firebaseActions";
dotenv.config();

/* Signs a specific student or driver into the app. Will check the users database for the specific id, 
and if it is not there, will add a new user. If the user is in the table, we need to make sure this user 
is not in the ProblematicUsers table with a blacklisted field of 1 before we return success : true.

- Takes in a json object formatted as: {
directive: "SIGNIN", phoneNum: string, netID: string, name: string, studentNum: number, role: 'STUDENT' | 'DRIVER' }.

- On error, returns the json object in the form:  { response: “ERROR”, success: false, error: string, category: “SIGNIN” }. 
- Returns a json object TO THE STUDENT in the form: { response: “SIGNIN”, success: true }. */
export const signIn = async (
  netid: string,
  name: string,
  phone_number: string,
  student_number: string,
  student_or_driver: 0 | 1
): Promise<GeneralResponse | ErrorResponse> => {
  if (!phone_number || !netid || !name || !student_number) {
    return {
      response: "ERROR",
      error: "Missing or invalid sign in details.",
      category: "SIGNIN",
    };
  }
  // TODO: Email (and phone number?) validation
  // make sure this user is not in the ProblematicUsers table with a blacklisted field of 1
  if (await isProblematic(netid)) {
    return {
      response: "ERROR",
      error: `${netid} is blacklisted.`,
      category: "SIGNIN",
    };
  }
  // else, try to make user entry
  try {
    await createUser({
      netid,
      name,
      phone_number,
      student_number,
      student_or_driver,
    });
    return { response: "SIGNIN", success: true };
  } catch (e) {
    return {
      response: "ERROR",
      error: `Error adding user to database: ${e}.`,
      category: "SIGNIN",
    };
  }
};

/* Adds a new ride request object to the queue using the parameters given. 
Will add a new request to the database, populated with the fields passed in and a request status of 0.

- Takes in a json object with the following format: 
{ directive: "REQUEST_RIDE", phoneNum: string, netID: string, location: string, destination: string; numRiders: bigint }.

- On error, returns the json object in the form: { response: “ERROR”, success: false, error: string, category: “REQUEST_RIDE” }.
- Returns a json object TO THE STUDENT in the form: { response: “REQUEST_RIDE”, requestid: string }. */
export const requestRide = async (
  phoneNum: string,
  netid: string,
  from: string,
  to: string,
  numRiders: number
): Promise<RequestRideResponse | ErrorResponse> => {
  if (!phoneNum || !from || !to || numRiders <= 0) {
    return {
      response: "ERROR",
      error: "Missing or invalid ride request details.",
      category: "REQUEST_RIDE",
    };
  }

  // add a new request to the database, populated with the fields passed in and a request status of 0
  // on error, return { success: false, error: 'Error adding ride request to the database.'};
  let requestid;
  try {
    requestid = await addRideRequest(netid, from, to, numRiders);
  } catch (e) {
    return {
      response: "ERROR",
      error: `Error adding ride request to the database: ${e}`,
      category: "REQUEST_RIDE",
    };
  }

  // we also want to keep the requests locally in the server queue, but without too much information
  const newRideReq: localRideRequest = { requestid, netid };
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
 driver: { response: "ACCEPT_RIDE", netID: string, location: string, destination: string, numRiders: number, requestid: string }}
Where the object that should be returned TO THE STUDENT is in the form: { response: "ACCEPT_RIDE", success: true }
and the object that should be returned TO THE DRIVER is in the format: 
{ response: "ACCEPT_RIDE", netID: string, location: string, destination: string, numRiders: number, requestid: string } */
export const acceptRide = async (
  driverid: string
): Promise<AcceptResponse | ErrorResponse> => {
  if (!rideReqQueue.peek()) {
    return {
      response: "ERROR",
      error: "No ride requests in the queue.",
      category: "ACCEPT_RIDE",
    };
  }

  // get the next request in the queue
  const nextRide = rideReqQueue.pop() as localRideRequest;
  // update the request in database to add the driver id and change the status of the request to 1 (accepted)
  // if there is an error, return { success: false, error: 'Error accepting ride request.'};
  try {
    const req: RideRequest = await acceptRideRequest(
      nextRide.requestid,
      driverid
    );
    return {
      student: { response: "ACCEPT_RIDE", success: true },
      driver: {
        response: "ACCEPT_RIDE",
        netid: nextRide.netid,
        location: req.locationFrom,
        destination: req.locationTo,
        numRiders: req.numRiders,
        requestid: nextRide.requestid,
      },
    };
  } catch (e) {
    return {
      response: "ERROR",
      error: `Error accepting ride request: ${e}`,
      category: "ACCEPT_RIDE",
    };
  }
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
export const cancelRide = async (
  netid: string,
  role: 0 | 1
): Promise<CancelResponse | ErrorResponse> => {
  if (!netid) {
    return {
      response: "ERROR",
      error: "Missing required fields.",
      category: "CANCEL",
    };
  }

  if (role === 0) {
    // get rid of any pending requests in the local queue that have the same netid
    removeRideReq(netid);
  }

  try {
    const driverid = await cancelRideRequest(netid, role);
    if (driverid && netid != driverid) {
      // since drivers can also cancel rides, it makes no sense to notify
      // the person who canceled AND the driver of the request because they are the same person
      return {
        info: { response: "CANCEL", success: true },
        otherNetid: driverid,
      };
    }
    // no driver specified in this pending request case!
    return { info: { response: "CANCEL", success: true } };
  } catch (e) {
    // if there is an error, return { success: false, error: 'Error canceling ride request.'};
    return {
      response: "ERROR",
      error: `Error canceling ride request: ${e}`,
      category: "CANCEL",
    };
  }
};

/* Once a ride is finished, the driver will set that specific request status to 2 in the database. 
(Both the student and driver will still get a notification that the ride is completed)

- Takes in a json object in the form: { directive: "COMPLETE", requestid: string }.

- On error, returns the json object in the form: 
{ response: “ERROR”, success: false, error: string, category: “COMPLETE” }.
- Returns a json object TO THE DRIVER in the format: { response: “COMPLETE”, success: true } */
export const completeRide = async (
  requestid: string
): Promise<GeneralResponse | ErrorResponse> => {
  if (!requestid) {
    return {
      response: "ERROR",
      error: "Missing required fields.",
      category: "COMPLETE",
    };
  }
  // set the specific request status to 2 in the database
  // if there is an error, return { success: false, error: 'Error completing ride request.'};
  try {
    await completeRideRequest(requestid);
    return { response: "COMPLETE", success: true };
  } catch (e) {
    // if there is an error, return { success: false, error: 'Error completing ride request.'};
    return {
      response: "ERROR",
      error: `Error completing ride request: ${e}`,
      category: "COMPLETE",
    };
  }
};

/* The student can give us feedback on a specific ride they just took. 
This feedback is added to the Feedback table using the fields passed in. Feedback is anonymous. 

- Takes in: { directive: "ADD_FEEDBACK”, rating: bigint, feedback: string, appOrRide: bigint (1 or 0) }

- On error, returns the json object in the form: { response: “ERROR”, success: false, error: string, category: “ADD_FEEDBACK” }.
- Returns a json object TO THE STUDENT in the format: { response: “ADD_FEEDBACK”, success: true } */
export const addFeedback = async (
  rating: number,
  textFeedback: string,
  rideOrApp: 0 | 1
): Promise<GeneralResponse | ErrorResponse> => {
  if (!rating || !textFeedback || !rideOrApp) {
    return {
      response: "ERROR",
      error: "Missing required fields.",
      category: "ADD_FEEDBACK",
    };
  }
  const feedback: Feedback = {
    rating,
    textFeedback,
    rideOrApp,
  };
  try {
    // add feedback to the Feeback table using the fields passed in
    await addFeedbackToDb(feedback);
  } catch (e) {
    // if there is an error, return { success: false, error: 'Error adding feedback to the database.'};
    return {
      response: "ERROR",
      error: `Error adding feedback to the database: ${e}`,
      category: "ADD_FEEDBACK",
    };
  }
  return { response: "ADD_FEEDBACK", success: true };
};

/* Driver needs to be able to report a specific student they just dropped off for bad behavior. 
This will add a new student entry to the ProblematicUsers table with a blacklisted field of 0.
- Takes in: { directive: "REPORT”, netID: string, requestid: string, reason: string }

- On error, returns the json object in the form: { response: “ERROR”, success: false, error: string, category: “REPORT” }.
- Returns a json object TO THE DRIVER in the format: { response: “REPORT”, success: true } */
export const report = async (
  netid: string,
  requestid: string,
  reason: string
): Promise<GeneralResponse | ErrorResponse> => {
  if (!netid || !requestid || !reason) {
    return {
      response: "ERROR",
      error: "Missing required fields.",
      category: "REPORT",
    };
  }
  // add a new student entry to the ProblematicUsers table with a blacklisted field of 0
  const problem: ProblematicUser = {
    netid,
    requestid,
    reason,
    blacklisted: 0,
  };

  try {
    await addProblematic(problem);
    return { response: "REPORT", success: true };
  } catch (error) {
    // if there is an error, return { success: false, error: 'Error reporting student.'};
    return {
      response: "ERROR",
      error: `Error reporting student: ${error}`,
      category: "REPORT",
    };
  }
};

/* UWPD needs to be able to manually blacklist a specific student they’ve reported. 
Will use netid to modify the ‘ProblematicUsers’ table so that the blacklisted field is 1.

- Takes in: { directive: "BLACKLIST”, netID: string }

- On error, returns the json object in the form: 
{ response: “ERROR”, success: false, error: string, category: “BLACKLIST” }.
- Returns a json object TO THE DRIVER in the format: { response: “BLACKLIST”, success: true } */
export const blacklist = async (
  netid: string
): Promise<GeneralResponse | ErrorResponse> => {
  if (!netid) {
    return {
      response: "ERROR",
      error: "Missing required fields.",
      category: "BLACKLIST",
    };
  }
  // modify the ‘ProblematicUsers’ table so that the blacklisted field is 1
  // if there is an error, return { success: false, error: 'Error blacklisting student.'};
  try {
    await blacklistUser(netid);
    return { response: "BLACKLIST", success: true };
  } catch (e) {
    return {
      response: "ERROR",
      error: `Error blacklisting student: ${e}`,
      category: "BLACKLIST",
    };
  }
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

- Takes in: { directive: "WAIT_TIME”, requestid: string, pickupLocation?: 
    [ latitude: number, longitude: number ], driverLocation?: [ latitude: number, longitude: number ] }

    - On error, returns the json object in the form: { response: “ERROR”, success: false, error: string, category: “WAIT_TIME” }.
- Returns a json object TO THE STUDENT in the format: { response: “WAIT_TIME”, waitTime: bigint //in minutes }	
 */
export const waitTime = (
  requestid: string,
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
    console.log(index);
    if (index === -1) {
      return {
        response: "ERROR",
        error: "Request not found in the queue.",
        category: "WAIT_TIME",
      };
    }
    // eliminate 0 based indexing
    ETA = (index + 1) * 15;
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
export const location = async (
  id: string,
  latitude: number,
  longitude: number
): Promise<LocationResponse | ErrorResponse> => {
  if (!id || !latitude || !longitude) {
    return {
      response: "ERROR",
      error: "Missing required fields.",
      category: "LOCATION",
    };
  }
  // Look for an accepted request with the netid passed in and extract the opposite user netid
  let otherNetId;
  try {
    otherNetId = await getOtherNetId(id);
  } catch (e) {
    return {
      response: "ERROR",
      error: `Error getting other netid: ${e}`,
      category: "LOCATION",
    };
  }
  // TODO: get the location of the user
  // pass the location information to the opposite user
  return { response: "LOCATION", netid: otherNetId, latitude, longitude };
};

/* We need to get some basic stats about our current feedback table back to the client. 
The types of canned queries we will return are: number of feedback entries, filter ride or app feedback, 
all feedback from a date, all feedback from a specific rating.

- Takes in: { directive: "QUERY”, rideorApp?: bigint // 0 for ride, 1 for app, default: query both, date?: { start: Date; end: Date }, rating?: bigint }
- On error, returns the json object in the form: { response: “ERROR”, success: false, error: string, category: “QUERY” }.
- Returns a json object TO THE DRIVER in the format: 
{ response: “QUERY”, numberOfEntries: bigint, feedback: [ { rating: bigint, textFeeback: string } ] } */
export const query = async (
  rideorApp?: 0 | 1,
  date?: { start: Date; end: Date },
  rating?: number
): Promise<QueryResponse | ErrorResponse> => {
  // get some basic stats about our current feedback table back to the client
  // types of canned queries we will return are: number of feedback entries,
  // filter ride or app feedback, all feedback from a date, all feedback from a specific rating
  // if there is an error, return { success: false, error: 'Error querying feedback.'};
  try {
    const queried: Feedback[] = await queryFeedback(rideorApp, date, rating);
    return { response: "QUERY", numberOfEntries: 0, feedback: queried };
  } catch (e) {
    return {
      response: "ERROR",
      error: `Error querying feedback: ${e}`,
      category: "QUERY",
    };
  }
};
