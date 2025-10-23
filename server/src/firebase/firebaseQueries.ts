// firebaseQueries.ts
// This file contains all non-transactional, read-only functions for interacting with Firestore.
import {
  collection,
  // doc,
  getDocs,
  getFirestore,
  query,
  where,
  // limit,
  // orderBy,
  QueryConstraint,
  // WhereFilterOp,
  DocumentReference,
  // Timestamp,
} from "firebase/firestore";
import { app } from "./firebaseConfig";
import {
  Feedback,
  // RecentLocation,
  RideRequest,
  // User,
  CANCELED_STATUS,
  COMPLETED_STATUS,
  REQUESTED_STATUS,
  VIEWING_STATUS,
  // DRIVING_TO_PICK_UP_STATUS,
  // DRIVER_AT_PICK_UP_STATUS,
  // DRIVING_TO_DESTINATION_STATUS,
} from "../api";

// --- DATABASE INITIALIZATION AND COLLECTIONS ---
export const db = getFirestore(app);
export const usersCollection = collection(db, "Users");
export const rideRequestsCollection = collection(db, "RideRequests");
export const problematicUsersCollection = collection(db, "ProblematicUsers");
export const feedbackCollection = collection(db, "Feedback");
export const recentlocationsCollection = collection(db, "RecentLocations");

// --- QUERY FUNCTIONS ---

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
