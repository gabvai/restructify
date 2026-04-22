# Restructify Frontend

Minimal React + Vite frontend for the Restructify backend.

## Stack

- React 18
- Vite 5
- React Router 6
- Fetch API (no extra HTTP client)
- Plain CSS + CSS Modules
- JWT stored in `localStorage`

## Getting started

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173` and talks to the backend at
`http://localhost:4000` by default.

To override the backend URL, create a `.env` file (see `.env.example`):

```
VITE_API_BASE_URL=http://localhost:4000
```

Make sure the backend is running: `cd backend && npm run dev`.

## Scripts

- `npm run dev` — start Vite dev server
- `npm run build` — production build into `dist/`
- `npm run preview` — preview production build

## Project structure

```
src/
  api/          HTTP client + endpoint wrappers
  components/   Reusable UI primitives (Button, Input, FormField, Navbar)
  context/      AuthContext (login state + actions)
  layouts/      MainLayout (navbar + centered content)
  pages/        Login, Register, Home, Create Beam, My Listings
  routes/       AppRoutes, ProtectedRoute
  styles/       Global CSS variables + resets
  utils/        localStorage helpers
```

## Routing

| Path          | Access     | Description                    |
| ------------- | ---------- | ------------------------------ |
| `/login`      | Public     | Login form                     |
| `/register`   | Public     | Registration form              |
| `/`           | Protected  | Home / landing                 |
| `/beams`      | Protected  | My listings                    |
| `/beams/new`  | Protected  | Create a new beam              |
| `*`           | —          | Redirects to `/`               |

Protected routes render inside `MainLayout` (which renders the navbar) and
redirect to `/login` when the user is not authenticated.

## Auth

- `AuthContext` exposes `user`, `token`, `isAuthenticated`, `login`,
  `register`, and `logout`.
- On successful login/register, the user and JWT are stored in
  `localStorage` under `restructify.token` and `restructify.user`.
- The API client (`src/api/client.js`) automatically attaches
  `Authorization: Bearer <token>` to protected requests.
- `ProtectedRoute` guards authenticated pages and preserves the
  originally requested path for post-login redirect.

## Assumptions

- Backend URL defaults to `http://localhost:4000`.
- Backend response shape is `{ status, data }` for both auth and beam
  endpoints.
- `POST /beams` also requires a construction `type`; the frontend sends
  `type: "beam"` automatically when creating a listing.
- Number-like beam fields are coerced to numbers; empty fields are
  omitted so the backend stores them as `null`.
```
