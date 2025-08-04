import dotenv from "dotenv";
import { AuthSessionResult } from "expo-auth-session";
import {
  ErrorResponse,
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
  DistanceResponse,
  ViewRideRequestResponse,
  ViewDecisionResponse,
  SnapLocationResponse,
  PlaceSearchResult,
  GooglePlaceSearchResponse,
  GooglePlaceSearchBadLocationTypes,
  PlaceSearchResponse,
  PurpleZone,
} from "./api";
import {
  addFeedbackToDb,
  addProblematic,
  blacklistUser,
  cancelRideRequest,
  completeRideRequest,
  createUser,
  finishCreatingUser,
  getOtherNetId,
  queryFeedback,
  db,
  getProfile,
  addRideRequestToPool,
  getRideRequests,
  setRideRequestStatus,
  setRideRequestDriver,
  getRecentLocations,
  isNotAccepted,
} from "./firebaseActions";
import { runTransaction } from "firebase/firestore";
import { highestRank, rankOf } from "./rankingAlgorithm";
dotenv.config();

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
      error: `Error getting snap location: ${(e as Error).message}}`,
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

  const query = await fetch(url.toString(), { method: "GET" });
  const response = await query.json();
  // Handle errors
  if (response.code !== "Ok") {
    console.error(
      `${response.code} - ${response.message}.\n\nFor more information: https://docs.mapbox.com/api/navigation/map-matching/#map-matching-api-errors`
    );
    return;
  }
  // Get the coordinates from the response.
  const coords = response.matchings[0].geometry;
  console.log(coords);

  // check if we have a valid road name
  let roadName = response.tracepoints[1].name;
  if (roadName.length < 1) {
    // there was no road name, so we need to use the reverse geocoding API
    // to get the name of the street
    const geoCodingBase = `https://api.mapbox.com/search/geocode/v6/reverse`;
    const geoCodingUrl = new URL(geoCodingBase);
    geoCodingUrl.searchParams.set("longitude", `${safeLong}`); // from the coordinates
    geoCodingUrl.searchParams.set("latitude", `${safeLat}`);
    geoCodingUrl.searchParams.set("types", "street"); // get the street name
    geoCodingUrl.searchParams.set(
      "access_token",
      process.env.MAPBOX_SNAPPING_TOKEN
    );
    const query = await fetch(geoCodingUrl.toString(), { method: "GET" });
    const response = await query.json();
    console.log("response from mapbox:", response.features[0].properties);

    if (response.features.length > 0) {
      roadName = response.features[0].properties.name;
    }
    // else we give up and just return the empty string
  }
  // Code from the next step will go here
  return { coords: coords, roadName };
}

/* Adds a new ride request object to the queue using the parameters given. 
Will add a new request to the database, populated with the fields passed in and a request status of 0.

- Takes in a json object with the following format: 
{ directive: "REQUEST_RIDE", phoneNum: string, netID: string, location: string, destination: string; numRiders: bigint }.

- On error, returns the json object in the form: { response: “ERROR”, success: false, error: string, category: “REQUEST_RIDE” }.
- Returns a json object TO THE STUDENT in the form: { response: “REQUEST_RIDE”, requestid: string }. */
export const requestRide = async (
  rideRequest: RideRequest
): Promise<RequestRideResponse | ErrorResponse> => {
  try {
    const response: { requestid: string; notifyDrivers: boolean } =
      await runTransaction(db, async (t) => {
        return await addRideRequestToPool(t, rideRequest);
      });
    if (response.requestid != null) {
      return { response: "REQUEST_RIDE", ...response };
    } else {
      throw new Error(`requestid was null`);
    }
  } catch (e: unknown) {
    return {
      response: "ERROR",
      error: `Error adding new ride request to the database: ${(e as Error).message}`,
      category: "REQUEST_RIDE",
    };
  }
};

/**
 * Returns "YES" or "NO" depending on if there are currently rides in the pool.
 * Used by the ride request broker, called when a driver opens the application.
 */
export const ridesExist = async (): Promise<boolean | ErrorResponse> => {
  try {
    return await runTransaction(db, async () => {
      // get all REQUESTED rides
      const rideRequests: RideRequest[] = await getRideRequests();
      // check if there are actually rides
      return rideRequests.length !== 0;
    });
  } catch (e) {
    return {
      response: "ERROR",
      error: `Error getting ride requests from the database: ${(e as Error).message}`,
      category: "REQUEST_RIDE",
    };
  }
};

