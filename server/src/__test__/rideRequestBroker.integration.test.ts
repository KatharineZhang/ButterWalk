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
import {
  addDoc,
  collection,
  deleteDoc,
  getDocs,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { setTimeout } from "timers/promises";
import { db, usersCollection } from "../firebaseActions";

const MOCK_RR_MSG: string = JSON.stringify({
  directive: "REQUEST_RIDE",
  phoneNum: "098-765-4321",
  netid: "3333333",
  location: "MOCK_TEST_LOCATION",
  destination: "MOCK_TEST_DESTINATION",
  numRiders: 1,
});

const rideRequestsCollection = collection(db, "RideRequests");

// returns number of test rides in the database
const mockRideCount = async (): Promise<number> => {
  const queryExistingRide = query(
    rideRequestsCollection,
    where("netid", "in", ["0000000", "1111111", "2222222", "3333333"])
  );
  const inDatabase = await getDocs(queryExistingRide);
  return inDatabase.size;
};

describe("Websocket Integration", () => {
  beforeAll(async () => {
    // add test users to the firestore
    await addDoc(usersCollection, {
      firstName: "first_name_0000000",
      lastName: "last_name_0000000",
      netid: "0000000",
      phoneNumber: "000-111-1010",
      preferredName: "test_user_0000000",
      studentNumber: "0000000",
      studentOrDriver: "STUDENT",
    });
    await addDoc(usersCollection, {
      firstName: "first_name_1111111",
      lastName: "last_name_1111111",
      netid: "1111111",
      phoneNumber: "111-111-1010",
      preferredName: "test_user_1111111",
      studentNumber: "1111111",
      studentOrDriver: "STUDENT",
    });
    await addDoc(usersCollection, {
      firstName: "first_name_2222222",
      lastName: "last_name_2222222",
      netid: "2222222",
      phoneNumber: "222-111-1010",
      preferredName: "test_user_2222222",
      studentNumber: "2222222",
      studentOrDriver: "STUDENT",
    });
    await addDoc(usersCollection, {
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
    const queryExistingRide = query(
      rideRequestsCollection,
      where("netid", "in", ["0000000", "1111111", "2222222", "3333333"])
    );
    const inDatabase = await getDocs(queryExistingRide);
    expect(inDatabase.size).toBe(0);
  });
  afterEach(async () => {
    ws.close();
    // make sure all test data has been removed from the RideRequests table
    // tests in this file always use netids: 0000000, 1111111, 2222222, or 3333333
    const queryExistingRide = query(
      rideRequestsCollection,
      where("netid", "in", ["0000000", "1111111", "2222222", "3333333"])
    );
    const inDatabase = await getDocs(queryExistingRide);
    inDatabase.forEach((el) => {
      deleteDoc(el.ref);
    });
    // wait for the websocket to close (yes this is terrible, it also works)
    await setTimeout(1000);
  });
  afterAll(async () => {
    //remove test users from firestore
    const queryUsers = query(
      usersCollection,
      where("netid", "in", ["0000000", "1111111", "2222222", "3333333"])
    );
    const inDatabase = await getDocs(queryUsers);
    inDatabase.forEach((el) => {
      deleteDoc(el.ref);
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
      location: "TEST_LOCATION",
      destination: "TEST_DESTINATION",
      numRiders: 1,
    });
    ws.send(message);
    await setTimeout(1000);
    const queryExistingRide = query(
      rideRequestsCollection,
      where("netid", "in", ["0000000"])
    );
    const inDatabase = await getDocs(queryExistingRide);
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
    await addDoc(rideRequestsCollection, {
      netid: "0000000",
      driverid: "TEST_WHATEVER",
      requestedAt: Timestamp.now(),
      completedAt: Timestamp.now(),
      locationFrom: "nodejs",
      locationTo: "jest",
      studentLocation: "my puter",
      numRiders: 100,
      status: "COMPLETED",
    });
    await addDoc(rideRequestsCollection, {
      netid: "1111111",
      driverid: "TEST_WHATEVER",
      requestedAt: Timestamp.now(),
      completedAt: Timestamp.now(),
      locationFrom: "nodejs",
      locationTo: "jest",
      studentLocation: "my puter",
      numRiders: 100,
      status: "CANCELED",
    });
    await addDoc(rideRequestsCollection, {
      netid: "1111111",
      driverid: "TEST_WHATEVER",
      requestedAt: Timestamp.now(),
      completedAt: Timestamp.now(),
      locationFrom: "nodejs",
      locationTo: "jest",
      studentLocation: "my puter",
      numRiders: 100,
      status: "AWAITING_PICK_UP",
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

  test("RIDES_EXIST returns true when there are rides with multiple status's including REQUSTED", async () => {
    await addDoc(rideRequestsCollection, {
      netid: "0000000",
      driverid: "928374_TEST",
      requestedAt: Timestamp.now(),
      completedAt: Timestamp.now(),
      locationFrom: "nodejs",
      locationTo: "jest",
      studentLocation: "my puter",
      numRiders: 100,
      status: "COMPLETED",
    });
    await addDoc(rideRequestsCollection, {
      netid: "1111111",
      driverid: "TEST_WHATEVER",
      requestedAt: Timestamp.now(),
      completedAt: Timestamp.now(),
      locationFrom: "nodejs",
      locationTo: "jest",
      studentLocation: "my puter",
      numRiders: 100,
      status: "CANCELED",
    });
    await addDoc(rideRequestsCollection, {
      netid: "1111111",
      driverid: "TEST_WHATEVER",
      requestedAt: Timestamp.now(),
      completedAt: Timestamp.now(),
      locationFrom: "nodejs",
      locationTo: "jest",
      studentLocation: "my puter",
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
    expect(lastMsg.rideRequest.netid).toBe("3333333");
    const queryExistingRide = query(
      rideRequestsCollection,
      where("netid", "in", ["3333333"])
    );
    const inDatabase = await getDocs(queryExistingRide);
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
    expect(lastMsg.rideRequest.netid).toBe("3333333");
    const queryExistingRide = query(
      rideRequestsCollection,
      where("netid", "in", ["3333333"])
    );
    const inDatabase = await getDocs(queryExistingRide);
    expect(inDatabase.size).toBe(1);
    expect(inDatabase.docs[0].get("status")).toBe("VIEWING");
    const msg = {
      directive: "VIEW_DECISION",
      driverid: "7777777",
      view: {
        rideRequest: {
          locationFrom: "MOCK_TEST_LOCATION",
          status: "REQUESTED",
          completedAt: null,
          numRiders: 1,
          requestedAt: Timestamp.now(), //incorrect timestamp, shouldn't matter though
          locationTo: "MOCK_TEST_DESTINATION",
          netid: "3333333",
          driverid: null,
        },
        user: {
          firstName: "first_name_3333333",
          lastName: "last_name_3333333",
          netid: "3333333",
          phoneNumber: "333-111-1010",
          preferredName: "test_user_3333333",
          studentNumber: "3333333",
          studentOrDriver: "STUDENT",
        },
      },
      decision: "ACCEPT",
    };
    ws.send(JSON.stringify(msg));
    await setTimeout(1000);
    expect(lastMsg.response).toBe("VIEW_DECISION");
    expect(lastMsg.success).toBe(true);
    const updatedInDatabase = await getDocs(queryExistingRide);
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
    expect(lastMsg.rideRequest.netid).toBe("3333333");
    const queryExistingRide = query(
      rideRequestsCollection,
      where("netid", "in", ["3333333"])
    );
    const inDatabase = await getDocs(queryExistingRide);
    expect(inDatabase.size).toBe(1);
    expect(inDatabase.docs[0].get("status")).toBe("VIEWING");
    const msg = {
      directive: "VIEW_DECISION",
      driverid: "7777777",
      view: {
        rideRequest: {
          locationFrom: "MOCK_TEST_LOCATION",
          status: "REQUESTED",
          completedAt: null,
          numRiders: 1,
          requestedAt: Timestamp.now(), //incorrect timestamp, shouldn't matter though
          locationTo: "MOCK_TEST_DESTINATION",
          netid: "3333333",
          driverid: null,
        },
        user: {
          firstName: "first_name_3333333",
          lastName: "last_name_3333333",
          netid: "3333333",
          phoneNumber: "333-111-1010",
          preferredName: "test_user_3333333",
          studentNumber: "3333333",
          studentOrDriver: "STUDENT",
        },
      },
      decision: "ACCEPT",
    };
    ws.send(JSON.stringify(msg));
    await setTimeout(1000);
    expect(lastMsg.response).toBe("VIEW_DECISION");
    expect(lastMsg.success).toBe(true);
    const updatedInDatabase = await getDocs(queryExistingRide);
    expect(updatedInDatabase.size).toBe(1);
    expect(updatedInDatabase.docs[0].get("status")).toBe("DRIVING TO PICK UP");
    expect(updatedInDatabase.docs[0].get("netid")).toBe("3333333");
    // actual important part of this test
    const driverArrivedMsg = {
      directive: "DRIVER_ARRIVED",
      driverid: "7777777",
      studentNetid: "3333333",
    };
    ws.send(JSON.stringify(driverArrivedMsg));
    await setTimeout(1000);
    expect(lastMsg.response).toBe("DRIVER_ARRIVED");
    expect(lastMsg.success).toBe(true);
    const updatedAgain = await getDocs(queryExistingRide);
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
