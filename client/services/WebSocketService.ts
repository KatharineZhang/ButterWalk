import { AppState } from "react-native";
import {
  Command,
  ErrorResponse,
  WebSocketMessage,
  WebSocketResponse,
} from "../../server/src/api";

// the type of function (event handler) that will be called when a message of a certain type is received
type WebSocketResponseHandler = (message: WebSocketResponse) => void;
type ConnectionHandler = (state: number | undefined) => void;

export type WebsocketConnectMessage =
  | `Failed to Connect`
  | "Connected Successfully";

export type WSConnectionState = "CONNECTED" | "DISCONNECTED" | "CONNECTING";

// Abstracts the websocket details from the react native app
class WebSocketService {
  private websocket: WebSocket | null = null;
  private messageHandlers: Map<Command, WebSocketResponseHandler[]> = new Map();
  private pingHandlers: ConnectionHandler[] = [];
  private appState = "";
  private lastPong: number = 0;
  private pingTimer: number | undefined = undefined;
  private PING_INTERVAL_MS = 30000; // every 30s, ping the server
  private PONG_TIMEOUT_MS = 5000; // expect pong within 5s

  constructor() {
    // make a listener to update appState on change
    AppState.addEventListener("change", async (nextState) => {
      if (
        this.appState.match(/inactive|background/) &&
        nextState === "active"
      ) {
        // reconnect to websocket in case it disconnected while app was in background
        console.log(await this.connect());
      }

      this.appState = nextState;
    });
  }

  /**
   * Create a new websocket connection to the server,
   * linking a specific netid to the websocket instance created
   *
   * @param netid
   * @returns
   */
  async connect(): Promise<WebsocketConnectMessage> {
    if (
      this.websocket != null &&
      this.websocket.readyState === WebSocket.OPEN
    ) {
      return Promise.resolve("Connected Successfully");
    }

    const IP_ADDRESS = process.env.EXPO_PUBLIC_IP_ADDRESS
      ? process.env.EXPO_PUBLIC_IP_ADDRESS
      : undefined;
    if (!IP_ADDRESS) {
      console.error("IP_ADDRESS not found in .env");
      return Promise.resolve("Failed to Connect");
    }

    this.websocket = new WebSocket(`ws://${IP_ADDRESS}:8080/api/`);

    if (this.websocket == null) {
      console.error("WEBSOCKET: Failed to create WebSocket");
      return Promise.resolve("Failed to Connect");
    }

    this.startWebsocketListeners();

    return await this.waitForOpenConnection();
  }

  startWebsocketListeners = () => {
    if (this.websocket == null) {
      return;
    }

    this.websocket.onopen = () => {
      console.log("WEBSOCKET: Connected to Websocket");
      this.startPing();
      this.callPingHandlers();
    };

    this.websocket.onmessage = (event) => {
      this.callPingHandlers();
      console.log(`WEBSOCKET: Received message => ${event.data}`);
      const message = JSON.parse(event.data) as WebSocketResponse;
      // send message to any component interested in this message type
      const key =
        message.response == "ERROR"
          ? (message as ErrorResponse).category
          : message.response;

      const handlersToCall: WebSocketResponseHandler[] | undefined =
        this.messageHandlers.get(key);
      // if there are handlers for this message type, i.e. handlersToCall is no undefined, call them
      if (handlersToCall) {
        handlersToCall.forEach((handler) => {
          handler(message);
        });
      }
    };

    this.websocket.onclose = () => {
      this.callPingHandlers();
      console.log(
        "WEBSOCKET: Disconnected from Websocket" +
          (this.appState === "active"
            ? " unexpectedly"
            : " because app went background")
      );
      // try reconnecting if the app is still active
      if (this.appState === "active") {
        setTimeout(async () => {
          await this.connect();
        }, 1000);
      }
    };

    this.websocket.onerror = (error: Event) => {
      console.log(`WEBSOCKET: Error: ${(error as ErrorEvent).message}`);
    };
  };

  /**
   * Keep retrying (max 10 times) until connection has been made, with 200 ms gap in between each try
   */
  waitForOpenConnection = () => {
    return new Promise<WebsocketConnectMessage>((resolve, reject) => {
      const maxNumberOfAttempts = 10;
      const intervalTime = 200; //ms

      let currentAttempt = 0;
      const interval = setInterval(() => {
        if (currentAttempt > maxNumberOfAttempts - 1) {
          clearInterval(interval);
          reject("Failed to Connect: Max number of attempts reached");
        } else if (
          this.websocket != null &&
          this.websocket.readyState === this.websocket.OPEN
        ) {
          // we're connected!
          clearInterval(interval);
          resolve("Connected Successfully");
        }
        currentAttempt++;
      }, intervalTime);
    });
  };

  /**
   * Send a message to the websocket server
   *
   * @param message
   */
  send(message: WebSocketMessage) {
    if (
      this.websocket != null &&
      this.websocket.readyState === WebSocket.OPEN
    ) {
      this.websocket.send(JSON.stringify(message));
      return;
    }
    this.callPingHandlers();
    console.log("No websocket connection");
  }

  /**
   * Adds a event handler to our collection. Used to update state in components
   * when a message of certain directive type is received
   *
   * @param handler the function this service will call when it receives a message of response type 'directive'
   * @param directive the response type the component is interested in
   */
  addListener(handler: WebSocketResponseHandler, directive: Command) {
    // add directive to map if not already there
    if (!this.messageHandlers.has(directive)) {
      this.messageHandlers.set(directive, []);
    }
    // add to the directive's array of handlers
    this.messageHandlers.get(directive)?.push(handler);
  }

  addConnectionListener(handler: ConnectionHandler) {
    // add to our array of ping handlers
    this.pingHandlers.push(handler);
  }

  /**
   * The converse of addListener. Removes a handler from the collection
   *
   * @param handler the handler to remove
   * @param directive the dirctive passed in to addListener when this handler was added
   */
  removeListener(handler: WebSocketResponseHandler, directive: Command) {
    this.messageHandlers.get(directive)?.filter((h) => h !== handler);
  }

  // Disconnect from the websocket
  close() {
    if (
      this.websocket != null &&
      this.websocket.readyState === WebSocket.OPEN
    ) {
      this.websocket.close();
      // stop pinging
      clearInterval(this.pingTimer);
    }
  }

  startPing() {
    // Send a ping every 30 seconds to check that the client is alive, and to
    // keep the connection alive
    this.pingTimer = setInterval(() => {
      if (
        this.websocket != null &&
        this.websocket.readyState === WebSocket.OPEN
      ) {
        console.log("Sending " + JSON.stringify({ directive: "PING" }));
        this.websocket.send(JSON.stringify({ directive: "PING" }));

        // check if last pong is too old
        if (
          this.lastPong &&
          Date.now() - this.lastPong >
            this.PING_INTERVAL_MS + this.PONG_TIMEOUT_MS
        ) {
          console.log("Pong timeout — reconnecting...");
          this.callPingHandlers();
          this.connect();
        }
      }
    }, 10000);
  }

  callPingHandlers() {
    this.pingHandlers.forEach((handler) => {
      // call each handler with the websocket's current state
      handler(this.websocket?.readyState);
    });
  }
}

export default new WebSocketService();
