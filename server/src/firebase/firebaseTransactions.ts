import {
  DocumentReference,
  Timestamp,
  Transaction,
} from "firebase-admin/firestore";
import {
  Feedback,
  ProblematicUser,
  RecentLocation,
  RideRequest,
  RideRequestStatus,
  User,
  CANCELED_STATUS,
  COMPLETED_STATUS,
  DRIVING_TO_DESTINATION_STATUS,
  DRIVING_TO_PICK_UP_STATUS,
  REQUESTED_STATUS,
  VIEWING_STATUS,
  DRIVER_AT_PICK_UP_STATUS,
  CallLog,
} from "../api";
import {
  usersCollection,
  problematicUsersCollection,
  recentlocationsCollection,
  feedbackCollection,
  rideRequestsCollection,
} from "./firebaseQueries";
import { defaultCampusLocations } from "../constants/defaultCampusLocations";
import { RideTakenError } from "./errors";

/**
 * Logic to create a new user if they don't exist and are not blacklisted.
 * This also creates a default list of recent locations for the new user.
 * @param t The transaction object.
 * @param user The user object to create.
 * @returns A boolean indicating if the user already existed with a phone number.
 */
export async function createUserLogic(
  t: Transaction,
  user: User
): Promise<boolean> {
  const problematicRef = problematicUsersCollection.doc(user.netid);
  const userRef = usersCollection.doc(user.netid);
  const locationRef = recentlocationsCollection.doc(user.netid);

  const [problematicDoc, userDoc] = await Promise.all([
    t.get(problematicRef),
    t.get(userRef),
  ]);

  const problematicData = problematicDoc.data();
  if (
    problematicDoc.exists &&
    problematicData && 
    problematicData.category === "BLACKLISTED"
  ) {
    throw new Error("User is blacklisted.");
  }

  if (userDoc.exists) {
    // User exists, check if their account is fully set up.
    const userData = userDoc.data() as User;
    if (!userData) {
      throw new Error("User document exists but data is missing.");
    }
    return userData.phoneNumber !== null;
  } else {
    // New user, create both user and recent locations documents.
    t.set(userRef, user);
    t.set(locationRef, { locations: defaultCampusLocations });
    return false;
  }
}

/**
 * Logic to add phone and student numbers to a user's profile.
 * @param t The transaction object.
 * @param netid The user's netid.
 * @param preferredName The user's preferred name.
 * @param phoneNumber The user's phone number.
 * @param studentNumber The user's student number.
 */
export async function finishCreatingUserLogic(
  t: Transaction,
  netid: string,
  preferredName: string,
  phoneNumber: string,
  studentNumber: string
) {
  const userRef = usersCollection.doc(netid);
  const userDoc = await t.get(userRef);
  if (!userDoc.exists) {
    throw new Error("User does not exist to be updated.");
  }
  t.update(userRef, { preferredName, phoneNumber, studentNumber });
}

/**
 * Logic to add a new ride request to the pool.
 * @param t The transaction object.
 * @param newRide The ride request data.
 * @returns The ID of the newly created ride request document.
 */
export function addRideRequestToPoolLogic(
  t: Transaction,
  newRide: Omit<RideRequest, "requestId">
): DocumentReference {
  const rideRef = rideRequestsCollection.doc();
  t.set(rideRef, {
    ...newRide,
    status: REQUESTED_STATUS,
    requestedAt: Timestamp.now(),
  });
  return rideRef;
}

/**
 * Logic to assign a ride to a driver for viewing.
 * @param t The transaction object.
 * @param rideToViewRef The DocumentReference of the ride to be viewed.
 * @param driverid The ID of the driver who will view the ride.
 */
export async function assignRideForViewingLogic(
  t: Transaction,
  rideToViewRef: DocumentReference,
  driverid: string
) {
  const rideDoc = await t.get(rideToViewRef);
  const rideData = rideDoc.data();

  // Possible race condition: some other driver also tried to view at the same
  // time and won the transaction. Now the ride we thought existed is not available.
  if (!rideDoc.exists || !rideData || rideData.status !== REQUESTED_STATUS) {
    throw new RideTakenError("This ride is no longer available to be viewed.");
  }

  t.update(rideToViewRef, {
    status: VIEWING_STATUS,
    driverid: driverid,
  });
}

/**
 * Logic to handle a driver's decision on a ride they are viewing.
 * @param t The transaction object.
 * @param rideRef The reference to the ride document.
 * @param driverid The ID of the driver.
 * @param decision The driver's decision ('ACCEPT' or 'DENY').
 * @returns The new status of the ride.
 */
export async function handleDriverViewChoiceLogic(
  t: Transaction,
  rideRef: DocumentReference,
  driverid: string,
  decision: "ACCEPT" | "DENY" | "TIMEOUT" | "ERROR"
): Promise<RideRequestStatus> {
  const rideDoc = await t.get(rideRef);
  if (!rideDoc.exists) throw new Error("Ride does not exist.");

  const rideData = rideDoc.data() as RideRequest;
  if (rideData.status !== VIEWING_STATUS) {
    throw new Error("Ride is no longer in the viewing state.");
  }

  if (decision === "ACCEPT") {
    t.update(rideRef, { status: DRIVING_TO_PICK_UP_STATUS, driverid });
    return DRIVING_TO_PICK_UP_STATUS;
  } else {
    // DENY, TIMEOUT, or ERROR all return the ride to the pool
    t.update(rideRef, { status: REQUESTED_STATUS, driverid: null });
    return REQUESTED_STATUS;
  }
}

