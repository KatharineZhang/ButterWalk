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
  LocationType,
  DistanceResponse,
  SnapLocationResponse,
  RecentLocationResponse,
  PlaceSearchResult,
  GooglePlaceSearchResponse,
  GooglePlaceSearchBadLocationTypes,
  PlaceSearchResponse,
  PurpleZone,
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
  getRecentLocations,
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
// Removed duplicate declaration of fetchRecentLocations

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

export const snapLocation = async (
  currLat: number,
  currLong: number
): Promise<SnapLocationResponse | ErrorResponse> => {
  // if currLat or currLong is not a number, return an error
  if (!currLat || !currLong) {
    return {
      response: "ERROR",
      error: "Missing or invalid location details.",
      category: "SNAP",
    };
  }

  if (typeof currLat !== "number" || typeof currLong !== "number") {
    return {
      response: "ERROR",
      error: "latitude or longitude not the correct type.",
      category: "SNAP",
    };
  }

  if (currLat < -90 || currLat > 90 || currLong < -180 || currLong > 180) {
    return {
      response: "ERROR",
      error: "Invalid latitude or longitude.",
      category: "SNAP",
    };
  }

  try {
    // Documentation on how to use MapBox's map matching API:
    // https://docs.mapbox.com/help/tutorials/get-started-map-matching-api/?step=5

    const snappedInfo = await getMatch(currLat, currLong);
    console.log("Snapped info:", snappedInfo);

    // these are temporary return values just to appease the red lines
    const roadName: string = snappedInfo?.roadName;
    const snappedLat: number = snappedInfo?.coords.coordinates[0][1];
    const snappedLong: number = snappedInfo?.coords.coordinates[0][0];
    console.log("Snapped locations:", snappedLat, snappedLong);

    return {
      response: "SNAP",
      success: true,
      roadName: roadName,
      latitude: snappedLat,
      longitude: snappedLong,
    };
  } catch (e) {
    return {
      response: "ERROR",
      error: `Error getting snap location: ${e}`,
      category: "SNAP",
    };
  }
};

// Make a Map Matching request
async function getMatch(lat: number, long: number) {
  const safeLat = encodeURIComponent(lat.toString());
  const safeLong = encodeURIComponent(long.toString());
  const coord = `${safeLong},${safeLat}`;
  const radius = "25"; // in meters
  const profile = "walking";

  // Create the query
  const base = `https://api.mapbox.com/matching/v5/mapbox/${profile}/${coord};${coord}`;
  const url = new URL(base);
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("radiuses", `${radius};${radius}`);
  url.searchParams.set("steps", "false");
  url.searchParams.set("access_token", process.env.MAPBOX_SNAPPING_TOKEN);

  console.log("in getMatch");
  const query = await fetch(url.toString(), { method: "GET" });
  const response = await query.json();
  console.log("response from mapbox:", response);
  // Handle errors
  if (response.code !== "Ok") {
    console.error(
      `${response.code} - ${response.message}.\n\nFor more information: https://docs.mapbox.com/api/navigation/map-matching/#map-matching-api-errors`
    );
    return;
  }
  // Get the coordinates from the response.
  // TODO: figure out if it's in an array or not
  const coords = response.matchings[0].geometry;
  console.log(coords);
  // Code from the next step will go here
  return { coords: coords, roadName: response.tracepoints[1].name };
}

