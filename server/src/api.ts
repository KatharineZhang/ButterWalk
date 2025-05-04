// This is where all the server / database data structures will go
import { Timestamp } from "firebase/firestore";
import { AuthSessionResult } from "expo-auth-session";

// Webhook commands
export type Command =
  | "CONNECT"
  | "SIGNIN"
  | "FINISH_ACC"
  | "REQUEST_RIDE"
  | "ACCEPT_RIDE"
  | "CANCEL"
  | "COMPLETE"
  | "ADD_FEEDBACK"
  | "REPORT"
  | "BLACKLIST"
  | "WAIT_TIME"
  | "LOCATION"
  | "QUERY"
  | "PROFILE"
  | "DISTANCE"
  | "ERROR";

// Input types
export type WebSocketMessage =
  | { directive: "DISCONNECT" }
  | { directive: "CONNECT"; netid: string; role: "STUDENT" | "DRIVER" } // TODO: REMOVE THIS ONCE BYPASS SIGNIN IS REMOVED
  | {
      directive: "SIGNIN";
      response: AuthSessionResult;
      role: "STUDENT" | "DRIVER";
    }
  | {
      directive: "FINISH_ACC";
      netid: string;
      preferredName: string;
      phoneNum: string;
      studentNum: string;
    }
  | {
      directive: "REQUEST_RIDE";
      phoneNum: string;
      netid: string;
      location: string;
      destination: string;
      numRiders: number;
    }
  | { directive: "ACCEPT_RIDE"; driverid: string }
  | { directive: "CANCEL"; netid: string; role: "STUDENT" | "DRIVER" }
  | { directive: "COMPLETE"; requestid: string }
  | {
      directive: "ADD_FEEDBACK";
      rating: number;
      feedback: string;
      rideOrApp: "RIDE" | "APP";
    }
  | { directive: "REPORT"; netid: string; requestid: string; reason: string }
  | { directive: "BLACKLIST"; netid: string }
  | {
      directive: "WAIT_TIME";
      requestedRide?: {
        pickUpLocation: { latitude: number; longitude: number };
        dropOffLocation: { latitude: number; longitude: number };
      };
      requestid?: string;
      driverLocation?: { latitude: number; longitude: number };
    }
  | {
      directive: "LOCATION";
      id: string; // the netid of the student or driver
      latitude: number;
      longitude: number;
    }
  | {
      directive: "QUERY";
      rideOrApp?: "RIDE" | "APP"; // if rideOrApp is undefined, the default is to query both feebcack types
      date?: { start: Date; end: Date };
      rating?: number;
    }
  | { directive: "PROFILE"; netid: string }
  | {
      directive: "DISTANCE";
      origin: { latitude: number; longitude: number }[];
      destination: { latitude: number; longitude: number }[];
      mode: "driving" | "walking";
    };

// TEMP FIX
export type ConnectMessage = {
  directive: "CONNECT";
  netid: string;
  role: "STUDENT" | "DRIVER";
};

// Response types
export type WebSocketResponse =
  | GeneralResponse
  | SignInResponse
  | FinishAccCreationResponse
  | RequestRideResponse
  | WaitTimeResponse
  | AcceptResponse
  | DriverAcceptResponse
  | CancelResponse
  | CompleteResponse
  | LocationResponse
  | QueryResponse
  | ProfileResponse
  | DistanceResponse
  | ErrorResponse;

export type GeneralResponse = {
  response:
    | "CONNECT"
    | "SIGNIN"
    | "FINISH_ACC"
    | "CANCEL"
    | "COMPLETE"
    | "ADD_FEEDBACK"
    | "REPORT"
    | "BLACKLIST"
    | "ACCEPT_RIDE";
  success: true;
};

export type SignInResponse = {
  response: "SIGNIN";
  success: true;
  alreadyExists: boolean;
  netid: string;
};

export type FinishAccCreationResponse = {
  response: "FINISH_ACC";
  success: boolean;
};

export type RequestRideResponse = {
  response: "REQUEST_RIDE";
  requestid: string;
};

/**
 * Represents a response provided by the server given to a driver
 * who wants to view a ride, contains information about the ride
 * request they are being provided and the associated student
 * who requested the ride, or rideExists is false if there are
 * not rides to be returned.
 */
