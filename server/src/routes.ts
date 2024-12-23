import dotenv from 'dotenv';
import { User, rideRequest, uniqueUsers, users, rideReqQueue, ErrorResponse, removeRideReq, AcceptResponse } from './api';
dotenv.config();

// currently used to log the number of unique users
// TODO: PHASE THIS OUT
export const logUser = (netid: string): void => {   
    const hash = hashNetID(netid);
    uniqueUsers.add(hash as number);
    console.log(`SERVER: ${uniqueUsers.size} unique users`);
};

// helper function for logUser
const hashNetID = (netID: string): number => {
    let hash = 0;
    for (let i = 0; i < netID.length; i++) {
      hash += netID.charCodeAt(i) * Math.pow(131, netID.length - 1 - i);
    }
    return hash % 1000000000;
  };
  
/* Signs a specific student or driver into the app based on phone number and netid. 
Will check the users database for the specific id, and if it is not there, will add a new user. 
If the user is in the table, we need to make sure this user is not in the ProblematicUsers table 
with a blacklisted field of 1 before we return success : true.
Takes in a json object formatted as: { directive: "SIGNIN", phoneNum: string, netID: string, role: 'STUDENT' | 'DRIVER' }.
On error, returns the json object in the form:  { success: false, error: string }. 
Returns a json object TO THE STUDENT in the form: { signedIn: true }. */
export const signIn = (phoneNum: string, netID: string, role: 'STUDENT' | 'DRIVER'): 
{ signedIn: true } | ErrorResponse => {
    if (!phoneNum || !netID || !role ) {
        return { success: false, error: 'Missing required fields.'};
    }
    // TODO: check the users database for the specific id, and if it is not there, will add a new user. 
    // TODO: make sure this user is not in the ProblematicUsers table with a blacklisted field of 1
    return { signedIn: true };    
};

/* Adds a new ride request object to the queue using the parameters given. 
Will add a new request to the database, populated with the fields passed in and a request status of 0.
Takes in a json object with the following format: 
{ directive: "REQUEST_RIDE", phoneNum: string, netID: string, location: string, destination: string; numRiders: number }.
On error, returns the json object in the form:  { success: false, error: string }. 
Returns a json object TO THE STUDENT in the form: { requested: true, requestid: number }. */
export const requestRide = (phoneNum: string, netID: string, from: string, to: string, numRiders: number): 
{ requested: true, requestid: number } | ErrorResponse => {
    if (!phoneNum || !from || !to || numRiders <= 0) {
        return { success: false, error: 'Missing or invalid ride request details.'};
    }

    // TODO: Based on the number of requests in the RideRequests table, the next requestID will be the number of requests + 1
    // for now, since there is no db, we will just use the size of the queue
    const requestid = rideReqQueue.size() + 1;
    
    // TODO: add a new request to the database, populated with the fields passed in and a request status of 0
    // on error, return { success: false, error: 'Error adding ride request to the database.'};

    // we also want to keep the requests locally in the server queue, but without too much information
    const newRideReq: rideRequest = { requestid, netID };
    rideReqQueue.add(newRideReq);
    return { requested: true, requestid };
}

/* Pops the next ride request in the queue and assigns it to the driver. 
This call will update the database to add the driver id to the specific 
request and change the status of the request to 1 (accepted). 
Takes in a json object in the form { directive: "ACCEPT_RIDE" }.
On error, returns the json object in the form:  { success: false, error: string }. 
Returns a json object TO THE STUDENT in the form: { accepted: true }. 
Returns a json object TO THE DRIVER in the format: 
{  netID: string, location: string, destination: string, numRiders: number, requestid: number } */
export const acceptRide = (): AcceptResponse | ErrorResponse => {
    if (!rideReqQueue.peek()) {
        return { success: false, error: 'No ride requests in the queue.'};
    }

    // get the next request in the queue
    const nextRide = rideReqQueue.pop() as rideRequest;
    // TODO: look up the request in the database
    // TODO: update the request in database to add the driver id and change the status of the request to 1 (accepted)
    // if there is an error, return { success: false, error: 'Error accepting ride request.'};

    return { student: { accepted: true }, 
    driver: {  netID: nextRide.netID, location: "DUMMY", destination: "DUMMY", 
        numRiders: 100, requestid: nextRide.requestid } }
}

