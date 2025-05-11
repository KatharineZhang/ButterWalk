import { RideRequest } from "./api"

/**
 * This file encapsulates the ranking alogithm / blackbox used to rank ride requests
 * and decide which one to return to a given driver at any time.
 */

/**
 * Returns the highest ranked ride request / the ride request that should be
 * paired with the provided driver
 * @param rideRequests Array of ride requests to rank
 */
export const highestRank = (
  rideRequests: RideRequest[],
  // must disable due to currently unsused parameter :(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  driverId: string,
  // must disable due to currently unsused parameter :(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  driverLocation: string
) => {
  if (rideRequests.length === 0) {
    throw new Error("Cannot get highest rank of 0 ride requests.");
  }
  return oldestRequest(rideRequests);
}

/**
 * Lame, sus, cringe ranking algorithm that just returns the oldest
 * request (actually pretty good, but like, still lame. most basic
 * functional implementation, please make cooler version later!)
 */
const oldestRequest = (rideRequests: RideRequest[]): RideRequest => {
  rideRequests.sort((a, b) => {
    if (a.requestedAt == undefined || a.requestedAt == null ||
        b.requestedAt == undefined || b.requestedAt == null
    ) {
      throw new Error(`Cannot rank rideRequests without "requestedAt": ${a}, ${b}`);
    }
    return a.requestedAt.seconds - b.requestedAt.seconds;
  })
  return rideRequests[0];
}