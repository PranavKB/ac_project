import { createWebSocketClient } from "./socketClient";

// Single instance to be used across the app
const client = createWebSocketClient();

export const socketService = {
  connect: () => {
    client.activate();
  },

  disconnect: () => {
    client.deactivate();
  },

  subscribeToChat: (rideId, callback) => {
    return client.subscribe(`/topic/chat/${rideId}`, (message) => {
      callback(JSON.parse(message.body));
    });
  },

  sendMessage: (rideId, payload) => {
    client.publish({
      destination: `/app/chat/${rideId}`,
      body: JSON.stringify(payload),
    });
  },

  isConnected: () => client.connected,

  unsubscribe: (subscription) => {
    if (subscription) {
      subscription.unsubscribe();
    }
  },
};
