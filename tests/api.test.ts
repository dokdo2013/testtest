import request from "supertest";
import { app } from "../src/app";
import { sequelize } from "../src/db";

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe("GET /api/posts", () => {
  it("returns empty array when no posts", async () => {
    const res = await request(app).get("/api/posts");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("POST /api/posts", () => {
  it("creates a post and returns 201", async () => {
    const res = await request(app)
      .post("/api/posts")
      .send({ nickname: "user1", content: "CIME is great" });
    expect(res.status).toBe(201);
    expect(res.body.nickname).toBe("user1");
    expect(res.body.content).toBe("CIME is great");
    expect(res.body.id).toBeDefined();
  });

  it("returns 400 when nickname is missing", async () => {
    const res = await request(app)
      .post("/api/posts")
      .send({ content: "no name" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when content is missing", async () => {
    const res = await request(app)
      .post("/api/posts")
      .send({ nickname: "user1" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when nickname is empty string", async () => {
    const res = await request(app)
      .post("/api/posts")
      .send({ nickname: "", content: "something" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when content is empty string", async () => {
    const res = await request(app)
      .post("/api/posts")
      .send({ nickname: "user1", content: "" });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/posts after creation", () => {
  it("returns posts in newest-first order", async () => {
    await sequelize.sync({ force: true });
    await request(app)
      .post("/api/posts")
      .send({ nickname: "first", content: "first post" });
    await request(app)
      .post("/api/posts")
      .send({ nickname: "second", content: "second post" });

    const res = await request(app).get("/api/posts");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].nickname).toBe("second");
    expect(res.body[1].nickname).toBe("first");
  });
});
