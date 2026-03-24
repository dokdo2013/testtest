import express from "express";
import path from "path";
import { postsRouter } from "./routes/posts";

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));
app.use("/api/posts", postsRouter);

export { app };
