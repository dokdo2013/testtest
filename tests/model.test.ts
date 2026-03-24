import { sequelize } from "../src/db";
import { Post } from "../src/models/Post";

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe("Post model", () => {
  it("creates a post with nickname, content, and password", async () => {
    const post = await Post.create({
      nickname: "tester",
      content: "CIME is fast",
      password: "hashed_pw",
    });
    expect(post.id).toBeDefined();
    expect(post.nickname).toBe("tester");
    expect(post.content).toBe("CIME is fast");
    expect(post.password).toBe("hashed_pw");
    expect(post.createdAt).toBeInstanceOf(Date);
  });

  it("rejects a post without nickname", async () => {
    await expect(
      Post.create({ content: "no nickname", password: "pw" } as any)
    ).rejects.toThrow();
  });

  it("rejects a post without content", async () => {
    await expect(
      Post.create({ nickname: "tester", password: "pw" } as any)
    ).rejects.toThrow();
  });

  it("rejects a post without password", async () => {
    await expect(
      Post.create({ nickname: "tester", content: "no pw" } as any)
    ).rejects.toThrow();
  });
});
