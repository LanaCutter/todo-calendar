# Feature: Class Management

**Feature ID:** 1
**Branch pattern:** `feature/1-class-management`
**Status:** Ready
**Created:** 2026-11-11
**Input:** A student adds classes, each with a name and a color from a fixed set, so later assignments can be told apart by class. There is no sign-in.
**Related:** [features/reference/api.md](./reference/api.md) (routes mount at `/api`)

## User Stories

### US-1.1: Add a class
**As a** student
**I want to** add a class with a name and a color
**So that** I can group later assignments under that class

**Priority:** P1
**Independent test:** Add a class named `Biology` with color `green` and see it returned by the API and on the classes page
**Acceptance scenarios:** see ### US-1.1 under Acceptance Criteria

### US-1.2: View classes
**As a** student
**I want to** see my classes and their colors
**So that** I know which classes I can attach assignments to

**Priority:** P1
**Independent test:** With two classes stored, open the classes page and see both names and colors in name order
**Acceptance scenarios:** see ### US-1.2 under Acceptance Criteria

### US-1.3: Edit a class
**As a** student
**I want to** change a class name and color
**So that** the class stays accurate when the course label or color is wrong

**Priority:** P1
**Independent test:** Change `Biology` / `green` to `Chemistry` / `blue` and see the updated class
**Acceptance scenarios:** see ### US-1.3 under Acceptance Criteria

### US-1.4: Delete a class
**As a** student
**I want to** delete a class I no longer use
**So that** my class list stays only the classes I need

**Priority:** P1
**Independent test:** Delete a class and confirm it is gone from the list and from `GET /api/classes`
**Acceptance scenarios:** see ### US-1.4 under Acceptance Criteria

## Requirements

### Functional Requirements

- **FR-001**: The system MUST let a student add, view, edit, and delete classes without signing in. Endpoints MUST NOT require an `Authorization` header and MUST NOT return `401`.
- **FR-002**: A class MUST have a `name` and a `color`. The system MUST trim leading and trailing spaces from `name` before saving.
- **FR-003**: `name` MUST be required after trim, at most 100 characters, and unique among classes when compared case-insensitively. The stored value MUST keep the student's casing (`Biology`, not a forced lowercase display).
- **FR-004**: `color` MUST be required and MUST be one of: `maroon`, `blue`, `green`, `amber`, `purple`, `teal`, `orange`, `slate`.
- **FR-005**: `GET /api/classes` MUST return every class as a JSON array, ordered by `name` ascending using a case-insensitive comparison.
- **FR-006**: Creating a class MUST return `201` and the saved class. Updating a class MUST return `200` and the saved class. Deleting a class MUST return `200` with `{ "message": "Class deleted." }`.
- **FR-007**: Validation failures MUST return `400` with `{ "message": "<exact message>" }` using the messages in Acceptance Criteria. A missing class MUST return `404` with `{ "message": "Class with id=<id> not found." }`. An id that is not an integer MUST return `400` with `{ "message": "Class id must be a number." }`.
- **FR-008**: The classes page MUST confirm before deleting. Cancel MUST leave the class in place.
- **FR-009**: Class rows MUST NOT include a `userId`. There is one shared set of classes for this app.

## Assumptions

- The database starts with no classes.
- This product has no accounts. [testing-standards.mdc](../.cursor/rules/testing-standards.mdc) cases for a missing token (`401`) and for another user's row do not apply.
- Routes mount at `/api` ([backend/server.js](../backend/server.js), [reference/api.md](./reference/api.md)).
- Color swatches use Vuetify theme color names. Hex values for any new theme colors live only in `frontend/src/plugins/vuetify.js`.
- Assignments do not exist yet. Deleting a class always succeeds when the id exists. Feature 2 adds the rule that a class with assignments cannot be deleted.

## Edge Cases

- Empty or whitespace-only name → `400` `"Name is required."`
- Name longer than 100 characters → `400` `"Name must be 100 characters or fewer."`
- Missing color, or a color outside the enum → `400` `"Choose a color from the list."`
- Name matches another class ignoring case → `400` `"A class with that name already exists."`
- Edit that only changes this class's own casing, or leaves the name the same → success
- Unknown id → `404`
- Non-integer id → `400`
- Cancel on the delete confirm → class remains
- Empty list → the empty-state copy, not an error

## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test before merge
- **SC-002**: A student can add, view, edit, and delete a class from the classes page without signing in
- **SC-003**: Two classes cannot share a name when compared case-insensitively after trim

