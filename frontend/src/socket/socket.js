import { io } from "socket.io-client";

export const createSocket = (userId, token) => {
  return io("http://localhost:3000", {
    auth: { 
      userId,
      token
    }
  });
};