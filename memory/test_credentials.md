# Test Credentials — ProcureAI

## Demo Account
- Email: demo@procureai.com
- Password: Demo@123

## Auth
- Tokens are JWT (Bearer). Login returns { token, user }. Send `Authorization: Bearer <token>`.
- Endpoints: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me, POST /api/auth/logout

## Notes
- Backend: Node.js + Express + TypeScript on internal port 8002, fronted by a FastAPI proxy on 8001.
- All API routes are prefixed with /api.
- The demo account is seeded with ~9 sample searches so the dashboard/analytics are populated.
