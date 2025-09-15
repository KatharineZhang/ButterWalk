// This is where we will directly interact with the firestore database
import { app } from "./firebaseConfig";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  QueryConstraint,
  Timestamp,
  Transaction,
  updateDoc,
  where,
  WhereFilterOp,
} from "firebase/firestore";
import {
  Feedback,
  RecentLocation,
  ProblematicUser,
  RideRequest,
  User,
  LocationType,
  RideRequestStatus,
  type_canceled,
  type_requested,
  CANCELED_STATUS,
  REQUESTED_STATUS,
  COMPLETED_STATUS,
  VIEWING_STATUS,
  DRIVING_TO_PICK_UP_STATUS,
  DRIVER_AT_PICK_UP_STATUS,
  DRIVING_TO_DESTINATION_STATUS,
} from "./api";

export const db = getFirestore(app);

// GREAT RESOURCE FOR BASIC FIRESTORE WORK: https://www.youtube.com/watch?v=kwVbKV0ZFEs

// Our tables / collections in the database
export const usersCollection = collection(db, "Users");
const driversCollection = collection(db, "Drivers");
const rideRequestsCollection = collection(db, "RideRequests");
const problematicUsersCollection = collection(db, "ProblematicUsers");
const feedbackCollection = collection(db, "Feedback");
const recentlocationsCollection = collection(db, "RecentLocations");

// PROFILE - get the recent locations of a user
export async function getRecentLocations(
  transaction: Transaction,
  netid: string
) {
  const docRef = doc(recentlocationsCollection, netid);
  const docSnap = await transaction.get(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data() as RecentLocation;
    return data.locations;
  } else {
    console.log("Document does not exist");
    return [];
  }
}

// SIGN IN - Adds a user to the database if they are not problematic
// this is a completely NEW USER
export async function createUser(transaction: Transaction, user: User) {
  // check if the user is in the problematicUsers table with a blacklisted status
  const isProblematic = doc(db, "ProblematicUsers", user.netid);
  const problematicDoc = await transaction.get(isProblematic);
  if (
    problematicDoc.exists() &&
    problematicDoc.data().category === "BLACKLISTED"
  ) {
    throw new Error("User is blacklisted");
  }

  // otherwise, add the user to the users table using transaction
  // use the net id of the user as the document id
  const docRef = doc(usersCollection, user.netid);
  const docSnap = await transaction.get(docRef);

  // make a new document for the user in the locations table
  // use the net id of the user as the document id
  const docLocationRef = doc(recentlocationsCollection, user.netid);
  // populate their recent locations with our default recent locations
  const campusLocations = defaultCampusLocations;

  // continue with the user creation
  if (docSnap.exists()) {
    const data = docSnap.data() as User;
    if (data.phoneNumber === null && data.studentNumber === null) {
      // User exists but phoneNum and studentNum are NULL
      return false;
    } else {
      // User already exists in the database
      return true;
    }
  } else {
    console.log("User does NOT exist in the database");
    // before, only RecentLocations in FireBase was being updated with
    // the new user, however with the below line,
    // we also add the user in Users (otherwise it throws
    // a bunch of errors!) in FireBase
    transaction.set(docRef, {
      firstName: user.firstName,
      lastName: user.lastName,
      netid: user.netid,
      studentOrDriver: user.studentOrDriver,
    });
    transaction.set(docLocationRef, { locations: campusLocations });
    console.log("Document does not exist, so added default campuslocations");
    return false;
  }
}

// FINISH ACCOUNT CREATION - add phone number and student num to the database
// associated with the user's unique netid
// returns true if the user was updated, false if the user was not found
export async function finishCreatingUser(
  transaction: Transaction,
  netid: string,
  preferredName: string,
  phoneNumber: string,
  studentNumber: string
) {
  // use the net id of the user as the document id
  // from the Users document in Firebase
  const docRef = doc(usersCollection, netid);
  const docSnap = await transaction.get(docRef);
  if (docSnap.exists()) {
    // User already exists in the database

    try {
      await transaction.update(docRef, {
        preferredName, // add new entry to document
        phoneNumber,
        studentNumber,
      });

      return true;
    } catch (error) {
      console.log(`Error occured when updating user databse: ${error}`);
      return false;
    }
  } else {
    // User does NOT exists in the database
    return false;
  }
}