/**
 * Temporarily checks out a ride request to a driver, who can choose to either accept
 * or decline the ride reqeust they are granted.
 * @param driverid The ID of the driver who is going to view a ride and either accept
 * or deny it after having viewed it.
 * @param driverLocation The current location of the driver associated with driverId.
 * @returns a ViewRideRequestResponse with all of the information the driver needs
 * to accept or deny the request, or an ErrorResponse if there was some recoverable
 * problem.
 */
export const viewRide = async (
  driverid: string,
  driverLocation: {
    latitude: number;
    longitude: number;
  }
): Promise<ViewRideRequestResponse | ErrorResponse> => {
  try {
    return await runTransaction(db, async (t) => {
      // get REQUESTED rides
      const rideRequests: RideRequest[] = await getRideRequests();
      if (rideRequests.length === 0) {
        return {
          response: "VIEW_RIDE",
          rideExists: false,
          notifyDrivers: false,
        };
      }
      // get the best ride
      // currently this is the ride requested earliest in time
      const bestRequest: RideRequest = highestRank(
        rideRequests,
        driverid,
        driverLocation
      );

      // get some stats on the ride
      const driverToPickUpDuration = await getDuration(
        driverLocation,
        bestRequest.locationFrom.coordinates,
        false // we are getting driverETA so don't get addresses
      ).then((resp) => {
        if ("duration" in resp) {
          return resp.duration;
        } else {
          // error response
          throw new Error(
            `Error getting driver to pick up duration: ${resp.error}`
          );
        }
      });

      // get stats on ride part 2
      const pickUpToDropOffDuration = await getDuration(
        bestRequest.locationFrom.coordinates,
        bestRequest.locationTo.coordinates,
        false // we are getting rideDuration so don't get addresses
      ).then((resp) => {
        if ("duration" in resp) {
          return resp.duration;
        } else {
          // error response
          throw new Error(
            `Error getting driver to pick up duration: ${resp.error}`
          );
        }
      });

      // before we take the request out of the queue,
      // check if this was the last request before empty
      let notify = false;
      const numReqs = await getRideRequests();
      if (numReqs.length == 1) {
        notify = true;
      }

      // take the ride out of the "pool"
      // by changing its status to VIEWING
      setRideRequestStatus(t, "VIEWING", bestRequest.netid);
      return {
        response: "VIEW_RIDE",
        rideExists: true,
        rideRequest: bestRequest,
        driverToPickUpDuration,
        pickUpToDropOffDuration,
        notifyDrivers: notify,
      };
    });
  } catch (e) {
    return {
      response: "ERROR",
      error: `Unknown problem during viewRide: ${(e as Error).message}}`,
      category: "VIEW_RIDE",
    };
  }
};

/**
 * Handles the acceptance, rejection, reporting, timing out, or erroring
 * of a ride request in the pool that was previously checked out to a
 * particular driver.
 * @param driverid ID of the driver who viewed the given ride request
 * @param providedView The view that was provided to the driver
 * @param decision The driver's decision on the ride request
 *  `ACCEPT` -> Accepts the ride request, ties to driver
 */
export const handleDriverViewChoice = async (
  driverid: string,
  netid: string,
  decision: "ACCEPT" | "DENY" | "TIMEOUT" | "ERROR"
): Promise<ViewDecisionResponse | ErrorResponse> => {
  try {
    return await runTransaction(db, async (t) => {
      if (decision === "ACCEPT") {
        // this will throw an error if the student's ride is no longer simply requested/viewed
        if (await isNotAccepted(netid)) {
          setRideRequestDriver(t, netid, driverid);
          setRideRequestStatus(t, "DRIVING TO PICK UP", netid);
          return {
            response: "VIEW_DECISION",
            driver: {
              response: "VIEW_DECISION",
              success: true,
            },
            student: {
              response: "ACCEPT_RIDE",
              success: true,
            },
            notifyDrivers: false, // already notified drivers during VIEW_RIDE
          };
        } else {
          throw new Error(
            `Request is no longer available for decision: ${decision}`
          );
        }
      } else if (
        decision === "DENY" ||
        decision === "TIMEOUT" ||
        decision === "ERROR"
      ) {
        // check if the pool was empty and the ride we are about to
        // add back in the queue is the first one in the pool
        let notify = false;
        const numReqs = await getRideRequests();
        if (numReqs.length == 0) {
          notify = true;
        }
        // make sure the ride has not been accepted / processed by the time we make our decision
        if (await isNotAccepted(netid)) {
          // reset the status to put the request put it back in the queue
          setRideRequestStatus(t, "REQUESTED", netid);
          return {
            response: "VIEW_DECISION",
            driver: {
              response: "VIEW_DECISION",
              success: true,
            },
            student: undefined,
            notifyDrivers: notify,
          };
        } else {
          // ride was taken by someone else!
          throw new Error(
            `Request is no longer available for decision: ${decision}`
          );
        }
      }
      // A bad decision was passed in
      return {
        response: "ERROR",
        error: `Invalid decision or missing parameters. ${decision}`,
        category: "VIEW_RIDE",
      };
    });
  } catch (e) {
    return {
      response: "ERROR",
      error: `Unexpected Error during handleDriverViewChoice: ${(e as Error).message}}`,
      category: "VIEW_RIDE",
    };
  }
};

