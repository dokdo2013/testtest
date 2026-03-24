import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { Post } from "../models/Post";

const router = Router();

const SALT_ROUNDS = 10;
const PUBLIC_ATTRS = ["id", "nickname", "content", "createdAt", "updatedAt"] as const;

router.get("/", async (_req: Request, res: Response) => {
  const posts = await Post.findAll({
    attributes: [...PUBLIC_ATTRS],
    order: [["createdAt", "DESC"]],
  });
  res.json(posts);
});

router.post("/", async (req: Request, res: Response) => {
  const { nickname, content, password } = req.body;

  if (typeof nickname !== "string" || typeof content !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "nickname, content, and password are required" });
    return;
  }

  const trimmedNickname = nickname.trim();
  const trimmedContent = content.trim();

  if (!trimmedNickname || !trimmedContent || !password) {
    res.status(400).json({ error: "nickname, content, and password are required" });
    return;
  }

  if (trimmedNickname.length > 50 || trimmedContent.length > 2000) {
    res.status(400).json({ error: "input too long" });
    return;
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const post = await Post.create({ nickname: trimmedNickname, content: trimmedContent, password: hashed });

  const { getIO } = require("../socket");
  const io = getIO();
  if (io) {
    io.emit("newPost", {
      id: post.id, nickname: post.nickname, content: post.content,
      createdAt: post.createdAt, updatedAt: post.updatedAt,
    });
  }

  res.status(201).json({
    id: post.id, nickname: post.nickname, content: post.content,
    createdAt: post.createdAt, updatedAt: post.updatedAt,
  });
});

router.put("/:id", async (req: Request, res: Response) => {
  const { content, password } = req.body;

  if (typeof password !== "string" || !password) {
    res.status(400).json({ error: "password is required" });
    return;
  }

  const post = await Post.findByPk(req.params.id);
  if (!post) {
    res.status(404).json({ error: "post not found" });
    return;
  }

  const match = await bcrypt.compare(password, post.password);
  if (!match) {
    res.status(403).json({ error: "wrong password" });
    return;
  }

  if (typeof content === "string" && content.trim()) {
    if (content.trim().length > 2000) {
      res.status(400).json({ error: "input too long" });
      return;
    }
    post.content = content.trim();
    await post.save();
  }

  const { getIO } = require("../socket");
  const io = getIO();
  if (io) {
    io.emit("updatePost", {
      id: post.id, nickname: post.nickname, content: post.content,
      createdAt: post.createdAt, updatedAt: post.updatedAt,
    });
  }

  res.json({
    id: post.id, nickname: post.nickname, content: post.content,
    createdAt: post.createdAt, updatedAt: post.updatedAt,
  });
});

router.delete("/:id", async (req: Request, res: Response) => {
  const { password } = req.body;

  if (typeof password !== "string" || !password) {
    res.status(400).json({ error: "password is required" });
    return;
  }

  const post = await Post.findByPk(req.params.id);
  if (!post) {
    res.status(404).json({ error: "post not found" });
    return;
  }

  const match = await bcrypt.compare(password, post.password);
  if (!match) {
    res.status(403).json({ error: "wrong password" });
    return;
  }

  await post.destroy();

  const { getIO } = require("../socket");
  const io = getIO();
  if (io) {
    io.emit("deletePost", { id: post.id });
  }

  res.status(204).end();
});

export { router as postsRouter };