// SIGN IN - check if the driverid exists in the database
export async function verifyDriverId(
  t: Transaction,
  driverid: string
): Promise<boolean> {
  // check if the driverid exists in the Drivers collection
  const queryDriver = query(
    driversCollection,
    where("driverid", "==", driverid)
  );
  const docs = await getDocs(queryDriver);
  // if there is exactly one document with that driverid, return true
  if (docs.size == 1) {
    return true;
  }
  // otherwise, return false
  return false;
}

/**
 * Adds a new ride request to the database/pool, always with the status 'REQUESTED'
 * @param t The transaction running
 * @param rideRequest the ride request to add to the database
 * @returns the docid supplied by firebase
 */
export async function addRideRequestToPool(
  t: Transaction,
  rideRequest: RideRequest
): Promise<{ requestid: string; notifyDrivers: boolean }> {
  let notify: boolean = false;
  // how many rides were there in pool before add this one?
  const inThePool = query(
    rideRequestsCollection,
    where("status", "==", REQUESTED_STATUS)
  );
  const result = await getDocs(inThePool);
  // if there was previously 0 (before we add)
  // we need to notify drivers that rides now exist!!
  if (result.size == 0) {
    notify = true;
  }

  // make sure there are no pending rides in the database by this user
  const queryExistingRide = query(
    rideRequestsCollection,
    where("netid", "==", rideRequest.netid),
    where("status", "in", [
      REQUESTED_STATUS,
      VIEWING_STATUS,
      DRIVING_TO_PICK_UP_STATUS,
      DRIVER_AT_PICK_UP_STATUS,
      DRIVING_TO_DESTINATION_STATUS,
    ])
  );
  const inDatabase = await getDocs(queryExistingRide); // get the document by netid
  //  check if user is in problematicUsers table
  if (inDatabase.size > 0) {
    throw new Error(`${rideRequest.netid} already has a pending ride`);
  }
  rideRequest.completedAt = null;
  rideRequest.driverid = null;
  rideRequest.requestedAt = Timestamp.now();
  rideRequest.status = REQUESTED_STATUS;
  const docRef = doc(rideRequestsCollection);
  t.set(docRef, rideRequest);
  return { requestid: docRef.id, notifyDrivers: notify };
}

/**
 * Used for the ride request pool, returns all currently REQUESTED
 * ride requests.
 * @returns a list of RideRequests with status REQUESTED_STATUS
 */
export async function getRideRequests(): Promise<RideRequest[]> {
  const queryRides = query(
    rideRequestsCollection,
    where("status", "==", REQUESTED_STATUS)
  );
  const inDatabase = await getDocs(queryRides);
  const rideRequests: RideRequest[] = [];
  inDatabase.forEach((el) => {
    const rideRequest = el.data();
    rideRequest.requestId = el.id;
    rideRequests.push(rideRequest as RideRequest);
  });
  return rideRequests;
}

/**
 * Updates the status of the provided stuent's ride request to the provided status
 * @param status The status to change to CANCELED_STATUS, COMPLETED_STATUS, etc.
 * @param student_netid The netid of the STUDENT with the ride request to change
 */
export async function setRideRequestStatus(
  t: Transaction,
  status: RideRequestStatus,
  student_netid: string
) {
  // gets the student's ride that is not complete (COMPLETED or CANCELED_STATUS)
  // and changes its status
  const queryNetid = query(
    rideRequestsCollection,
    where("netid", "==", student_netid),
    where("status", "not-in", [CANCELED_STATUS, COMPLETED_STATUS])
  );
  // run the query
  const res = await getDocs(queryNetid);
  if (res.size !== 1) {
    // TODO: DOUBLE CHECK THIS
    throw new Error(
      `Expected exactly one active ride request for netid: ${student_netid}, found ${res.size}`
    );
  }
  const docRef = res.docs[0].ref;
  await updateDoc(docRef, { status: status });
}

/**
 * Returns if the student's ride request has been accepted or not
 * @param netid student's netid
 * @returns if there is a ride request by that student that has not been accepted, etc.
 */
export async function isNotAccepted(netid: string): Promise<boolean> {
  const queryNetid = query(
    rideRequestsCollection,
    where("netid", "==", netid),
    where("status", "in", [REQUESTED_STATUS, VIEWING_STATUS])
  );
  // run the query
  const res = await getDocs(queryNetid);
  if (res.size == 0) {
    return false;
  }
  return true;
}

