import { Router, Request, Response } from "express";
import { Post } from "../models/Post";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  const posts = await Post.findAll({ order: [["createdAt", "DESC"]] });
  res.json(posts);
});

router.post("/", async (req: Request, res: Response) => {
  const { nickname, content } = req.body;

  if (typeof nickname !== "string" || typeof content !== "string") {
    res.status(400).json({ error: "nickname and content are required" });
    return;
  }

  const trimmedNickname = nickname.trim();
  const trimmedContent = content.trim();

  if (!trimmedNickname || !trimmedContent) {
    res.status(400).json({ error: "nickname and content are required" });
    return;
  }

  if (trimmedNickname.length > 50 || trimmedContent.length > 2000) {
    res.status(400).json({ error: "input too long" });
    return;
  }

  const post = await Post.create({ nickname: trimmedNickname, content: trimmedContent });
  res.status(201).json(post);
});

export { router as postsRouter };
