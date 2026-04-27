import { io } from "socket.io-client";

export const createSocket = (userId) => {
  return io("http://localhost:3000", {
    auth: { userId }
  });
};