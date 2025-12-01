import { RideRequest } from "../api";

// This file encapsulates the ranking alogithm / blackbox used to rank ride requests
// and decide which one to return to a given driver at any time.

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
  driverLocation: {
    latitude: number;
    longitude: number;
  }
) => {
  if (rideRequests.length === 0) {
    throw new Error("Cannot get highest rank of 0 ride requests.");
  }
  return rankRequests(rideRequests)[0];
};

/**
 * Returns the 0 based rank of the ride request currently associated with
 * the given student netid in the provided array. Returns an index out of
 * the bounds of the array if the student does not have an associated req.
 * @param rideRequests Array of ride requets to use for ranking
 * @param studentNetid netid of the student whose ride we should identify
 */
export const rankOf = (rideRequests: RideRequest[], studentNetid: string) => {
  rideRequests = rankRequests(rideRequests);
  return rideRequests.findIndex((rideRequest: RideRequest) => {
    return rideRequest.netid === studentNetid;
  });
};

/**
 * Returns the 0 based rank of the ride request currently associated with
 * the given student netid in the provided array. Returns an index out of
 * the bounds of the array if the student does not have an associated req.
 * @param rideRequests Array of ride requets to use for ranking
 * @param requestId the id of the ride we should identify
 */
export const rankOfRequest = (
  rideRequests: RideRequest[],
  requestId: string
) => {
  rideRequests = rankRequests(rideRequests);
  console.log(rideRequests);
  return rideRequests.findIndex((rideRequest: RideRequest) => {
    return rideRequest.requestId === requestId;
  });
};

///////////////////////////////////////////////////////////
// Private functions -- Ranking Algorithm Implementation //
///////////////////////////////////////////////////////////

/**
 * The ranking algorithm. Ranks the passed in requests such that
 * rankRequests(rideRequests)[0] has the highest priority.
 * @param rideRequests List of ride requests to rank
 * @returns the same list of ride requests in ranked order.
 */
const rankRequests = (rideRequests: RideRequest[]): RideRequest[] => {
  // Currently, we are just ranking rides by which ones was requested
  // the longest time ago
  return sortTemporal(rideRequests);
};

/**
 * @param rideRequests List of ride requests to sort
 * @returns the list of ride requests in sorted order by
 * the time they were originally requested.
 */
const sortTemporal = (rideRequests: RideRequest[]): RideRequest[] => {
  rideRequests.sort((a, b) => {
    if (
      a.requestedAt == undefined ||
      a.requestedAt == null ||
      b.requestedAt == undefined ||
      b.requestedAt == null
    ) {
      throw new Error(
        `Cannot rank rideRequests without "requestedAt": ${a}, ${b}`
      );
    }
    return a.requestedAt.seconds - b.requestedAt.seconds;
  });
  return rideRequests;
};