/* Allows the student to cancel a ride and updates the server and notifies the user. 
This route will also be called when the websocket is disconnected and there is a request 
stored locally on  the client. This route will look through all the ride requests made by 
this specific user and will change any active (status: 0 or 1) request to canceled (status: -1). 
In the case that a request has a status of 1, we want to notify the corresponding driver.
Takes in a json object in the form: { directive: "CANCEL" }.
On error, returns the json object in the form:  { success: false, error: string }. 
Returns a json object  TO THE STUDENT in the format: {  cancelled: true }
Returns a json object  TO THE DRIVER in the format: {  cancelled: true } */
export const cancelRide = (netid: string): {  cancelled: true } | ErrorResponse => {
    if (!netid) {
        return { success: false, error: 'Missing required fields.'};
    }
    // get rid of any requests in the queue that have the same netid
    removeRideReq(netid);
    
    // TODO: look through all the ride requests made by this specific user
    // TODO: change any active (status: 0 or 1) request to canceled (status: -1)
    // TODO: if a request has a status of 1, notify the corresponding driver
    // if there is an error, return { success: false, error: 'Error canceling ride request.'};
    return { cancelled: true };
}

/* Once a ride is finished, the driver will set that specific request status to 2 in the database. 
(Both the student and driver will still get a notification that the ride is completed)
Takes in a json object in the form: { directive: "COMPLETE", requestid: number }.
On error, returns the json object in the form:  { success: false, error: string }. 
Returns a json object  TO THE DRIVER in the format:   {  success: true } */
export const completeRide = (requestid: number): {  success: true } | ErrorResponse => {
    if (!requestid) {
        return { success: false, error: 'Missing required fields.'};
    }
    // TODO: set the specific request status to 2 in the database
    // if there is an error, return { success: false, error: 'Error completing ride request.'};
    return { success: true };
}

/* The student can give us feedback on a specific ride they just took. 
This feedback is added to the Feeback table using the fields passed in. Feedback is anonymous. 
Takes in: {  directive: "ADD_FEEDBACK”, rating: number, feedback: string, appOrRide: number (1 or 0) }
On error, returns the json object in the form:  { success: false, error: string }. 
Returns a json object  TO THE STUDENT in the format: {  success: true } */
export const addFeedback = (rating: number, feedback: string, appOrRide: 0 | 1): 
{  success: true } | ErrorResponse => {
    if (!rating || !feedback || !appOrRide) {
        return { success: false, error: 'Missing required fields.'};
    }
    // TODO: add feedback to the Feeback table using the fields passed in
    // if there is an error, return { success: false, error: 'Error adding feedback to the database.'};
    return { success: true };
}

/* Driver needs to be able to report a specific student they just dropped off for bad behavior. 
This will add a new student entry to the ProblematicUsers table with a blacklisted field of 0.
Takes in: { directive: "REPORT”, netID: string, requestid: string, reason: string }
On error, returns the json object in the form:  { success: false, error: string }. 
Returns a json object TO THE DRIVER in the format: {  success: true } */
export const report = (netID: string, requestid: string, reason: string): 
{  success: true } | ErrorResponse => {
    if (!netID || !requestid || !reason) {
        return { success: false, error: 'Missing required fields.'};
    }
    // TODO: add a new student entry to the ProblematicUsers table with a blacklisted field of 0
    // if there is an error, return { success: false, error: 'Error reporting student.'};
    return { success: true };
}

/* UWPD needs to be able to manually blacklist a specific student they’ve reported. 
Will use netid to modify the ‘ProblematicUsers’ table so that the blacklisted field is 1.
Takes in: { directive: "BLACKLIST”, netID: string }
On error, returns the json object in the form:  { success: false, error: string }. 
Returns a json object TO THE DRIVER in the format:   {  success: true } */
export const blacklist = (netID: string): {  success: true } | ErrorResponse => {
    if (!netID) {
        return { success: false, error: 'Missing required fields.'};
    }
    // TODO: modify the ‘ProblematicUsers’ table so that the blacklisted field is 1
    // if there is an error, return { success: false, error: 'Error blacklisting student.'};
    return { success: true };
}

