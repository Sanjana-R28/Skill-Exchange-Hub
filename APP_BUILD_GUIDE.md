# Student Skill Exchange App Build Guide

## What the app does

This app is a full-stack Student Skill Exchange Platform for college students. Students can create an account, add skills they can teach, add skills they want to learn, discover other students, get matched with complementary peers, send connection requests, chat after connecting, and share a Google Meet study link.

## Technologies used

### Frontend

- React for the user interface
- Vite for the development server and frontend bundling
- TypeScript for typed frontend code
- Tailwind CSS for styling
- shadcn-style UI components for cards, buttons, inputs, forms, avatars, and layout pieces
- React Query for API data fetching, caching, polling, and refreshing chat/messages
- Wouter for frontend routing
- Lucide React for icons
- date-fns for message time formatting

Frontend location:

- `artifacts/student-skill-exchange`

### Backend

- Node.js with Express 5 for the API server
- TypeScript for typed backend code
- Zod for validating request bodies, route params, and API responses
- PBKDF2 password hashing using Node crypto
- Signed HTTP-only cookie sessions using HMAC signatures
- Pino logging through the API server setup

Backend location:

- `artifacts/api-server`

### Database

- PostgreSQL database
- Drizzle ORM for schema definitions and database queries
- Tables for students, skills, connections, and messages

Database schema location:

- `lib/db/src/schema/student-skill-exchange.ts`

### API contract and generated client

- OpenAPI is the source of truth for the API shape
- Orval generates typed React Query hooks and Zod schemas from the OpenAPI file
- The frontend imports generated hooks from the shared API client package

Important files:

- `lib/api-spec/openapi.yaml`
- `lib/api-client-react`
- `lib/api-zod`

## Main database tables

### students

Stores each account.

Main fields:

- id
- name
- email
- passwordHash
- college
- branch
- profilePicture
- createdAt

### skills

Stores skills linked to a student.

Main fields:

- id
- userId
- name
- category
- direction, either `offered` or `wanted`

### connections

Stores connection requests and accepted connections.

Main fields:

- id
- senderId
- receiverId
- status, either `pending`, `accepted`, or `rejected`
- createdAt

### messages

Stores chat messages between accepted connections.

Main fields:

- id
- senderId
- receiverId
- message
- timestamp

## How authentication works

1. A student signs up with full name, email, password, college, and branch.
2. The backend validates the input with Zod.
3. The password is hashed with PBKDF2 before saving.
4. The backend creates a signed session token.
5. The token is stored in an HTTP-only cookie named `sse_session`.
6. The frontend checks `/api/auth/me` to know if the student is logged in.
7. Logout clears the session cookie.

## How Discover works

The Discover page calls the backend skill search endpoint. The backend returns every registered student except the current logged-in user. Search now checks:

- student name
- email
- college
- branch
- offered skills
- wanted skills

This means new signups appear in Discover for other students even before they add skills. If a category filter is selected, the list focuses on students with matching skill categories.

## How matching works

The matching system compares skills between students:

- If I want to learn React and another student offers React, that is one match direction.
- If I offer Python and that student wants Python, that is the other match direction.
- Students are strongest matches when both sides can teach something the other wants to learn.

The backend calculates matches from stored skills and returns a ranked list.

## How connection requests work

1. A student clicks Connect on another student.
2. The backend creates a connection row with `pending` status.
3. The receiver sees it as an incoming request.
4. The receiver can accept or reject it.
5. Only accepted connections can chat.

For demo students, the app auto-accepts requests so the app feels active immediately during testing.

## How chat works

Chat messages are stored in the PostgreSQL `messages` table. The frontend polls messages every few seconds, so if the other person sends a message, it appears automatically.

Both users can send and receive:

- normal text messages
- Google Meet links
- study session notes

Meet links are rendered as clickable links in chat.

## How Study Meet works

The Study Meet page creates a simple Google Meet invite message using `https://meet.new` and a room note based on the connection id pair. The user can:

- open Google Meet
- copy the invite text
- send the meet link directly into chat

The actual video call is handled by Google Meet. The app stores and shares the invite text through its normal message system.

## Demo accounts

The backend seeds demo data if the database starts empty.

Demo login:

- Email: `aarav@example.edu`
- Password: `student123`

Other demo students include Nisha Rao and Kabir Singh. They help make Discover, matches, connections, and chat usable immediately.

## Main app flow

1. Student signs up or logs in.
2. Student lands on the dashboard.
3. Student adds offered and wanted skills in profile/skills areas.
4. Student opens Discover to find classmates.
5. Student sends a connection request.
6. Once accepted, both students can chat.
7. Either student can send a Meet link or open Study Meet.
8. Messages and meet links are saved in the database and visible to both accepted users.

## Key project files

- `artifacts/student-skill-exchange/src/pages/auth.tsx` — signup and login UI
- `artifacts/student-skill-exchange/src/pages/discover.tsx` — student discovery UI
- `artifacts/student-skill-exchange/src/pages/chat.tsx` — main chat box
- `artifacts/student-skill-exchange/src/pages/messages.tsx` — direct chat page
- `artifacts/student-skill-exchange/src/pages/study-room.tsx` — Google Meet study room page
- `artifacts/api-server/src/routes/student-skill-exchange.ts` — backend route logic
- `lib/db/src/schema/student-skill-exchange.ts` — database schema
- `lib/api-spec/openapi.yaml` — API contract

## How the frontend and backend connect

The frontend does not manually hard-code every fetch call. Instead, the OpenAPI file defines the endpoints, then the generated API client creates typed hooks such as login, register, list users, send connection request, list messages, and send message. React components call those hooks and React Query keeps the UI updated.

## Security choices

- Passwords are never stored directly.
- Sessions are signed so users cannot forge another user id.
- Session cookies are HTTP-only so frontend JavaScript cannot read them.
- Message and connection endpoints check that the user is logged in.
- Chat endpoints require an accepted connection before messages can be sent or read.
