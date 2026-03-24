# CIME Posts Web App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page web app where users post advantages of the CIME service (nickname + content), served by Express with SQLite/Sequelize.

**Architecture:** Express serves a static HTML/CSS frontend and exposes two REST endpoints (GET/POST /api/posts). Sequelize manages a single Post model backed by SQLite. app.ts and server.ts are separated so supertest can import the app without starting a listener.

**Tech Stack:** TypeScript, Express, Sequelize, SQLite3, Jest, ts-jest, supertest

---

## Context7 Documentation References

구현 시 아래 Context7 라이브러리 ID를 사용하여 공식 문서를 조회할 것. 각 태스크의 `Context7 조회` 단계에서 `mcp__context7__resolve-library-id` → `mcp__context7__query-docs` 순으로 호출한다.

| Library | Context7 ID | 사용 태스크 |
|---------|------------|------------|
| Sequelize (공식 문서) | `/sequelize/website` | Task 2, 3 |
| Express (공식 문서) | `/websites/expressjs_en` | Task 3, 4 |
| Jest | `/jestjs/jest` | Task 2, 3 |
| ts-jest | `/kulshekhar/ts-jest` | Task 1 |

---

## File Map

| File | Responsibility |
|------|---------------|
| `package.json` | Dependencies, scripts |
| `tsconfig.json` | TypeScript config |
| `jest.config.ts` | Jest config with ts-jest |
| `src/db.ts` | Sequelize instance (SQLite), sync helper |
| `src/models/Post.ts` | Post model definition |
| `src/routes/posts.ts` | GET /api/posts, POST /api/posts |
| `src/app.ts` | Express app setup, middleware, static files, routes |
| `src/server.ts` | app.listen entrypoint |
| `tests/model.test.ts` | Post model unit tests |
| `tests/api.test.ts` | API integration tests (supertest) |
| `public/index.html` | Single page UI |
| `public/style.css` | Styles |

---

### Task 1: Project scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `jest.config.ts`

- [ ] **Step 1: Initialize project and install dependencies**

```bash
cd /Users/hyeonwoo/DEV_test
npm init -y
npm install express sequelize sqlite3
npm install -D typescript ts-node @types/express @types/node jest ts-jest @types/jest supertest @types/supertest
```

- [ ] **Step 2: Configure tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 3: Context7 — ts-jest 설정 확인**

```
mcp__context7__query-docs(libraryId: "/kulshekhar/ts-jest", query: "ts-jest configuration with jest.config.ts preset and testEnvironment")
```

공식 문서에서 `preset: "ts-jest"` 설정과 권장 옵션을 확인한 뒤 아래 설정에 반영한다.

- [ ] **Step 4: Configure jest.config.ts**

```ts
import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
};

export default config;
```

- [ ] **Step 5: Add scripts to package.json**

Add to `package.json` scripts:
```json
{
  "scripts": {
    "build": "tsc",
    "start": "ts-node src/server.ts",
    "test": "jest --forceExit --detectOpenHandles"
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json jest.config.ts
git commit -m "chore: scaffold project with TypeScript, Express, Sequelize, Jest"
```

---

### Task 2: Database and Post model

**Files:**
- Create: `src/db.ts`
- Create: `src/models/Post.ts`
- Create: `tests/model.test.ts`

- [ ] **Step 1: Context7 — Sequelize 모델 정의 문서 확인**

```
mcp__context7__query-docs(libraryId: "/sequelize/website", query: "Model definition with TypeScript InferAttributes InferCreationAttributes DataTypes init SQLite")
```

공식 문서에서 TypeScript 모델 정의 패턴(`InferAttributes`, `CreationOptional`), `DataTypes`, `Model.init()` 사용법을 확인한다. SQLite dialect 설정과 `allowNull` 제약 조건도 확인할 것.

- [ ] **Step 2: Context7 — Jest 테스트 구조 확인**

```
mcp__context7__query-docs(libraryId: "/jestjs/jest", query: "beforeAll afterAll describe it expect async test setup teardown")
```

Jest의 `beforeAll`/`afterAll` lifecycle, `describe`/`it` 구조, `rejects.toThrow()` 등 비동기 에러 테스트 패턴을 확인한다.

- [ ] **Step 3: Write the failing model test**

