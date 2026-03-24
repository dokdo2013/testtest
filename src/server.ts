import http from "http";
import { Server as IOServer } from "socket.io";
import { app } from "./app";
import { sequelize } from "./db";
import { setupSocket, setIO } from "./socket";

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new IOServer(server);

setIO(io);
setupSocket(io);

async function start() {
  await sequelize.sync();
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();

export { server, io };
