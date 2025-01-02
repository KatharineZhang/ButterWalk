import express, { Express } from "express";
import bodyParser from "body-parser";
import WebSocketServer from "ws";
import http from "http";
import { v4 as uuidv4 } from "uuid";
import { handleWebSocketMessage } from "./websocket";

const app: Express = express();
app.use(bodyParser.json());

//Make a new websocket server on 8080
const server = http.createServer(app);
server.listen(8080, () => {
  console.log("WEBSOCKET: HTTP server listening on port 8080");
});
const wss = new WebSocketServer.Server({ server });
export let clients: {
  websocketid: string;
  websocketInstance: WebSocketServer;
  netid: string;
}[] = [];

wss.on("connection", (ws: WebSocketServer) => {
  const instanceId = uuidv4(); // generate a unique id for each websocket instance

  console.log(`WEBSOCKET: ${instanceId} connected`);
  clients.push({
    websocketid: instanceId,
    websocketInstance: ws,
    netid: "unknown",
  }); // add the client to the list

  ws.on("message", (message: string) => {
    handleWebSocketMessage(ws, message);
  });

  ws.on("close", () => {
    console.log(`WEBSOCKET: ${instanceId} disconnected`);
    clients = clients.filter((client) => client.websocketid != instanceId); // remove the client from the list
  });
});
