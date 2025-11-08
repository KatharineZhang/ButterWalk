// Integration tests that run over a websocket on the live server[1].
// End to end, and requires proper set up[2] of connections with Firestore,
// the Google Maps API, and any other intermediate services.
// Not intended to be comprehensive, and only verifies that the "routes"
// handled by websokcet messages relating to the ride request broker
// behave properly.
//
// [1][2] If you run these integration tests with the same credentials as
// the production server, it will act like a real client on the real
// production app data. Probably don't do that while the app is live.
// Consider https://firebase.google.com/docs/emulator-suite

// note: these tests require that you use the --runInBand option with Jest,
// as they verify directly with the database accordingly to invariant that
// no test data is in the database at the start of the test, and does not
// expect any other test to modify anything during the duration of the test.
// note 2: Jest will complain that there is a hanging operation after the tests
// run, this is only an error with the test set up, not the things being testes.
// note 3: tests might also fail if anyone else is connected to the firstore
// and unrelated ride requests are in the RideRequests collection, it is expected
// to be empty (no active requests) when the tests are run

import { clients, server, wss } from "..";
import { describe, expect, test } from "@jest/globals";
import { WebSocket } from "ws";
import { Timestamp } from "firebase-admin/firestore";
import { setTimeout } from "timers/promises";
import {
  usersCollection,
  rideRequestsCollection,
} from "../firebase/firebaseQueries";
import { LocationType } from "../api";

const MOCK_LOCATION_FROM: LocationType = {
  name: "Mock Test Location",
  address: "123 Test St, Seattle, WA",
  coordinates: { latitude: 47.6553, longitude: -122.3035 }, // UW
};

const MOCK_LOCATION_TO: LocationType = {
  name: "Mock Test Destination",
  address: "456 Mock Ave, Seattle, WA",
  coordinates: { latitude: 47.6563, longitude: -122.3049 }, // UW
};

const MOCK_STUDENT_LOCATION = {
  latitude: 47.6553,
  longitude: -122.3035,
};

const MOCK_RR_MSG: string = JSON.stringify({
  directive: "REQUEST_RIDE",
  phoneNum: "098-765-4321",
  netid: "3333333",
  location: MOCK_LOCATION_FROM,
  destination: MOCK_LOCATION_TO,
  numRiders: 1,
  studentLocation: MOCK_STUDENT_LOCATION,
});

// returns number of test rides in the database
const mockRideCount = async (): Promise<number> => {
  const queryExistingRide = rideRequestsCollection.where("netid", "in", [
    "0000000",
    "1111111",
    "2222222",
    "3333333",
  ]);
  const inDatabase = await queryExistingRide.get();
  return inDatabase.size;
};

