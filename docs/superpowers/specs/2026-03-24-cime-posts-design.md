# CIME Posts Web App — Design Spec

## Overview

CIME 서비스의 장점을 유저들이 직접 작성하고 모아볼 수 있는 단일 페이지 웹 앱.

## Constraints

- 로그인 없음 — 닉네임만 입력
- 작성(POST) + 조회(GET)만 지원, 삭제/수정/좋아요 없음
- 전체 목록 최신순 표시, 페이지네이션 없음
- ngrok으로 외부 공개

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Server:** Express (정적 파일 서빙 포함)
- **DB:** SQLite (파일 기반)
- **ORM:** Sequelize
- **Test:** Jest + ts-jest + supertest
- **Tunnel:** ngrok

## Project Structure

```
cime-posts/
├── src/
│   ├── app.ts          # Express 설정, 미들웨어, 정적파일 서빙
│   ├── server.ts       # app.listen (테스트와 분리)
│   ├── db.ts           # Sequelize 인스턴스 + SQLite 설정
│   ├── models/
│   │   └── Post.ts     # Sequelize 모델
│   └── routes/
│       └── posts.ts    # POST /api/posts, GET /api/posts
├── public/
│   ├── index.html      # 단일 페이지 (작성폼 + 목록)
│   └── style.css
├── tests/
│   ├── model.test.ts   # Post 모델 단위 테스트
│   └── api.test.ts     # API 통합 테스트 (supertest)
├── package.json
└── tsconfig.json
```

## Data Model

### Post

| Field     | Type              | Constraints       |
|-----------|-------------------|-------------------|
| id        | INTEGER           | PK, auto-increment|
| nickname  | STRING(50)        | NOT NULL          |
| content   | TEXT              | NOT NULL          |
| createdAt | DATE              | auto              |
| updatedAt | DATE              | auto              |

## API

### GET /api/posts

- Response: `200` — `Post[]` (최신순, `order: [['createdAt', 'DESC']]`)

### POST /api/posts

- Body: `{ nickname: string, content: string }`
- Success: `201` — 생성된 Post 객체
- Failure: `400` — nickname 또는 content가 빈 값일 때

## Frontend

단일 HTML 페이지. fetch API로 서버와 통신.

- **상단:** 작성 폼 (닉네임 input, 내용 textarea, 제출 button)
- **하단:** 포스트 목록 (카드 형태, 닉네임 + 내용 + 작성일시)
- 작성 성공 시 목록 자동 갱신, 폼 초기화

## Testing

- **model.test.ts:** Post 생성 성공, 필수 필드 누락 시 에러 검증
- **api.test.ts:** GET /api/posts 빈 목록, POST 성공/실패, GET으로 생성된 포스트 확인
- 모든 테스트에서 in-memory SQLite 사용 (`storage: ':memory:'`)

## Architecture Decisions

- **app.ts / server.ts 분리:** supertest가 app 인스턴스를 직접 사용하므로 listen과 분리
- **서비스 레이어 없음:** CRUD 2개뿐이라 라우터에서 모델 직접 호출
- **모놀리식 단일 라우터:** 포스트 하나의 리소스만 다루므로 충분
