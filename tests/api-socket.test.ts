import http from "http";
import { Server as IOServer } from "socket.io";
import ioClient from "socket.io-client";
import request from "supertest";
import { app } from "../src/app";
import { sequelize } from "../src/db";
import { setupSocket, setIO } from "../src/socket";

type ClientSocket = ReturnType<typeof ioClient>;

let httpServer: http.Server;
let ioServer: IOServer;
let client: ClientSocket;

beforeAll(async () => {
  await sequelize.sync({ force: true });
  httpServer = http.createServer(app);
  ioServer = new IOServer(httpServer);
  setIO(ioServer);
  setupSocket(ioServer);
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const addr = httpServer.address() as { port: number };
  client = ioClient(`http://localhost:${addr.port}`, { transports: ["websocket"] });
  await new Promise<void>((resolve) => client.on("connect", () => resolve()));
});

afterAll(async () => {
  client?.disconnect();
  setIO(null as any);
  ioServer?.close();
  await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  await sequelize.close();
});

describe("API + Socket.IO integration", () => {
  it("broadcasts newPost on POST /api/posts", (done) => {
    client.on("newPost", (post: any) => {
      expect(post.nickname).toBe("socket-tester");
      expect(post.content).toBe("hello via socket");
      expect(post.password).toBeUndefined();
      client.off("newPost");
      done();
    });

    request(app)
      .post("/api/posts")
      .send({ nickname: "socket-tester", content: "hello via socket", password: "pw123" })
      .expect(201)
      .end(() => {});
  });

  it("broadcasts updatePost on PUT /api/posts/:id", (done) => {
    request(app)
      .post("/api/posts")
      .send({ nickname: "updater", content: "before", password: "upw" })
      .expect(201)
      .end((_err, res) => {
        const postId = res.body.id;

        client.on("updatePost", (post: any) => {
          expect(post.id).toBe(postId);
          expect(post.content).toBe("after");
          expect(post.password).toBeUndefined();
          client.off("updatePost");
          done();
        });

        request(app)
          .put(`/api/posts/${postId}`)
          .send({ content: "after", password: "upw" })
          .expect(200)
          .end(() => {});
      });
  });

  it("broadcasts deletePost on DELETE /api/posts/:id", (done) => {
    request(app)
      .post("/api/posts")
      .send({ nickname: "deleter", content: "bye", password: "dpw" })
      .expect(201)
      .end((_err, res) => {
        const postId = res.body.id;

        client.on("deletePost", (data: any) => {
          expect(data.id).toBe(postId);
          client.off("deletePost");
          done();
        });

        request(app)
          .delete(`/api/posts/${postId}`)
          .send({ password: "dpw" })
          .expect(204)
          .end(() => {});
      });
  });
});
