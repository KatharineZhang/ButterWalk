// This is where all the server / database data structures will go
import { Timestamp } from "firebase/firestore";

// Webhook commands
export type Command =
  | "CONNECT"
  | "SIGNIN"
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
  | "ERROR";

// Input types
export type WebSocketMessage =
  | { directive: "CONNECT"; netid: string }
  | {
      directive: "SIGNIN";
      netid: string;
      name: string;
      phoneNum: string;
      studentNum: string;
      role: "STUDENT" | "DRIVER";
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
      requestid: string;
      pickupLocation?: [latitude: number, longitude: number];
      driverLocation?: [latitude: number, longitude: number];
    }
  | { directive: "LOCATION"; id: string; latitude: number; longitude: number }
  | {
      directive: "QUERY";
      rideorApp?: "RIDE" | "APP"; // if rideOrApp is undefined, the default is to query both feebcack types
      date?: { start: Date; end: Date };
      rating?: number;
    };

// Response types
export type WebSocketResponse =
  | GeneralResponse
  | RequestRideResponse
  | WaitTimeResponse
  | AcceptResponse
  | DriverAcceptResponse
  | CancelResponse
  | LocationResponse
  | QueryResponse
  | ErrorResponse;

export type GeneralResponse = {
  response:
    | "CONNECT"
    | "SIGNIN"
    | "CANCEL"
    | "COMPLETE"
    | "ADD_FEEDBACK"
    | "REPORT"
    | "BLACKLIST"
    | "ACCEPT_RIDE";
  success: true;
};

export type RequestRideResponse = {
  response: "REQUEST_RIDE";
  requestid: string;
};

export type WaitTimeResponse = { response: "WAIT_TIME"; waitTime: number };

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
    | "QUERY";
};

// Server Types and Data Structures
export type localRideRequest = {
  requestid: string;
  netid: string;
};

// TODO: Change this implementation to be specific to localRideRequest
class Queue<T> {
  private items: T[];

  constructor() {
    this.items = [];
  }

  // return all the items in the queue
  get = (): T[] => {
    return this.items;
  };
  // adding to the back of the queue
  add = (item: T): void => {
    this.items.push(item);
  };
  // removing from the front of the queue
  pop = (): T | undefined => {
    return this.items.shift();
  };
  // returns size of queue
  size = (): number => {
    return this.items.length;
  };
  // returns first item of queue without removing it
  peek = (): T | undefined => {
    return this.items[0];
  };
}

export let rideReqQueue = new Queue<localRideRequest>(); // rideRequests Queue

// TODO: this is a temporary solution. We will need to implement a more robust solution
export const removeRideReq = (netid: string): void => {
  const newQueue = new Queue<localRideRequest>();
  const rideReq = rideReqQueue.get();
  rideReq.forEach((request) => {
    if (request.netid != netid) {
      newQueue.add(request);
    }
  });
  rideReqQueue = newQueue;
};

// Database Types

// CREATE TABLE Users ( netid varchar(20) PRIMARY KEY, name text, student_num char(7),
// phone_num char(10), student_or_driver int); –- 0 for student, 1 for driver
export type User = {
  netid: string;
  name: string;
  phone_number: string;
  student_number: string;
  student_or_driver: "STUDENT" | "DRIVER";
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
