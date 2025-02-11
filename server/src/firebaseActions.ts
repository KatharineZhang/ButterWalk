// This is where we will directly interact with the firestore database
import { app } from "./firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  QueryConstraint,
  Timestamp,
  Transaction,
  where,
  WhereFilterOp
} from "firebase/firestore";
import { Feedback, ProblematicUser, RideRequest, User } from "./api";

export const db = getFirestore(app);

// GREAT RESOURCE FOR BASIC FIRESTORE WORK: https://www.youtube.com/watch?v=kwVbKV0ZFEs

// Our tables / collections in the database
const usersCollection = collection(db, "Users");
const rideRequestsCollection = collection(db, "RideRequests");
const problematicUsersCollection = collection(db, "ProblematicUsers");
const feedbackCollection = collection(db, "Feedback");

// SIGN IN - Adds a user to the database if they are not problematic
// this is a completely NEW USER
export async function createUser(transaction: Transaction, user: User) {
  // check if the user is in the problematicUsers table with a blacklisted status
  const isProblematic = doc(db, "ProblematicUsers", user.netid);
  const problematicDoc = await getDoc(isProblematic);
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
  if(docSnap.exists()) {
    console.log("User already exists in the database");
    return true;
  } else {
    console.log("User does NOT exists in the database");
    await transaction.set(docRef, user);
    return false;
  }
}



// FINISH ACCOUNT CREATION - add phone number and student num to the database
// associated with the user's unique netid

export async function finishCreatingUser(transaction: Transaction, netid: string, phone_number: string, student_number: string) {
  // use the net id of the user as the document id
  const docRef = doc(usersCollection, netid);
  const docSnap = await transaction.get(docRef);
  if(docSnap.exists()) {
    console.log("User already exists in the database");

    try {
      await transaction.update(docRef, {
        phone_number: phone_number,
        student_number: student_number
      });

      return true;
    } catch (error) {
      console.log(`Error occured when updating user databse: ${error}`);
      return false;
    }
  } else {
    console.log("User does NOT exists in the database");
    return false;
  }
}

// REQUEST RIDE - Add a ride request to the database
export async function addRideRequest(
  transaction: Transaction,
  netid: string,
  location: string,
  destination: string,
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

  let driverid: string | null = null;
  docs.forEach(async (doc) => {
    // change any active (based on status) request to canceleD
    const data = doc.data() as RideRequest;

    // only cancel requests that are not completed
    if (data.status != "REQUESTED" && data.status != "ACCEPTED") {
      throw new Error(
        "Cannot cancel a ride that is not 'requested' or 'accepted'"
      );
    }

    if (data.status == "ACCEPTED") {
      // if a request was accepted, notify the corresponding driver
      driverid = data.driverid;
    }

    await transaction.update(doc.ref, { status: "CANCELLED" });
  });

  return driverid; // return the driver id if there was a ride request that was accepted
}

// COMPLETE RIDE - Update a ride request to completed
export async function completeRideRequest(
  transaction: Transaction,
  requestid: string
) {
  const docRef = doc(rideRequestsCollection, requestid); // get the document by id
  const docSnap = await transaction.get(docRef);
  if (docSnap.exists() && docSnap.data().status != "ACCEPTED") {
    throw new Error(
      "Only can complete a ride that is 'accepted' not " + docSnap.data().status
    );
  }
  transaction.update(docRef, {
    completedAt: Timestamp.now(),
    status: "COMPLETED",
  });
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
  throw new Error("No accepted ride request found with user" + netid);
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