/**
 * Logic for canceling a ride.
 * @param t The transaction object.
 * @param ride The ride data.
 * @param rideRef The reference to the ride document.
 * @param role The role of the person canceling.
 * @returns An object with the new status and the other user's ID.
 */
export function cancelRideLogic(
  t: Transaction,
  ride: RideRequest,
  rideRef: DocumentReference,
  role: "STUDENT" | "DRIVER"
): { otherId: string | null; newRideStatus: RideRequestStatus } {
  let otherId: string | null = null;
  let newRideStatus: RideRequestStatus = CANCELED_STATUS;

  if (role === "STUDENT") {
    otherId = ride.driverid;
    t.update(rideRef, { status: CANCELED_STATUS });
  } else {
    // Role is "DRIVER"
    otherId = ride.netid;
    if (
      ride.status === DRIVING_TO_PICK_UP_STATUS ||
      ride.status === VIEWING_STATUS
    ) {
      t.update(rideRef, { status: REQUESTED_STATUS, driverid: null });
      newRideStatus = REQUESTED_STATUS;
    } else {
      t.update(rideRef, { status: CANCELED_STATUS });
    }
  }
  return { otherId, newRideStatus };
}

/**
 * Logic to mark a ride as complete and update recent locations.
 * @param t The transaction object.
 * @param rideRef The reference to the ride document.
 */
export async function completeRideLogic(
  t: Transaction,
  rideRef: DocumentReference
) {
  const rideDoc = await t.get(rideRef);
  if (!rideDoc.exists) throw new Error("Ride does not exist.");

  const ride = rideDoc.data() as RideRequest;
  if (ride.status !== DRIVING_TO_DESTINATION_STATUS) {
    throw new Error(
      "Ride must be in 'DRIVING TO DESTINATION' status to be completed."
    );
  }

  // Update recent locations for the student
  const locationRef = recentlocationsCollection.doc(ride.netid);
  const locationDoc = await t.get(locationRef);
  const locationData = locationDoc.data() as RecentLocation;
  const currentLocations = locationDoc.exists && locationData
    ? locationData.locations
    : [];

  const newLocations = [ride.locationTo, ride.locationFrom, ...currentLocations]
    .filter(
      (loc, index, self) => index === self.findIndex((l) => l.name === loc.name)
    )
    .slice(0, 20);

  t.set(locationRef, { netid: ride.netid, locations: newLocations });

  t.update(rideRef, { status: COMPLETED_STATUS, completedAt: Timestamp.now() });

  return { student: ride.netid, driver: ride.driverid };
}

/**
 * Logic to update the status of a ride.
 * @param t The transaction object.
 * @param rideRef The reference to the ride document.
 * @param status The new status.
 */
export function setRideStatusLogic(
  t: Transaction,
  rideRef: DocumentReference,
  status: RideRequestStatus
) {
  const updateData: { status: RideRequestStatus; pickedUpAt?: Timestamp } = {
    status,
  };
  if (status === DRIVING_TO_DESTINATION_STATUS) {
    updateData.pickedUpAt = Timestamp.now();
  }
  t.update(rideRef, updateData);
}

/**
 * Logic to add feedback to the database.
 * @param t The transaction object.
 * @param feedback The feedback data.
 */
export function addFeedbackLogic(
  t: Transaction,
  feedback: Omit<Feedback, "date">
) {
  const feedbackRef = feedbackCollection.doc();
  t.set(feedbackRef, { ...feedback, date: Timestamp.now() });
}

/**
 * Logic to report a problematic user.
 * @param t The transaction object.
 * @param problem The problematic user data.
 */
export function reportUserLogic(t: Transaction, problem: ProblematicUser) {
  const problemRef = problematicUsersCollection.doc(problem.netid);
  t.set(problemRef, { ...problem, category: "REPORTED" });
}

/**
 * Logic to blacklist a user.
 * @param t The transaction object.
 * @param netid The netid of the user to blacklist.
 */
export function blacklistUserLogic(t: Transaction, netid: string) {
  const problemRef = problematicUsersCollection.doc(netid);
  t.update(problemRef, { category: "BLACKLISTED" });
}

/**
 * Atomically adds a new call log entry to a ride request.
 * @param t The transaction object.
 * @param rideRef The DocumentReference of the ride to update.
 * @param from The netid of the caller.
 * @param to The netid of the user being called.
 * @param phoneNumberCalled The phone number that was called.
 */
export async function addCallLogLogic(
  t: Transaction,
  rideRef: DocumentReference,
  from: string,
  to: string,
  phoneNumberCalled: string
) {
  const rideDoc = await t.get(rideRef);
  if (!rideDoc.exists) {
    throw new Error("Ride request does not exist.");
  }

  const ride = rideDoc.data() as RideRequest;

  // Ensure the ride is still in the correct state
  if (
    ride.status !== DRIVING_TO_PICK_UP_STATUS &&
    ride.status !== DRIVER_AT_PICK_UP_STATUS
  ) {
    throw new Error(
      `Ride is no longer in a state to be called (Status: ${ride.status}).`
    );
  }

  const newCallLogEntry: CallLog = {
    from,
    to,
    phoneNumberCalled,
    timestamp: Timestamp.now(),
  };

  const oldCallLog: CallLog[] = ride.callLog || [];

  t.update(rideRef, {
    callLog: [...oldCallLog, newCallLogEntry],
  });
}