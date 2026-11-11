# API Reference

**Status:** current through Feature 1 (Class Management).

API mount path is `/api` (see `backend/server.js`). Class routes are not authenticated.

## Endpoints

| Method | Endpoint | Auth | Purpose | Introduced |
|--------|----------|------|---------|------------|
| `GET` | `/api/health` | No | Process check | Starter |
| `GET` | `/api/classes` | No | List every class, name order | Feature 1 |
| `POST` | `/api/classes` | No | Create a class | Feature 1 |
| `PUT` | `/api/classes/:id` | No | Update name and color | Feature 1 |
| `DELETE` | `/api/classes/:id` | No | Delete a class | Feature 1 |

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

`DELETE` success (`200`): `{ "message": "Class deleted." }`

### Errors

`{ "message": "..." }`

| Condition | Status | Message |
|-----------|--------|---------|
| Name missing or blank after trim | `400` | `Name is required.` |
| Name longer than 100 characters | `400` | `Name must be 100 characters or fewer.` |
| Color missing or not in the enum | `400` | `Choose a color from the list.` |
| Name duplicates another class, case-insensitive | `400` | `A class with that name already exists.` |
| `:id` is not an integer | `400` | `Class id must be a number.` |
| No class with that id | `404` | `Class with id=<id> not found.` |

## Conventions

- Flat JSON responses (no `{ success, data }` envelope).
- Errors: `{ "message": "..." }`.
- Class routes do not use `Authorization`. Authenticated routes are not part of this product yet.
