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
  | "ERROR"
  | "RECENT_LOCATIONS"
  | "PLACE_SEARCH";

// Input types
export type WebSocketMessage =
  | { directive: "RECENT_LOCATIONS"; netid: string }
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
      location: LocationType;
      destination: LocationType;
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
    }
  | { directive: "PLACE_SEARCH"; query: string };

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
  | ErrorResponse
  | RecentLocationResponse
  | PlaceSearchResponse;

export type RecentLocationResponse = {
  response: "RECENT_LOCATIONS";
  locations: LocationType[];
};

export type LocationType = {
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
};

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
  location: LocationType;
  destination: LocationType;
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
  category: Command;
};

export type DistanceResponse = {
  response: "DISTANCE";
  // The tag is used to identify different distance requests.
  // Whatever the client sends, the server will send back and the client can use it to identify the response
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

// Google Place API Response Types
export type PlaceSearchResponse = {
  response: "PLACE_SEARCH";
  results: PlaceSearchResult[];
};

export type PlaceSearchResult = {
  name: string;
  coordinates: { latitude: number; longitude: number };
  address: string;
};

// Type of the Google Place API response
export type GooglePlaceSearchResponse = {
  business_status: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
    viewport: {
      northeast: { lat: number; lng: number };
      southwest: { lat: number; lng: number };
    };
  };
  icon: string;
  icon_background_color: string;
  icon_mask_base_uri: string;
  name: string;
  place_id: string;
  plus_code?: {
    compound_code: string;
    global_code: string;
  };
  rating?: number;
  reference: string;
  types: string[];
  user_ratings_total?: number;
};

// We don't want GooglePlaceResult.types to incluse these tags
export const GooglePlaceSearchBadLocationTypes = [
  "bar",
  "casino",
  "drugstore",
  "liquor_store",
  "night_club",
];

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
  locationFrom: LocationType;
  locationTo: LocationType;
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

export type RecentLocation = {
  netid: string;
  locations: LocationType[];
};

// Zone Service Copy since we can't import it from the client side
export type Coordinates = {
  latitude: number;
  longitude: number;
};

// represents a polygon of map region
export class Zone {
  public coordinates: Coordinates[];
  constructor(coordinates: Coordinates[]) {
    this.coordinates = coordinates;
  }

  // Checks if a given point is inside of the polygon
  // uses a ray casting algorithm: Given a point and a polygon, check if the point is inside or outside the polygon
  isPointInside(point: Coordinates): boolean {
    let inside = false;
    for (
      let i = 0, j = this.coordinates.length - 1;
      i < this.coordinates.length;
      j = i++
    ) {
      const xi = this.coordinates[i].latitude;
      const yi = this.coordinates[i].longitude;
      const xj = this.coordinates[j].latitude;
      const yj = this.coordinates[j].longitude;

      const intersect =
        yi > point.longitude !== yj > point.longitude &&
        point.latitude < ((xj - xi) * (point.longitude - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }
    return inside;
  }
}

// logically groups multiple zones together
export class MulitZone {
  public zones: Zone[];

  constructor(zones: Zone[]) {
    this.zones = zones;
  }
  // Checks if a given point is inside of any of the zones
  isPointInside(point: Coordinates): boolean {
    for (const zone of this.zones) {
      if (zone.isPointInside(point)) {
        return true;
      }
    }
    return false;
  }
}

// Parts of the UW SafeTrip Service Area
const specificLargePolygonCoordinates: {
  latitude: number;
  longitude: number;
}[] = [
  // left side
  { latitude: 47.67197822654261, longitude: -122.31736823645943 },
  { latitude: 47.657826336017735, longitude: -122.31778749627834 },
  { latitude: 47.65538164211254, longitude: -122.31838264706631 },
  { latitude: 47.655782527173024, longitude: -122.32073398057402 },
  { latitude: 47.655624802268186, longitude: -122.32191452559616 },
  { latitude: 47.654468138408575, longitude: -122.3219535518779 },
  { latitude: 47.65440241810187, longitude: -122.3197973498126 },

  // bottom
  { latitude: 47.65365977287074, longitude: -122.31737772029295 },
  { latitude: 47.65363495131938, longitude: -122.31735910126282 },
  { latitude: 47.653251915739446, longitude: -122.31761659332349 },
  { latitude: 47.65153183453685, longitude: -122.3139366026232 },
  { latitude: 47.647855267086754, longitude: -122.30894418096462 },
  { latitude: 47.64770668040322, longitude: -122.30011486410316 },

  // right
  { latitude: 47.65204763837195, longitude: -122.29850097325405 },
  { latitude: 47.6524132447055, longitude: -122.29960112480595 },
  { latitude: 47.65918952197625, longitude: -122.29884680679379 },
  { latitude: 47.660489764540145, longitude: -122.2997174186812 },
  { latitude: 47.66057899568555, longitude: -122.30106118920304 },
  { latitude: 47.661241850848334, longitude: -122.30104226285768 },
  { latitude: 47.66131833364706, longitude: -122.3044679315033 },
  { latitude: 47.66269500392275, longitude: -122.30401369921422 },
  { latitude: 47.666014901802086, longitude: -122.30387212072591 },
  { latitude: 47.66811021020102, longitude: -122.30382920538246 },
  { latitude: 47.66951185231267, longitude: -122.30408669744313 },

  // top
  { latitude: 47.66925175662091, longitude: -122.30648995667599 },
  { latitude: 47.66961300028717, longitude: -122.30782033232272 },
  { latitude: 47.670552222117784, longitude: -122.30803490903993 },
  { latitude: 47.669959791887436, longitude: -122.30964423448701 },
  { latitude: 47.67191441388561, longitude: -122.31734210884817 },
];

const arrowSectionCoordinates: { latitude: number; longitude: number }[] = [
  // arrow section
  { latitude: 47.66490016349351, longitude: -122.30073347435852 },
  { latitude: 47.66568604344422, longitude: -122.30046674791475 },
  { latitude: 47.66566358989555, longitude: -122.29866634441919 },
  { latitude: 47.66602284551541, longitude: -122.2987163556274 },
  { latitude: 47.665416600222606, longitude: -122.29701597454826 },
  { latitude: 47.664462310960005, longitude: -122.29574902394029 },
  { latitude: 47.66447353799392, longitude: -122.29741606421393 },
  { latitude: 47.66494507123801, longitude: -122.29741606421393 },
];

const triangleCoordinates: { latitude: number; longitude: number }[] = [
  { latitude: 47.661094404923574, longitude: -122.29271168996141 },
  { latitude: 47.66100796577077, longitude: -122.29029889185436 },
  { latitude: 47.658535745420586, longitude: -122.29014488346454 },
  { latitude: 47.658432013336444, longitude: -122.2883994550467 },
  { latitude: 47.65748112629489, longitude: -122.28837378698172 },
  { latitude: 47.65649564326909, longitude: -122.28870747182631 },
  { latitude: 47.65787877207353, longitude: -122.29124861025818 },
  { latitude: 47.65848387940428, longitude: -122.29119727412824 },
  { latitude: 47.65879507472935, longitude: -122.29091492541362 },
];

//
export const PurpleZone = new MulitZone([
  new Zone(specificLargePolygonCoordinates),
  new Zone(arrowSectionCoordinates),
  new Zone(triangleCoordinates),
]);