export type ViewRideRequestResponse = {
  response: "VIEW_RIDE_REQUEST";
  rideExists: boolean;
  view?: {
    rideRequest: RideRequest;
    user: User;
  }
}

/**
 * After a driver views a ride request checked out to them temporarily
 * by the broker, they choose to accept/deny/report etc, and after
 * doing so are returned a response of this type indicating the successful
 * or unsuccesful assignment of the ride to them.
 */
export type ViewChoiceResponse = {
  response: "VIEW_CHOICE";
  providedView: ViewRideRequestResponse;
  success: boolean;
}

export type WaitTimeResponse = {
  response: "WAIT_TIME";
  rideDuration: number;
  driverETA: number;
  pickUpAddress?: string;
  dropOffAddress?: string;
};

export type AcceptResponse = {
  response: "ACCEPT_RIDE";
  student: { response: "ACCEPT_RIDE"; success: true }; // of type GeneralResponse
  driver: DriverAcceptResponse;
};

export type DriverAcceptResponse = {
  response: "ACCEPT_RIDE";
  netid: string;
  location: string;
  destination: string;
  numRiders: number;
  requestid: string;
};

export type CancelResponse = {
  response: "CANCEL";
  info: { response: "CANCEL"; success: true }; // of type GeneralResponse
  otherNetid?: string;
};

export type CompleteResponse = {
  response: "COMPLETE";
  info: { response: "COMPLETE"; success: true }; // of type GeneralResponse
  netids: { student: string; driver: string };
};

export type LocationResponse = {
  response: "LOCATION";
  netid: string;
  latitude: number;
  longitude: number;
};

export type QueryResponse = {
  response: "QUERY";
  numberOfEntries: number;
  feedback: Feedback[];
};

export type ProfileResponse = {
  response: "PROFILE";
  user: User;
};

export type ErrorResponse = {
  response: "ERROR";
  error: string;
  category:
    | "CONNECT"
    | "SIGNIN"
    | "COMPLETE"
    | "ADD_FEEDBACK"
    | "REPORT"
    | "BLACKLIST"
    | "WAIT_TIME"
    | "REQUEST_RIDE"
    | "ACCEPT_RIDE"
    | "CANCEL"
    | "LOCATION"
    | "QUERY"
    | "PROFILE"
    | "DISTANCE"
    | "FINISH_ACC";
};

export type DistanceResponse = {
  response: "DISTANCE";
  apiResponse: DistanceMatrixResponse;
};
export type DistanceMatrixResponse = {
  destination_addresses: string[];
  origin_addresses: string[];
  rows: [
    {
      elements: [
        {
          distance: { text: string; value: number }; // value in meters
          duration: { text: string; value: number }; // value in seconds
          status: string;
        },
      ];
    },
  ];
  status: string;
};

// Google Authentication Response types
export type GoogleResponse =
  | GoogleResponseSuccess
  | { message: `Error signing in: ${string}` };
export type GoogleResponseSuccess = {
  message: "Google Signin Successful";
  userInfo: GoogleUserInfo;
};
export type GoogleUserInfo = {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
  category: Command;
};

// Server Types and Data Structures
export type localRideRequest = {
  requestid: string;
  netid: string;
};

class RideRequestQueue {
  private items: localRideRequest[];

  constructor() {
    this.items = [];
  }

  // return all the items in the queue
  get = (): localRideRequest[] => {
    return this.items;
  };
  // adding to the back of the queue
  add = (item: localRideRequest): void => {
    this.items.push(item);
  };
  // removing from the front of the queue
  pop = (): localRideRequest | undefined => {
    return this.items.shift();
  };
  // returns size of queue
  size = (): number => {
    return this.items.length;
  };
  // returns first item of queue without removing it
  peek = (): localRideRequest => {
    return this.items[0];
  };

  remove = (netid: string): void => {
    this.items = this.items.filter((item) => item.netid !== netid);
  };
}

export const rideReqQueue = new RideRequestQueue(); // rideRequests Queue

// Database Types