```ts
// tests/model.test.ts
import { sequelize } from "../src/db";
import { Post } from "../src/models/Post";

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe("Post model", () => {
  it("creates a post with nickname and content", async () => {
    const post = await Post.create({
      nickname: "tester",
      content: "CIME is fast",
    });
    expect(post.id).toBeDefined();
    expect(post.nickname).toBe("tester");
    expect(post.content).toBe("CIME is fast");
    expect(post.createdAt).toBeInstanceOf(Date);
  });

  it("rejects a post without nickname", async () => {
    await expect(
      Post.create({ content: "no nickname" } as any)
    ).rejects.toThrow();
  });

  it("rejects a post without content", async () => {
    await expect(
      Post.create({ nickname: "tester" } as any)
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx jest tests/model.test.ts --verbose`
Expected: FAIL — cannot find `../src/db` or `../src/models/Post`

- [ ] **Step 5: Implement db.ts**

```ts
// src/db.ts
import { Sequelize } from "sequelize";

const isTest = process.env.NODE_ENV === "test";

export const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: isTest ? ":memory:" : "./database.sqlite",
  logging: false,
});
```

- [ ] **Step 6: Implement Post model**

```ts
// src/models/Post.ts
import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";
import { sequelize } from "../db";

export class Post extends Model<InferAttributes<Post>, InferCreationAttributes<Post>> {
  declare id: CreationOptional<number>;
  declare nickname: string;
  declare content: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Post.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nickname: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: "posts",
  }
);
```

- [ ] **Step 7: Run test to verify it passes**

Run: `NODE_ENV=test npx jest tests/model.test.ts --verbose`
Expected: 3 tests PASS

- [ ] **Step 8: Commit**

```bash
git add src/db.ts src/models/Post.ts tests/model.test.ts
git commit -m "feat: add Post model with Sequelize and unit tests"
```

---

### Task 3: API routes

**Files:**
- Create: `src/routes/posts.ts`
- Create: `src/app.ts`
- Create: `tests/api.test.ts`

- [ ] **Step 1: Context7 — Express Router 및 미들웨어 문서 확인**

```
mcp__context7__query-docs(libraryId: "/websites/expressjs_en", query: "express.Router express.json middleware express.static serving static files path.join")
```

Express의 `Router()`, `express.json()` 미들웨어, `express.static()` 정적 파일 서빙 설정을 공식 문서에서 확인한다.

- [ ] **Step 2: Context7 — Sequelize findAll / create 쿼리 문서 확인**

```
mcp__context7__query-docs(libraryId: "/sequelize/website", query: "Model.findAll order DESC Model.create validation allowNull")
```

`findAll`의 `order` 옵션과 `create` 시 `allowNull` 제약 검증 동작을 확인한다.

- [ ] **Step 3: Write the failing API tests**

```ts
// tests/api.test.ts
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
```

- [ ] **Step 4: Run test to verify it fails**

Run: `NODE_ENV=test npx jest tests/api.test.ts --verbose`
Expected: FAIL — cannot find `../src/app`

- [ ] **Step 5: Implement routes/posts.ts**

```ts
// src/routes/posts.ts
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
```

- [ ] **Step 6: Implement app.ts**

```ts
// src/app.ts
import express from "express";
import path from "path";
import { postsRouter } from "./routes/posts";

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));
app.use("/api/posts", postsRouter);

export { app };
```

- [ ] **Step 7: Run test to verify it passes**

Run: `NODE_ENV=test npx jest tests/api.test.ts --verbose`
Expected: 7 tests PASS

- [ ] **Step 8: Commit**

```bash
git add src/routes/posts.ts src/app.ts tests/api.test.ts
git commit -m "feat: add POST/GET /api/posts routes with validation and tests"
```

---

### Task 4: Server entrypoint

**Files:**
- Create: `src/server.ts`

- [ ] **Step 1: Context7 — Express app.listen 및 Sequelize sync 문서 확인**

```
mcp__context7__query-docs(libraryId: "/websites/expressjs_en", query: "app.listen port callback")
mcp__context7__query-docs(libraryId: "/sequelize/website", query: "sequelize.sync force alter options")
```

`app.listen()` 시그니처와 `sequelize.sync()` 옵션을 확인한다.

- [ ] **Step 2: Implement server.ts**

```ts
// src/server.ts
import { app } from "./app";
import { sequelize } from "./db";

const PORT = process.env.PORT || 3000;

async function start() {
  await sequelize.sync();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
```

- [ ] **Step 3: Verify server starts**

