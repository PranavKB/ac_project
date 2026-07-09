import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { BASE_URL } from "../../api";

const SOCKET_URL = `${BASE_URL}/ws`;

export const createWebSocketClient = (onConnect, onDisconnect, onError) => {
  const client = new Client({
    webSocketFactory: () => new SockJS(SOCKET_URL),
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    debug: (str) => console.log("STOMP: " + str),
  });

  client.onConnect = (frame) => {
    console.log("Connected to STOMP broker");
    if (onConnect) onConnect(frame);
  };

  client.onDisconnect = () => {
    console.log("Disconnected from STOMP broker");
    if (onDisconnect) onDisconnect();
  };

  client.onStompError = (frame) => {
    console.error("STOMP error", frame);
    if (onError) onError(frame);
  };

  return client;
};