// CREATE TABLE Users ( netid varchar(20) PRIMARY KEY, name text, student_num char(7),
// phone_num char(10), student_or_driver int); –- 0 for student, 1 for driver
export type User = {
  netid: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  studentNumber: string | null;
  studentOrDriver: "STUDENT" | "DRIVER";
  preferredName?: string; // if the account has been finished, there will be a preferred name
};

// CREATE TABLE Feedback (feedbackid int PRIMARY KEY, rating float, textFeedback text,
// rideOrApp int); -- 0 for ride, 1 for app feedback
export type Feedback = {
  // feedbackid created and stored in the database, we don't have to worry about it
  // feedbackid created and stored in the database, we don't have to worry about it
  rating: number;
  textFeedback: string;
  rideOrApp: "RIDE" | "APP";
};

/**
 * RideRequest represents a students request for a ride, with all the information necessary
 * to rank, assign, and complete a ride.
 * 
 * Optional parameters are new additions for the ride request broker system.
 */
export type RideRequest = {
  /**
   * ID of this request (?)
   */
  requestId?: string;
  /**
   * Student UW netid (uniquely identifies a student).
   * - A given student should only have one active ride request at a time (meaning
   * any netid should only be associated with one ride request that is either requested,
   * accepted, in transit, or being viewed).
   */
  netid: string;
  /**
   * ID that uniquely identified a driver.
   * - Any given driver should only be associated with one active ride request at 
   * a time (meaning any driverid should only be associated with one ride request that
   * is either accepted, in transit, or being viewed).
   * - `null` indicates the ride request is unassigned.
   */
  driverid: string | null;
  /**
   * The time that this ride request was requested by the student.
   */
  requestedAt?: Timestamp
  /**
   * The time that the ride associated with this request was completed.
   */
  completedAt: Timestamp | null;
  /**
   * The pick up location.
   */
  locationFrom: string; // TODO: should these be coordinates or location names?
  /**
   * The drop off location.
   */
  locationTo: string;
  /**
   * Most recent location at the time of the ride request.
   * - Potentially used to calculate the earliest pick up time of the student
   * based on their distance from the pick up location, may need to be updated
   * accordingly or ignored after a certain amount of time.
   */
  studentLocation?: string;
  /**
   * The number of students in the ride
   */
  numRiders: number;
  /**
   * Status of the ride request.
   * - `CANCELED`: The ride request was canceled for any reason (could indicate
   * cancellation by the student, cancellation by the driver, or an error).
   * - `REQUESTED`: The ride request is waiting in the queue: the student who
   * made the ride request is waiting for a driver to accept their ride. This
   * is the only state which indicates that the ride is part of the "pool", and
   * should be passed as an option to the ranking algorithm to be viewed by a driver.
   * - `VIEWING`: The ride has been checked out temporarily from the queue
   * to be accepted to denied by a potential driver (This is new behavior
   * implemented for the ride request broker system).
   * - `ACCEPTED`: **SHOULD BE DEPRECATED ASAP** Represents that a ride request
   * is either in progress or has been accepted by a driver who has not yet
   * picked up the student. Does not have the necessary level of granularity to
   * handle cancellation edge cases or ride request broker behavior.
   * - `AWAITING PICK UP`: The ride request was accepted by a driver after being
   * checked out to them for viewing and is in the pick up stage, i.e. the driver
   * is driving to go pick up the student, the student is waiting to be picked up,
   * or the driver is waiting at the pick up location to pick up the student (This
   * is new behavior for the ride request broker).
   * - `DRIVING`: The student has been picked up by the driver and the ride is in
   * progress (new behavior for the ride request broker). 
   * - `COMPLETED`: The student was dropped off after completion of the ride.
   */
  status: 
    "CANCELED" | "REQUESTED" | "VIEWING" | "ACCEPTED" | 
    "AWAITING PICK UP" | "DRIVING" | "COMPLETED";
};

// CREATE TABLE ProblematicUsers (netid varchar(20) REFERENCES Users(netid) PRIMARY KEY,
// requestid int REFERENCES RideRequests(requestid), reason text, blacklisted int); -- 0 for reported, 1 for blacklisted
export type ProblematicUser = {
  netid: string;
  requestid: string;
  reason: string;
  category: "REPORTED" | "BLACKLISTED";
};
