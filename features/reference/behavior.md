# Behavior & Rules Reference

**Living snapshot** of product rules currently in force on this branch (Feature 1).

These files answer: *"What rules does the app enforce right now?"*  
They do **not** authorize new scope — implement only from `features/feature-*.md`.

| File | Role |
|------|------|
| [api.md](./api.md) | Routes / payloads |
| [data-model.md](./data-model.md) | Tables / columns |
| **This file** | Ownership, sort, validation, UI rules |

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| No sign-in. Class routes accept any caller and do not return `401`. | No `authenticate` middleware on `/api/classes` | Feature 1 |
| One shared set of classes. Rows have no `userId`. | `classes` table | Feature 1 |
| Name is trimmed, required, and at most 100 characters. | `400` `Name is required.` or `Name must be 100 characters or fewer.` | Feature 1 |
| Names are unique case-insensitively. Stored casing is kept. | `400` `A class with that name already exists.` | Feature 1 |
| Color is one of maroon, blue, green, amber, purple, teal, orange, slate. | `400` `Choose a color from the list.` | Feature 1 |
| Class list is ordered by name, case-insensitive. | `GET /api/classes` `ORDER BY LOWER(name)` | Feature 1 |
| Unknown class id is `404`. A non-integer id is `400`. | `Class with id=<id> not found.` / `Class id must be a number.` | Feature 1 |
| Delete asks for confirmation. Cancel leaves the class. | Dialog **Delete this class?** | Feature 1 |
| Empty class list shows the empty state, not an error. | "No classes yet. Add your first class." | Feature 1 |
| `/` opens the classes page. | Redirect to route `classes` | Feature 1 |
