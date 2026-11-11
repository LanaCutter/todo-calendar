# Feature: Assignment Day Todos

**Feature ID:** 4
**Branch pattern:** `feature/4-assignment-day-todos`
**Status:** Ready
**Created:** 2026-11-11
**Input:** From an assignment, a student opens the calendar, selects every day to work that assignment, and saves. Those days are todos. A star shows on the assignment’s stripe for each selected day that the stripe covers. There is no sign-in.
**Depends on:** [Feature 3 — Assignment Calendar](./feature-3-assignment-calendar.md)
**Related:** [features/reference/api.md](./reference/api.md)

## User Stories

### US-4.1: Choose days for a todo
**As a** student
**I want to** open a calendar from an assignment and select the days I will do it
**So that** I can plan one or many work days without retyping the assignment

**Priority:** P1
**Independent test:** Click **Create todo** on an assignment, select two days, save, and see both dates stored for that assignment
**Acceptance scenarios:** see ### US-4.1 under Acceptance Criteria

### US-4.2: See a star on a todo day
**As a** student
**I want** a star on the stripe for each day I marked as a todo
**So that** the calendar shows which days I planned to work that assignment

**Priority:** P1
**Independent test:** Save a todo on a day inside the stripe and see a star on that day’s stripe; a stripe day with no todo has no star
**Acceptance scenarios:** see ### US-4.2 under Acceptance Criteria

### US-4.3: Change the selected days
**As a** student
**I want to** add or remove days and save again
**So that** the todos match the days I actually intend to work

**Priority:** P1
**Independent test:** Open **Create todo** for an assignment that already has days, unselect one, save, and see only the remaining dates
**Acceptance scenarios:** see ### US-4.3 under Acceptance Criteria

### US-4.4: Remove todos when the assignment is deleted
**As a** student
**I want** an assignment’s day todos to disappear when I delete the assignment
**So that** I do not keep work days for coursework that is gone

**Priority:** P1
**Independent test:** Delete an assignment that has day todos and confirm those todos are no longer stored
**Acceptance scenarios:** see ### US-4.4 under Acceptance Criteria

## Requirements

### Functional Requirements

- **FR-001**: A day todo MUST be one calendar date on one assignment. It MUST NOT have its own name. Many day todos MAY belong to the same assignment. The pair (`assignmentId`, `todoDate`) MUST be unique.
- **FR-002**: **Create todo** on an assignment MUST open a month calendar for that assignment. Days that already have a day todo MUST start selected. The student MUST be able to move between months without losing the current selection. **Save** MUST replace that assignment’s day todos with exactly the selected dates. **Cancel** MUST close without saving.
- **FR-003**: `PUT /api/assignments/:id/day-todos` with `{ "dates": ["YYYY-MM-DD", ...] }` MUST replace the assignment’s day todos. The response MUST be `200` with `{ "dates": [...] }` sorted ascending. Duplicate dates in the request MUST be stored once. An empty array MUST remove every day todo for that assignment.
- **FR-004**: `GET /api/assignments`, `POST /api/assignments`, and `PUT /api/assignments/:id` responses MUST include `dayTodos`, an array of `YYYY-MM-DD` strings sorted ascending. Assignments with none MUST include `dayTodos: []`.
- **FR-005**: These routes MUST NOT require `Authorization` and MUST NOT return `401`. There is no `userId` on a day todo.
- **FR-006**: A missing `dates` value, or a `dates` value that is not an array, MUST return `400` with `{ "message": "Dates are required." }`. A value that is not a real `YYYY-MM-DD` date MUST return `400` with `{ "message": "Enter a valid date." }`. An unknown assignment MUST return `404` with `{ "message": "Assignment with id=<id> not found." }`. A non-integer id MUST return `400` with `{ "message": "Assignment id must be a number." }`.
- **FR-007**: On the calendar, a stripe day that has a day todo for that assignment MUST show a star (`aria-label` **Todo**) on that stripe. A stripe day with no day todo MUST NOT show a star. A day todo on a date that has no stripe for that assignment MUST stay stored and MUST appear selected in the picker, and MUST NOT show a star.
- **FR-008**: Deleting an assignment MUST delete its day todos. The database MUST use `ON DELETE CASCADE` from `assignments` to `day_todos`.
- **FR-009**: The student MAY select any calendar day, including days outside the stripe and days for an assignment that is not drawn on the calendar.

## Assumptions

