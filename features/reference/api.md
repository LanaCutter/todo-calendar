# API Reference

**Status:** current through Feature 2 (Assignment Management).

API mount path is `/api` (see `backend/server.js`). These routes are not authenticated.

## Endpoints

| Method | Endpoint | Auth | Purpose | Introduced |
|--------|----------|------|---------|------------|
| `GET` | `/api/health` | No | Process check | Starter |
| `GET` | `/api/classes` | No | List every class, name order | Feature 1 |
| `POST` | `/api/classes` | No | Create a class | Feature 1 |
| `PUT` | `/api/classes/:id` | No | Update name and color | Feature 1 |
| `DELETE` | `/api/classes/:id` | No | Delete a class, unless assignments still use it | Feature 1, guard in Feature 2 |
| `GET` | `/api/assignments` | No | List every assignment, soonest due date first | Feature 2 |
| `POST` | `/api/assignments` | No | Create an assignment | Feature 2 |
| `PUT` | `/api/assignments/:id` | No | Update an assignment | Feature 2 |
| `DELETE` | `/api/assignments/:id` | No | Delete an assignment | Feature 2 |

### `POST /api/classes` and `PUT /api/classes/:id`

```json
{ "name": "Biology", "color": "green" }
```

`201` on create and `200` on update:

```json
{
  "id": 1,
  "name": "Biology",
  "color": "green",
  "createdAt": "2026-11-11T18:00:00.000Z",
  "updatedAt": "2026-11-11T18:00:00.000Z"
}
```

`GET /api/classes` returns an array of those objects, ordered by name case-insensitively.

`DELETE /api/classes/:id` success (`200`): `{ "message": "Class deleted." }`

When any assignment uses the class (`400`): `{ "message": "This class still has assignments." }`

### `POST /api/assignments` and `PUT /api/assignments/:id`

```json
{
  "name": "Lab report",
  "classId": 1,
  "dueDate": "2026-11-20",
  "dueTime": "23:59",
  "startWorkingBy": "2026-11-16"
}
```

Optional dates and `dueTime` may be omitted or `null`.

`201` on create, `200` on update, and each `GET /api/assignments` element:

```json
{
  "id": 1,
  "name": "Lab report",
  "classId": 1,
  "class": { "id": 1, "name": "Biology", "color": "green" },
  "dueDate": "2026-11-20",
  "dueTime": "23:59",
  "startWorkingBy": "2026-11-16",
  "createdAt": "2026-11-11T18:00:00.000Z",
  "updatedAt": "2026-11-11T18:00:00.000Z"
}
```

`dueDate`, `dueTime`, and `startWorkingBy` are `null` when unset. Dates are `YYYY-MM-DD`.

List order: `dueDate` ascending, undated assignments last, then `name` case-insensitively.

`DELETE /api/assignments/:id` success (`200`): `{ "message": "Assignment deleted." }`

### Errors

`{ "message": "..." }`

| Condition | Status | Message |
|-----------|--------|---------|
| Class name missing or blank after trim | `400` | `Name is required.` |
| Class name longer than 100 characters | `400` | `Name must be 100 characters or fewer.` |
| Color missing or not in the enum | `400` | `Choose a color from the list.` |
| Class name duplicates another class, case-insensitive | `400` | `A class with that name already exists.` |
| Class `:id` is not an integer | `400` | `Class id must be a number.` |
| No class with that id | `404` | `Class with id=<id> not found.` |
| Class still has assignments | `400` | `This class still has assignments.` |
| Assignment name missing or blank after trim | `400` | `Name is required.` |
| Assignment name longer than 200 characters | `400` | `Name must be 200 characters or fewer.` |
| `classId` missing | `400` | `Class is required.` |
| `classId` not found | `400` | `Class with id=<id> not found.` |
| `dueTime` present and `dueDate` empty | `400` | `Enter a due date before a due time.` |
| `dueTime` not `HH:mm` | `400` | `Enter a valid due time.` |
| `dueDate` or `startWorkingBy` not a real calendar date | `400` | `Enter a valid date.` |
| `startWorkingBy` after `dueDate` | `400` | `Start working by must be on or before the due date.` |
| Assignment `:id` is not an integer | `400` | `Assignment id must be a number.` |
| No assignment with that id | `404` | `Assignment with id=<id> not found.` |

## Conventions

- Flat JSON responses (no `{ success, data }` envelope).
- Errors: `{ "message": "..." }`.
- Class and assignment routes do not use `Authorization`. Authenticated routes are not part of this product yet.
