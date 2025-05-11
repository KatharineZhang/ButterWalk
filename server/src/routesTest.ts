import * as assert from "assert";

describe("routes", function () {
  const IP_ADDRESS = process.env.EXPO_PUBLIC_IP_ADDRESS
    ? process.env.EXPO_PUBLIC_IP_ADDRESS
    : undefined;
  if (!IP_ADDRESS) {
    console.error("IP_ADDRESS not found in .env");
    return;
  }

  const websocket = new WebSocket(`wss://${IP_ADDRESS}:8080/api/`);

  // TODO: set up fake db environment
  // TODO: finish implementing tests

  it("SIGNIN", function () {
    // test invalid arguements case
    assert.equal(websocket, websocket);
    // test the correct user case
    // test problematic user case
  });

  it("REQUEST_RIDE", function () {
    // test invalid arguements case
    // test correct case
    // check local queue
  });

  it("ACCEPT_RIDE", function () {
    // test invalid arguements case
    // test correct case
    // check local queue
  });

  it("CANCEL", function () {
    // test invalid arguements case
    // test correct case: student
    // test correct case: driver
  });

  it("COMPLETE", function () {
    // test invalid arguements case
    // test correct case
  });

  it("ADD_FEEDBACK", function () {
    // test invalid arguements case
    // test correct case
  });

  it("REPORT", function () {
    // test invalid arguements case
    // test correct case
  });

  it("BLACKLIST", function () {
    // test invalid arguements case
    // test user does not exist in ProblematicUsers table case
    // test correct case
  });

  it("WAIT_TIME", function () {
    // test invalid arguements case
    // test correct case: accepted
    // test correct case: not accepted, first in queue
    // test correct case: not accepted, not first in queue
  });

  it("LOCATION", function () {
    // test invalid arguements case
    // test correct case: ????
  });

  it("QUERY", function () {
    // test invalid arguements case
    // test correct case: rating
    // test correct case: date
    // test correct case: date
    // test correct case: rideOrApp
    // test correct case: combination
    // test correct case: combination
  });
});