describe("Websocket Integration", () => {
  beforeAll(async () => {
    // add test users to the firestore
    await usersCollection.add({
      firstName: "first_name_0000000",
      lastName: "last_name_0000000",
      netid: "0000000",
      phoneNumber: "000-111-1010",
      preferredName: "test_user_0000000",
      studentNumber: "0000000",
      studentOrDriver: "STUDENT",
    });
    await usersCollection.add({
      firstName: "first_name_1111111",
      lastName: "last_name_1111111",
      netid: "1111111",
      phoneNumber: "111-111-1010",
      preferredName: "test_user_1111111",
      studentNumber: "1111111",
      studentOrDriver: "STUDENT",
    });
    await usersCollection.add({
      firstName: "first_name_2222222",
      lastName: "last_name_2222222",
      netid: "2222222",
      phoneNumber: "222-111-1010",
      preferredName: "test_user_2222222",
      studentNumber: "2222222",
      studentOrDriver: "STUDENT",
    });
    await usersCollection.add({
      firstName: "first_name_3333333",
      lastName: "last_name_3333333",
      netid: "3333333",
      phoneNumber: "333-111-1010",
      preferredName: "test_user_3333333",
      studentNumber: "3333333",
      studentOrDriver: "STUDENT",
    });
  });

  let ws: WebSocket;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let lastMsg: any;
  beforeEach(async () => {
    // create a new websocket connection
    expect(clients.length).toStrictEqual(0);
    ws = new WebSocket("ws://localhost:8080");
    ws.on("message", (res) => {
      lastMsg = JSON.parse(res as unknown as string);
      console.log(lastMsg);
    });
    while (true) {
      if (ws.readyState == ws.OPEN) {
        break;
      } else {
        console.log("not connected...");
        await setTimeout(1000);
      }
    }
    expect(clients.length).toStrictEqual(1);
    // make sure all test data has been removed from the RideRequests table
    // tests in this file always use netids: 0000000, 1111111, 2222222, or 3333333
    const queryExistingRide = rideRequestsCollection.where("netid", "in", [
      "0000000",
      "1111111",
      "2222222",
      "3333333",
    ]);
    const inDatabase = await queryExistingRide.get();
    expect(inDatabase.size).toBe(0);
  });
  afterEach(async () => {
    if (ws) {
      const closePromise = new Promise((resolve) => {
        ws.on("close", () => {
          resolve(true);
        });
      });

      if (
        ws.readyState !== WebSocket.CLOSING &&
        ws.readyState !== WebSocket.CLOSED
      ) {
        ws.close();
      }
      await Promise.race([closePromise, setTimeout(2000)]);
    }
    const queryExistingRide = rideRequestsCollection.where("netid", "in", [
      "0000000",
      "1111111",
      "2222222",
      "3333333",
    ]);
    const inDatabase = await queryExistingRide.get();
    const deletePromises = inDatabase.docs.map((doc) => doc.ref.delete());
    await Promise.all(deletePromises);
    let retries = 0;
    const maxRetries = 25;
    let finalSize = inDatabase.size;

    while (finalSize > 0 && retries < maxRetries) {
      await setTimeout(200); // Wait 200ms
      const snapshot = await queryExistingRide.get(); // Re-run query
      finalSize = snapshot.size;
      retries++;
    }
    if (finalSize > 0) {
      throw new Error(
        `[afterEach] Failed to clean up database. ${finalSize} documents remain.`
      );
    }
  });
  afterAll(async () => {
    //remove test users from firestore
    const queryUsers = usersCollection.where("netid", "in", [
      "0000000",
      "1111111",
      "2222222",
      "3333333",
    ]);
    const inDatabase = await queryUsers.get();
    inDatabase.forEach((el) => {
      el.ref.delete();
    });
    //close socket server and server
    wss.close();
    server.close();
  });

  // Websocket directives
  test("REQUEST_RIDE send a ride request to firestore", async () => {
    const message: string = JSON.stringify({
      directive: "REQUEST_RIDE",
      phoneNum: "123-456-7890",
      netid: "0000000",
      location: MOCK_LOCATION_FROM,
      destination: MOCK_LOCATION_TO,
      numRiders: 1,
      studentLocation: MOCK_STUDENT_LOCATION,
    });
    ws.send(message);
    await setTimeout(1000);
    const queryExistingRide = rideRequestsCollection.where("netid", "in", [
      "0000000",
    ]);
    const inDatabase = await queryExistingRide.get();
    expect(inDatabase.size).toBe(1);
    expect(typeof lastMsg.requestid).toBe("string");
  });

  test("RIDES_EXIST returns true when rides exist", async () => {
    ws.send(MOCK_RR_MSG);
    await setTimeout(1000);
    expect(await mockRideCount()).toBe(1);
    ws.send(
      JSON.stringify({
        directive: "RIDES_EXIST",
      })
    );
    await setTimeout(1000);
    expect(lastMsg.ridesExist).toBe(true);
  });

  test("RIDES_EXIST returns false when rides don't exist", async () => {
    ws.send(
      JSON.stringify({
        directive: "RIDES_EXIST",
      })
    );
    await setTimeout(1000);
    expect(lastMsg.ridesExist).toBe(false);
  });

  test("RIDES_EXIST returns false when rides exist but don't have REQUESTED status", async () => {
    await rideRequestsCollection.add({
      netid: "0000000",
      driverid: "TEST_WHATEVER",
      requestedAt: Timestamp.now(),
      completedAt: Timestamp.now(),
      locationFrom: MOCK_LOCATION_FROM,
      locationTo: MOCK_LOCATION_TO,
      studentLocation: {
        coords: MOCK_STUDENT_LOCATION,
        lastUpdated: Timestamp.now(),
      },
      numRiders: 100,
      status: "COMPLETED",
    });
    await rideRequestsCollection.add({
      netid: "1111111",
      driverid: "TEST_WHATEVER",
      requestedAt: Timestamp.now(),
      completedAt: Timestamp.now(),
      locationFrom: MOCK_LOCATION_FROM,
      locationTo: MOCK_LOCATION_TO,
      studentLocation: {
        coords: MOCK_STUDENT_LOCATION,
        lastUpdated: Timestamp.now(),
      },
      numRiders: 100,
      status: "CANCELED",
    });
    await rideRequestsCollection.add({
      netid: "1111111",
      driverid: "TEST_WHATEVER",
      requestedAt: Timestamp.now(),
      completedAt: Timestamp.now(),
      locationFrom: MOCK_LOCATION_FROM,
      locationTo: MOCK_LOCATION_TO,
      studentLocation: {
        coords: MOCK_STUDENT_LOCATION,
        lastUpdated: Timestamp.now(),
      },
      numRiders: 100,
      status: "DRIVING TO PICK UP",
    });
    await setTimeout(1000);
    ws.send(
      JSON.stringify({
        directive: "RIDES_EXIST",
      })
    );
    await setTimeout(1000);
    expect(lastMsg.ridesExist).toBe(false);
  });

  test("VIEW_RIDE returns rideExists: false when no ride exists", async () => {
    ws.send(
      JSON.stringify({
        directive: "VIEW_RIDE",
        driverid: "9999999",
        driverLocation: {
          latitude: 1,
          longitude: 2,
        },
      })
    );
    await setTimeout(1000);
    expect(lastMsg.response).toBe("VIEW_RIDE");
    expect(lastMsg.rideExists).toBe(false);
  });

  test("VIEW_RIDE checks out a ride request and returns it", async () => {
    ws.send(MOCK_RR_MSG);
    await setTimeout(1000);
    ws.send(
      JSON.stringify({
        directive: "VIEW_RIDE",
        driverid: "9999999",
        driverLocation: {
          latitude: 1,
          longitude: 2,
        },
      })
    );
    await setTimeout(1000);
    expect(lastMsg.response).toBe("VIEW_RIDE");
    expect(lastMsg.rideExists).toBe(true);
    expect(lastMsg.rideInfo.rideRequest.netid).toBe("3333333"); // <-- FIXED TYPO
    const queryExistingRide = rideRequestsCollection.where("netid", "in", [
      "3333333",
    ]);
    const inDatabase = await queryExistingRide.get();
    expect(inDatabase.size).toBe(1);
    expect(inDatabase.docs[0].get("status")).toBe("VIEWING");
  });

  test("VIEW_DECISION -- ACCEPT updates ride status and driverid of the ride", async () => {
    ws.send(MOCK_RR_MSG);
    await setTimeout(1000);
    ws.send(
      JSON.stringify({
        directive: "VIEW_RIDE",
        driverid: "9999999",
        driverLocation: {
          latitude: 1,
          longitude: 2,
        },
      })
    );
    await setTimeout(1000);
    expect(lastMsg.response).toBe("VIEW_RIDE");
    expect(lastMsg.rideExists).toBe(true);
    expect(lastMsg.rideInfo.rideRequest.netid).toBe("3333333"); // <-- FIXED TYPO
    const queryExistingRide = rideRequestsCollection.where("netid", "in", [
      "3333333",
    ]);
    const inDatabase = await queryExistingRide.get();
    expect(inDatabase.size).toBe(1);
    expect(inDatabase.docs[0].get("status")).toBe("VIEWING");
    const msg = {
      directive: "VIEW_DECISION",
      driverid: "7777777",
      netid: "3333333", // This is the student's netid
      decision: "ACCEPT",
    };
    ws.send(JSON.stringify(msg));
    await setTimeout(1000);
    expect(lastMsg.response).toBe("VIEW_DECISION");
    expect(lastMsg.success).toBe(true);
    const updatedInDatabase = await queryExistingRide.get();
    expect(updatedInDatabase.size).toBe(1);
    expect(updatedInDatabase.docs[0].get("status")).toBe("DRIVING TO PICK UP");
    expect(updatedInDatabase.docs[0].get("netid")).toBe("3333333");
  });

  test("DRIVER_ARRIVED directive works as a part of the flow", async () => {
    ws.send(MOCK_RR_MSG);
    await setTimeout(1000);
    ws.send(
      JSON.stringify({
        directive: "VIEW_RIDE",
        driverid: "9999999",
        driverLocation: {
          latitude: 1,
          longitude: 2,
        },
      })
    );
    await setTimeout(1000);
    expect(lastMsg.response).toBe("VIEW_RIDE");
    expect(lastMsg.rideExists).toBe(true);
    expect(lastMsg.rideInfo.rideRequest.netid).toBe("3333333");
    const queryExistingRide = rideRequestsCollection.where("netid", "in", [
      "3333333",
    ]);
    const inDatabase = await queryExistingRide.get();
    expect(inDatabase.size).toBe(1);
    expect(inDatabase.docs[0].get("status")).toBe("VIEWING");
    const msg = {
      directive: "VIEW_DECISION",
      driverid: "7777777",
      netid: "3333333",
      decision: "ACCEPT",
    };
    ws.send(JSON.stringify(msg));
    await setTimeout(1000);
    expect(lastMsg.response).toBe("VIEW_DECISION");
    expect(lastMsg.success).toBe(true);
    const updatedInDatabase = await queryExistingRide.get();
    expect(updatedInDatabase.size).toBe(1);
    expect(updatedInDatabase.docs[0].get("status")).toBe("DRIVING TO PICK UP");
    expect(updatedInDatabase.docs[0].get("netid")).toBe("3333333");
    // actual important part of this test
    const driverArrivedMsg = {
      directive: "DRIVER_ARRIVED_AT_PICKUP",
      driverid: "7777777",
      studentNetid: "3333333",
    };
    ws.send(JSON.stringify(driverArrivedMsg));
    await setTimeout(1000);
    expect(lastMsg.response).toBe("DRIVER_ARRIVED_AT_PICKUP");
    expect(lastMsg.success).toBe(true);
    const updatedAgain = await queryExistingRide.get();
    expect(updatedAgain.size).toBe(1);
    expect(updatedAgain.docs[0].get("status")).toBe("DRIVER AT PICK UP");
    expect(updatedAgain.docs[0].get("netid")).toBe("3333333");
  });

  // The following tests not written because their functionality is not planned
  // to be used in app v1.
  //TODO(connor): tests for VIEW_DECISION: DENY
  //TODO(connor): tests for VIEW_DECISION: REPORT
  //TODO(connor): tests for VIEW_DECISION: TIMEOUT
  //TODO(connor): tests for VIEW_DECISION: ERROR
});
