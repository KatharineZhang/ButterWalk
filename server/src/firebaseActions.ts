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
} from "./api";

export const db = getFirestore(app);

// GREAT RESOURCE FOR BASIC FIRESTORE WORK: https://www.youtube.com/watch?v=kwVbKV0ZFEs

// Our tables / collections in the database
const usersCollection = collection(db, "Users");
const rideRequestsCollection = collection(db, "RideRequests");
const problematicUsersCollection = collection(db, "ProblematicUsers");
const feedbackCollection = collection(db, "Feedback");
const recentlocationsCollection = collection(db, "RecentLocations");

// RECENT_LOCATIONS - get the recent locations of a user
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
    transaction.set(docLocationRef, campusLocations);
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

// REQUEST RIDE - Add a ride request to the database
export async function addRideRequest(
  transaction: Transaction,
  netid: string,
  location: LocationType,
  destination: LocationType,
  numRiders: number
): Promise<string> {
  // make sure there are no pending rides in the database by this user
  const queryExistingRide = query(
    rideRequestsCollection,
    where("netid", "==", netid),
    where("status", "in", ["REQUESTED", "ACCEPTED"])
  );
  const inDatabase = await getDocs(queryExistingRide); // get the document by netid
  //  check if user is in problematicUsers table
  if (inDatabase.size > 0) {
    throw new Error(`${netid} already has a pending ride`);
  }
  const rideRequest: RideRequest = {
    netid,
    driverid: null,
    completedAt: null,
    locationFrom: location,
    locationTo: destination,
    numRiders,
    status: "REQUESTED",
  };
  // make a new document and let the db decide the key
  const docRef = doc(rideRequestsCollection);
  await transaction.set(docRef, rideRequest);
  return docRef.id;
}

// ACCEPT RIDE - Update a ride request to accepted
export async function acceptRideRequest(
  transaction: Transaction,
  requestid: string,
  driverid: string
) {
  const docRef = doc(rideRequestsCollection, requestid); // get the document by id
  const docSnap = await transaction.get(docRef);
  await transaction.update(docRef, { driverid, status: "ACCEPTED" });
  return docSnap.data() as RideRequest; // return the updated document data
}

// CANCEL RIDE - Update a ride request to canceled
// returns the driver id if there was a ride request that was accepted or null if not
export async function cancelRideRequest(
  transaction: Transaction,
  netid: string,
  role: "STUDENT" | "DRIVER"
): Promise<string | null> {
  // look through all the ride requests made by this specific user using the status
  let queryRequests;
  if (role == "STUDENT") {
    // student query
    queryRequests = query(rideRequestsCollection, where("netid", "==", netid));
  } else {
    // driver query
    queryRequests = query(
      rideRequestsCollection,
      where("driverid", "==", netid)
    );
  }
  // transaction doesn't support querying docs
  const docs = await getDocs(queryRequests);

  let otherid: string | null = null;
  for (const doc of docs.docs) {
    // change any active (based on status) request to canceleD
    const data = doc.data() as RideRequest;

    // only cancel requests that are not completed
    if (data.status != "REQUESTED" && data.status != "ACCEPTED") {
      continue;
    }

    if (data.status == "ACCEPTED") {
      // if a request was accepted, notify the corresponding driver
      if (role == "STUDENT") {
        otherid = data.driverid;
      } else {
        otherid = data.netid;
      }
    }

    await transaction.update(doc.ref, { status: "CANCELLED" });
  }

  return otherid; // return the driver id if there was a ride request that was accepted
}

// COMPLETE RIDE - Update a ride request to completed
export async function completeRideRequest(
  transaction: Transaction,
  requestid: string
) {
  // get the ride request document by id
  const docRef = doc(rideRequestsCollection, requestid); // get the document by id
  const docSnap = await transaction.get(docRef);

  if (docSnap.exists() && docSnap.data().status != "ACCEPTED") {
    throw new Error(
      "Only can complete a ride that is 'ACCEPTED' not " + docSnap.data().status
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
    (location) => location !== data.locationTo
  );
  oldLocations = oldLocations.filter(
    (location) => location !== data.locationFrom
  );

  // add the new pickup and dropoff locations to the front of the array
  oldLocations.unshift(data.locationTo); // dropoff location
  // only add the pickup location if it doesn't have an asterisk
  // (the location will have an asterisk if the loaction is a snapped street)
  if (!data.locationFrom.includes("*")) {
    oldLocations.unshift(data.locationFrom); // pickup location
  }

  // limit the array to 20 locations
  oldLocations.slice(0, 20);

  // update the document with the new locations in the locations table
  transaction.update(docLoc, {
    locations: oldLocations,
  });

  // mark the ride request as completed in the ride requests table
  transaction.update(docRef, {
    completedAt: Timestamp.now(),
    status: "COMPLETED",
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
    throw new Error(`User not found in ProblematicUsers table: ${e}`);
  }
}

// LOCATIONS - Get opposite user
export async function getOtherNetId(netid: string): Promise<string> {
  const queryNetid = query(
    rideRequestsCollection,
    where("netid", "==", netid),
    where("status", "==", "ACCEPTED")
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
    where("status", "==", "ACCEPTED")
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
  const docRef = doc(usersCollection, netid);
  const docSnap = await transaction.get(docRef);
  if (!docSnap.exists()) {
    throw new Error(`User with netid: ${netid} does not exist`);
  }
  return docSnap.data() as User;
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