/**
 * Sets the status of the ride request associated with `netid`
 * to be "DRIVER AT PICK UP" indicating that the driver has
 * arrived at the pick up location
 * @param netid netid of the student of the ride request
 * @returns DriverArrivedResponse with .success = true on success,
 * or an error response otherwise.
 */
export const driverArrived = async (
  netid: string
): Promise<ErrorResponse | GeneralResponse> => {
  try {
    await runTransaction(db, async (t) => {
      await setRideRequestStatus(t, "DRIVER AT PICK UP", netid);
    });
    return {
      response: "DRIVER_ARRIVED_AT_PICKUP",
      success: true,
    };
  } catch (e) {
    return {
      response: "ERROR",
      error: `Unexpected Error during driverArrived: ${(e as Error).message}`,
      category: "DRIVER_ARRIVED_AT_PICKUP",
    };
  }
};

/**
 * Sets the status of the ride request associated with `netid`
 * to be "DRIVING TO DESTINATION" indicating that the driver has
 * picked up student and is taking them to the dropoff
 * @param netid netid of the student of the ride request
 * @returns DriverArrivedResponse with .success = true on success,
 * or an error response otherwise.
 */
export const driverDrivingToDropoff = async (
  netid: string
): Promise<ErrorResponse | GeneralResponse> => {
  try {
    await runTransaction(db, async (t) => {
      await setRideRequestStatus(t, "DRIVING TO DESTINATION", netid);
    });
    return {
      response: "DRIVER_DRIVING_TO_DROPOFF",
      success: true,
    };
  } catch (e) {
    return {
      response: "ERROR",
      error: `Unexpected Error during driverPickedUpStudent: ${(e as Error).message}}`,
      category: "DRIVER_DRIVING_TO_DROPOFF",
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
  try {
    return await runTransaction(db, async (transaction) => {
      const response = await cancelRideRequest(transaction, netid, role);
      if (response.otherId) {
        // if we have an accepted ride, we have annetid of the opposite user
        return {
          response: "CANCEL",
          info: { response: "CANCEL", success: true },
          otherNetid: response.otherId,
          notifyDrivers: response.notifyDrivers,
        };
      }
      // no driver specified in this pending request case!
      return {
        response: "CANCEL",
        info: { response: "CANCEL", success: true },
        notifyDrivers: response.notifyDrivers,
      };
    });
  } catch (e) {
    return {
      response: "ERROR",
      error: `Error canceling ride request: ${(e as Error).message}}`,
      category: "CANCEL",
    };
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
  try {
    return await runTransaction(db, async (t) => {
      const netids = await completeRideRequest(t, requestid);
      return {
        response: "COMPLETE",
        info: {
          response: "COMPLETE",
          success: true,
        },
        netids: {
          student: netids.student,
          driver: netids.driver,
        },
      };
    });
  } catch (e) {
    return {
      response: "ERROR",
      error: `Unexpected Error during completeRide: ${(e as Error).message}}`,
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
      error: `Error adding feedback to the database: ${(e as Error).message}}`,
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
      error: `Error blacklisting student: ${(e as Error).message}}`,
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
  if (!requestid) {
    // if there is no concrete request in the queue, return the queue length * 15 minutes
    const queueLength = (await getRideRequests()).length;
    driverETA = queueLength * 15;
  } else if (requestid && !driverLocation) {
    // if there is a requestid, then there is a requested ride,
    // if there is also no driverLocation,
    // return corresponding queue index * 15
    const rideRequests: RideRequest[] = await getRideRequests();
    const index = rankOf(rideRequests, requestid);
    if (index === -1) {
      // the requestid was not in the queue
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
      error: `Error getting other netid: ${(e as Error).message}}`,
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
      error: `Error querying feedback: ${(e as Error).message}}`,
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
      const locations = await getRecentLocations(transaction, netid);
      return { response: "PROFILE", user, locations };
    });
  } catch (e) {
    return {
      response: "ERROR",
      error: `Error getting profile: ${(e as Error).message}}`,
      category: "PROFILE",
    };
  }
};

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
  try {
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
      const toReturn = Array.from(new Set(places));
      return toReturn;
    }
  } catch (e: unknown) {
    console.log("GOOGLE PLACE SEARCH ERROR", e);
  }
  return [];
};
