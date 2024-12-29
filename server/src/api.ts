// This is where all the server data structures will go

// All commands
export type commands =
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
  | "QUERY";

// Input types
export type WebSocketMessage =
  | { directive: "CONNECT"; netid: string }
  | {
      directive: "SIGNIN";
      phoneNum: string;
      netid: string;
      name: string;
      studentNum: number;
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
  | { directive: "ACCEPT_RIDE" }
  | { directive: "CANCEL"; netid: string; role: "STUDENT" | "DRIVER" }
  | { directive: "COMPLETE"; requestid: number }
  | {
      directive: "ADD_FEEDBACK";
      rating: number;
      feedback: string;
      appOrRide: 0 | 1;
    }
  | { directive: "REPORT"; netid: string; requestid: string; reason: string }
  | { directive: "BLACKLIST"; netid: string }
  | {
      directive: "WAIT_TIME";
      requestid: number;
      pickupLocation?: [latitude: number, longitude: number];
      driverLocation?: [latitude: number, longitude: number];
    }
  | { directive: "LOCATION"; id: string; latitude: number; longitude: number }
  | {
      directive: "QUERY";
      rideorApp?: 0 | 1; // 0 for ride, 1 for app, default: query both
      date?: Date;
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
  requestid: number;
};

export type WaitTimeResponse = { response: "WAIT_TIME"; waitTime: number };

export type AcceptResponse = {
  student: { response: "ACCEPT_RIDE"; success: true }; // of type GeneralResponse
  driver: DriverAcceptResponse;
};

export type DriverAcceptResponse = {
  response: "ACCEPT_RIDE";
  netid: string;
  location: string;
  destination: string;
  numRiders: number;
  requestid: number;
};

export type CancelResponse = {
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
  feedback: { rating: number; textFeeback: string }[];
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

// custom Queue implementation
export type rideRequest = {
  requestid: number;
  netid: string;
};

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

export let rideReqQueue = new Queue<rideRequest>(); // rideRequests Queue

// TODO: this is a temporary solution. We will need to implement a more robust solution
export const removeRideReq = (netid: string): void => {
  let newQueue = new Queue<rideRequest>();
  let rideReq = rideReqQueue.get();
  rideReq.forEach((request) => {
    if (request.netid != netid) {
      newQueue.add(request);
    }
  });
  rideReqQueue = newQueue;
};
