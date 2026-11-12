# Feature: Assignment Management

**Feature ID:** 2
**Branch pattern:** `feature/2-assignment-management`
**Status:** Ready
**Created:** 2026-11-11
**Input:** A student enters assignments (name and class required; due date, due time, and start-working-by date optional) and reviews them in a table. There is no sign-in.
**Depends on:** [Feature 1 — Class Management](./feature-1-class-management.md)
**Related:** [features/reference/api.md](./reference/api.md)

## User Stories

### US-2.1: Enter an assignment
**As a** student
**I want to** enter an assignment with a name, a class, and optional due date, due time, and start-working-by date
**So that** I can track coursework and when I should start

**Priority:** P1
**Independent test:** Create an assignment named `Lab report` for class `Biology` with a due date, due time, and start-working-by date, and receive the saved row
**Acceptance scenarios:** see ### US-2.1 under Acceptance Criteria

### US-2.2: View assignments in a table
**As a** student
**I want to** see my assignments in a table
**So that** I can scan name, class, and dates in one place

**Priority:** P1
**Independent test:** With several assignments stored, open the table and see soonest due dates first, undated assignments last, and each class name with its color
**Acceptance scenarios:** see ### US-2.2 under Acceptance Criteria

### US-2.3: Edit an assignment
**As a** student
**I want to** change an assignment’s name, class, dates, and due time
**So that** the row matches the real coursework

**Priority:** P1
**Independent test:** Change `Lab report`’s due date and see the updated row in the table
**Acceptance scenarios:** see ### US-2.3 under Acceptance Criteria

### US-2.4: Delete an assignment
**As a** student
**I want to** delete an assignment
**So that** finished or mistaken work leaves the table

**Priority:** P1
**Independent test:** Delete an assignment and confirm it is gone from `GET /api/assignments` and the table
**Acceptance scenarios:** see ### US-2.4 under Acceptance Criteria

### US-2.5: Keep a class that still has assignments
**As a** student
**I want** a class to stay while assignments still use it
**So that** I do not lose the class color and name those assignments point at

**Priority:** P1
**Independent test:** Delete a class that has an assignment and receive `400` with the class and assignment still stored; delete a class with no assignments and see it removed
**Acceptance scenarios:** see ### US-2.5 under Acceptance Criteria

### US-2.6: Switch pages from a sidebar
**As a** student
**I want** a red sidebar and no top bar
**So that** I can open assignments and classes from the side of the page

**Priority:** P1
**Independent test:** From the assignment page, click **Classes** in the sidebar and land on `/classes`, with no top bar and a sidebar in the primary red
**Acceptance scenarios:** see ### US-2.6 under Acceptance Criteria

## Requirements

### Functional Requirements

- **FR-001**: The system MUST let a student create, view, edit, and delete assignments without signing in. Assignment and class endpoints MUST NOT require `Authorization` and MUST NOT return `401`.
- **FR-002**: An assignment MUST have a `name` (trimmed, required, at most 200 characters; duplicates allowed) and a `classId` that references an existing class.
- **FR-003**: `dueDate` and `startWorkingBy` are optional calendar dates (`YYYY-MM-DD`, no time-of-day). `dueTime` is an optional time of day `HH:mm` (24-hour). `dueTime` MUST be rejected when `dueDate` is empty. When both dates are present, `startWorkingBy` MUST be on or before `dueDate`.
- **FR-004**: Omitted optional fields and JSON `null` MUST store `null`. Updating an assignment MUST be able to clear `dueDate`, `dueTime`, and `startWorkingBy` by sending `null`.
- **FR-005**: `GET /api/assignments` MUST return every assignment. Sort by `dueDate` ascending, assignments with no `dueDate` last, then by `name` ascending using a case-insensitive comparison.
- **FR-006**: Each assignment in API responses MUST include `class` as `{ "id", "name", "color" }` for its class. Responses MUST NOT include `userId`.
- **FR-007**: Creating an assignment MUST return `201` and the saved assignment. Updating MUST return `200` and the saved assignment. Deleting MUST return `200` with `{ "message": "Assignment deleted." }`.
- **FR-008**: Validation failures MUST return `400` with the exact `message` strings in Acceptance Criteria. An unknown assignment id MUST return `404` with `{ "message": "Assignment with id=<id> not found." }`. A non-integer assignment id MUST return `400` with `{ "message": "Assignment id must be a number." }`.
- **FR-009**: `DELETE /api/classes/:id` MUST return `400` with `{ "message": "This class still has assignments." }` when any assignment references that class, and MUST NOT delete the class. When no assignment references it, delete MUST still succeed as in Feature 1.
- **FR-010**: The assignment page MUST confirm before deleting an assignment. Cancel MUST leave the assignment in place. If no class exists, the add form MUST show "Add a class before creating an assignment." and MUST NOT submit.
- **FR-011**: `/` MUST show the assignment table. `/` MUST NOT redirect to `/classes`. A sidebar MUST link **Assignments** to `/` and **Classes** to `/classes`. There MUST be no top bar. The sidebar background MUST be theme color `primary` (the same red as primary buttons). Link text MUST use theme color `on-primary`.

