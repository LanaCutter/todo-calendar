# Data Model Reference

**Status:** current through Feature 1 (Class Management).

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

## Associations

*(none)*
