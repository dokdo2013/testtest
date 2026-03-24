import express from "express";
import path from "path";
import rateLimit from "express-rate-limit";
import { postsRouter } from "./routes/posts";

const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "10kb" }));
app.use(express.static(path.join(__dirname, "../public")));

const postLimiter = rateLimit({ windowMs: 60_000, max: 20 });
app.use("/api/posts", postLimiter, postsRouter);

export { app };