## Data Ownership & Isolation

This app is single-user. There is no signed-in user and no per-user partition.

| Rule | Requirement |
|------|-------------|
| **Read scope** | `GET /api/classes` returns every class |
| **Write scope** | `PUT` and `DELETE` apply to the class id in the path. Any caller may use them |
| **Create scope** | `POST` inserts one class. There is no owner column |
| **Cross-user access** | Not applicable. Do not invent `userId` or `403` |
| **UI scope** | The classes page shows the full list from the API |
| **Auth** | No `authenticate` middleware on these routes |

## Key Entities

- **Class**: a course or subject the student tracks. It has one display name and one color from the fixed set. Later features attach assignments to a class. A class does not belong to a user account.

## API Requirements

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/api/classes` | No | List every class |
| `POST` | `/api/classes` | No | Create a class |
| `PUT` | `/api/classes/:id` | No | Update name and color |
| `DELETE` | `/api/classes/:id` | No | Delete a class |

**Create and update request body:**

```json
{ "name": "Biology", "color": "green" }
```

**Success response** (`201` create, `200` update):

```json
{
  "id": 1,
  "name": "Biology",
  "color": "green",
  "createdAt": "2026-11-11T18:00:00.000Z",
  "updatedAt": "2026-11-11T18:00:00.000Z"
}
```

`GET /api/classes` returns an array of those objects.

**Delete success** (`200`): `{ "message": "Class deleted." }`

**Error response:** `{ "message": "Human-readable explanation." }`

| Condition | Status | `message` |
|-----------|--------|-----------|
| Name missing or blank after trim | `400` | `Name is required.` |
| Name longer than 100 characters | `400` | `Name must be 100 characters or fewer.` |
| Color missing or not in the enum | `400` | `Choose a color from the list.` |
| Name duplicates another class, case-insensitive | `400` | `A class with that name already exists.` |
| `:id` is not an integer | `400` | `Class id must be a number.` |
| No class with that id | `404` | `Class with id=<id> not found.` |

Flat JSON only. No `{ success, data }` envelope.

## Screen Requirements

### [View: Classes] — route name `classes`

*   Path: `/classes`. Until Feature 2, `/` redirects to `/classes`.
*   Heading: **Classes**
*   Primary action: **Add class** (`oc-cta`), which opens the add dialog. Dialog actions sit outside `v-card-title` ([ui-style-system.mdc](../.cursor/rules/ui-style-system.mdc)).
*   Each row shows the class name and a swatch in that class's theme color (`maroon`, `blue`, `green`, `amber`, `purple`, `teal`, `orange`, `slate`).
*   Row actions: icon **Edit class** (`aria-label` **Edit class**) and icon **Delete class** (`aria-label` **Delete class**).
*   **Add class** dialog: fields **Name** and **Color**. **Color** is a select. Visible labels: Maroon, Blue, Green, Amber, Purple, Teal, Orange, Slate. Stored values are the lowercase enum. Actions: **Save** and **Cancel**.
*   **Edit class** dialog: same fields, filled with the current name and color. Title **Edit class**. Actions: **Save** and **Cancel**.
*   **Delete** confirm: text **Delete this class?** Actions: **Delete** and **Cancel**.
*   **Empty state:** "No classes yet. Add your first class."
*   **Loading:** a progress indicator while the list request is in flight.
*   **Error:** `<v-alert type="error">` showing the API `message`. Client-side validation uses the same messages and blocks **Save** before the request.

No `MenuBar` in this feature. Feature 2 adds it.

## Data Model Requirements

### `classes` table

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `name` | STRING(100) | Required after trim; unique; case-insensitive uniqueness |
| `color` | STRING(20) | Required; one of `maroon`, `blue`, `green`, `amber`, `purple`, `teal`, `orange`, `slate` |
| `createdAt` | DATE | Sequelize timestamp |
| `updatedAt` | DATE | Sequelize timestamp |

No `userId`. No other tables in this feature.

## Acceptance Criteria

### US-1.1 — Add a class

#### Scenario: User adds a class with a name and color
*   **Given** there are no classes
*   **When** I create a class with name `Biology` and color `green`
*   **Then** the API returns `201` with `name` `Biology` and `color` `green`
*   **And** the classes page lists Biology with the green swatch

#### Scenario: User adds a class with an empty name
*   **Given** I am adding a class
*   **When** I leave **Name** empty and choose color Green
*   **And** I click **Save**
*   **Then** the API is not called
*   **And** I see "Name is required."

#### Scenario: User adds a class with a name that is only spaces
*   **Given** I am adding a class
*   **When** I enter a name of only spaces and color `green`
*   **Then** the API returns `400` with `{ "message": "Name is required." }`

#### Scenario: User adds a class without a color
*   **Given** I am adding a class
*   **When** I enter name `Biology` and no color
*   **And** I click **Save**
*   **Then** I see "Choose a color from the list."
*   **And** the class is not created

#### Scenario: User adds a class with a color that is not in the list
*   **Given** there are no classes
*   **When** I send `POST /api/classes` with `{ "name": "Biology", "color": "pink" }`
*   **Then** the API returns `400` with `{ "message": "Choose a color from the list." }`

#### Scenario: User adds a class with a name that matches an existing class ignoring case
*   **Given** a class named `Biology` exists
*   **When** I create a class named `biology` with color `blue`
*   **Then** the API returns `400` with `{ "message": "A class with that name already exists." }`

#### Scenario: User adds a class with a name longer than 100 characters
*   **Given** there are no classes
*   **When** I create a class whose name is 101 characters and color `teal`
*   **Then** the API returns `400` with `{ "message": "Name must be 100 characters or fewer." }`

### US-1.2 — View classes

#### Scenario: User sees classes in name order
*   **Given** classes `Chemistry` (`maroon`) and `algebra` (`blue`) exist
*   **When** I open the classes page
*   **Then** `GET /api/classes` returns `algebra` before `Chemistry`
*   **And** the page shows both names with their color swatches in that order

#### Scenario: User sees an empty class list
*   **Given** there are no classes
*   **When** I open the classes page
*   **Then** I see "No classes yet. Add your first class."

### US-1.3 — Edit a class

#### Scenario: User edits a class name and color
*   **Given** a class `Biology` with color `green` exists
*   **When** I change it to name `Chemistry` and color `blue`
*   **And** I click **Save**
*   **Then** the API returns `200` with `name` `Chemistry` and `color` `blue`
*   **And** the list shows Chemistry with the blue swatch

#### Scenario: User edits a class and keeps its own name
*   **Given** a class `Biology` with color `green` exists
*   **When** I save the same name `Biology` with color `amber`
*   **Then** the API returns `200` with `color` `amber`
*   **And** I do not see "A class with that name already exists."

#### Scenario: User edits a class to a name another class already uses
*   **Given** classes `Biology` and `Chemistry` exist
*   **When** I rename `Biology` to `chemistry`
*   **Then** the API returns `400` with `{ "message": "A class with that name already exists." }`
*   **And** `Biology` is unchanged

#### Scenario: User edits a class that does not exist
*   **Given** no class has id `99`
*   **When** I send `PUT /api/classes/99` with `{ "name": "Art", "color": "orange" }`
*   **Then** the API returns `404` with `{ "message": "Class with id=99 not found." }`

#### Scenario: User updates a class with an id that is not a number
*   **When** I send `PUT /api/classes/abc` with `{ "name": "Art", "color": "orange" }`
*   **Then** the API returns `400` with `{ "message": "Class id must be a number." }`

### US-1.4 — Delete a class

#### Scenario: User deletes a class
*   **Given** a class `Biology` exists
*   **When** I choose **Delete class**
*   **And** I confirm **Delete this class?**
*   **Then** the API returns `200` with `{ "message": "Class deleted." }`
*   **And** Biology is gone from the list

#### Scenario: User cancels deleting a class
*   **Given** a class `Biology` is listed
*   **When** I choose **Delete class**
*   **And** I click **Cancel**
*   **Then** the API is not called
*   **And** Biology remains on the page

#### Scenario: User deletes a class that does not exist
*   **Given** no class has id `99`
*   **When** I send `DELETE /api/classes/99`
*   **Then** the API returns `404` with `{ "message": "Class with id=99 not found." }`

#### Scenario: User deletes a class with an id that is not a number
*   **When** I send `DELETE /api/classes/abc`
*   **Then** the API returns `400` with `{ "message": "Class id must be a number." }`

## Test Coverage Map

Each scenario above must map to at least one automated test. `it` names match the scenario titles.

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-1.1 | User adds a class with a name and color | `backend/tests/classes.test.js` | `User adds a class with a name and color` |
| US-1.1 | User adds a class with a name and color | `frontend/tests/Classes.test.js` | `User adds a class with a name and color` |
| US-1.1 | User adds a class with an empty name | `frontend/tests/Classes.test.js` | `User adds a class with an empty name` |
| US-1.1 | User adds a class with a name that is only spaces | `backend/tests/classes.test.js` | `User adds a class with a name that is only spaces` |
| US-1.1 | User adds a class without a color | `frontend/tests/Classes.test.js` | `User adds a class without a color` |
| US-1.1 | User adds a class with a color that is not in the list | `backend/tests/classes.test.js` | `User adds a class with a color that is not in the list` |
| US-1.1 | User adds a class with a name that matches an existing class ignoring case | `backend/tests/classes.test.js` | `User adds a class with a name that matches an existing class ignoring case` |
| US-1.1 | User adds a class with a name longer than 100 characters | `backend/tests/classes.test.js` | `User adds a class with a name longer than 100 characters` |
| US-1.2 | User sees classes in name order | `backend/tests/classes.test.js` | `User sees classes in name order` |
| US-1.2 | User sees classes in name order | `frontend/tests/Classes.test.js` | `User sees classes in name order` |
| US-1.2 | User sees an empty class list | `frontend/tests/Classes.test.js` | `User sees an empty class list` |
| US-1.3 | User edits a class name and color | `backend/tests/classes.test.js` | `User edits a class name and color` |
| US-1.3 | User edits a class name and color | `frontend/tests/Classes.test.js` | `User edits a class name and color` |
| US-1.3 | User edits a class and keeps its own name | `backend/tests/classes.test.js` | `User edits a class and keeps its own name` |
| US-1.3 | User edits a class to a name another class already uses | `backend/tests/classes.test.js` | `User edits a class to a name another class already uses` |
| US-1.3 | User edits a class that does not exist | `backend/tests/classes.test.js` | `User edits a class that does not exist` |
| US-1.3 | User updates a class with an id that is not a number | `backend/tests/classes.test.js` | `User updates a class with an id that is not a number` |
| US-1.4 | User deletes a class | `backend/tests/classes.test.js` | `User deletes a class` |
| US-1.4 | User deletes a class | `frontend/tests/Classes.test.js` | `User deletes a class` |
| US-1.4 | User cancels deleting a class | `frontend/tests/Classes.test.js` | `User cancels deleting a class` |
| US-1.4 | User deletes a class that does not exist | `backend/tests/classes.test.js` | `User deletes a class that does not exist` |
| US-1.4 | User deletes a class with an id that is not a number | `backend/tests/classes.test.js` | `User deletes a class with an id that is not a number` |

When a scenario checks both the API and the page, the same `it` title is required in each mapped file.

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 1 from @features/feature-1-class-management.md on branch `feature/1-class-management`.

Follow layer order in @features/framework.md (models → routes → backend tests → frontend → frontend tests).
Map every Gherkin scenario in the Test Coverage Map; run `npm test` before finishing.
If API routes, payloads, schema, or product rules changed per this spec, update @features/reference/api.md, @features/reference/data-model.md, and/or @features/reference/behavior.md in the same PR to match shipped code.
Complete Definition of Done and the merge checklist in @features/framework.md.
Do not implement behavior not in this spec. Do not add sign-in, sessions, or userId.
```

