// This is where we will directly interact with the firestore database
import app from "./firebaseConfig";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  QueryConstraint,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  WhereFilterOp,
} from "firebase/firestore";
import { Feedback, ProblematicUser, RideRequest, User } from "./api";

const db = getFirestore(app);

// GREAT RESOURCE FOR BASIC FIRESTORE WORK: https://www.youtube.com/watch?v=kwVbKV0ZFEs

// Various tables / collections in the database
// const usersCollection = collection(db, "Users");
const rideRequestsCollection = collection(db, "RideRequests");
const problematicUsersCollection = collection(db, "ProblematicUsers");
const feedbackCollection = collection(db, "Feedback");

// SIGN IN - Adds a user to the database
export async function createUser(user: User) {
  // setDoc will replace an existing document or create a new one if it didn't previously exist
  // use the net id of the user as the document id
  return await setDoc(doc(db, "Users", user.netid), user);
}

// SIGN IN - check if a specific user is in the ProblematicUsers table
// returns true if they are blacklisted and false otherwise
export async function isProblematic(netid: string): Promise<boolean> {
  const queryNetid = query(
    problematicUsersCollection,
    where("netid", "==", netid),
    where("blacklisted", "==", 1)
  );
  return (await getDocs(queryNetid)).size == 1;
}

// REQUEST RIDE - Add a ride request to the database
export async function addRideRequest(
  netid: string,
  location: string,
  destination: string,
  numRiders: number
): Promise<string> {
  // make sure there are no pending rides in the database by this user
  const queryExistingRide = query(
    rideRequestsCollection,
    where("netid", "==", netid),
    where("status", "in", [0, 1])
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
    status: 0, // 0 for requested
  };
  const addedRequest = await addDoc(rideRequestsCollection, rideRequest);
  return addedRequest.id; // the autogenerated request id
}

// ACCEPT RIDE - Update a ride request to accepted
export async function acceptRideRequest(requestid: string, driverid: string) {
  const docRef = doc(rideRequestsCollection, requestid); // get the document by id
  await updateDoc(docRef, { driverid, status: 1 }); // 1 for accepted
  const docSnap = await getDoc(docRef);
  return docSnap.data() as RideRequest; // return the updated document data
}

// CANCEL RIDE - Update a ride request to canceled
// returns the driver id if there was a ride request that was accepted or null if not
export async function cancelRideRequest(
  netid: string,
  role: 0 | 1
): Promise<string | null> {
  // look through all the ride requests made by this specific user using the status
  let queryRequests;
  if (role == 0) {
    // student query
    queryRequests = query(rideRequestsCollection, where("netid", "==", netid));
  } else {
    // driver query
    queryRequests = query(
      rideRequestsCollection,
      where("driverid", "==", netid)
    );
  }
  const docs = await getDocs(queryRequests);

  let driverid: string | null = null;
  docs.forEach(async (doc) => {
    // change any active (based on status) request to canceled (status: -1)
    const data = doc.data() as RideRequest;
    if (data.status == 1) {
      // if a request has a status of 1, notify the corresponding driver
      driverid = data.driverid;
    }
    await updateDoc(doc.ref, { status: -1 });
  });

  return driverid; // return the driver id if there was a ride request that was accepted
}

// COMPLETE RIDE - Update a ride request to completed
export async function completeRideRequest(requestid: string) {
  const docRef = doc(rideRequestsCollection, requestid); // get the document by id
  return await updateDoc(docRef, { completedAt: Timestamp.now(), status: 2 }); // 2 for completed
}

// ADD FEEDBACK - Add feedback to the database
export async function addFeedbackToDb(feedback: Feedback) {
  const toAdd = {
    ...feedback,
    date: Timestamp.now(),
  };
  return await addDoc(feedbackCollection, toAdd);
}

// REPORT - Add problematic user to the database
export async function addProblematic(problem: ProblematicUser) {
  return await addDoc(problematicUsersCollection, problem);
}

// BLACKLIST - Update a problematic user to blacklisted
export async function blacklistUser(netid: string) {
  const queryProblem = query(
    problematicUsersCollection,
    where("netid", "==", netid)
  );
  const inDatabase = await getDocs(queryProblem); // get the document by netid
  //  check if user is in problematicUsers table
  if (inDatabase.size == 0) {
    throw new Error(`${netid} not found in ProblematicUsers table`);
  }
  const docRef = doc(problematicUsersCollection, inDatabase.docs[0].id);
  return await updateDoc(docRef, { blacklisted: 1 }); // 1 for blacklisted
}

// LOCATIONS - Get opposite user
export async function getOtherNetId(netid: string): Promise<string> {
  const queryNetid = query(
    rideRequestsCollection,
    where("netid", "==", netid),
    where("status", "==", 1)
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
    where("status", "==", 1)
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
  throw new Error("No accepted ride request found with user" + netid);
}

// QUERY - Get all ride requests based on parameters
export async function queryFeedback(
  rideorApp?: 0 | 1,
  date?: { start: Date; end: Date },
  rating?: number
): Promise<Feedback[]> {
  const filters: {
    field: string;
    operator: WhereFilterOp;
    value: string | Date | number;
  }[] = [];
  if (rideorApp) {
    filters.push({
      field: "rideorApp",
      operator: "==",
      value: rideorApp.toString(),
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

  const docs = await getDocs(queriedFeedbacks);
  return docs.docs.map((doc) => doc.data() as Feedback);
}