/* A specific user needs to know when approximately the driver will accept their ride. 
Once the request has been accepted, we will start calling GetUserLocation from BOTH the 
student and driver to display those locations on the map. This means that we can tell 
if a request has been accepted based on if we have the location information of the opposite user. 
We will use that information in this route (accepted or not) to calculate the wait time. 
In the case that the request is not yet accepted, none of the optional fields 
(pickupLocation and driverLocation) will be passed in. Wait time will be the requestid’s 
position in the local server queue * 15 minutes.
If the user’s request has been accepted, both pickupLocation and driverLocation will be 
passed in. Wait time will be the ETA of the corresponding driverid to the user’s pick up location. 
We do this by calculating the ETA from driverLocation to pickupLocation.
Takes in: { directive: "WAIT_TIME”, requestid: number, pickupLocation?: 
[ latitude: number, longitude: number ], driverLocation?: [ latitude: number, longitude: number ] }
On error, returns the json object in the form:  { success: false, error: string }. 
Returns a json object  TO THE STUDENT in the format: { success: true, waitTime: number //in minutes } */
export const waitTime = (requestid: number, 
pickupLocation?: [ latitude: number, longitude: number ], 
driverLocation?: [ latitude: number, longitude: number ]): { success: true, waitTime: number } | ErrorResponse => {
    if (!requestid) {
        return { success: false, error: 'Missing required fields.'};
    }
    let ETA = 0;
    // if the request has been accepted, both pickupLocation and driverLocation will be passed in
    // calculate the ETA from driverLocation to pickupLocation
    if (pickupLocation && driverLocation) {
        // TODO: calculate the ETA from driverLocation to pickupLocation
        ETA = 100; // dummy value
    } else {
        // else if the request has not been accepted, 
        // wait time will be the requestid’s position in the local server queue * 15 minutes
        const index = rideReqQueue.get().findIndex((request) => request.requestid === requestid);
        if (index === -1) {
            return { success: false, error: 'Request not found.'};
        }
        ETA = index * 15;
    }
    return { success: true, waitTime: ETA };
}

/* refresh, each user will send its own location to the websocket, 
which will pass that information to the opposite user (student → driver, driver → student).
Takes in: { directive: "LOCATION”, id: string, latitude: number, longitude: number }
On error, returns the json object in the form:  { success: false, error: string }. 
Returns a json object  TO THE OPPOSITE USER (STUDENT OR DRIVER) in the format: 
{  success: true, latitude: number, longitude: number } */

// THIS MAY NOT NEED TO BE A FUNCTION AND CAN BE HANDLED IN THE WEBSOCKET??
export const location = (id: string, latitude: number, longitude: number): 
{  success: true, latitude: number, longitude: number } | ErrorResponse => {
    if (!id || !latitude || !longitude) {
        return { success: false, error: 'Missing required fields.'};
    }
    // pass the location information to the opposite user
    return { success: true, latitude, longitude };
}

/* We need to get some basic stats about our current feedback table back to the client. 
The types of canned queries we will return are: number of feedback entries, 
filter ride or app feedback, all feedback from a date, all feedback from a specific rating. 
Takes in: { directive: "QUERY”, rideorApp?: number // 0 for ride, 1 for app, default: query both, 
date?: Date, rating?: number }
On error, returns the json object in the form:  { success: false, error: string }. 
Returns a json object  TO THE DRIVER  in the format:   
{ success: true, numberOfEntries: number, feedback: [ { rating: number, textFeeback: string } ] } */
export const query = (rideorApp?: 0 | 1, date?: Date, rating?: number ): 
{ success: true, numberOfEntries: number, feedback: { rating: number, textFeeback: string }[] } | ErrorResponse => {
    // TODO: get some basic stats about our current feedback table back to the client
    // types of canned queries we will return are: number of feedback entries, 
    // filter ride or app feedback, all feedback from a date, all feedback from a specific rating
    return { success: true, numberOfEntries: 0, feedback: [] };
}