import dotenv from 'dotenv';

dotenv.config();

type User = {
    phoneNum: string;
    netID: string;
    role: "student" | "driver";
}

type rideRequest = {
    phoneNum: string;
    netID: string;
    from: string;
    to: string;
    canceled: boolean;
    numRiders: bigint;
}

class Queue<T> {
    private items: T[];

    constructor() {
        this.items = [];
    }

    // return all the items in the queue
    get = (): T[] => {
        return this.items;
    }
    // adding to the back of the queue
    add = (item: T): void => {
        this.items.push(item);
    }
    // removing from the front of the queue
    pop = (): T | undefined => {
        return this.items.shift();
    }
    // returns size of queue
    size = (): number => {
        return this.items.length;
    }
    // returns first item of queue without removing it
    peek = (): T | undefined => {
        return this.items[0];
    }
}

const users: User[] = []; // users array
const rideReqQueue = new Queue<rideRequest>(); // rideRequests queue

let uniqueUsers = new Set<number>();

export const logUser = (netid: string): void => {   
    const hash = hashNetID(netid);
    uniqueUsers.add(hash as number);
    console.log(`SERVER: ${uniqueUsers.size} unique users`);
};

const hashNetID = (netID: string): number => {
    let hash = 0;
    for (let i = 0; i < netID.length; i++) {
      hash += netID.charCodeAt(i) * Math.pow(131, netID.length - 1 - i);
    }
    return hash % 1000000000;
  };
  
export const signIn = (phoneNum: string, netID: string, role: 'STUDENT' | 'DRIVER'): void => {
    if (!phoneNum || !netID || !role ) {
        console.log('Missing required fields.');
    }
    // DO EMAIL VERIFICATION HERE
    const existingUser = users.find(user => user.phoneNum === phoneNum || user.netID === netID);
    if (existingUser) {
        console.log(`User signed in successfully, user: ${existingUser}`);
    }
    
    const newUser: User = {
        phoneNum: phoneNum as string,
        netID: netID as string,
        role: role as "student" | "driver",
    };
    users.push(newUser);
    console.log('New user signed in', newUser);

};

export const requestRide = (phoneNum: string, netID: string, from: string, to: string, numRiders: bigint): void => {
    if (!phoneNum || !from || !to || numRiders <= 0) {
        console.log('SERVER: Missing or invalid ride request details.');
    }
    const newRideReq: rideRequest = { phoneNum, netID, from, to, canceled: false, numRiders };
    rideReqQueue.add(newRideReq);
    console.log(`SERVER: Ride requested sucessfully! request: ${newRideReq}`);
}

export const acceptRide = (): void => {
    const nextRide = rideReqQueue.peek();
    if (!nextRide) {
        console.log('No ride requests in the queue.');
    }
    if (nextRide?.canceled) {
        console.log('The next ride request has been canceled.');
    }
    rideReqQueue.pop();
    console.log(`Ride accepted', ride: ${nextRide}`);
}

// create routes for canceling rides!!