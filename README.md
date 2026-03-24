# 씨미 칭찬하기

씨미(CIME) 서비스의 장점을 유저들이 직접 칭찬하고 공유할 수 있는 실시간 커뮤니티 보드입니다.

## 주요 기능

- **칭찬 작성** — 닉네임, 비밀번호, 내용을 입력하여 칭찬 게시
- **수정 / 삭제** — 작성 시 설정한 비밀번호로 본인 글 수정·삭제
- **실시간 반영** — Socket.IO를 통해 새 글, 수정, 삭제가 모든 접속자에게 즉시 반영
- **타이핑 인디케이터** — 다른 유저가 작성 중일 때 "OO님이 작성 중..." 표시
- **Lottie 애니메이션** — 헤더 반짝이, 칭찬 전송 시 축하 버스트, 빈 상태 캐릭터
- **ngrok 터널링** — 로컬 서버를 외부에 공개

## 기술 스택

| 분류 | 기술 |
|------|------|
| 런타임 | Node.js + TypeScript |
| 서버 | Express 5 |
| DB | SQLite + Sequelize ORM |
| 실시간 | Socket.IO |
| 보안 | bcryptjs (비밀번호 해싱), express-rate-limit |
| 프론트엔드 | HTML / CSS / Vanilla JS + Lottie Web |
| 테스트 | Jest + ts-jest + supertest |
| 터널 | ngrok |

## 프로젝트 구조

```
├── src/
│   ├── app.ts              # Express 앱 설정 (미들웨어, 정적 파일, 라우트)
│   ├── server.ts           # HTTP 서버 + Socket.IO 초기화 및 시작
│   ├── db.ts               # Sequelize 인스턴스 (SQLite)
│   ├── socket.ts           # Socket.IO 이벤트 핸들러 (타이핑, 브로드캐스트)
│   ├── models/
│   │   └── Post.ts         # Post 모델 (id, nickname, content, password, timestamps)
│   └── routes/
│       └── posts.ts        # REST API (GET, POST, PUT, DELETE /api/posts)
├── public/
│   ├── index.html          # 단일 페이지 프론트엔드
│   ├── style.css           # Soft Sky 디자인 (화이트 + 하늘색)
│   └── lottie/             # Lottie 애니메이션 JSON
│       ├── sparkle.json    # 헤더 별 반짝이
│       ├── burst.json      # 칭찬 전송 축하 효과
│       └── empty.json      # 빈 상태 귀여운 캐릭터
├── tests/
│   ├── model.test.ts       # Post 모델 단위 테스트 (4개)
│   ├── api.test.ts         # API 통합 테스트 (17개)
│   └── socket.test.ts      # Socket.IO 이벤트 테스트 (6개)
├── docs/superpowers/
│   ├── specs/              # 설계 문서
│   └── plans/              # 구현 계획서
├── tsconfig.json           # TypeScript 설정
├── tsconfig.test.json      # 테스트용 TS 설정 (node16 모듈)
└── jest.config.ts          # Jest 설정
```

## API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/posts` | 전체 칭찬 목록 (최신순, 비밀번호 제외) |
| `POST` | `/api/posts` | 칭찬 작성 (`nickname`, `content`, `password` 필수) |
| `PUT` | `/api/posts/:id` | 칭찬 수정 (`content`, `password` 필수, 비밀번호 검증) |
| `DELETE` | `/api/posts/:id` | 칭찬 삭제 (`password` 필수, 비밀번호 검증) |

## Socket.IO 이벤트

| 이벤트 | 방향 | 설명 |
|--------|------|------|
| `newPost` | 서버 → 클라이언트 | 새 칭찬 게시 시 브로드캐스트 |
| `updatePost` | 서버 → 클라이언트 | 칭찬 수정 시 브로드캐스트 |
| `deletePost` | 서버 → 클라이언트 | 칭찬 삭제 시 브로드캐스트 |
| `typing` | 클라이언트 → 서버 | 작성 중 알림 (`{ nickname }`) |
| `stopTyping` | 클라이언트 → 서버 | 작성 중단 알림 |
| `typingUsers` | 서버 → 클라이언트 | 현재 작성 중인 유저 목록 |

## 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm start

# 테스트 실행
npm test

# 커버리지 리포트
npx jest --coverage

# 외부 공개 (ngrok 설치 필요)
ngrok http 3000
```

## 테스트 커버리지

35개 테스트, 4개 test suite.

```
------------|---------|----------|---------|---------|
File        | % Stmts | % Branch | % Funcs | % Lines |
------------|---------|----------|---------|---------|
All files   |   98.29 |    96.29 |     100 |   98.29 |
 app.ts     |   84.61 |       50 |     100 |   84.61 |
 db.ts      |     100 |       50 |     100 |     100 |
 socket.ts  |     100 |      100 |     100 |     100 |
 Post.ts    |     100 |      100 |     100 |     100 |
 posts.ts   |     100 |      100 |     100 |     100 |
------------|---------|----------|---------|---------|
```

| 테스트 파일 | 테스트 수 | 설명 |
|------------|----------|------|
| `model.test.ts` | 4 | Post 모델 생성, 필수 필드 누락 검증 |
| `api.test.ts` | 22 | CRUD API 전체 + 유효성 검사 + 길이 제한 |
| `socket.test.ts` | 6 | 타이핑 브로드캐스트, 중단, 빈 닉네임, 중복 제거 |
| `api-socket.test.ts` | 3 | API + Socket.IO 통합 (newPost, updatePost, deletePost) |

## 보안

- 비밀번호는 bcrypt로 해싱하여 저장 (응답에 포함되지 않음)
- POST 엔드포인트에 분당 20회 Rate Limit 적용
- JSON Body 크기 10KB 제한
- 닉네임 50자, 내용 2000자 서버측 검증
- `x-powered-by` 헤더 비활성화
- 프론트엔드 XSS 방지 (DOM API `textContent` 사용, innerHTML 미사용)

## 디자인

**Soft Sky** 테마 — Gaegu (손글씨) + Noto Sans KR 폰트, 화이트 배경에 하늘색 액센트, 파스텔 버블 배경, 동글동글한 카드, 3D 틸트 호버, Lottie 애니메이션.
