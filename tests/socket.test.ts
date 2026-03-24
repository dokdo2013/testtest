import http from "http";
import { Server as IOServer } from "socket.io";
import ioClient from "socket.io-client";
import { setupSocket } from "../src/socket";

type ClientSocket = ReturnType<typeof ioClient>;

let httpServer: http.Server;
let ioServer: IOServer;
let client1: ClientSocket;
let client2: ClientSocket;

function connectClient(port: number): Promise<ClientSocket> {
  return new Promise((resolve) => {
    const client: ClientSocket = ioClient(`http://localhost:${port}`, {
      transports: ["websocket"],
    });
    client.on("connect", () => resolve(client));
  });
}

beforeAll((done) => {
  httpServer = http.createServer();
  ioServer = new IOServer(httpServer);
  setupSocket(ioServer);
  httpServer.listen(0, done);
});

afterAll((done) => {
  client1?.disconnect();
  client2?.disconnect();
  ioServer.close();
  httpServer.close(done);
});

beforeEach(async () => {
  const addr = httpServer.address() as { port: number };
  client1 = await connectClient(addr.port);
  client2 = await connectClient(addr.port);
});

afterEach(() => {
  client1?.disconnect();
  client2?.disconnect();
});

describe("typing events", () => {
  it("broadcasts typing user to other clients", (done) => {
    client2.on("typingUsers", (names: string[]) => {
      expect(names).toContain("tester");
      done();
    });
    client1.emit("typing", { nickname: "tester" });
  });

  it("removes user on stopTyping", (done) => {
    client1.emit("typing", { nickname: "tester" });

    setTimeout(() => {
      client2.on("typingUsers", (names: string[]) => {
        expect(names).not.toContain("tester");
        done();
      });
      client1.emit("stopTyping");
    }, 50);
  });

  it("ignores typing with empty nickname", (done) => {
    client2.on("typingUsers", (names: string[]) => {
      expect(names).toHaveLength(0);
      done();
    });
    client1.emit("typing", { nickname: "" });
  });

  it("ignores typing with no nickname field", (done) => {
    client2.on("typingUsers", (names: string[]) => {
      expect(names).toHaveLength(0);
      done();
    });
    client1.emit("typing", {});
  });

  it("removes user on disconnect", (done) => {
    client1.emit("typing", { nickname: "leaver" });

    setTimeout(() => {
      client2.on("typingUsers", (names: string[]) => {
        expect(names).not.toContain("leaver");
        done();
      });
      client1.disconnect();
    }, 50);
  });

  it("deduplicates same nickname from different sockets", (done) => {
    let received = false;
    client1.emit("typing", { nickname: "shared" });

    setTimeout(() => {
      const addr = httpServer.address() as { port: number };
      const client3 = ioClient(`http://localhost:${addr.port}`, {
        transports: ["websocket"],
      });

      client3.on("connect", () => {
        client3.emit("typing", { nickname: "shared" });

        setTimeout(() => {
          client2.on("typingUsers", (names: string[]) => {
            if (!received) {
              received = true;
              const sharedCount = names.filter((n: string) => n === "shared").length;
              expect(sharedCount).toBeLessThanOrEqual(1);
              client3.disconnect();
              done();
            }
          });
          client3.emit("stopTyping");
        }, 50);
      });
    }, 50);
  });
});
