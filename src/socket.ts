import { Server as IOServer, Socket } from "socket.io";

const typingUsers = new Map<string, string>();

export function setupSocket(io: IOServer) {
  io.on("connection", (socket: Socket) => {
    socket.on("typing", (data: { nickname?: string }) => {
      const name =
        typeof data?.nickname === "string" && data.nickname.trim()
          ? data.nickname.trim()
          : null;

      if (name) {
        typingUsers.set(socket.id, name);
      } else {
        typingUsers.delete(socket.id);
      }
      broadcastTyping(io, socket);
    });

    socket.on("stopTyping", () => {
      typingUsers.delete(socket.id);
      broadcastTyping(io, socket);
    });

    socket.on("disconnect", () => {
      typingUsers.delete(socket.id);
      broadcastTyping(io);
    });
  });
}

function broadcastTyping(io: IOServer, excludeSocket?: Socket) {
  const names = [...new Set(typingUsers.values())];
  if (excludeSocket) {
    excludeSocket.broadcast.emit("typingUsers", names);
  } else {
    io.emit("typingUsers", names);
  }
}

export function getIO(): IOServer | null {
  return ioInstance;
}

let ioInstance: IOServer | null = null;

export function setIO(io: IOServer) {
  ioInstance = io;
}
