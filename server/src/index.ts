import express, { Express } from "express";
import bodyParser from "body-parser";
import WebSocketServer from "ws";
import https from "https";
import { v4 as uuidv4 } from "uuid";
import { handleWebSocketMessage } from "./websocket";

const app: Express = express();
app.use(bodyParser.json());

//Make a new websocket server on 8080
const server = https.createServer(app);
server.listen(8080, () => {
  console.log("WEBSOCKET: HTTP server listening on port 8080");
});
const wss = new WebSocketServer.Server({ server });
export let clients: {
  websocketid: string;
  websocketInstance: WebSocketServer;
  netid: string;
  role: "STUDENT" | "DRIVER";
}[] = [];

wss.on("connection", (ws: WebSocketServer) => {
  const instanceId = uuidv4(); // generate a unique id for each websocket instance

  console.log(`WEBSOCKET: ${instanceId} connected`);
  clients.push({
    websocketid: instanceId,
    websocketInstance: ws,
    netid: "unknown",
    role: "STUDENT",
  }); // add the client to the list

  ws.on("message", (message: string) => {
    handleWebSocketMessage(ws, message);
  });

  ws.on("close", () => {
    console.log(`WEBSOCKET: ${instanceId} disconnected`);
    const client = clients.find((client) => client.websocketid == instanceId);
    if (client && client.netid != "unknown") {
      // a valid user is disconnecting
      // cancel any ride requests they may have
      handleWebSocketMessage(
        ws,
        JSON.stringify({
          directive: "CANCEL",
          netid: client.netid,
          role: client.role,
        })
      );
    }
    // else, the websocket instance was alive, but not connected to a specific user
    // remove the instance from the list
    clients = clients.filter((client) => client.websocketid != instanceId);
  });
});

/**
 * Keep the websocket server in the list but nullify netid and role info
 * This is to allow for multiple users using the same websocket instance
 *
 * @param ws the websocket instance to remove
 */
export function refreshClient(ws: WebSocketServer) {
  // find the client to remove
  let client = clients.find((client) => client.websocketInstance === ws);
  // remove it
  clients = clients.filter((client) => client.websocketInstance !== ws);
  if (client) {
    client = { ...client, netid: "unknown", role: "STUDENT" };
    // readd the client with the updated info
    clients.push(client);
  }
}