- Features 1–3 are on `dev`: classes, the assignment table, and calendar stripes.
- There is no sign-in. Any caller may replace day todos.
- The picker is a month grid in a dialog, built with Vuetify, same Sunday-first layout as Feature 3. It does not add a calendar library.
- **Save** sends every selected date, including dates in months that are not currently visible.
- Stars are drawn only where Feature 3 already draws a stripe.

## Edge Cases

- One selected day → one day todo
- Several days, including days in different months → one day todo per distinct date
- Duplicate dates in one request → a single stored date
- Empty `dates` array → no day todos remain for that assignment
- Cancel → previous day todos unchanged and no `PUT`
- Invalid date or non-array `dates` → `400` as in **FR-006**
- Unknown assignment or non-integer id → `404` or `400` as in **FR-006**
- Todo on a day the stripe does not cover → stored, no star
- Todo on a day the stripe does cover → star on that day’s stripe
- Delete assignment → its day todos are gone
- Two assignments on the same day → the star is only on the assignment that has the todo

## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test before merge
- **SC-002**: From **Create todo**, a student can save several days for one assignment and see them as that assignment’s day todos
- **SC-003**: A star appears on a stripe day if and only if that assignment has a day todo on that date
- **SC-004**: Deleting an assignment leaves no day todos for that assignment id

## Data Ownership & Isolation

Single-user, same as Features 1–3. Day todos belong to an assignment, not to an account.

| Rule | Requirement |
|------|-------------|
| **Read scope** | Day todos come back on every assignment from `GET /api/assignments` |
| **Write scope** | `PUT /api/assignments/:id/day-todos` replaces todos for that assignment id only |
| **Create scope** | There is no separate create call. The replace request is the whole set |
| **Delete scope** | Removing a date from the set deletes that day todo. Deleting the assignment deletes all of its day todos |
| **Cross-user access** | Not applicable. Do not add `userId` |
| **UI scope** | The picker and stars show only the dates returned for that assignment |
| **Auth** | No `authenticate` middleware |

## Key Entities

- **Assignment**: from Feature 2. It now has many day todos.
- **Day todo**: a calendar date the student chose for one assignment. It has no title. The star on the calendar is the visible mark for a day todo that falls on that assignment’s stripe.

## API Requirements

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `PUT` | `/api/assignments/:id/day-todos` | No | Replace the assignment’s day todos |
| `GET` | `/api/assignments` | No | Unchanged list, plus `dayTodos` on each assignment |
| `POST` | `/api/assignments` | No | Unchanged create; response includes `dayTodos` (empty for a new row) |
| `PUT` | `/api/assignments/:id` | No | Unchanged assignment update; response includes current `dayTodos` |
| `DELETE` | `/api/assignments/:id` | No | Feature 2 delete; also removes day todos (**FR-008**) |

**Replace request body:**

```json
{ "dates": ["2026-11-10", "2026-11-12"] }
```

**Success response** (`200`):

```json
{ "dates": ["2026-11-10", "2026-11-12"] }
```

`dates` in the response is sorted ascending and contains each date once.

**Assignment objects** add:

```json
"dayTodos": ["2026-11-10", "2026-11-12"]
```

**Error response:** `{ "message": "Human-readable explanation." }`

| Condition | Status | `message` |
|-----------|--------|-----------|
| `dates` missing or not an array | `400` | `Dates are required.` |
| Any entry is not a real `YYYY-MM-DD` date | `400` | `Enter a valid date.` |
| `:id` is not an integer | `400` | `Assignment id must be a number.` |
| No assignment with that id | `404` | `Assignment with id=<id> not found.` |

`dates: []` is valid and clears day todos. Flat JSON only.

## Screen Requirements

### [View: Assignments] — route name `assignments`

*   Each row has a **Create todo** button in addition to Feature 2’s edit and delete actions.
*   **Create todo** opens the day-todo dialog for that assignment.

### [View: Calendar] — route name `calendar`

*   Each visible assignment stripe has one **Create todo** control (`aria-label` **Create todo**) that opens the same dialog for that assignment.
*   On a stripe segment whose `data-date` is in that assignment’s `dayTodos`, show a star icon with `aria-label` **Todo**. Other stripe segments for that assignment have no star.
*   Feature 3 `data-assignment-id`, `data-date`, and `data-color` stay on the stripe.

### Day-todo dialog

