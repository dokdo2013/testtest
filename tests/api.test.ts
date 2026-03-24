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
  it("creates a post and returns 201 without password in response", async () => {
    const res = await request(app)
      .post("/api/posts")
      .send({ nickname: "user1", content: "CIME is great", password: "secret123" });
    expect(res.status).toBe(201);
    expect(res.body.nickname).toBe("user1");
    expect(res.body.content).toBe("CIME is great");
    expect(res.body.id).toBeDefined();
    expect(res.body.password).toBeUndefined();
  });

  it.each([
    [{ content: "x", password: "p" }, "nickname missing"],
    [{ nickname: "x", password: "p" }, "content missing"],
    [{ nickname: "x", content: "x" }, "password missing"],
    [{ nickname: "", content: "x", password: "p" }, "nickname empty"],
    [{ nickname: "x", content: "", password: "p" }, "content empty"],
    [{ nickname: "x", content: "x", password: "" }, "password empty"],
  ])("returns 400 when %s", async (body, _desc) => {
    const res = await request(app).post("/api/posts").send(body);
    expect(res.status).toBe(400);
  });

  it("returns 400 when nickname exceeds 50 chars", async () => {
    const res = await request(app)
      .post("/api/posts")
      .send({ nickname: "a".repeat(51), content: "ok", password: "pw" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("input too long");
  });

  it("returns 400 when content exceeds 2000 chars", async () => {
    const res = await request(app)
      .post("/api/posts")
      .send({ nickname: "ok", content: "a".repeat(2001), password: "pw" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("input too long");
  });
});

describe("GET /api/posts excludes password", () => {
  it("does not include password in list response", async () => {
    await sequelize.sync({ force: true });
    await request(app)
      .post("/api/posts")
      .send({ nickname: "a", content: "b", password: "pw" });

    const res = await request(app).get("/api/posts");
    expect(res.body[0].password).toBeUndefined();
  });
});

describe("GET /api/posts ordering", () => {
  it("returns posts in newest-first order", async () => {
    await sequelize.sync({ force: true });
    await request(app)
      .post("/api/posts")
      .send({ nickname: "first", content: "first post", password: "pw1" });
    await request(app)
      .post("/api/posts")
      .send({ nickname: "second", content: "second post", password: "pw2" });

    const res = await request(app).get("/api/posts");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].nickname).toBe("second");
    expect(res.body[1].nickname).toBe("first");
  });
});

describe("PUT /api/posts/:id", () => {
  let postId: number;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    const res = await request(app)
      .post("/api/posts")
      .send({ nickname: "editor", content: "original", password: "mypass" });
    postId = res.body.id;
  });

  it("updates content with correct password", async () => {
    const res = await request(app)
      .put(`/api/posts/${postId}`)
      .send({ content: "updated", password: "mypass" });
    expect(res.status).toBe(200);
    expect(res.body.content).toBe("updated");
    expect(res.body.password).toBeUndefined();
  });

  it("returns 403 with wrong password", async () => {
    const res = await request(app)
      .put(`/api/posts/${postId}`)
      .send({ content: "hacked", password: "wrong" });
    expect(res.status).toBe(403);
  });

  it("returns 404 for non-existent post", async () => {
    const res = await request(app)
      .put("/api/posts/99999")
      .send({ content: "x", password: "x" });
    expect(res.status).toBe(404);
  });

  it("returns 400 without password", async () => {
    const res = await request(app)
      .put(`/api/posts/${postId}`)
      .send({ content: "x" });
    expect(res.status).toBe(400);
  });

  it("returns 200 without content change (password-only)", async () => {
    const res = await request(app)
      .put(`/api/posts/${postId}`)
      .send({ password: "mypass" });
    expect(res.status).toBe(200);
    expect(res.body.content).toBe("updated");
  });

  it("returns 400 when updated content exceeds 2000 chars", async () => {
    const res = await request(app)
      .put(`/api/posts/${postId}`)
      .send({ content: "a".repeat(2001), password: "mypass" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("input too long");
  });
});

describe("DELETE /api/posts/:id", () => {
  let postId: number;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    const res = await request(app)
      .post("/api/posts")
      .send({ nickname: "deleter", content: "to delete", password: "delpw" });
    postId = res.body.id;
  });

  it("returns 400 without password", async () => {
    const res = await request(app)
      .delete(`/api/posts/${postId}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it("returns 403 with wrong password", async () => {
    const res = await request(app)
      .delete(`/api/posts/${postId}`)
      .send({ password: "wrong" });
    expect(res.status).toBe(403);
  });

  it("deletes with correct password", async () => {
    const res = await request(app)
      .delete(`/api/posts/${postId}`)
      .send({ password: "delpw" });
    expect(res.status).toBe(204);
  });

  it("returns 404 after deletion", async () => {
    const res = await request(app)
      .delete(`/api/posts/${postId}`)
      .send({ password: "delpw" });
    expect(res.status).toBe(404);
  });
});