/**
 * Set the driver id of a specific student's ride request
 * @param t The associated transaction
 * @param netid netid of the student who owns the ride request to update
 * @param driverid the id of the driver
 */
export async function setRideRequestDriver(
  t: Transaction,
  netid: string,
  driverid: string
) {
  // find any ride by student 'netid' that
  // is not accepted, not processed and not CANCELED_STATUS/COMPLETED_STATUS
  // aka not processed currently
  const queryNetid = query(
    rideRequestsCollection,
    where("netid", "==", netid),
    where("status", "in", [REQUESTED_STATUS, VIEWING_STATUS])
  );
  // run the query
  const res = await getDocs(queryNetid);

  if (res.size !== 1) {
    throw new Error(
      `Expected exactly one active ride request for netid: ${netid}, found ${res.size}`
    );
  }
  const docRef = res.docs[0].ref;
  await updateDoc(docRef, { driverid: driverid });
}

/**
 * Updates the driver location of the active ride request for the given student netid
 * @param t The associated transaction
 * @param netid the STUDENT's netid
 * @param driverLocation
 */
export async function setRideRequestDriverLocation(
  t: Transaction,
  netid: string,
  driverLocation: { latitude: number; longitude: number }
) {
  // find any ride by student 'netid' that
  // is not accepted, not processed and not CANCELED_STATUS/COMPLETED_STATUS
  // aka not processed currently
  const queryNetid = query(
    rideRequestsCollection,
    where("netid", "==", netid),
    where("status", "in", [REQUESTED_STATUS, VIEWING_STATUS])
  );
  // run the query
  const res = await getDocs(queryNetid);

  if (res.size !== 1) {
    throw new Error(
      `Expected exactly one active ride request for netid: ${netid}, found ${res.size}`
    );
  }

  // for each result (should only be one), check if the last update was less than 5 seconds ago
  res.forEach((el) => {
    const rideRequest = el.data() as RideRequest;
    // the driverLocation.lastUpdated can be null if this is the first update
    // if it is not null, check the time difference
    if (
      rideRequest.driverLocation.lastUpdated &&
      Timestamp.now().seconds - rideRequest.driverLocation.lastUpdated.seconds <
        5000
    ) {
      // it has been less than 5 seconds since last update
      console.log("Skipping driver location update, throttled");
      return; // skip this update
    }
  });

  const docRef = res.docs[0].ref;
  // update the driver location and lastUpdated
  await updateDoc(docRef, {
    driverLocation: {
      coords: driverLocation,
      lastUpdated: Date.now(),
    },
  });
}

/**
 * Updates the student location of the active ride request for the given student netid
 * @param t
 * @param netid the student's netid
 * @param studentLocation
 */
export async function setRideRequestStudentLocation(
  t: Transaction,
  netid: string,
  studentLocation: { latitude: number; longitude: number }
) {
  // find any ride by student 'netid' that
  // is not accepted, not processed and not CANCELED_STATUS/COMPLETED_STATUS
  // aka not processed currently
  const queryNetid = query(
    rideRequestsCollection,
    where("netid", "==", netid),
    where("status", "in", [REQUESTED_STATUS, VIEWING_STATUS])
  );
  // run the query
  const res = await getDocs(queryNetid);

  if (res.size !== 1) {
    throw new Error(
      `Expected exactly one active ride request for netid: ${netid}, found ${res.size}`
    );
  }

  // for each result (should only be one), check if the last update was less than 5 seconds ago
  res.forEach((el) => {
    const rideRequest = el.data() as RideRequest;
    if (
      Timestamp.now().seconds -
        rideRequest.studentLocation.lastUpdated.seconds <
      5000
    ) {
      // it has been less than 5 seconds since last update
      console.log("Skipping student location update, throttled");
      return; // skip this update
    }
  });

  const docRef = res.docs[0].ref;
  // update the student location and lastUpdated
  await updateDoc(docRef, {
    studentLocation: {
      coords: studentLocation,
      lastUpdated: Date.now(),
    },
  });
}