## Assumptions

- Feature 1 classes are available (table, API, and classes page).
- This product has no accounts. Token and cross-user test cases do not apply.
- Dates are calendar dates. Store them as `DATEONLY` so a timezone does not shift the day.
- The calendar view, stripes, and day todos are later features. This feature does not draw a calendar.
- Deleting an assignment in this feature removes that assignment only. Feature 4 adds day todos and deletes them with the assignment.

## Edge Cases

- Empty or whitespace name → `400` `"Name is required."`
- Name longer than 200 characters → `400` `"Name must be 200 characters or fewer."`
- Missing `classId` → `400` `"Class is required."`
- `classId` not found → `400` `"Class with id=<id> not found."`
- No classes exist and the student opens **Add assignment** → the form shows "Add a class before creating an assignment." and does not submit
- `dueTime` set while `dueDate` is null or omitted → `400` `"Enter a due date before a due time."`
- `dueTime` not `HH:mm` → `400` `"Enter a valid due time."`
- `dueDate` or `startWorkingBy` not a real `YYYY-MM-DD` date → `400` `"Enter a valid date."`
- `startWorkingBy` after `dueDate` → `400` `"Start working by must be on or before the due date."`
- Only `startWorkingBy`, or only `dueDate`, or neither date → allowed
- Same assignment names → allowed
- Unknown assignment id → `404`
- Non-integer assignment id → `400`
- Delete a class that still has assignments → `400` and no delete
- Delete a class with zero assignments → Feature 1 success
- Cancel assignment delete → row remains
- Empty table → empty-state copy

## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test before merge
- **SC-002**: A student can enter, view, edit, and delete an assignment in the table without signing in
- **SC-003**: A class that still has an assignment cannot be deleted; a class with none can

## Data Ownership & Isolation

This app is single-user. Assignments are not owned by an account.

| Rule | Requirement |
|------|-------------|
| **Read scope** | `GET /api/assignments` returns every assignment |
| **Write scope** | `PUT` and `DELETE` apply to the assignment id. Any caller may use them |
| **Create scope** | `POST` inserts one assignment pointing at an existing class. There is no owner column |
| **Class delete** | Blocked while assignments reference the class (`400`), otherwise Feature 1 delete |
| **Cross-user access** | Not applicable. Do not add `userId` |
| **UI scope** | The table shows the full list from the API |
| **Auth** | No `authenticate` middleware on these routes |

## Key Entities

- **Class**: from Feature 1. An assignment belongs to one class. A class may have many assignments.
- **Assignment**: one piece of coursework. It has a name, a class, an optional due date, an optional due time on that due date, and an optional start-working-by date.

