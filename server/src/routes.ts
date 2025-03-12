import dotenv from "dotenv";
import { AuthSessionResult } from "expo-auth-session";
import {
  localRideRequest,
  rideReqQueue,
  ErrorResponse,
  AcceptResponse,
  CancelResponse,
  GeneralResponse,
  FinishAccCreationResponse,
  RequestRideResponse,
  WaitTimeResponse,
  LocationResponse,
  QueryResponse,
  RideRequest,
  Feedback,
  ProblematicUser,
  CompleteResponse,
  SignInResponse,
  GoogleResponse,
  ProfileResponse,
  User,
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
  finishCreatingUser,
  getOtherNetId,
  queryFeedback,
  db,
  getProfile,
  //getProfile,
} from "./firebaseActions";
import { runTransaction } from "firebase/firestore";
import { Mutex } from "async-mutex";
dotenv.config();

// every time we access the queue and the database,
// we want to lock the entire section to make both the database action
// and the queue action combined into one atomic action to prevent data races
const queueLock: Mutex = new Mutex();

// performs the google auth and returns the user profile information
export const googleAuth = async (
  response: AuthSessionResult
): Promise<GoogleResponse> => {
  return await handleToken(response);
};

const handleToken = async (
  response: AuthSessionResult
): Promise<GoogleResponse> => {
  if (response?.type === "success") {
    const { authentication } = response;
    if (authentication == null) {
      console.error("auth is null @106 routes.ts");
    } else {
      const token = authentication.accessToken;
      console.log("access token", token);

      return getUserProfile(token);
    }
  }
  console.log("error with response", response);
  return { message: "Error signing in: Make sure you're using your UW email." };
};

// gets the user profile information using the token from google auth
// returns us the user info if the user is a UW student and signin is successful
//     as a JSON object in the form:
//    { message: "Google Signin Successful", userInfo: {
//   "sub": string,
//   "name": string,
//   "given_name": string,
//   "family_name": string,
//   "profile": string,
//   "picture": string,
//   "email": string,
//   "email_verified": boolean,
//   "locale": string,
//   "hd": string
// }
// }
// returns an error message if the user is not a UW student and therefore signin is unsuccessful
const getUserProfile = async (token: string): Promise<GoogleResponse> => {
  if (!token) return { message: "Error signing in: No token" };
  try {
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v1/userinfo?alt=json",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const userInfo = await response.json();
    const email = userInfo.email;

    const UWregex = /@uw.edu$/;
    if (!UWregex.test(email)) {
      return {
        message: "Error signing in: Please ensure your using your UW email",
      };
    }

    return { message: "Google Signin Successful", userInfo };
  } catch (error) {
    console.log("error fetching user info", error);
  }
  return { message: "Error signing in: Error getting profile" };
};

/* Signs a specific student or driver into the app. Will check the users database for the specific id, 
and if it is not there, will add a new user. If the user is in the table, we need to make sure this user 
is not in the ProblematicUsers table with a blacklisted field of 1 before we return success : true.

- Takes in a json object formatted as: {
directive: "SIGNIN", phoneNum: string, netID: string, name: string, studentNum: number, role: 'STUDENT' | 'DRIVER' }.

- On error, returns the json object in the form:  { response: “ERROR”, success: false, error: string, category: “SIGNIN” }. 
- Returns a json object TO THE STUDENT in the form: { response: “SIGNIN”, success: true }. */
export const signIn = async (
  netid: string,
  firstName: string,
  lastName: string,
  studentOrDriver: "STUDENT" | "DRIVER"
): Promise<SignInResponse | ErrorResponse> => {
  if (!netid || !firstName || !lastName) {
    return {
      response: "ERROR",
      error: "Missing or invalid sign in details.",
      category: "SIGNIN",
    };
  }
  try {
    return await runTransaction(db, async (transaction) => {
      const alreadyExists = await createUser(transaction, {
        netid,
        firstName,
        lastName,
        phoneNumber: null,
        studentNumber: null,
        studentOrDriver,
      });
      return { response: "SIGNIN", success: true, alreadyExists, netid };
    });
  } catch (e: unknown) {
    return {
      response: "ERROR",
      error: `Error adding user to database: ${(e as Error).message}.`,
      category: "SIGNIN",
    };
  }
};

