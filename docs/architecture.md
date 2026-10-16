# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep each route's view in its existing component and use the shared API client. Render API data, loading and meaningful empty states, and accessible error alerts; keep persistence and business rules out of React.
- Logic tier decision: Keep Express routes thin. Put request validation, persistence orchestration, point calculation, aggregation, and recommendation selection in the service layer; return deliberate 4xx responses for invalid input and missing records.
- Data tier decision: Complete the existing Mongoose schemas with required fields and references, and preserve the seed script's idempotence. Keep MongoDB as the source of persisted application data; do not add authentication.
- Activity tracking approach: Validate the request shape, ID format, and existence of the referenced user and team before writing. Store the submitted type, minutes, user, and team, calculate points deterministically on the server, and set `occurredAt` on creation.
- Team management approach: Require a non-empty name, preserve the submitted name and mascot, validate member references, and return created/listed teams with their members.
- Leaderboard approach: Aggregate activity points by team, sort totals descending, and assign 1-based ranks in the service layer.
- Workout suggestions approach: Find the user by email, use their goal and recent activities to choose an appropriate suggestion, include a reason tied to that signal, and return a deliberate 4xx when no user matches.

## Test plan

Run the focused contracts in dependency order, then run both builds. The initial contract run currently reports:

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`: currently 4 failures and 1 pass. Failures indicate missing required-field validation in the user, team, activity, or workout schema; a seed failure indicates the fixtures or idempotent seed behavior regressed.
- API command: `npm run test:api --prefix octofit-tracker/backend`: currently 4 failures. Failures indicate activity/team request handling or persistence is incomplete, leaderboard totals/ranks are incorrect, or workout selection is not based on the requested user's goal/activity; invalid input must not surface as `501` or an unhandled cast error.
- Frontend command: `npm test --prefix octofit-tracker/frontend`: currently 15 failures. Failures indicate missing API-backed rendering, route-specific loading/empty/error states, accessible error announcements, or the expected user-specific workout request.
- Backend build command: `npm run build --prefix octofit-tracker/backend`: run after backend changes; failures indicate TypeScript or backend compile-time integration issues, not API behavior (which the contract suite covers).
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`: run after frontend changes; failures indicate TypeScript or Vite build issues, not presentation behavior (which the frontend contract suite covers).