*   Title: **Create todo**
*   Text: "Select every day to do this assignment."
*   Month grid for one month at a time, Sunday through Saturday, with **Previous month** and **Next month** (`aria-label` values **Previous month** and **Next month**).
*   A day button is selected or not. Selected days use `aria-pressed="true"`. Clicking a day toggles it. Changing months keeps the selection.
*   Days already stored for this assignment start selected, including days outside the visible month.
*   Actions, outside `v-card-title`: **Save** and **Cancel**.
*   **Save** sends `PUT /api/assignments/:id/day-todos` with every selected date, then closes and refreshes assignments so stars match.
*   **Cancel** closes and does not call the API.
*   **Error:** `<v-alert type="error">` with the API `message`. The dialog stays open.
*   Build the grid with Vuetify. No new calendar library. No raw hex in the component.

## Data Model Requirements

Feature 2 `assignments` columns are unchanged. New table:

### `day_todos` table

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `assignmentId` | INTEGER FK | Required; references `assignments.id`; `ON DELETE CASCADE` |
| `todoDate` | DATEONLY | Required; `YYYY-MM-DD` |
| `createdAt` | DATE | Sequelize timestamp |
| `updatedAt` | DATE | Sequelize timestamp |

Unique (`assignmentId`, `todoDate`). No `userId`. No name column.

### Associations

*   **Assignment hasMany DayTodo**
*   **DayTodo belongsTo Assignment**
*   Deleting an assignment deletes its day todos

`GET /api/assignments` includes the related dates as `dayTodos` (the date strings, not the full row).

## Acceptance Criteria

### US-4.1 — Choose days for a todo

#### Scenario: User saves one day as a todo
*   **Given** assignment `Lab report` has id `1` and no day todos
*   **And** I am on the assignment table
*   **When** I click **Create todo** on Lab report
*   **And** I select `2026-11-12`
*   **And** I click **Save**
*   **Then** the API returns `200` with `{ "dates": ["2026-11-12"] }`
*   **And** Lab report’s `dayTodos` is `["2026-11-12"]`

#### Scenario: User saves several days as todos for the same assignment
*   **Given** assignment `Lab report` has id `1`
*   **When** I send `PUT /api/assignments/1/day-todos` with `{ "dates": ["2026-11-12", "2026-11-10", "2026-12-01"] }`
*   **Then** the API returns `200` with `{ "dates": ["2026-11-10", "2026-11-12", "2026-12-01"] }`
*   **And** `GET /api/assignments` includes those three dates on Lab report, sorted ascending

#### Scenario: User selects days in two months and saves both
*   **Given** the day-todo dialog is open for `Lab report`
*   **When** I select `2026-11-12`
*   **And** I go to the next month and select `2026-12-01`
*   **And** I click **Save**
*   **Then** the request body dates include both `2026-11-12` and `2026-12-01`

#### Scenario: User cancels without changing todos
*   **Given** `Lab report` has a day todo on `2026-11-12`
*   **And** the day-todo dialog is open
*   **When** I select another day
*   **And** I click **Cancel**
*   **Then** the API is not called
*   **And** Lab report’s day todos are still only `2026-11-12`

#### Scenario: User opens create todo from the calendar stripe
*   **Given** `Lab report` is drawn on the calendar
*   **When** I activate **Create todo** on its stripe
*   **Then** the day-todo dialog opens for Lab report

#### Scenario: User saves todos for an assignment that does not exist
*   **Given** no assignment has id `99`
*   **When** I send `PUT /api/assignments/99/day-todos` with `{ "dates": ["2026-11-12"] }`
*   **Then** the API returns `404` with `{ "message": "Assignment with id=99 not found." }`

#### Scenario: User sends a date that is not a calendar date
*   **Given** assignment id `1` exists
*   **When** I send `PUT /api/assignments/1/day-todos` with `{ "dates": ["2026-11-31"] }`
*   **Then** the API returns `400` with `{ "message": "Enter a valid date." }`
*   **And** the assignment’s day todos are unchanged

#### Scenario: User sends duplicate dates
*   **Given** assignment id `1` exists
*   **When** I send `PUT /api/assignments/1/day-todos` with `{ "dates": ["2026-11-12", "2026-11-12"] }`
*   **Then** the API returns `200` with `{ "dates": ["2026-11-12"] }`

#### Scenario: User replaces day todos with an id that is not a number
*   **When** I send `PUT /api/assignments/abc/day-todos` with `{ "dates": ["2026-11-12"] }`
*   **Then** the API returns `400` with `{ "message": "Assignment id must be a number." }`

