import { Router, Request, Response } from "express";
import { Post } from "../models/Post";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  const posts = await Post.findAll({ order: [["createdAt", "DESC"]] });
  res.json(posts);
});

router.post("/", async (req: Request, res: Response) => {
  const { nickname, content } = req.body;

  if (!nickname || !content || !nickname.trim() || !content.trim()) {
    res.status(400).json({ error: "nickname and content are required" });
    return;
  }

  const post = await Post.create({ nickname: nickname.trim(), content: content.trim() });
  res.status(201).json(post);
});

export { router as postsRouter };