// CANCEL RIDE - Update a student ride request to CANCELED_STATUS
// Returns: the other id if there was a ride request that was accepted or null if not
// otherid is the netid of the driver if the driver is the one canceling
// or the netid of the student if the student is the one canceling
// notifyDrivers is true if there are no more rides in the pool after cancelation
// and we need to notify drivers that rides no longer exist
export async function cancelRideRequest(
  transaction: Transaction,
  netid: string,
  role: "STUDENT" | "DRIVER"
): Promise<{
  otherId: string | null;
  notifyDrivers: boolean;
  newRideStatus: type_canceled | type_requested;
}> {
  //tracks if need to notif drivers if no more rides exist after cancelation
  let notify: boolean = false;
  // assume until we change this that we are canceling the ride
  let newRideStatus: type_canceled | type_requested = CANCELED_STATUS;
  // save the num rides in pool for later
  const numRidesInPool = await getRideRequests();

  // look through all the ride requests made by this specific user using the status
  let queryRequests;
  if (role == "STUDENT") {
    // student query
    queryRequests = query(
      rideRequestsCollection,
      where("netid", "==", netid),
      where("status", "not-in", [CANCELED_STATUS, COMPLETED_STATUS])
    );
  } else {
    // driver query
    queryRequests = query(
      rideRequestsCollection,
      where("driverid", "==", netid),
      where("status", "not-in", [CANCELED_STATUS, COMPLETED_STATUS])
    );
  }
  // transaction doesn't support querying docs
  const result = await getDocs(queryRequests);

  let otherId: string | null = null;
  for (const doc of result.docs) {
    // change any active (based on status) request to CANCELED_STATUS
    const data = doc.data() as RideRequest;

    // If the CANCELED_STATUS request is being helped by a driver, notify the driver.
    if (role == "STUDENT") {
      otherId = data.driverid;
      // if the student cancels, the ride is always just CANCELED_STATUS
      await setRideRequestStatus(transaction, CANCELED_STATUS, netid);
    } else {
      otherId = data.netid; // this is the student's netid
      if (
        data.status != DRIVING_TO_DESTINATION_STATUS &&
        data.status != DRIVER_AT_PICK_UP_STATUS
      ) {
        // if the ride is not currently happening, or the driver is not at the pickup location
        // then any cancelation (say the driver signs out or app crashes)
        // should put the student back into the pool, not cancel the ride
        // ride status could be VIEWING or DRIVING TO PICK UP (hopefully not COMPLETED or CANCELED_STATUS)
        await setRideRequestStatus(transaction, REQUESTED_STATUS, otherId);
        newRideStatus = REQUESTED_STATUS;
        // erase the driver from the request
        await setRideRequestDriver(transaction, data.netid, "");
      } else {
        // the driver is waiting to start the ride and so a cancelation should actually cancel the ride
        // in the case that a cancelation occurs when status in DRIVING TO DROPOFF, we can't really
        // put the ride back in the queue, so we will cancel in this case too
        await setRideRequestStatus(transaction, CANCELED_STATUS, otherId);
      }
    }
  }

  // if no one had accepted this ride yet and it was the only one in the pool
  // only then, notify the drivers
  if (!otherId && numRidesInPool.length == 1) {
    notify = true;
  }

  return { otherId, notifyDrivers: notify, newRideStatus }; // return the driver id if there was a ride request that was accepted
}

// COMPLETE RIDE - Update a ride request to COMPLETED_STATUS
export async function completeRideRequest(
  transaction: Transaction,
  requestid: string
) {
  // get the ride request document by id
  const docRef = doc(rideRequestsCollection, requestid); // get the document by id
  const docSnap = await transaction.get(docRef);

  if (
    docSnap.exists() &&
    docSnap.data().status != DRIVING_TO_DESTINATION_STATUS
  ) {
    throw new Error(
      "Only can complete a ride that is 'DRIVING TO DESTINATION' not " +
        docSnap.data().status
    );
  }

  const data = docSnap.data();

  // if the ride request document does not exist, error out
  if (!data) {
    throw new Error("Ride Request data is undefined");
  }
  const netids = { student: data.netid, driver: data.driverid };

  // update the recent locations of the student to include the pikup and dropoff locations
  const docLoc = doc(recentlocationsCollection, netids.student);
  const docSnapLoc = await transaction.get(docLoc);
  let oldLocations: LocationType[] = [];

  // if the recent locations document does not exist, error out
  if (!docSnapLoc.exists()) {
    throw new Error(`${netids.student} does not exist in RecentLocations`);
  }

  // store the old locations in an array
  const dataLoc = docSnapLoc.data() as RecentLocation;
  oldLocations.push(...dataLoc.locations);

  // if the current pickup and dropoff locations are already in the array,
  // remove them to prevent duplicates
  oldLocations = oldLocations.filter(
    (location) => location.name !== data.locationTo.name
  );
  oldLocations = oldLocations.filter(
    (location) => location.name !== data.locationFrom.name
  );

  // add the new pickup and dropoff locations to the front of the array
  oldLocations.unshift(data.locationTo); // dropoff location
  // only add the pickup location if it doesn't have an asterisk
  // (the location will have an asterisk if the loaction is a snapped street)
  if (!data.locationFrom.name.includes("*")) {
    oldLocations.unshift(data.locationFrom); // pickup location
  }

  // limit the array to 20 locations
  oldLocations.slice(0, 20);

  // update the document with the new locations in the locations table
  transaction.update(docLoc, {
    locations: oldLocations,
  });

  // mark the ride request as COMPLETED_STATUS in the ride requests table
  transaction.update(docRef, {
    completedAt: Timestamp.now(),
    status: COMPLETED_STATUS,
  });
  return netids;
}