## API Requirements

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/api/assignments` | No | List every assignment, sorted |
| `POST` | `/api/assignments` | No | Create an assignment |
| `PUT` | `/api/assignments/:id` | No | Update an assignment |
| `DELETE` | `/api/assignments/:id` | No | Delete an assignment |
| `DELETE` | `/api/classes/:id` | No | Feature 1 delete, plus the in-use rule in **FR-009** |

`GET /api/classes` is unchanged.

**Create and update request body:**

```json
{
  "name": "Lab report",
  "classId": 1,
  "dueDate": "2026-11-20",
  "dueTime": "23:59",
  "startWorkingBy": "2026-11-16"
}
```

Optional keys may be omitted or `null`.

**Success response** (`201` create, `200` update, and each list element):

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

`dueDate`, `dueTime`, and `startWorkingBy` are JSON `null` when unset. `dueDate` and `startWorkingBy` are `YYYY-MM-DD` strings when set.

**Delete success** (`200`): `{ "message": "Assignment deleted." }`

**Error response:** `{ "message": "Human-readable explanation." }`

| Condition | Status | `message` |
|-----------|--------|-----------|
| Name missing or blank after trim | `400` | `Name is required.` |
| Name longer than 200 characters | `400` | `Name must be 200 characters or fewer.` |
| `classId` missing | `400` | `Class is required.` |
| `classId` not found | `400` | `Class with id=<id> not found.` |
| `dueTime` present and `dueDate` empty | `400` | `Enter a due date before a due time.` |
| `dueTime` not `HH:mm` | `400` | `Enter a valid due time.` |
| `dueDate` or `startWorkingBy` not a real calendar date | `400` | `Enter a valid date.` |
| `startWorkingBy` after `dueDate` | `400` | `Start working by must be on or before the due date.` |
| Assignment `:id` is not an integer | `400` | `Assignment id must be a number.` |
| No assignment with that id | `404` | `Assignment with id=<id> not found.` |
| Delete a class that still has assignments | `400` | `This class still has assignments.` |

Flat JSON only. No `{ success, data }` envelope.

## Screen Requirements

### App chrome

*   `Sidebar` on assignment and class routes. No `v-app-bar` and no top bar.
*   The sidebar is a permanent navigation drawer. Its background is theme color `primary`. Link labels use theme color `on-primary`.
*   Links: **Assignments** (`/`) and **Classes** (`/classes`).
*   `/` no longer redirects to `/classes`.

### [View: Assignments] — route name `assignments`

*   Path: `/`. Heading: **Assignments**
*   Primary action: **Add assignment** (`oc-cta`), opening the add dialog. Dialog actions sit outside `v-card-title`.
*   Table columns: **Name**, **Class**, **Due date**, **Due time**, **Start working by**.
*   **Class** cell: a swatch in `class.color` plus `class.name`.
*   Empty date or time cells are blank.
*   Row order matches **FR-005**.
*   Row actions: **Edit assignment** (`aria-label` **Edit assignment**) and **Delete assignment** (`aria-label` **Delete assignment**). The icons have no button background.
*   **Add assignment** dialog fields, in this order: **Name**, **Class** (select of existing classes by name), **Due date** (date), **Due time** (time), **Start working by** (date). Actions: **Save** and **Cancel**.
*   When no class exists, the dialog shows "Add a class before creating an assignment." and **Save** does not submit.
*   **Edit assignment** dialog: same fields, filled from the row. Title **Edit assignment**. Actions: **Save** and **Cancel**. Clearing a date or time and saving sends `null` for that field.
*   **Delete** confirm: text **Delete this assignment?** Actions: **Delete** and **Cancel**.
*   **Empty state:** "No assignments yet. Add your first assignment."
*   **Loading:** a progress indicator while the list request is in flight.
*   **Error:** `<v-alert type="error">` with the API `message`. Client validation uses the same messages and blocks **Save**.

### [View: Classes] — route name `classes`

*   Feature 1 screen, plus `Sidebar`.
*   When delete returns "This class still has assignments.", show that message in `<v-alert type="error">` and leave the class in the list.

## Data Model Requirements

Feature 1 `classes` is unchanged. New table:

### `assignments` table

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `name` | STRING(200) | Required after trim; not unique |
| `classId` | INTEGER FK | Required; references `classes.id` |
| `dueDate` | DATEONLY | Optional; `YYYY-MM-DD` |
| `dueTime` | STRING(5) | Optional; `HH:mm`; null when there is no due date |
| `startWorkingBy` | DATEONLY | Optional; `YYYY-MM-DD`; on or before `dueDate` when both are set |
| `createdAt` | DATE | Sequelize timestamp |
| `updatedAt` | DATE | Sequelize timestamp |

### Associations

*   **Class hasMany Assignment**
*   **Assignment belongsTo Class**

Do not cascade-delete assignments when a class is deleted. The API rejects that delete (**FR-009**). No `userId`.

## Acceptance Criteria

### US-2.1 — Enter an assignment

#### Scenario: User enters an assignment with a name and class
*   **Given** a class `Biology` with id `1` and color `green` exists
*   **And** I am on the assignments page
*   **When** I add an assignment named `Lab report` for Biology and leave dates and time empty
*   **And** I click **Save**
*   **Then** the API returns `201` with `name` `Lab report`, `classId` `1`, and null `dueDate`, `dueTime`, and `startWorkingBy`
*   **And** the table lists Lab report with class Biology

#### Scenario: User enters an assignment with a due date, due time, and start working by date
*   **Given** a class `Biology` with id `1` exists
*   **When** I send `POST /api/assignments` with name `Lab report`, `classId` `1`, `dueDate` `2026-11-20`, `dueTime` `23:59`, and `startWorkingBy` `2026-11-16`
*   **Then** the API returns `201` with those dates and time
*   **And** `class` is `{ "id": 1, "name": "Biology", "color": "green" }` when Biology’s color is `green`

#### Scenario: User enters an assignment with a name that is only spaces
*   **Given** a class with id `1` exists
*   **When** I send `POST /api/assignments` with a name of only spaces and `classId` `1`
*   **Then** the API returns `400` with `{ "message": "Name is required." }`

#### Scenario: User enters an assignment with an empty name
*   **Given** a class exists and I am adding an assignment
*   **When** I leave **Name** empty, choose the class, and click **Save**
*   **Then** the API is not called
*   **And** I see "Name is required."

#### Scenario: User enters an assignment without a class
*   **Given** a class exists
*   **When** I send `POST /api/assignments` with `{ "name": "Lab report" }`
*   **Then** the API returns `400` with `{ "message": "Class is required." }`

#### Scenario: User enters an assignment when no class exists
*   **Given** there are no classes
*   **And** I am on the assignments page
*   **When** I click **Add assignment**
*   **Then** I see "Add a class before creating an assignment."
*   **And** **Save** does not create an assignment

#### Scenario: User enters a due time without a due date
*   **Given** a class with id `1` exists
*   **When** I send `POST /api/assignments` with name `Lab report`, `classId` `1`, `dueTime` `23:59`, and no `dueDate`
*   **Then** the API returns `400` with `{ "message": "Enter a due date before a due time." }`

#### Scenario: User enters a start working by date after the due date
*   **Given** a class with id `1` exists
*   **When** I create an assignment with `startWorkingBy` `2026-11-21` and `dueDate` `2026-11-20`
*   **Then** the API returns `400` with `{ "message": "Start working by must be on or before the due date." }`

#### Scenario: User enters an assignment for a class that does not exist
*   **Given** no class has id `9`
*   **When** I send `POST /api/assignments` with `{ "name": "Lab report", "classId": 9 }`
*   **Then** the API returns `400` with `{ "message": "Class with id=9 not found." }`

#### Scenario: User enters an assignment with a name longer than 200 characters
*   **Given** a class with id `1` exists
*   **When** I create an assignment whose name is 201 characters and `classId` `1`
*   **Then** the API returns `400` with `{ "message": "Name must be 200 characters or fewer." }`

#### Scenario: User enters a due time that is not a time of day
*   **Given** a class with id `1` exists
*   **When** I create an assignment with `dueDate` `2026-11-20` and `dueTime` `25:00`
*   **Then** the API returns `400` with `{ "message": "Enter a valid due time." }`

#### Scenario: User enters a due date that is not a real date
*   **Given** a class with id `1` exists
*   **When** I create an assignment with `dueDate` `2026-11-31` and `classId` `1`
*   **Then** the API returns `400` with `{ "message": "Enter a valid date." }`

### US-2.2 — View assignments in a table

#### Scenario: User sees assignments soonest due date first
*   **Given** an assignment `Lab report` due `2026-11-20` and an assignment `Essay` due `2026-11-10`
*   **When** I open the assignments page
*   **Then** `GET /api/assignments` returns Essay before Lab report
*   **And** the table shows that order

#### Scenario: User sees same-day assignments in name order
*   **Given** assignments `Quiz` and `Essay` are both due `2026-11-10`
*   **When** I list assignments
*   **Then** Essay comes before Quiz

#### Scenario: User sees an assignment with no due date after dated assignments
*   **Given** `Reading` has no due date and `Essay` is due `2026-11-10`
*   **When** I list assignments
*   **Then** Essay comes before Reading

#### Scenario: User sees an empty assignment table
*   **Given** there are no assignments
*   **When** I open the assignments page
*   **Then** I see "No assignments yet. Add your first assignment."

#### Scenario: User sees the class color and name on the row
*   **Given** class `Biology` has color `green`
*   **And** assignment `Lab report` uses Biology
*   **When** I open the assignments page
*   **Then** the Lab report row shows Biology and a green swatch

### US-2.3 — Edit an assignment

#### Scenario: User edits an assignment
*   **Given** assignment `Lab report` is due `2026-11-20` with no due time
*   **When** I change the due date to `2026-11-22` and set due time `18:00`
*   **And** I click **Save**
*   **Then** the API returns `200` with `dueDate` `2026-11-22` and `dueTime` `18:00`
*   **And** the table shows those values

#### Scenario: User clears optional dates and time
*   **Given** assignment `Lab report` has `dueDate` `2026-11-20`, `dueTime` `23:59`, and `startWorkingBy` `2026-11-16`
*   **When** I send `PUT /api/assignments/<id>` with those three fields set to `null` and the same name and `classId`
*   **Then** the API returns `200` with `dueDate`, `dueTime`, and `startWorkingBy` null

#### Scenario: User edits an assignment that does not exist
*   **Given** no assignment has id `99`
*   **When** I send `PUT /api/assignments/99` with a valid name and `classId`
*   **Then** the API returns `404` with `{ "message": "Assignment with id=99 not found." }`

#### Scenario: User updates an assignment with an id that is not a number
*   **When** I send `PUT /api/assignments/abc` with a valid name and `classId`
*   **Then** the API returns `400` with `{ "message": "Assignment id must be a number." }`

### US-2.4 — Delete an assignment

#### Scenario: User deletes an assignment
*   **Given** assignment `Lab report` is listed
*   **When** I choose **Delete assignment**
*   **And** I confirm **Delete this assignment?**
*   **Then** the API returns `200` with `{ "message": "Assignment deleted." }`
*   **And** Lab report is gone from the table

#### Scenario: User cancels deleting an assignment
*   **Given** assignment `Lab report` is listed
*   **When** I choose **Delete assignment**
*   **And** I click **Cancel**
*   **Then** the API is not called
*   **And** Lab report remains

#### Scenario: User deletes an assignment that does not exist
*   **Given** no assignment has id `99`
*   **When** I send `DELETE /api/assignments/99`
*   **Then** the API returns `404` with `{ "message": "Assignment with id=99 not found." }`

### US-2.5 — Keep a class that still has assignments

#### Scenario: User cannot delete a class that has an assignment
*   **Given** class `Biology` has assignment `Lab report`
*   **When** I confirm delete for Biology
*   **Then** the API returns `400` with `{ "message": "This class still has assignments." }`
*   **And** Biology and Lab report remain

#### Scenario: User deletes a class that has no assignments
*   **Given** class `Art` has no assignments
*   **When** I confirm delete for Art
*   **Then** the API returns `200` with `{ "message": "Class deleted." }`
*   **And** Art is gone from the class list

### US-2.6 — Switch pages from a sidebar

#### Scenario: User opens classes from the sidebar
*   **Given** I am on the assignment page
*   **When** I click **Classes** in the sidebar
*   **Then** the page is `/classes`
*   **And** there is no top bar
*   **And** the sidebar background is theme color `primary`

## Test Coverage Map

Each scenario above must map to at least one automated test. `it` names match the scenario titles. When a scenario checks both the API and the page, use that title in each mapped file.

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-2.1 | User enters an assignment with a name and class | `backend/tests/assignments.test.js` | `User enters an assignment with a name and class` |
| US-2.1 | User enters an assignment with a name and class | `frontend/tests/Assignments.test.js` | `User enters an assignment with a name and class` |
| US-2.1 | User enters an assignment with a due date, due time, and start working by date | `backend/tests/assignments.test.js` | `User enters an assignment with a due date, due time, and start working by date` |
| US-2.1 | User enters an assignment with a name that is only spaces | `backend/tests/assignments.test.js` | `User enters an assignment with a name that is only spaces` |
| US-2.1 | User enters an assignment with an empty name | `frontend/tests/Assignments.test.js` | `User enters an assignment with an empty name` |
| US-2.1 | User enters an assignment without a class | `backend/tests/assignments.test.js` | `User enters an assignment without a class` |
| US-2.1 | User enters an assignment when no class exists | `frontend/tests/Assignments.test.js` | `User enters an assignment when no class exists` |
| US-2.1 | User enters a due time without a due date | `backend/tests/assignments.test.js` | `User enters a due time without a due date` |
| US-2.1 | User enters a start working by date after the due date | `backend/tests/assignments.test.js` | `User enters a start working by date after the due date` |
| US-2.1 | User enters an assignment for a class that does not exist | `backend/tests/assignments.test.js` | `User enters an assignment for a class that does not exist` |
| US-2.1 | User enters an assignment with a name longer than 200 characters | `backend/tests/assignments.test.js` | `User enters an assignment with a name longer than 200 characters` |
| US-2.1 | User enters a due time that is not a time of day | `backend/tests/assignments.test.js` | `User enters a due time that is not a time of day` |
| US-2.1 | User enters a due date that is not a real date | `backend/tests/assignments.test.js` | `User enters a due date that is not a real date` |
| US-2.2 | User sees assignments soonest due date first | `backend/tests/assignments.test.js` | `User sees assignments soonest due date first` |
| US-2.2 | User sees assignments soonest due date first | `frontend/tests/Assignments.test.js` | `User sees assignments soonest due date first` |
| US-2.2 | User sees same-day assignments in name order | `backend/tests/assignments.test.js` | `User sees same-day assignments in name order` |
| US-2.2 | User sees an assignment with no due date after dated assignments | `backend/tests/assignments.test.js` | `User sees an assignment with no due date after dated assignments` |
| US-2.2 | User sees an empty assignment table | `frontend/tests/Assignments.test.js` | `User sees an empty assignment table` |
| US-2.2 | User sees the class color and name on the row | `frontend/tests/Assignments.test.js` | `User sees the class color and name on the row` |
| US-2.3 | User edits an assignment | `backend/tests/assignments.test.js` | `User edits an assignment` |
| US-2.3 | User edits an assignment | `frontend/tests/Assignments.test.js` | `User edits an assignment` |
| US-2.3 | User clears optional dates and time | `backend/tests/assignments.test.js` | `User clears optional dates and time` |
| US-2.3 | User edits an assignment that does not exist | `backend/tests/assignments.test.js` | `User edits an assignment that does not exist` |
| US-2.3 | User updates an assignment with an id that is not a number | `backend/tests/assignments.test.js` | `User updates an assignment with an id that is not a number` |
| US-2.4 | User deletes an assignment | `backend/tests/assignments.test.js` | `User deletes an assignment` |
| US-2.4 | User deletes an assignment | `frontend/tests/Assignments.test.js` | `User deletes an assignment` |
| US-2.4 | User cancels deleting an assignment | `frontend/tests/Assignments.test.js` | `User cancels deleting an assignment` |
| US-2.4 | User deletes an assignment that does not exist | `backend/tests/assignments.test.js` | `User deletes an assignment that does not exist` |
| US-2.5 | User cannot delete a class that has an assignment | `backend/tests/assignments.test.js` | `User cannot delete a class that has an assignment` |
| US-2.5 | User cannot delete a class that has an assignment | `frontend/tests/Classes.test.js` | `User cannot delete a class that has an assignment` |
| US-2.5 | User deletes a class that has no assignments | `backend/tests/assignments.test.js` | `User deletes a class that has no assignments` |
| US-2.6 | User opens classes from the sidebar | `frontend/tests/App.test.js` | `User opens classes from the sidebar` |

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 2 from @features/feature-2-assignment-management.md on branch `feature/2-assignment-management`.

Follow layer order in @features/framework.md (models → routes → backend tests → frontend → frontend tests).
Map every Gherkin scenario in the Test Coverage Map; run `npm test` before finishing.
If API routes, payloads, schema, or product rules changed per this spec, update @features/reference/api.md, @features/reference/data-model.md, and/or @features/reference/behavior.md in the same PR to match shipped code.
Complete Definition of Done and the merge checklist in @features/framework.md.
Do not implement behavior not in this spec. Do not add sign-in, sessions, userId, the calendar, or day todos.
```

