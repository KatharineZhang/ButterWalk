import {
  Command,
  WebSocketMessage,
  WebSocketResponse,
} from "../../server/src/api";

// the type of function (event handler) that will be called when a message of a certain type is received
type WebSocketResponseHandler = (message: WebSocketResponse) => void;

// Abstracts the websocket details from the react native app
class WebSocketService {
  private websocket: WebSocket | null = null;
  private messageHandlers: Map<Command, WebSocketResponseHandler[]> = new Map();

  /**
   * Create a new websocket connection to the server,
   * linking a specific netid to the websocket instance created
   *
   * @param netid
   * @returns
   */
  connect(netid: string, role: "STUDENT" | "DRIVER") {
    if (
      this.websocket != null &&
      this.websocket.readyState === WebSocket.OPEN
    ) {
      return;
    }

    const IP_ADDRESS = process.env.EXPO_PUBLIC_IP_ADDRESS
      ? process.env.EXPO_PUBLIC_IP_ADDRESS
      : undefined;
    if (!IP_ADDRESS) {
      console.error("IP_ADDRESS not found in .env");
      return;
    }

    this.websocket = new WebSocket(`ws://${IP_ADDRESS}:8080/api/`);

    if (this.websocket == null) {
      console.error("WEBSOCKET: Failed to create WebSocket");
      return;
    }

    this.websocket.onopen = () => {
      console.log("WEBSOCKET: Connected to Websocket");
      this.send({ directive: "CONNECT", netid: netid, role: role });
    };

    this.websocket.onmessage = (event) => {
      console.log(`WEBSOCKET: Received message => ${event.data}`);
      const message = JSON.parse(event.data) as WebSocketResponse;
      // send message to any component interested in this message type
      const key =
        message.response == "ERROR" ? message.category : message.response;

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
      console.log("WEBSOCKET: Disconnected from Websocket");
    };

    this.websocket.onerror = (error: Event) => {
      console.error(`WEBSOCKET: Error: ${(error as ErrorEvent).message}`);
    };
  }

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
    console.error("No websocket connection");
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
    }
  }
}

export default new WebSocketService();
