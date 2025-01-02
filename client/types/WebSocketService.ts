import { WebSocketMessage } from "../../server/src/api";

// Abstracts the websocket details from the react native app
class WebSocketService {
  private websocket: WebSocket | null = null;

  // Must pass in a netid to connect the generated websocket to the user
  connect(netid: string) {
    if (
      this.websocket != null &&
      this.websocket.readyState === WebSocket.OPEN
    ) {
      return;
    }

    let IP_ADDRESS = process.env.EXPO_PUBLIC_IP_ADDRESS
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
      this.send({ directive: "CONNECT", netid: netid });
    };
    this.websocket.onmessage = (event) => {
      console.log(`WEBSOCKET: Received message => ${event.data}`);
    };
    this.websocket.onclose = () => {
      console.log("WEBSOCKET: Disconnected from Websocket");
    };
    this.websocket.onerror = (error: Event) => {
      console.error(`WEBSOCKET: Error: ${(error as ErrorEvent).message}`);
    };
  }

  // Send a message to the websocket
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