**Reference updates for this feature:** `features/reference/api.md`, `features/reference/data-model.md`, `features/reference/behavior.md`.

## Definition of Done

*   [ ] Backend and frontend implemented per this spec (**FR-001** through **FR-011** satisfied, including **US-2.6**)
*   [ ] **Success Criteria (SC-001** through **SC-003)** met
*   [ ] All mapped tests pass (`npm test`)
*   [ ] Test Coverage Map complete
*   [ ] `features/reference/data-model.md` updated
*   [ ] `features/reference/api.md` updated
*   [ ] `features/reference/behavior.md` updated

## Out of Scope

*   Sign-in, registration, sessions, and route protection
*   Calendar stripes and month navigation ([Feature 3](./feature-3-assignment-calendar.md))
*   Day todos, stars, and deleting day todos with an assignment ([Feature 4](./feature-4-assignment-day-todos.md))
*   Moving the assignment table off `/` (Feature 3 makes `/` the calendar and puts the table at `/assignments`)
*   Completion checkboxes and the unfinished/all filter ([Feature 5](./feature-5-completion-and-filter.md))
*   More than one user

## Delivered to Feature 3

*   The assignment table lives at `/` with a primary-red `Sidebar` and no top bar. Links are **Assignments** and **Classes**. Feature 3 makes `/` the calendar and moves this table to `/assignments`.