// Finishes the account for the user by adding the phone number and student number to the database
// returns a success message if the account creation is successful and a boolean value of true if the account already exists
//     as a JSON object in the form: { response: "FINISH_ACC", success: boolean }
// returns an error message if the account creation is unsuccessful
//     as a JSON object in the form:
// return {
//       response: "ERROR",
//       error: string,
//       category: "FINISH_ACC",
//     };
export const finishAccCreation = async (
  netid: string,
  preferredName: string,
  phone_number: string,
  student_num: string
): Promise<FinishAccCreationResponse | ErrorResponse> => {
  if (!netid || !phone_number || !student_num) {
    return {
      response: "ERROR",
      error: "Missing or invalid finish account creation details.",
      category: "FINISH_ACC",
    };
  }

  // add values to database
  try {
    return await runTransaction(db, async (transaction) => {
      const isSuccessful = await finishCreatingUser(
        transaction,
        netid,
        preferredName,
        phone_number,
        student_num
      );
      return { response: "FINISH_ACC", success: isSuccessful };
    });
  } catch (e: unknown) {
    return {
      response: "ERROR",
      error: `Error adding phone number or student number to database: ${(e as Error).message}.`,
      category: "FINISH_ACC",
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

  queueLock.acquire();
  // add a new request to the database, populated with the fields passed in and a request status of 0
  // on error, return { success: false, error: 'Error adding ride request to the database.'};
  try {
    const requestid = await runTransaction(db, async (transaction) => {
      // we cannot directly assign the requestid to the return value of addRideRequest
      // since you cannot alter app state in a transaction
      return await addRideRequest(transaction, netid, from, to, numRiders);
    });
    // can't do this in the transaction unfortuntely
    // we also want to keep the requests locally in the server queue, but without too much information
    const newRideReq: localRideRequest = { requestid, netid };
    rideReqQueue.add(newRideReq);
    return { response: "REQUEST_RIDE", requestid };
  } catch (e) {
    return {
      response: "ERROR",
      error: `Error adding ride request to the database: ${e}`,
      category: "REQUEST_RIDE",
    };
  } finally {
    queueLock.release();
  }
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
  queueLock.acquire();
  if (!rideReqQueue.peek()) {
    queueLock.release();
    return {
      response: "ERROR",
      error: "No ride requests in the queue.",
      category: "ACCEPT_RIDE",
    };
  }

  // get the next request in the queue
  // can't do this in the transaction unfortuntely
  const nextRide = rideReqQueue.pop() as localRideRequest;
  // update the request in database to add the driver id and change the status of the request to 1 (accepted)
  // if there is an error, return { success: false, error: 'Error accepting ride request.'};
  try {
    const req: RideRequest = await runTransaction(db, async (transaction) => {
      return await acceptRideRequest(transaction, nextRide.requestid, driverid);
    });
    return {
      response: "ACCEPT_RIDE",
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
  } finally {
    queueLock.release();
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

* In the case that a request has a status of 1, we want to notify the corresponding driver or student. *
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
  role: "STUDENT" | "DRIVER"
): Promise<CancelResponse | ErrorResponse> => {
  if (!netid) {
    return {
      response: "ERROR",
      error: "Missing required fields.",
      category: "CANCEL",
    };
  }

  queueLock.acquire();
  // can't do this in the transaction unfortuntely, so lock instead
  if (role === "STUDENT") {
    // get rid of any pending requests in the local queue that have the same netid
    rideReqQueue.remove(netid);
  }

  try {
    return await runTransaction(db, async (transaction) => {
      const otherid = await cancelRideRequest(transaction, netid, role);
      if (otherid) {
        // if we have an accepted ride, we have annetid of the opposite user
        return {
          response: "CANCEL",
          info: { response: "CANCEL", success: true },
          otherNetid: otherid,
        };
      }
      // no driver specified in this pending request case!
      return {
        response: "CANCEL",
        info: { response: "CANCEL", success: true },
      };
    });
  } catch (e) {
    // if there is an error, return { success: false, error: 'Error canceling ride request.'};
    return {
      response: "ERROR",
      error: `Error canceling ride request: ${e}`,
      category: "CANCEL",
    };
  } finally {
    queueLock.release();
  }
};

/* Once a ride is finished, the driver will set that specific request status to 2 in the database. 
(Both the student and driver will still get a notification that the ride is completed)

- Takes in a json object in the form: { directive: "COMPLETE", requestid: string }.

- On error, returns the json object in the form: 
{ response: “ERROR”, success: false, error: string, category: “COMPLETE” }.
- Returns a json object TO THE DRIVER in the format: { response: “COMPLETE”, success: true }
- Returns a json object TO THE STUDENT in the format: { response: “COMPLETE”, success: true } */
export const completeRide = async (
  requestid: string
): Promise<CompleteResponse | ErrorResponse> => {
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
    return await runTransaction(db, async (transaction) => {
      const netids = await completeRideRequest(transaction, requestid);
      return {
        response: "COMPLETE",
        info: { response: "COMPLETE", success: true },
        netids: netids,
      };
    });
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
  rideOrApp: "RIDE" | "APP"
): Promise<GeneralResponse | ErrorResponse> => {
  if (!rating || !textFeedback || !rideOrApp) {
    return {
      response: "ERROR",
      error: "Missing required fields.",
      category: "ADD_FEEDBACK",
    };
  }

  try {
    return await runTransaction(db, async (transaction) => {
      const feedback: Feedback = {
        rating,
        textFeedback,
        rideOrApp,
      };
      // add feedback to the Feeback table using the fields passed in
      await addFeedbackToDb(transaction, feedback);
      return { response: "ADD_FEEDBACK", success: true };
    });
  } catch (e) {
    // if there is an error, return { success: false, error: 'Error adding feedback to the database.'};
    return {
      response: "ERROR",
      error: `Error adding feedback to the database: ${e}`,
      category: "ADD_FEEDBACK",
    };
  }
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

  try {
    return await runTransaction(db, async (transaction) => {
      // add a new student entry to the ProblematicUsers table with the reported category
      const problem: ProblematicUser = {
        netid,
        requestid,
        reason,
        category: "REPORTED",
      };
      await addProblematic(transaction, problem);
      return { response: "REPORT", success: true };
    });
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
    return await runTransaction(db, async (transaction) => {
      await blacklistUser(transaction, netid);
      return { response: "BLACKLIST", success: true };
    });
  } catch (e) {
    return {
      response: "ERROR",
      error: `Error blacklisting student: ${e}`,
      category: "BLACKLIST",
    };
  }
};

/*
A specific user needs to know when approximately the driver will arrive.

If the user has not yet indicated on a specific ride they want to take,
requestid, requestedRide, and driverLocation will not be passed in. In this case,
we will estimate the time it takes for the driver to arrive as the current number of requests in the queue * 15 minutes.
In this case, rideDuration will be -1 since there is no ride to calculate the duration of!

If the user is experimenting with ride requests or 
they are about to request a ride and are being shown a confirmation screen,
they will pass in only the requestedRide while requestid and driverLocation will not be passed in.
In this case, the rideDurations is calculated as the Google Maps eta from pickup to dropoff location.
The driverETA, since there is no driver yet or a request in the queue, is 
still the current number of requests in the queue * 15 minutes.

If the user has already requested a ride and it is waiting in the queue, 
they will pass in the requestid and requestedRide while driverLocation will not be passed in.
In this case, the rideDuration is calculated as the Google Maps eta from pickup to dropoff location.
The driverETA is calculated as the position of the request in the queue * 15 minutes.

If the user has requested a ride and it has been accepted, they will have access to 
the driverLocation. In this case, they will pass in all three fields.
In this case, the rideDuration is calculated as the Google Maps eta from pickup to dropoff location.
The driverETA is calculated as the Google Maps eta from driverLocation to pickupLocation.

- Takes in: { directive: "WAIT_TIME”,  requestedRide?: {
    pickupLocation: [latitude: number, longitude: number];
    dropOffLocation: [latitude: number, longitude: number];},
    requestid?: string, driverLocation?: [latitude: number, longitude: number] }
- On error, returns the json object in the form:
    { response: “ERROR”, success: false, error: string, category: “WAIT_TIME” }.
- Returns a json object TO THE STUDENT in the format:
    { response: “WAIT_TIME”, rideDuration: number //in minutes, driverETA: number //in minutes }
 */
export const waitTime = async (
  requestedRide?: {
    pickupLocation: { latitude: number; longitude: number };
    dropOffLocation: { latitude: number; longitude: number };
  },
  requestid?: string,
  driverLocation?: { latitude: number; longitude: number }
): Promise<WaitTimeResponse | ErrorResponse> => {
  let rideDuration = -1;
  let driverETA = -1;

  // FIND THE RIDE DURATION (PICKUP TO DROPOFF)
  if (requestedRide) {
    const resp = await getDuration(
      requestedRide.pickupLocation,
      requestedRide.dropOffLocation
    );
    if (typeof resp === "number") {
      rideDuration = resp;
    } else {
      // error response
      return resp;
    }
  }

  // FIND THE DRIVER'S ETA TO THE STUDENT
  queueLock.acquire();
  if (!requestid) {
    // if there is no concrete request in the queue, return the queue length * 15 minutes
    const queueLength = rideReqQueue.get().length;
    driverETA = queueLength * 15;
  } else if (requestid && !driverLocation) {
    // if there is a requestid, then there is a requested ride,
    // if there is also no driverLocation,
    // return corresponding queue index * 15
    const index = rideReqQueue
      .get()
      .findIndex((request) => request.requestid === requestid);
    if (index === -1) {
      // the requestid was not in the queue
      queueLock.release();
      return {
        response: "ERROR",
        error: `Could not find requestid ${requestid} in the queue.`,
        category: "WAIT_TIME",
      };
    }
    // index 0 is the next person in line and
    // will have a wait time of 15 minutes and so on
    driverETA = (index + 1) * 15;
  } else if (requestedRide && driverLocation) {
    // if there is requested ride and driverLoc (and maybe request id),
    // we can calculate the ETA from driverLoc to pickupLoc
    const resp = await getDuration(
      driverLocation,
      requestedRide.pickupLocation
    );
    if (typeof resp === "number") {
      driverETA = resp;
    } else {
      // error response
      return resp;
    }
  }

  queueLock.release();
  return { response: "WAIT_TIME", rideDuration, driverETA };
};

/**
 * HELPER FUNCTION FOR WAIT_TIME TO GET THE DURATION FROM GOOGLE MAPS API
 *
 * @param origin
 * @param destination
 * @returns the drive time in minutes or an error response
 */
const getDuration = async (
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number }
): Promise<ErrorResponse | number> => {
  try {
    const etaURL =
      `https://maps.googleapis.com/maps/api/distancematrix/json?` +
      `origins=${origin.latitude},${origin.longitude}` +
      `&destinations=${destination.latitude},${destination.longitude}` +
      `&key=${process.env.GOOGLE_MAPS_APIKEY}&mode=driving&units=imperial`;
    const response = await fetch(etaURL);
    const data = await response.json();

    if (data.rows[0].elements[0].status === "OK") {
      const distance = data.rows[0].elements[0].distance.value; // in meters
      const duration = data.rows[0].elements[0].duration.value; // in seconds

      console.log(`driverETA: Distance: ${distance}`);
      console.log(`driverETA: Duration: ${duration}`);
      return Math.ceil(duration / 60); // convert to minutes
    } else {
      return {
        response: "ERROR",
        error: `Error fetching distance: ${data.rows[0].elements[0].status}`,
        category: "WAIT_TIME",
      };
    }
  } catch (error: unknown) {
    return {
      response: "ERROR",
      error: `Error fetching distance: ${(error as Error).message}`,
      category: "WAIT_TIME",
    };
  }
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
    return await runTransaction(db, async () => {
      // we can't use transactions to query so hopefully this is fine
      otherNetId = await getOtherNetId(id); // get the location of the user
      // pass the location information to the opposite user
      return { response: "LOCATION", netid: otherNetId, latitude, longitude };
    });
  } catch (e) {
    return {
      response: "ERROR",
      error: `Error getting other netid: ${e}`,
      category: "LOCATION",
    };
  }
};

/* We need to get some basic stats about our current feedback table back to the client. 
The types of canned queries we will return are: number of feedback entries, filter ride or app feedback, 
all feedback from a date, all feedback from a specific rating.

- Takes in: { directive: "QUERY”, rideOrApp?: bigint // 0 for ride, 1 for app, default: query both, date?: { start: Date; end: Date }, rating?: bigint }
- On error, returns the json object in the form: { response: “ERROR”, success: false, error: string, category: “QUERY” }.
- Returns a json object TO THE DRIVER in the format: 
{ response: “QUERY”, numberOfEntries: bigint, feedback: [ { rating: bigint, textFeeback: string } ] } */
export const query = async (
  rideOrApp?: "RIDE" | "APP",
  date?: { start: Date; end: Date },
  rating?: number
): Promise<QueryResponse | ErrorResponse> => {
  // get some basic stats about our current feedback table back to the client
  // types of canned queries we will return are: number of feedback entries,
  // filter ride or app feedback, all feedback from a date, all feedback from a specific rating
  // if there is an error, return { success: false, error: 'Error querying feedback.'};
  try {
    return await runTransaction(db, async () => {
      const queried: Feedback[] = await queryFeedback(rideOrApp, date, rating);
      return { response: "QUERY", numberOfEntries: 0, feedback: queried };
    });
  } catch (e) {
    return {
      response: "ERROR",
      error: `Error querying feedback: ${e}`,
      category: "QUERY",
    };
  }
};

/* Get user information based on the netid
- Takes in: { directive: "PROFILE", netid: string }
- On error, returns the json object in the form: { response: “ERROR”, success: false, error: string, category: PROFILE }.
- Returns a json object TO THE DRIVER in the format: { response: PROFILE, user: User } */
export const profile = async (
  netid: string
): Promise<ProfileResponse | ErrorResponse> => {
  // get the user's profile information
  // if there is an error, return { success: false, error: 'Error getting profile.'};
  try {
    return await runTransaction(db, async (transaction) => {
      // get the user's profile information
      const user: User = await getProfile(transaction, netid);
      return { response: "PROFILE", user };
    });
  } catch (e) {
    return {
      response: "ERROR",
      error: `Error getting profile: ${e}`,
      category: "PROFILE",
    };
  }
};
