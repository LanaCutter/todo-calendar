# API Reference

**Status:** current through Feature 4 (Assignment Day Todos).

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
| `PUT` | `/api/assignments/:id/day-todos` | No | Replace one assignment’s todo dates | Feature 4 |
| `PUT` | `/api/assignments/:id/completion` | No | Set an assignment completed and, when true, complete its todos | Feature 4 |
| `PUT` | `/api/assignments/:id` | No | Update an assignment | Feature 2 |
| `DELETE` | `/api/assignments/:id` | No | Delete an assignment and its todos | Feature 2, cascade in Feature 4 |
| `GET` | `/api/day-todos` | No | List every todo, date then name | Feature 4 |
| `POST` | `/api/day-todos` | No | Create a todo with no assignment | Feature 4 |
| `PUT` | `/api/day-todos/:id/completion` | No | Set one todo completed | Feature 4 |
| `PUT` | `/api/day-todos/:id` | No | Update a todo that has no assignment | Feature 4 |
| `DELETE` | `/api/day-todos/:id` | No | Delete a todo that has no assignment | Feature 4 |

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
  "completed": false,
  "dayTodos": [{ "date": "2026-11-18", "completed": false }],
  "createdAt": "2026-11-11T18:00:00.000Z",
  "updatedAt": "2026-11-11T18:00:00.000Z"
}
```

`dueDate`, `dueTime`, and `startWorkingBy` are `null` when unset. Dates are `YYYY-MM-DD`. `completed` defaults to false. `dayTodos` is sorted by date. A new assignment has `dayTodos: []`.

List order: `dueDate` ascending, undated assignments last, then `name` case-insensitively.

`DELETE /api/assignments/:id` success (`200`): `{ "message": "Assignment deleted." }` Deleting an assignment deletes its day todos.

### `PUT /api/assignments/:id/day-todos`

```json
{ "dates": ["2026-11-12", "2026-11-18"] }
```

`200`: `{ "dates": ["2026-11-12", "2026-11-18"] }` sorted ascending. Dates already stored keep their `completed` value. New dates are not completed. This does not change the assignment’s `completed` flag. `dates: []` removes that assignment’s todos. Duplicate dates are stored once.

### `PUT /api/assignments/:id/completion`

```json
{ "completed": true }
```

`200` is the assignment, including `completed` and `dayTodos`. `true` completes the assignment and every todo that belongs to it. `false` clears only the assignment; its todos stay as they were.

### `GET /api/day-todos`

Each item:

```json
{
  "id": 1,
  "date": "2026-11-12",
  "name": "Lab report",
  "assignmentId": 1,
  "class": { "id": 1, "name": "Biology", "color": "green" },
  "completed": false
}
```

A todo with no assignment has `assignmentId: null`, `class: null`, and its own `name`. An assignment todo’s `name` and `class` come from the assignment. Sort is `date` ascending, then `name` case-insensitively.

### `POST /api/day-todos`

```json
{ "name": "Buy a notebook", "date": "2026-11-15" }
```

`201` is the list item. `assignmentId` and `class` are null. `completed` is false.

### `PUT /api/day-todos/:id`

Same body as create. `200` is the list item. Allowed only when `assignmentId` is null.

### `PUT /api/day-todos/:id/completion`

```json
{ "completed": true }
```

`200` is the list item plus `assignmentCompleted`. That value is the assignment’s `completed` flag, or `null` when the todo has no assignment. This call does not change the assignment’s `completed` flag.

### `DELETE /api/day-todos/:id`

`200`: `{ "message": "Todo deleted." }` Allowed only when `assignmentId` is null.

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
| Day-todo `dates` is missing or not an array | `400` | `Dates are required.` |
| A day-todo date is not a real calendar date | `400` | `Enter a valid date.` |
| Standalone todo name missing or blank after trim | `400` | `Name is required.` |
| Standalone todo name longer than 200 characters | `400` | `Name must be 200 characters or fewer.` |
| Standalone todo date missing | `400` | `Date is required.` |
| Update or delete targets an assignment’s todo | `400` | `Change this todo from the assignment.` |
| Todo `:id` is not an integer | `400` | `Todo id must be a number.` |
| No todo with that id | `404` | `Todo with id=<id> not found.` |
| `completed` is missing or not a boolean | `400` | `Completed must be true or false.` |

## Conventions

- Flat JSON responses (no `{ success, data }` envelope).
- Errors: `{ "message": "..." }`.
- Class, assignment, and day-todo routes do not use `Authorization`. Authenticated routes are not part of this product yet.