// ADD FEEDBACK - Add feedback to the database
export async function addFeedbackToDb(
  transaction: Transaction,
  feedback: Feedback
) {
  const docRef = doc(feedbackCollection); // let the db decide the key
  const toAdd = {
    ...feedback,
    date: Timestamp.now(),
  };
  transaction.set(docRef, toAdd);
}

// REPORT - Add problematic user to the database
export async function addProblematic(
  transaction: Transaction,
  problem: ProblematicUser
) {
  // for problematic users, we want the primary key to be the netid
  // just like the users table
  const docRef = doc(problematicUsersCollection, problem.netid);
  transaction.set(docRef, problem);
}

// BLACKLIST - Update a problematic user to blacklisted
export async function blacklistUser(transaction: Transaction, netid: string) {
  try {
    const docRef = doc(db, "ProblematicUsers", netid); // get the document by netid
    transaction.update(docRef, { category: "BLACKLISTED" });
  } catch (e) {
    throw new Error(
      `User not found in ProblematicUsers table: ${(e as Error).message}`
    );
  }
}

// LOCATIONS - Get opposite user
export async function getOtherNetId(netid: string): Promise<string> {
  const queryNetid = query(
    rideRequestsCollection,
    where("netid", "==", netid),
    where("status", "in", [
      DRIVING_TO_PICK_UP_STATUS,
      DRIVER_AT_PICK_UP_STATUS,
      DRIVING_TO_DESTINATION_STATUS,
    ])
  );
  // if something is returned here, the user is a student
  // and the opposite user is the driver
  let docs = await getDocs(queryNetid);
  if (docs.size != 0) {
    const data = docs.docs[0].data() as RideRequest;
    if (data.driverid) {
      return data.driverid;
    } else {
      throw new Error("Driver ID is null");
    }
  }

  // if we are here, the user is a driver
  // and the opposite user is the student
  const queryDriver = query(
    rideRequestsCollection,
    where("driverid", "==", netid),
    where("status", "in", [
      DRIVING_TO_PICK_UP_STATUS,
      DRIVER_AT_PICK_UP_STATUS,
      DRIVING_TO_DESTINATION_STATUS,
    ])
  );
  docs = await getDocs(queryDriver);
  if (docs.size != 0) {
    const data = docs.docs[0].data() as RideRequest;
    if (data.netid) {
      return data.netid;
    } else {
      throw new Error("Student ID is null");
    }
  }
  throw new Error("No accepted ride request found with user " + netid);
}

// QUERY - Get all ride requests based on parameters
export async function queryFeedback(
  rideOrApp?: "RIDE" | "APP",
  date?: { start: Date; end: Date },
  rating?: number
): Promise<Feedback[]> {
  const filters: {
    field: string;
    operator: WhereFilterOp;
    value: string | Date | number;
  }[] = [];
  if (rideOrApp) {
    filters.push({
      field: "rideOrApp",
      operator: "==",
      value: rideOrApp,
    });
  }
  if (date) {
    filters.push({
      field: "date",
      operator: ">=",
      value: new Date(date.start),
    });
    filters.push({
      field: "date",
      operator: "<=",
      value: new Date(date.end),
    });
  }
  if (rating) {
    filters.push({ field: "rating", operator: "==", value: rating });
  }

  const queryConstraints: QueryConstraint[] = filters.map((f) => {
    return where(f.field, f.operator, f.value);
  });
  const queriedFeedbacks = query(feedbackCollection, ...queryConstraints);

  // the transaction doesn't support querying docs
  // hopefully this is still concurrent
  const docs = await getDocs(queriedFeedbacks);
  return docs.docs.map((doc) => doc.data() as Feedback);
}