#### Scenario: User sends dates that are not a list
*   **Given** assignment id `1` exists
*   **When** I send `PUT /api/assignments/1/day-todos` with `{ "dates": "2026-11-12" }`
*   **Then** the API returns `400` with `{ "message": "Dates are required." }`

### US-4.2 — See a star on a todo day

#### Scenario: User sees a star on the stripe for a day with a todo
*   **Given** `Lab report` is drawn from `2026-11-09` through `2026-11-13`
*   **And** Lab report has a day todo on `2026-11-12`
*   **And** the calendar is showing November 2026
*   **When** the calendar finishes loading
*   **Then** the Lab report stripe on `2026-11-12` shows a star with `aria-label` **Todo**
*   **And** the Lab report stripe on `2026-11-11` does not show that star

#### Scenario: User keeps a todo on a day that has no stripe
*   **Given** `Reading` has no due date, so it has no stripe
*   **And** Reading has a day todo on `2026-11-04`
*   **And** the calendar is showing November 2026
*   **When** the calendar finishes loading
*   **Then** no star for Reading is shown
*   **And** `GET /api/assignments` still lists `2026-11-04` in Reading’s `dayTodos`
*   **And** opening **Create todo** for Reading shows `2026-11-04` selected

#### Scenario: User sees a star only on the assignment that has the todo
*   **Given** `Lab report` and `Quiz` are both drawn on `2026-11-13`
*   **And** only Lab report has a day todo on `2026-11-13`
*   **And** the calendar is showing November 2026
*   **When** the calendar finishes loading
*   **Then** the Lab report stripe on `2026-11-13` shows a star
*   **And** the Quiz stripe on `2026-11-13` does not show a star

### US-4.3 — Change the selected days

#### Scenario: User unselects a day and saving removes that todo
*   **Given** `Lab report` is drawn from `2026-11-09` through `2026-11-13`
*   **And** `Lab report` has day todos on `2026-11-11` and `2026-11-12`
*   **And** the day-todo dialog is open with both days selected
*   **When** I unselect `2026-11-12`
*   **And** I click **Save**
*   **Then** the API returns `200` with `{ "dates": ["2026-11-11"] }`
*   **And** the star remains on `2026-11-11` and is gone from `2026-11-12` when that day is on the stripe

#### Scenario: User adds a day to an existing set
*   **Given** `Lab report` has a day todo on `2026-11-11`
*   **When** I save the set `2026-11-11` and `2026-11-13`
*   **Then** Lab report’s `dayTodos` are `["2026-11-11", "2026-11-13"]`

#### Scenario: User saves an empty set and all day todos are removed
*   **Given** assignment id `1` has day todos
*   **When** I send `PUT /api/assignments/1/day-todos` with `{ "dates": [] }`
*   **Then** the API returns `200` with `{ "dates": [] }`
*   **And** that assignment’s `dayTodos` is `[]`

### US-4.4 — Remove todos when the assignment is deleted

#### Scenario: User deletes an assignment and its day todos are gone
*   **Given** assignment `Lab report` has id `1` and day todos on `2026-11-10` and `2026-11-12`
*   **When** I delete Lab report
*   **Then** the API returns `200` with `{ "message": "Assignment deleted." }`
*   **And** `GET /api/assignments` does not include Lab report
*   **And** no day todos remain stored for assignment id `1`

#### Scenario: User replaces day todos on a new assignment only
*   **Given** assignment id `1` was deleted with its day todos
*   **And** a new assignment id `2` exists
*   **When** I send `PUT /api/assignments/2/day-todos` with `{ "dates": ["2026-11-15"] }`
*   **Then** the API returns `200` with `{ "dates": ["2026-11-15"] }`
*   **And** those dates are stored for assignment id `2` only

## Test Coverage Map