/* Adds a new ride request object to the queue using the parameters given. 
Will add a new request to the database, populated with the fields passed in and a request status of 0.

- Takes in a json object with the following format: 
{ directive: "REQUEST_RIDE", phoneNum: string, netID: string, location: string, destination: string; numRiders: bigint }.

- On error, returns the json object in the form: { response: “ERROR”, success: false, error: string, category: “REQUEST_RIDE” }.
- Returns a json object TO THE STUDENT in the form: { response: “REQUEST_RIDE”, requestid: string }. */
export const requestRide = async (
  phoneNum: string,
  netid: string,
  from: LocationType,
  to: LocationType,
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
    { response: “WAIT_TIME”, rideDuration: number //in minutes, driverETA: number //in minutes, 
     pickUpAddress?: string, dropOffAddress?: string } 
 */
export const waitTime = async (
  requestedRide?: {
    pickUpLocation: { latitude: number; longitude: number };
    dropOffLocation: { latitude: number; longitude: number };
  },
  requestid?: string,
  driverLocation?: { latitude: number; longitude: number }
): Promise<WaitTimeResponse | ErrorResponse> => {
  let rideDuration = -1;
  let driverETA = -1;
  let pickUpAddress = undefined;
  let dropOffAddress = undefined;

  // FIND THE RIDE DURATION (PICKUP TO DROPOFF)
  if (requestedRide) {
    const resp = await getDuration(
      requestedRide.pickUpLocation,
      requestedRide.dropOffLocation,
      true // we are getting rideDuration so get addresses
    );
    if ("duration" in resp) {
      rideDuration = resp.duration;
      pickUpAddress = resp.pickUpAddress as string;
      dropOffAddress = resp.dropOffAddress as string;
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
      requestedRide.pickUpLocation,
      false // we are getting driverETA so don't get addresses
    );
    if ("duration" in resp) {
      driverETA = resp.duration;
    } else {
      // error response
      return resp;
    }
  }

  queueLock.release();
  return {
    response: "WAIT_TIME",
    rideDuration,
    driverETA,
    pickUpAddress,
    dropOffAddress,
  };
};

/**
 * HELPER FUNCTION FOR WAIT_TIME
 *
 * @param origin
 * @param destination
 * @param getPickUpDropOffAddress should we get the pickup and dropoff addresses from distance matrix
 * @returns the drive time in minutes or an error response
 */
const getDuration = async (
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  getPickUpDropOffAddress: boolean
): Promise<
  | ErrorResponse
  | { duration: number; pickUpAddress?: string; dropOffAddress?: string }
> => {
  try {
    // all the api
    const distResp = await distanceMatrix(
      [origin],
      [destination],
      "driving",
      "doesn't-matter"
    );

    // check for an error
    if ("response" in distResp && distResp.response === "ERROR") {
      // trigger the catch branch if error
      throw new Error(distResp.error);
    }

    const data = (distResp as DistanceResponse).apiResponse;

    // instantiate the response object
    const response: {
      duration: number;
      pickUpAddress?: string;
      dropOffAddress?: string;
    } = {
      duration: 0,
    };

    if (getPickUpDropOffAddress) {
      // if we wanted them, get the pickup and dropoff addresses
      const pickUpAddress = data.origin_addresses[0];
      const dropOffAddress = data.destination_addresses[0];
      response["pickUpAddress"] = pickUpAddress;
      response["dropOffAddress"] = dropOffAddress;
    }

    // addresses are returned even if distance and duration are not
    // in order to get distance and duration, we need to check the status
    if (data.rows[0].elements[0].status === "OK") {
      // const distance = data.rows[0].elements[0].distance.value; // in meters
      const duration = data.rows[0].elements[0].duration.value; // in seconds
      response["duration"] = Math.ceil(duration / 60); // convert to minutes
      return response;
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

/**
 * FUNCTION FOR GOOGLE MAPS DISTANCE MATRIX API
 * https://developers.google.com/maps/documentation/distance-matrix/distance-matrix
 *
 * @param origin list of origins
 * @param destination list of destinations
 * @param mode should the distance be calculated for driving or walking
 * @returns DistanceMatrix object (the rows are a corss product of origin and destination coodinates)
 */
export const distanceMatrix = async (
  origin: { latitude: number; longitude: number }[],
  destination: { latitude: number; longitude: number }[],
  mode: "driving" | "walking",
  tag: string
): Promise<ErrorResponse | DistanceResponse> => {
  try {
    // convert from coordinate array to string
    const originStr = origin.map(
      (coord) => `${coord.latitude},${coord.longitude}`
    );
    const origins = originStr.join("|");

    // convert from coordinate array to string
    const destinationStr = destination.map(
      (coord) => `${coord.latitude},${coord.longitude}`
    );
    const destinations = destinationStr.join("|");

    // call api
    const etaURL =
      `https://maps.googleapis.com/maps/api/distancematrix/json?` +
      `origins=${origins}` +
      `&destinations=${destinations}` +
      `&key=${process.env.GOOGLE_MAPS_APIKEY}&mode=${mode}&units=imperial`;
    const response = await fetch(etaURL);
    const data = await response.json();

    if (data.rows[0].elements[0].status === "OK") {
      // there are results so return response
      return { response: "DISTANCE", apiResponse: data, tag: tag };
    } else {
      // trigger the catch branch
      throw new Error(`Error fetching distance matrix info: ${data.status}`);
    }
  } catch (error: unknown) {
    return {
      response: "ERROR",
      error: `Error fetching distance matrix info: ${(error as Error).message}`,
      category: "DISTANCE",
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

/*testing get recent locations*/
export const fetchRecentLocations = async (
  netid: string
): Promise<RecentLocationResponse | ErrorResponse> => {
  if (!netid) {
    return {
      response: "ERROR",
      error: "Missing netid.",
      category: "RECENT_LOCATIONS",
    };
  }

  try {
    return await runTransaction(db, async (transaction) => {
      // Fetch recent locations using the function in firebaseActions
      const locations = await getRecentLocations(transaction, netid);

      return {
        response: "RECENT_LOCATIONS",
        locations,
      };
    });
  } catch (e) {
    return {
      response: "ERROR",
      error: `Error fetching recent locations: ${(e as Error).message}`,
      category: "RECENT_LOCATIONS",
    };
  }
};

// This is used to cache the results of the Google Place API
let previousQuery = "";
let previousResults: PlaceSearchResult[] = [];

// Call the Google Place Search to get place suggestions based on user input
export const getPlaceSearchResults = async (
  query: string
): Promise<PlaceSearchResponse | ErrorResponse> => {
  try {
    const results = await fetchGooglePlaceSuggestions(query);
    return {
      response: "PLACE_SEARCH",
      results,
    };
  } catch (e) {
    return {
      response: "ERROR",
      error: `Error fetching place search results: ${(e as Error).message}`,
      category: "PLACE_SEARCH",
    };
  }
};

/**
 * HELPER: Fetch Google Place Autocomplete suggestions based on user input.
 * @param query - The user's input query.
 * @param location - The latitude and longitude to restrict the search.
 * @param radius - The radius (in meters) to restrict the search (default: 5000).
 * @returns A promise that resolves to an array of place descriptions.
 */
export const fetchGooglePlaceSuggestions = async (
  query: string
): Promise<PlaceSearchResult[]> => {
  // If the query is basically the same as the previous one, return the cached results
  if (levensteinDistance(query, previousQuery) < 3) {
    console.log(
      "google place search cached results for query:",
      query,
      "previous query:",
      previousQuery
    );
    return previousResults;
  }
  try {
    previousQuery = query;
    const url =
      `https://maps.googleapis.com/maps/api/place/textsearch/json?` +
      `query=${encodeURIComponent(query)}` +
      `&location=47.65979,-122.30564` + // Source: trust me bro - Snigdha (https://www.calcmaps.com/map-radius/)
      `&radius=1859` + // but basically its just a radius around the purple zone area
      `&key=${process.env.GOOGLE_MAPS_APIKEY}`;

    const res = await fetch(url);
    const json = await res.json();

    if (Array.isArray(json.results)) {
      // Post-filter results to ensure they are inside the polygon
      const places = (json.results as GooglePlaceSearchResponse[])
        .map((r) => ({
          name: r.name,
          location: {
            latitude: r.geometry.location.lat,
            longitude: r.geometry.location.lng,
          },
          types: r.types,
          formatted_address: r.formatted_address,
        }))
        // filter to places inside the purple zone
        .filter((place) => PurpleZone.isPointInside(place.location))
        // filter out places that could potentially serve alcohol
        .filter((place) => {
          return !place.types.some((type) =>
            GooglePlaceSearchBadLocationTypes.includes(type)
          );
        })
        .map((place) => ({
          name: place.name,
          coordinates: place.location,
          address: place.formatted_address,
        }));
      // remove duplicates from places
      previousResults = Array.from(new Set(places));
      return previousResults;
    }
  } catch (e: unknown) {
    console.log("GOOGLE PLACE SEARCH ERROR", e);
  }
  previousResults = [];
  return [];
};

// Get the distance between two strings
// (number of insertions and deletions of characters to get from one to another)
const levensteinDistance = (a: string, b: string): number => {
  const matrix: number[][] = new Array(b.length + 1)
    .fill(null)
    .map(() => new Array(a.length + 1).fill(0));

  for (let i = 0; i < a.length + 1; i++) {
    matrix[0][i] = i;
  }

  for (let i = 0; i < b.length + 1; i++) {
    matrix[i][0] = i;
  }

  for (let i = 1; i < a.length + 1; i++) {
    for (let j = 1; j < b.length + 1; j++) {
      const min = Math.min(matrix[j - 1][i], matrix[j][i - 1]);
      if (a[i - 1] === b[j - 1]) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = min + 1;
      }
    }
  }
  return matrix[b.length][a.length];
};
