# Data Model Reference

**Status:** current through Feature 4 (Assignment Day Todos).

## Tables

### `classes`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `name` | STRING(100) | Required after trim; unique; case-insensitive uniqueness enforced in the controller |
| `color` | STRING(20) | Required; one of `maroon`, `blue`, `green`, `amber`, `purple`, `teal`, `orange`, `slate` |
| `createdAt` | DATE | Sequelize timestamp |
| `updatedAt` | DATE | Sequelize timestamp |

No `userId`.

### `assignments`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `name` | STRING(200) | Required after trim; not unique |
| `classId` | INTEGER FK | Required; references `classes.id`; delete of the class is restricted |
| `dueDate` | DATEONLY | Optional; `YYYY-MM-DD` |
| `dueTime` | STRING(5) | Optional; `HH:mm`; null when there is no due date |
| `startWorkingBy` | DATEONLY | Optional; `YYYY-MM-DD`; on or before `dueDate` when both are set |
| `completed` | BOOLEAN | Required; default `false` |
| `createdAt` | DATE | Sequelize timestamp |
| `updatedAt` | DATE | Sequelize timestamp |

No `userId`.

### `day_todos`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `assignmentId` | INTEGER FK | Optional; references `assignments.id`; `ON DELETE CASCADE`; null when the todo has no assignment |
| `name` | STRING(200) | Required only when `assignmentId` is null; trimmed; max 200; null when the todo belongs to an assignment |
| `todoDate` | DATEONLY | Required; `YYYY-MM-DD` |
| `completed` | BOOLEAN | Required; default `false` |
| `createdAt` | DATE | Sequelize timestamp |
| `updatedAt` | DATE | Sequelize timestamp |

Unique (`assignmentId`, `todoDate`) when `assignmentId` is set. Several todos with no assignment may share a date. No `userId`.

## Associations

- **Class hasMany Assignment** (`classId`, `ON DELETE RESTRICT`)
- **Assignment belongsTo Class** as `class`
- **Assignment hasMany DayTodo** as `dayTodos` (`ON DELETE CASCADE`)
- **DayTodo belongsTo Assignment** as `assignment` (optional)
