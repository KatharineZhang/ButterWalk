// This is where all the server data structures will go
export type User = {
  phoneNum: string;
  netID: string;
  role: "student" | "driver";
}

export type rideRequest = {
  requestid: number;
  netID: string;
}

export type ErrorResponse = { success: false, error: string };
export type AcceptResponse = 
{ student: { accepted: true }, 
driver: {  netID: string, location: string, destination: string, numRiders: number, requestid: number } };
export type CancelResponse = { success: { cancelled: true }, otherNetId?: string };

// custom Queue implementation
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

export let rideReqQueue = new Queue<rideRequest>(); // rideRequests queue

// TODO: this is a temporary solution. We will need to implement a more robust solution
export const removeRideReq = (netid: string): void => {
  let newQueue = new Queue<rideRequest>();
  let rideReq = rideReqQueue.get();
  rideReq.forEach((request) => {
      if (request.netID != netid) {
          newQueue.add(request);
      }
  });
  rideReqQueue = newQueue;
}