**Reference updates for this feature:** `features/reference/api.md`, `features/reference/data-model.md`, `features/reference/behavior.md`.

## Definition of Done

*   [ ] Backend and frontend implemented per this spec (**FR-001** through **FR-009** satisfied)
*   [ ] **Success Criteria (SC-001** through **SC-003)** met
*   [ ] All mapped tests pass (`npm test`)
*   [ ] Test Coverage Map complete
*   [ ] `features/reference/data-model.md` updated
*   [ ] `features/reference/api.md` updated
*   [ ] `features/reference/behavior.md` updated

## Out of Scope

*   Sign-in, registration, sessions, passwords, and route protection
*   Assignments, the assignment table, and the calendar ([Feature 2](./feature-2-assignment-management.md), [Feature 3](./feature-3-assignment-calendar.md))
*   Day todos and stars ([Feature 4](./feature-4-assignment-day-todos.md))
*   Refusing to delete a class that still has assignments ([Feature 2](./feature-2-assignment-management.md))
*   Custom colors outside the eight-color enum
*   `MenuBar` (Feature 2)

## Delivered to Feature 2

*   `/` redirects to `/classes`. Feature 2 replaces `/` with the assignment table and adds `MenuBar` links to assignments and classes.
*   Class delete has no "in use" check yet. Feature 2 rejects delete when assignments still reference the class.
