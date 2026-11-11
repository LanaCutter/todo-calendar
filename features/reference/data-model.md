# Data Model Reference

**Status:** current through Feature 2 (Assignment Management).

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
| `createdAt` | DATE | Sequelize timestamp |
| `updatedAt` | DATE | Sequelize timestamp |

No `userId`.

## Associations

- **Class hasMany Assignment** (`classId`, `ON DELETE RESTRICT`)
- **Assignment belongsTo Class** as `class`