Run: `npx ts-node src/server.ts &` then `curl http://localhost:3000/api/posts` then kill the process.
Expected: `[]`

- [ ] **Step 4: Commit**

```bash
git add src/server.ts
git commit -m "feat: add server entrypoint"
```

---

### Task 5: Frontend

**Files:**
- Create: `public/index.html`
- Create: `public/style.css`

- [ ] **Step 1: Create index.html**

Uses safe DOM methods (createElement + textContent) instead of innerHTML to prevent XSS:

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CIME 장점 공유</title>
  <link rel="stylesheet" href="/style.css" />
</head>
<body>
  <div class="container">
    <h1>CIME 장점 공유</h1>

    <form id="post-form">
      <input
        type="text"
        id="nickname"
        placeholder="닉네임"
        maxlength="50"
        required
      />
      <textarea
        id="content"
        placeholder="CIME의 장점을 공유해주세요!"
        rows="3"
        required
      ></textarea>
      <button type="submit">작성하기</button>
    </form>

    <div id="posts"></div>
  </div>

  <script>
    const form = document.getElementById("post-form");
    const postsDiv = document.getElementById("posts");
    const nicknameInput = document.getElementById("nickname");
    const contentInput = document.getElementById("content");

    function createPostCard(post) {
      const card = document.createElement("div");
      card.className = "card";

      const header = document.createElement("div");
      header.className = "card-header";

      const name = document.createElement("strong");
      name.textContent = post.nickname;

      const date = document.createElement("span");
      date.className = "date";
      date.textContent = new Date(post.createdAt).toLocaleString("ko-KR");

      header.appendChild(name);
      header.appendChild(date);

      const body = document.createElement("p");
      body.textContent = post.content;

      card.appendChild(header);
      card.appendChild(body);
      return card;
    }

    async function loadPosts() {
      const res = await fetch("/api/posts");
      const posts = await res.json();
      postsDiv.replaceChildren();
      posts.forEach(function (post) {
        postsDiv.appendChild(createPostCard(post));
      });
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nickname = nicknameInput.value.trim();
      const content = contentInput.value.trim();
      if (!nickname || !content) return;

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, content }),
      });

      if (res.ok) {
        nicknameInput.value = "";
        contentInput.value = "";
        await loadPosts();
      }
    });

    loadPosts();
  </script>
</body>
</html>
```

- [ ] **Step 2: Create style.css**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: #f5f5f5;
  color: #333;
  line-height: 1.6;
}

.container {
  max-width: 640px;
  margin: 2rem auto;
  padding: 0 1rem;
}

h1 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #2c3e50;
}

form {
  background: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

input,
textarea {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: #3498db;
}

button {
  padding: 0.75rem;
  background: #3498db;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}

button:hover {
  background: #2980b9;
}

.card {
  background: #fff;
  padding: 1.25rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.date {
  font-size: 0.85rem;
  color: #999;
}

.card p {
  white-space: pre-wrap;
}
```

- [ ] **Step 3: Verify manually**

Run: `npx ts-node src/server.ts` and open `http://localhost:3000` in browser.
Expected: Form and empty post list visible. Submit a post, it appears below.

- [ ] **Step 4: Commit**

```bash
git add public/index.html public/style.css
git commit -m "feat: add frontend single page with form and post list"
```

---

### Task 6: Run all tests and final verification

- [ ] **Step 1: Add .gitignore**

```bash
echo -e "node_modules/\ndist/\ndatabase.sqlite" > .gitignore
git add .gitignore
git commit -m "chore: add .gitignore"
```

- [ ] **Step 2: Run full test suite**

Run: `NODE_ENV=test npx jest --verbose`
Expected: All 10 tests pass (3 model + 7 API)

- [ ] **Step 2: Commit any fixes if needed**

- [ ] **Step 3: Final manual smoke test**

Run: `npx ts-node src/server.ts`, open browser, create a post, verify it shows in the list.

---

### Task 7: ngrok tunnel setup

- [ ] **Step 1: Start server and expose via ngrok**

```bash
npx ts-node src/server.ts &
ngrok http 3000
```

Expected: ngrok outputs a public URL (e.g., `https://xxxx.ngrok-free.app`). Open it in browser to verify external access.

> Note: ngrok must be installed separately (`brew install ngrok` or download from https://ngrok.com). A free ngrok account is required for a stable tunnel.
