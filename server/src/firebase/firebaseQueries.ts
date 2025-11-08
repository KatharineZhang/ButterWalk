import {
  // collection,
  // doc,
  getDocs,
  // getFirestore,
  query,
  where,
  QueryConstraint,
  DocumentReference,
  limit,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import {
  Feedback,
  RideRequest,
  CANCELED_STATUS,
  COMPLETED_STATUS,
  REQUESTED_STATUS,
  VIEWING_STATUS,
  User,
  DRIVING_TO_PICK_UP_STATUS,
  DRIVER_AT_PICK_UP_STATUS,
} from "../api";

// export const db = app;
export const usersCollection = db.ref("Users");
export const driversCollection = db.ref("/Drivers");
export const rideRequestsCollection = db.ref("/RideRequests");
export const problematicUsersCollection = db.ref("/ProblematicUsers");
export const feedbackCollection = db.ref("/Feedback");
export const recentlocationsCollection = db.ref("/RecentLocations");

/**
 * Checks if a driver ID exists in the Drivers collection.
 * This is a non-transactional read.
 * @param driverid The driver ID to verify.
 * @returns True if a single driver document exists, false otherwise.
 */
export async function verifyDriverId(driverid: string): Promise<boolean> {
  const q = query(driversCollection, where("driverid", "==", driverid));
  const querySnapshot = await getDocs(q);
  // Expect exactly one document
  return querySnapshot.size === 1;
}

/**
 * Gets a user's profile from the Users collection.
 */
export async function getProfile(netid: string): Promise<User> {
  // Query for the document where the 'netid' field matches
  const q = query(usersCollection, where("netid", "==", netid), limit(1));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error(`User profile not found for netid: ${netid}`);
  }

  // Assuming netid is unique, there should only be one document
  const userDoc = querySnapshot.docs[0];
  return userDoc.data() as User;
}

/**
 * Finds the active ride for a user and returns its data and reference.
 * @param id The driver's or student's netid.
 * @param role 'STUDENT' or 'DRIVER'.
 * @returns The ride data and its DocumentReference, or null if not found.
 */
export async function findActiveRideRef(
  id: string,
  role: "STUDENT" | "DRIVER"
): Promise<{ ride: RideRequest; ref: DocumentReference } | null> {
  const field = role === "STUDENT" ? "netid" : "driverid";
  const q = query(
    rideRequestsCollection,
    where(field, "==", id),
    where("status", "not-in", [CANCELED_STATUS, COMPLETED_STATUS])
  );

  const querySnapshot = await getDocs(q);

  if (querySnapshot.size > 1) {
    throw new Error(`Data integrity issue: Found ${querySnapshot.size} active rides for ${role} ${id}.`);
  }

  if (querySnapshot.empty) {
    return null;
  }

  const docSnap = querySnapshot.docs[0];
  return {
    ride: docSnap.data() as RideRequest,
    ref: docSnap.ref,
  };
}

/**
 * Gets all ride requests currently in the pool (status 'REQUESTED').
 * @returns An array of RideRequest objects.
 */
export async function getRideRequestsInPool(): Promise<(RideRequest & { requestId: string })[]> {
  const q = query(rideRequestsCollection, where("status", "==", REQUESTED_STATUS));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(
    (doc) => ({ ...doc.data(), requestId: doc.id } as RideRequest & { requestId: string })
  );
}

/**
 * Checks if a student's ride request is still in a state where it can be accepted.
 * @param netid The student's netid.
 * @returns True if the ride has a status of 'REQUESTED' or 'VIEWING'.
 */
export async function isRideAvailableForAcceptance(netid: string): Promise<boolean> {
  const q = query(
    rideRequestsCollection,
    where("netid", "==", netid),
    where("status", "in", [REQUESTED_STATUS, VIEWING_STATUS])
  );
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
}

/**
 * Gets the netid of the other user involved in an active ride.
 * @param netid The netid of the user making the request.
 * @returns The netid of the other user, or throws an error if no ride is found.
 */
export async function getOtherUserNetId(netid: string): Promise<string> {
    const activeRide = await findActiveRideRef(netid, "STUDENT") ?? await findActiveRideRef(netid, "DRIVER");
    if (!activeRide) {
        throw new Error("No active ride found for user " + netid);
    }

    const { ride } = activeRide;
    const isStudent = ride.netid === netid;

    if (isStudent && ride.driverid) {
        return ride.driverid;
    } else if (!isStudent) {
        return ride.netid;
    } else {
        throw new Error("Could not determine the other user in the ride.");
    }
}


/**
 * Queries the feedback collection based on optional filters.
 * @param rideOrApp Optional filter for 'RIDE' or 'APP'.
 * @param date Optional date range filter.
 * @param rating Optional rating filter.
 * @returns An array of Feedback objects.
 */
export async function queryFeedback(
  rideOrApp?: "RIDE" | "APP",
  date?: { start: Date; end: Date },
  rating?: number
): Promise<Feedback[]> {
  const filters: QueryConstraint[] = [];
  if (rideOrApp) {
    filters.push(where("rideOrApp", "==", rideOrApp));
  }
  if (date) {
    filters.push(where("date", ">=", new Date(date.start)));
    filters.push(where("date", "<=", new Date(date.end)));
  }
  if (rating) {
    filters.push(where("rating", "==", rating));
  }

  const q = query(feedbackCollection, ...filters);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as Feedback);
}

/**
 * Finds an active ride for a user that is in a state
 * appropriate for adding a call log.
 * @param id The netid of the user (student or driver).
 * @param role The role of the user.
 * @returns A DocumentReference to the ride, or null if not found.
 */
export async function findActiveRideForCall(
  id: string,
  role: "STUDENT" | "DRIVER"
): Promise<DocumentReference | null> {
  const field = role === "STUDENT" ? "netid" : "driverid";
  const q = query(
    rideRequestsCollection,
    where(field, "==", id),
    where("status", "in", [
      DRIVING_TO_PICK_UP_STATUS,
      DRIVER_AT_PICK_UP_STATUS,
    ]),
    limit(1) // We only expect one
  );

  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return null;
  }
  return querySnapshot.docs[0].ref;
}