Each scenario above must map to at least one automated test. `it` names match the scenario titles. When a scenario checks both the API and the page, use that title in each mapped file.

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-4.1 | User saves one day as a todo | `backend/tests/dayTodos.test.js` | `User saves one day as a todo` |
| US-4.1 | User saves one day as a todo | `frontend/tests/DayTodos.test.js` | `User saves one day as a todo` |
| US-4.1 | User saves several days as todos for the same assignment | `backend/tests/dayTodos.test.js` | `User saves several days as todos for the same assignment` |
| US-4.1 | User selects days in two months and saves both | `frontend/tests/DayTodos.test.js` | `User selects days in two months and saves both` |
| US-4.1 | User cancels without changing todos | `frontend/tests/DayTodos.test.js` | `User cancels without changing todos` |
| US-4.1 | User opens create todo from the calendar stripe | `frontend/tests/DayTodos.test.js` | `User opens create todo from the calendar stripe` |
| US-4.1 | User saves todos for an assignment that does not exist | `backend/tests/dayTodos.test.js` | `User saves todos for an assignment that does not exist` |
| US-4.1 | User sends a date that is not a calendar date | `backend/tests/dayTodos.test.js` | `User sends a date that is not a calendar date` |
| US-4.1 | User sends duplicate dates | `backend/tests/dayTodos.test.js` | `User sends duplicate dates` |
| US-4.1 | User replaces day todos with an id that is not a number | `backend/tests/dayTodos.test.js` | `User replaces day todos with an id that is not a number` |
| US-4.1 | User sends dates that are not a list | `backend/tests/dayTodos.test.js` | `User sends dates that are not a list` |
| US-4.2 | User sees a star on the stripe for a day with a todo | `frontend/tests/DayTodos.test.js` | `User sees a star on the stripe for a day with a todo` |
| US-4.2 | User keeps a todo on a day that has no stripe | `frontend/tests/DayTodos.test.js` | `User keeps a todo on a day that has no stripe` |
| US-4.2 | User keeps a todo on a day that has no stripe | `backend/tests/dayTodos.test.js` | `User keeps a todo on a day that has no stripe` |
| US-4.2 | User sees a star only on the assignment that has the todo | `frontend/tests/DayTodos.test.js` | `User sees a star only on the assignment that has the todo` |
| US-4.3 | User unselects a day and saving removes that todo | `backend/tests/dayTodos.test.js` | `User unselects a day and saving removes that todo` |
| US-4.3 | User unselects a day and saving removes that todo | `frontend/tests/DayTodos.test.js` | `User unselects a day and saving removes that todo` |
| US-4.3 | User adds a day to an existing set | `backend/tests/dayTodos.test.js` | `User adds a day to an existing set` |
| US-4.3 | User saves an empty set and all day todos are removed | `backend/tests/dayTodos.test.js` | `User saves an empty set and all day todos are removed` |
| US-4.4 | User deletes an assignment and its day todos are gone | `backend/tests/dayTodos.test.js` | `User deletes an assignment and its day todos are gone` |
| US-4.4 | User replaces day todos on a new assignment only | `backend/tests/dayTodos.test.js` | `User replaces day todos on a new assignment only` |

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 4 from @features/feature-4-assignment-day-todos.md on branch `feature/4-assignment-day-todos`.

Follow layer order in @features/framework.md (models → routes → backend tests → frontend → frontend tests).
Map every Gherkin scenario in the Test Coverage Map; run `npm test` before finishing.
If API routes, payloads, schema, or product rules changed per this spec, update @features/reference/api.md, @features/reference/data-model.md, and/or @features/reference/behavior.md in the same PR to match shipped code.
Complete Definition of Done and the merge checklist in @features/framework.md.
Do not implement behavior not in this spec. Do not add sign-in, sessions, or userId.
```

**Reference updates for this feature:** `features/reference/api.md`, `features/reference/data-model.md`, `features/reference/behavior.md`.

## Definition of Done

*   [ ] Backend and frontend implemented per this spec (**FR-001** through **FR-009** satisfied)
*   [ ] **Success Criteria (SC-001** through **SC-004)** met
*   [ ] All mapped tests pass (`npm test`)
*   [ ] Test Coverage Map complete
*   [ ] `features/reference/data-model.md` updated
*   [ ] `features/reference/api.md` updated
*   [ ] `features/reference/behavior.md` updated

## Out of Scope

*   Sign-in, registration, sessions, and per-user todos
*   A separate title or notes on a day todo
*   A done/complete flag, the todo list, and crossing off assignments ([Feature 5](./feature-5-completion-and-filter.md))
*   Dragging stripes or changing due dates from the calendar
*   Reminders and notifications
*   Showing a star on a day that has no stripe

## Delivered to Feature 5

*   `dayTodos` on assignment responses is an array of `YYYY-MM-DD` strings. Feature 5 replaces each entry with `{ "date", "completed" }` and adds `completed` on the assignment.
*   There is no todo list and no completion checkbox yet. Feature 5 adds `/todos`, checkboxes, the calendar day dialog, and the **Unfinished** / **All** control.