// PROFILE - Get a user's profile
export async function getProfile(
  transaction: Transaction,
  netid: string
): Promise<User> {
  const queryUsers = query(usersCollection, where("netid", "==", netid));
  const inDatabase = await getDocs(queryUsers);
  if (inDatabase.size != 1) {
    throw new Error(`There were ${inDatabase.size} users with netid: ${netid}`);
  }
  const userData = inDatabase.docs[0].data();
  if (userData === undefined) {
    throw new Error();
  }
  return userData as User;
}

const defaultCampusLocations: LocationType[] = [
  {
    name: "Alder Hall",
    address: "Alder Hall, 1315 NE Campus Pkwy, Seattle, WA 98105",
    coordinates: {
      latitude: 47.65546,
      longitude: -122.31419,
    },
  },
  {
    name: "Allen Library",
    address: "Allen Library, 4130 George Washington Ln NE, Seattle, WA 98195",
    coordinates: {
      latitude: 47.65554,
      longitude: -122.30703,
    },
  },
  {
    name: "Bagley Hall",
    address: "Bagley Hall, 3940 15th Ave NE, Seattle, WA 98195",
    coordinates: {
      latitude: 47.65348,
      longitude: -122.30884,
    },
  },
  {
    name: "Bloedel Hall",
    address: "Bloedel Hall, 3655 W Stevens Way NE, Seattle, WA 98195",
    coordinates: {
      latitude: 47.65128,
      longitude: -122.30765,
    },
  },
  {
    name: "Cedar Apartments",
    address: "Cedar Apartments, 10101 NE 40th Ave, Seattle, WA 98105",
    coordinates: {
      latitude: 47.65859,
      longitude: -122.31627,
    },
  },
  {
    name: "Chemistry Building (CHB)",
    address: "Chemistry Building, 4000 15th Ave NE, Seattle, WA 98195",
    coordinates: {
      latitude: 47.65292,
      longitude: -122.30835,
    },
  },
  {
    name: "Dempsey Hall (DEM)",
    address: "Dempsey Hall, 4215 E Stevens Way NE, Seattle, WA 98195",
    coordinates: {
      latitude: 47.6599,
      longitude: -122.308,
    },
  },
  {
    name: "Denny Hall (DEN)",
    address: "Denny Hall, 2004 Skagit Ln, Seattle, WA 98195",
    coordinates: {
      latitude: 47.65849324441406,
      longitude: -122.30882263356827,
    },
  },
  {
    name: "Elm Hall (ELM)",
    address: "Elm Hall, 1223 NE Campus Pkwy, Seattle, WA 98105",
    coordinates: {
      latitude: 47.6565,
      longitude: -122.3135,
    },
  },
  {
    name: "Engineering Library (ELB)",
    address: "Engineering Library, 4000 15th Ave NE, Seattle, WA 98195",
    coordinates: {
      latitude: 47.6535,
      longitude: -122.304,
    },
  },
  {
    name: "Founders Hall (FNDR)",
    address: "Founders Hall, 4215 E Stevens Way NE, Seattle, WA 98195",
    coordinates: {
      latitude: 47.6592,
      longitude: -122.3082,
    },
  },
  {
    name: "Fluke Hall (FLK)",
    address: "Fluke Hall, 4000 Mason Rd NE, Seattle, WA 98195",
    coordinates: {
      latitude: 47.653,
      longitude: -122.304,
    },
  },
  {
    name: "Gould Hall (GLD)",
    address: "Gould Hall, 3949 15th Ave NE, Seattle, WA 98195",
    coordinates: {
      latitude: 47.656,
      longitude: -122.313,
    },
  },
  {
    name: "Hitchcock Hall (HIT)",
    address: "Hitchcock Hall, 4000 15th Ave NE, Seattle, WA 98195",
    coordinates: {
      latitude: 47.6532,
      longitude: -122.3085,
    },
  },
  {
    name: "Husky Union Building (HUB)",
    address: "Husky Union Building, 4001 E Stevens Way NE, Seattle, WA 98195",
    coordinates: {
      latitude: 47.65557006903249,
      longitude: -122.30509195160619,
    },
  },
];
