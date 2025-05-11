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
  | "SNAP"
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
      directive: "SNAP";
      currLat: number;
      currLong: number;
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
      tag: string; // used to identify the response
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
  | SnapLocationResponse
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

export type SnapLocationResponse = {
  response: "SNAP";
  success: boolean;
  roadName: string;
  latitude: number;
  longitude: number;
};

export type RequestRideResponse = {
  response: "REQUEST_RIDE";
  requestid: string;
};

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
    | "SNAP"
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
  tag: string;
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

// CREATE TABLE RideRequests (requestid int PRIMARY KEY, netid varchar(20) REFERENCES Users(netid),
// driverid varchar(20) REFERENCES Drivers(driverid),
// completedAt smalldatetime, locationFrom geography, locationTo geography, numRiders int,
// completedAt smalldatetime, locationFrom geography, locationTo geography, numRiders int,
// status int); –- -1 for canceled, 0 for requested, 1 for accepted, 2 for completed
export type RideRequest = {
  // requestid created and stored in the database, we can't store it here
  // requestid created and stored in the database, we can't store it here
  netid: string;
  driverid: string | null;
  completedAt: Timestamp | null;
  locationFrom: string; // TODO: should these be coordinates or location names?
  locationTo: string;
  numRiders: number;
  status: "CANCELED" | "REQUESTED" | "ACCEPTED" | "COMPLETED";
};

// CREATE TABLE ProblematicUsers (netid varchar(20) REFERENCES Users(netid) PRIMARY KEY,
// requestid int REFERENCES RideRequests(requestid), reason text, blacklisted int); -- 0 for reported, 1 for blacklisted
export type ProblematicUser = {
  netid: string;
  requestid: string;
  reason: string;
  category: "REPORTED" | "BLACKLISTED";
};
