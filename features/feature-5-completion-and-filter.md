# Feature: Completion and Unfinished Filter

**Feature ID:** 5
**Branch pattern:** `feature/5-completion-and-filter`
**Status:** Ready
**Created:** 2026-11-11
**Input:** A student can cross off a day todo or an assignment. Crossing off a todo leaves the assignment unchanged. Marking an assignment completed also marks all of its day todos completed. Assignment list, todo list, and calendar can show only unfinished items or everything.
**Depends on:** [Feature 4 — Assignment Day Todos](./feature-4-assignment-day-todos.md)
**Related:** [docs/product-overview.md](../docs/product-overview.md)

## User Stories

### US-5.1: Cross off a todo
**As a** student
**I want to** cross off a day todo
**So that** I can record that I did the work that day without closing the whole assignment

**Priority:** P1
**Independent test:** Check a todo on the todo list and see that todo completed while its assignment stays not completed
**Acceptance scenarios:** see ### US-5.1 under Acceptance Criteria

### US-5.2: Mark an assignment completed
**As a** student
**I want to** mark an assignment completed and have its day todos completed too
**So that** finishing the coursework clears every planned day at once

**Priority:** P1
**Independent test:** Check an assignment that has two day todos and see the assignment and both todos completed
**Acceptance scenarios:** see ### US-5.2 under Acceptance Criteria

### US-5.3: Show unfinished items or everything
**As a** student
**I want to** switch each list and the calendar between unfinished items and all items
**So that** I can focus on what is left or review what I already finished

**Priority:** P1
**Independent test:** With one completed and one open assignment, choose **Unfinished** and see only the open one, then choose **All** and see both
**Acceptance scenarios:** see ### US-5.3 under Acceptance Criteria

### US-5.4: Finish work from a calendar day
**As a** student
**I want to** click a calendar day and check off that day’s todo or the whole assignment
**So that** I can update completion while I am looking at the month

**Priority:** P1
**Independent test:** Click a day that has a todo, check **Finish todo**, and see that todo completed; check **Complete assignment** and see the assignment and all of its todos completed
**Acceptance scenarios:** see ### US-5.4 under Acceptance Criteria

## Requirements

### Functional Requirements

- **FR-001**: An assignment MUST have `completed` (boolean, default `false`). A day todo MUST have `completed` (boolean, default `false`). New assignments and new day todos MUST start not completed. There is still no sign-in and no `userId`.
- **FR-002**: Setting a day todo’s `completed` flag MUST NOT change its assignment’s `completed` flag. Finishing the last open todo on an assignment MUST leave the assignment not completed.
- **FR-003**: Setting an assignment to completed MUST set `completed` true on that assignment and on every one of its day todos. Setting an assignment to not completed MUST set only the assignment’s `completed` to false and MUST leave each day todo’s `completed` as it was.
- **FR-004**: `PUT /api/assignments/:id/day-todos` (Feature 4) MUST keep `completed` for a date that remains in the set. A newly added date MUST be `completed: false`. A date removed from the set MUST delete that day todo. Replacing dates MUST NOT change the assignment’s `completed` flag.
- **FR-005**: After this feature, assignment responses MUST include `completed` and MUST replace Feature 4’s `dayTodos` string array with objects `{ "date": "YYYY-MM-DD", "completed": true|false }` sorted by `date` ascending. `GET /api/day-todos` MUST return every day todo with its assignment name, assignment `completed`, and class `name` and `color`, sorted by `todoDate` ascending, then assignment name case-insensitively.
- **FR-006**: The assignment list (`/`), the todo list (`/todos`), and the calendar (`/calendar`) MUST each offer **Unfinished** and **All**. Each view opens on **All**. **Unfinished** hides completed rows or stripes for that view only. **All** shows completed and not-completed items. The filter MUST NOT change stored data.
- **FR-007**: In **All**, a completed assignment name and a completed todo’s assignment name MUST render with a line through the name, and the completion checkbox MUST be checked. In **Unfinished** on the calendar, a completed assignment MUST NOT be drawn, and a completed day todo MUST NOT show a star. A not-completed assignment MUST still show its stripe. An unfinished todo’s star keeps `aria-label` **Todo**. A completed todo’s star, visible in **All**, uses `aria-label` **Todo completed**.
- **FR-008**: Clicking a calendar day cell MUST open a dialog for that date. **Create todo** MUST still open the Feature 4 picker and MUST NOT open this dialog. The dialog lists every day todo on that date, finished or not, even when the calendar filter is **Unfinished**. Each row has checkbox **Finish todo** and checkbox **Complete assignment**. Checking either box saves immediately. A day with no todos shows "No todos on this day."
- **FR-009**: The assignment list MUST include checkbox **Complete assignment** on each row. The todo list MUST include checkbox **Finish todo** on each row. `MenuBar` MUST link **Assignments** (`/`), **Todos** (`/todos`), **Calendar** (`/calendar`), and **Classes** (`/classes`). The Feature 3 label **Table** MUST be replaced by **Assignments**.
- **FR-010**: Completion endpoints MUST NOT require `Authorization`. `completed` other than boolean MUST return `400` with `{ "message": "Completed must be true or false." }`. An unknown assignment MUST return `404` with `{ "message": "Assignment with id=<id> not found." }`. A day todo that is not on that assignment MUST return `404` with `{ "message": "Todo on <date> not found." }`. A non-integer assignment id MUST return `400` with `{ "message": "Assignment id must be a number." }`.

## Assumptions

- Features 1–4 are the source for classes, assignments, stripes, and day todos. This feature adds completion and the filter.
- Until this feature is implemented, Feature 4’s `dayTodos` array is date strings. This feature replaces that array with objects. Tests written for Feature 4 that assert `dayTodos` strings need to expect the object shape once this feature ships.
- The filter is local to the view on screen. It is not saved on the server and not shared across views.
- Crossing off is a checkbox. Checked means completed. Unchecked means not completed.
- No accounts. Token and cross-user cases do not apply.

## Edge Cases

- Finish one todo on an assignment that has another open todo → only that todo is completed; the assignment stays not completed
- Finish the only todo → the assignment stays not completed
- Clear a todo → only that todo is not completed
- Clear a todo while the assignment is completed → the todo is not completed; the assignment stays completed
- Mark an assignment completed → every day todo on it is completed, including days not shown in the current dialog
- Mark an assignment completed when it has no day todos → the assignment is completed
- Clear assignment completion → todos stay as they are (completed todos stay completed)
- Replace the date set → kept dates keep `completed`; new dates start not completed; dropped dates are deleted; assignment `completed` is unchanged
- Add a day todo while the assignment is already completed → the new todo starts not completed; the assignment stays completed
- **Unfinished** with nothing left to show on the calendar → the month grid and "No assignments on this month's calendar."
- Day click when that date has no day todo → "No todos on this day."
- `completed` not a boolean → `400`
- Unknown assignment or unknown todo date → `404`

## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test before merge
- **SC-002**: Checking a todo never changes `assignment.completed`
- **SC-003**: Checking an assignment sets `completed` true on the assignment and on all of its day todos
- **SC-004**: **Unfinished** hides completed assignments on the assignment list and calendar, and hides completed todos on the todo list and calendar stars; **All** shows them

## Data Ownership & Isolation

Single-user, same as Features 1–4.

| Rule | Requirement |
|------|-------------|
| **Read scope** | `GET /api/assignments` and `GET /api/day-todos` return every row |
| **Write scope** | Completion updates apply to the assignment id, and for a todo also to that assignment’s date |
| **Create scope** | New rows start `completed: false` |
| **Cross-user access** | Not applicable. Do not add `userId` |
| **UI scope** | Lists and the calendar show the API data, then hide completed items only when **Unfinished** is selected |
| **Auth** | No `authenticate` middleware |

## Key Entities

- **Assignment**: from Feature 2. It can be completed. Completing it completes its day todos. Clearing it does not reopen those day todos.
- **Day todo**: from Feature 4. It can be completed on its own. Completing or clearing it does not change the assignment.

## API Requirements

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `PUT` | `/api/assignments/:id/completion` | No | Set the assignment completed flag. `true` also completes its day todos |
| `PUT` | `/api/assignments/:id/day-todos/completion` | No | Set one day todo’s completed flag. Does not change the assignment |
| `GET` | `/api/day-todos` | No | List every day todo for the todo list |
| `GET` | `/api/assignments` | No | Feature 4 list, with `completed` and object `dayTodos` |
| `PUT` | `/api/assignments/:id/day-todos` | No | Feature 4 replace; keeps `completed` on dates that remain (**FR-004**) |

**Complete an assignment:**

```json
{ "completed": true }
```

**Success** (`200`): the assignment, including `completed` and `dayTodos` as objects. When `completed` is `true` in the request, every `dayTodos[].completed` is `true`.

**Complete one todo:**

```json
{ "date": "2026-11-12", "completed": true }
```

**Success** (`200`):

```json
{
  "date": "2026-11-12",
  "completed": true,
  "assignmentCompleted": false
}
```

`assignmentCompleted` is the assignment’s `completed` value after the update. This endpoint MUST NOT change it.

**Day todo list element:**

```json
{
  "id": 3,
  "assignmentId": 1,
  "date": "2026-11-12",
  "completed": false,
  "assignment": {
    "id": 1,
    "name": "Lab report",
    "completed": false,
    "class": { "id": 1, "name": "Biology", "color": "green" }
  }
}
```

**Assignment `dayTodos` after this feature:**

```json
"completed": false,
"dayTodos": [
  { "date": "2026-11-10", "completed": true },
  { "date": "2026-11-12", "completed": false }
]
```

**Error response:** `{ "message": "Human-readable explanation." }`

| Condition | Status | `message` |
|-----------|--------|-----------|
| `completed` is missing or not a boolean | `400` | `Completed must be true or false.` |
| Todo completion body has no `date` | `400` | `Date is required.` |
| `date` is not a real `YYYY-MM-DD` date | `400` | `Enter a valid date.` |
| Assignment `:id` is not an integer | `400` | `Assignment id must be a number.` |
| No assignment with that id | `404` | `Assignment with id=<id> not found.` |
| No day todo on that assignment for `date` | `404` | `Todo on <date> not found.` |

Flat JSON only.

## Screen Requirements

### App chrome

*   `MenuBar` links: **Assignments** (`/`), **Todos** (`/todos`), **Calendar** (`/calendar`), **Classes** (`/classes`).
*   The assignment-list link label is **Assignments**, not **Table**.

### [View: Assignments] — route name `assignments`

*   Feature 2 table, plus a **Done** checkbox on each row (`aria-label` **Complete assignment**).
*   Checked means the assignment is completed. Checking it saves immediately and completes every day todo. Unchecking it saves immediately and leaves day todos unchanged.
*   Display control: **Unfinished** and **All**. The view opens on **All**.
*   **All** shows every assignment. Completed names use line-through.
*   **Unfinished** shows only assignments with `completed` false.
*   Empty under **All** stays "No assignments yet. Add your first assignment."
*   When **Unfinished** hides every row, show "No unfinished assignments."

### [View: Todos] — route name `todos`

*   Path: `/todos`. Heading: **Todos**
*   Columns: **Done**, **Date**, **Assignment**, **Class**.
*   **Done** is checkbox `aria-label` **Finish todo**. It saves immediately and does not change the assignment’s completed flag.
*   **Class** shows the swatch and class name.
*   Display control: **Unfinished** and **All**. The view opens on **All**.
*   **All** lists every day todo. When the todo is completed, the assignment name uses line-through.
*   **Unfinished** lists only day todos with `completed` false.
*   Order: date ascending, then assignment name.
*   **Empty state** under **All:** "No todos yet. Create a todo from an assignment."
*   When **Unfinished** hides every row, show "No unfinished todos."
*   **Loading** and `<v-alert type="error">` follow the assignment list.

### [View: Calendar] — route name `calendar`

*   Same **Unfinished** and **All** control. The view opens on **All**.
*   **All** draws Feature 3 stripes. Completed assignment names use line-through. Completed todo stars use `aria-label` **Todo completed**.
*   **Unfinished** does not draw a stripe whose assignment is completed, and does not draw a star whose day todo is completed. Other stripes and stars stay.
*   If that leaves no stripe, show the Feature 3 empty copy "No assignments on this month's calendar."
*   Clicking the day cell opens the day dialog. **Create todo** still opens the day-picker dialog.

### Day dialog

*   Heading is the date in long form, for example **November 12, 2026**. The dialog root sets `data-date` to `YYYY-MM-DD`.
*   One row per day todo on that date: assignment name, class swatch and name, checkbox **Finish todo**, checkbox **Complete assignment**.
*   **Finish todo** calls `PUT /api/assignments/:id/day-todos/completion`.
*   **Complete assignment** calls `PUT /api/assignments/:id/completion`. After a successful `true`, that row’s **Finish todo** box is checked and **Complete assignment** is checked. Todos on other days are completed in the data even though this dialog only lists this date.
*   The dialog lists finished and unfinished todos on that date, including when the calendar control is **Unfinished**.
*   **Empty state:** "No todos on this day."
*   **Error:** `<v-alert type="error">` with the API `message`, and the checkbox returns to its previous checked state.
*   Close control: **Close**.

## Data Model Requirements

Feature 5 adds columns only.

### `assignments` (changed)

| Field | Type | Rules |
|-------|------|-------|
| `completed` | BOOLEAN | Required; default `false` |

### `day_todos` (changed)

| Field | Type | Rules |
|-------|------|-------|
| `completed` | BOOLEAN | Required; default `false` |

No new tables. Associations stay as in Feature 4. `ON DELETE CASCADE` is unchanged.

## Acceptance Criteria

### US-5.1 — Cross off a todo

#### Scenario: User finishes a todo from the todo list
*   **Given** assignment `Lab report` is not completed
*   **And** Lab report has a day todo on `2026-11-12` that is not completed
*   **And** I am on the todo list
*   **When** I check **Finish todo** for that row
*   **Then** the API returns `200` with `completed` true and `assignmentCompleted` false
*   **And** Lab report stays not completed

#### Scenario: User finishes the only todo and the assignment stays open
*   **Given** `Lab report` is not completed and its only day todo is `2026-11-12`
*   **When** I set that todo completed
*   **Then** the todo is completed
*   **And** `Lab report` is not completed

#### Scenario: User clears a finished todo and the assignment stays open
*   **Given** `Lab report` is not completed
*   **And** its todo on `2026-11-12` is completed
*   **When** I uncheck **Finish todo**
*   **Then** that todo is not completed
*   **And** `Lab report` is not completed

#### Scenario: User clears a todo on a completed assignment
*   **Given** `Lab report` is completed
*   **And** its todo on `2026-11-12` is completed
*   **When** I set that todo to not completed
*   **Then** the todo is not completed
*   **And** `Lab report` stays completed

#### Scenario: User finishes a todo that does not exist
*   **Given** assignment id `1` has no day todo on `2026-11-12`
*   **When** I send `PUT /api/assignments/1/day-todos/completion` with `{ "date": "2026-11-12", "completed": true }`
*   **Then** the API returns `404` with `{ "message": "Todo on 2026-11-12 not found." }`

#### Scenario: User saves day todos and a kept date stays finished
*   **Given** `Lab report` has `2026-11-11` completed and `2026-11-12` not completed
*   **When** I replace its dates with `2026-11-12` and `2026-11-13`
*   **Then** `2026-11-11` is gone
*   **And** `2026-11-12` is not completed
*   **And** `2026-11-13` is not completed
*   **And** the assignment’s `completed` flag is unchanged

### US-5.2 — Mark an assignment completed

#### Scenario: User marks an assignment completed and its todos are completed
*   **Given** `Lab report` is not completed
*   **And** it has day todos on `2026-11-11` and `2026-11-13`, both not completed
*   **And** I am on the assignment list
*   **When** I check **Complete assignment** on Lab report
*   **Then** the API returns `200` with `completed` true
*   **And** both day todos are completed

#### Scenario: User marks an assignment completed when it has no todos
*   **Given** `Reading` is not completed and has no day todos
*   **When** I set `Reading` completed
*   **Then** `Reading` is completed
*   **And** it still has no day todos

#### Scenario: User clears assignment completion and its todos stay completed
*   **Given** `Lab report` is completed
*   **And** its day todos on `2026-11-11` and `2026-11-13` are completed
*   **When** I uncheck **Complete assignment**
*   **Then** `Lab report` is not completed
*   **And** both day todos stay completed

#### Scenario: User marks an assignment that does not exist
*   **Given** no assignment has id `99`
*   **When** I send `PUT /api/assignments/99/completion` with `{ "completed": true }`
*   **Then** the API returns `404` with `{ "message": "Assignment with id=99 not found." }`

#### Scenario: User sends a completion value that is not true or false
*   **Given** assignment id `1` exists
*   **When** I send `PUT /api/assignments/1/completion` with `{ "completed": "yes" }`
*   **Then** the API returns `400` with `{ "message": "Completed must be true or false." }`

### US-5.3 — Show unfinished items or everything

#### Scenario: User shows only unfinished assignments
*   **Given** `Lab report` is completed and `Essay` is not completed
*   **And** I am on the assignment list showing **All**
*   **When** I click **Unfinished**
*   **Then** I see Essay
*   **And** I do not see Lab report

#### Scenario: User shows all assignments including completed ones
*   **Given** `Lab report` is completed and `Essay` is not completed
*   **When** I open the assignment list
*   **Then** **All** is selected
*   **And** I see Essay and Lab report
*   **And** Lab report’s name is shown with a line through it

#### Scenario: User shows only unfinished todos
*   **Given** a todo on `2026-11-12` for `Lab report` is completed
*   **And** a todo on `2026-11-13` for `Essay` is not completed
*   **And** I am on the todo list
*   **When** I click **Unfinished**
*   **Then** I see the Essay todo
*   **And** I do not see the Lab report todo

#### Scenario: User shows all todos
*   **Given** a completed todo and a not-completed todo exist
*   **When** I open the todo list and **All** is selected
*   **Then** I see both todos
*   **And** the completed todo’s assignment name has a line through it

#### Scenario: User shows only unfinished assignments on the calendar
*   **Given** `Lab report` is completed and would otherwise be drawn from `2026-11-09` through `2026-11-13`
*   **And** `Essay` is not completed and is drawn on `2026-11-18`
*   **And** the calendar is showing November 2026
*   **When** I click **Unfinished**
*   **Then** Essay is drawn
*   **And** Lab report is not drawn

#### Scenario: User sees a finished todo star when showing all
*   **Given** `Lab report` is not completed and is drawn from `2026-11-09` through `2026-11-13`
*   **And** its todo on `2026-11-12` is completed
*   **And** its todo on `2026-11-11` is not completed
*   **And** the calendar is showing November 2026
*   **When** the calendar finishes loading on **All**
*   **Then** `2026-11-12` has a star with `aria-label` **Todo completed**
*   **And** `2026-11-11` has a star with `aria-label` **Todo**

#### Scenario: User hides a finished todo star on the unfinished calendar
*   **Given** `Lab report` is not completed and is drawn from `2026-11-09` through `2026-11-13`
*   **And** its todo on `2026-11-12` is completed and its todo on `2026-11-11` is not completed
*   **And** the calendar is showing November 2026 on **All**
*   **When** I click **Unfinished**
*   **Then** the Lab report stripe is still drawn
*   **And** `2026-11-12` has no star
*   **And** `2026-11-11` still has a star

### US-5.4 — Finish work from a calendar day

#### Scenario: User finishes a todo from the day dialog
*   **Given** `Lab report` is not completed and has a not-completed todo on `2026-11-12`
*   **And** the calendar is showing November 2026
*   **When** I click the day cell for `2026-11-12`
*   **And** I check **Finish todo**
*   **Then** the dialog stays open
*   **And** that todo is completed
*   **And** `Lab report` is not completed

#### Scenario: User marks the assignment completed from the day dialog
*   **Given** `Lab report` has not-completed todos on `2026-11-12` and `2026-11-14`
*   **And** the day dialog for `2026-11-12` is open
*   **When** I check **Complete assignment**
*   **Then** `Lab report` is completed
*   **And** the todos on `2026-11-12` and `2026-11-14` are completed
*   **And** **Finish todo** on the November 12 row is checked

#### Scenario: User opens a day that has no todos
*   **Given** no day todo falls on `2026-11-02`
*   **And** the calendar is showing November 2026
*   **When** I click the day cell for `2026-11-02`
*   **Then** I see "No todos on this day."

## Test Coverage Map

Each scenario above must map to at least one automated test. `it` names match the scenario titles. When a scenario checks both the API and the page, use that title in each mapped file.

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-5.1 | User finishes a todo from the todo list | `backend/tests/completion.test.js` | `User finishes a todo from the todo list` |
| US-5.1 | User finishes a todo from the todo list | `frontend/tests/Completion.test.js` | `User finishes a todo from the todo list` |
| US-5.1 | User finishes the only todo and the assignment stays open | `backend/tests/completion.test.js` | `User finishes the only todo and the assignment stays open` |
| US-5.1 | User clears a finished todo and the assignment stays open | `backend/tests/completion.test.js` | `User clears a finished todo and the assignment stays open` |
| US-5.1 | User clears a todo on a completed assignment | `backend/tests/completion.test.js` | `User clears a todo on a completed assignment` |
| US-5.1 | User finishes a todo that does not exist | `backend/tests/completion.test.js` | `User finishes a todo that does not exist` |
| US-5.1 | User saves day todos and a kept date stays finished | `backend/tests/completion.test.js` | `User saves day todos and a kept date stays finished` |
| US-5.2 | User marks an assignment completed and its todos are completed | `backend/tests/completion.test.js` | `User marks an assignment completed and its todos are completed` |
| US-5.2 | User marks an assignment completed and its todos are completed | `frontend/tests/Completion.test.js` | `User marks an assignment completed and its todos are completed` |
| US-5.2 | User marks an assignment completed when it has no todos | `backend/tests/completion.test.js` | `User marks an assignment completed when it has no todos` |
| US-5.2 | User clears assignment completion and its todos stay completed | `backend/tests/completion.test.js` | `User clears assignment completion and its todos stay completed` |
| US-5.2 | User marks an assignment that does not exist | `backend/tests/completion.test.js` | `User marks an assignment that does not exist` |
| US-5.2 | User sends a completion value that is not true or false | `backend/tests/completion.test.js` | `User sends a completion value that is not true or false` |
| US-5.3 | User shows only unfinished assignments | `frontend/tests/Completion.test.js` | `User shows only unfinished assignments` |
| US-5.3 | User shows all assignments including completed ones | `frontend/tests/Completion.test.js` | `User shows all assignments including completed ones` |
| US-5.3 | User shows only unfinished todos | `frontend/tests/Completion.test.js` | `User shows only unfinished todos` |
| US-5.3 | User shows all todos | `frontend/tests/Completion.test.js` | `User shows all todos` |
| US-5.3 | User shows only unfinished assignments on the calendar | `frontend/tests/Completion.test.js` | `User shows only unfinished assignments on the calendar` |
| US-5.3 | User sees a finished todo star when showing all | `frontend/tests/Completion.test.js` | `User sees a finished todo star when showing all` |
| US-5.3 | User hides a finished todo star on the unfinished calendar | `frontend/tests/Completion.test.js` | `User hides a finished todo star on the unfinished calendar` |
| US-5.4 | User finishes a todo from the day dialog | `frontend/tests/Completion.test.js` | `User finishes a todo from the day dialog` |
| US-5.4 | User marks the assignment completed from the day dialog | `frontend/tests/Completion.test.js` | `User marks the assignment completed from the day dialog` |
| US-5.4 | User opens a day that has no todos | `frontend/tests/Completion.test.js` | `User opens a day that has no todos` |

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 5 from @features/feature-5-completion-and-filter.md on branch `feature/5-completion-and-filter`.

Follow layer order in @features/framework.md (models → routes → backend tests → frontend → frontend tests).
Map every Gherkin scenario in the Test Coverage Map; run `npm test` before finishing.
If API routes, payloads, schema, or product rules changed per this spec, update @features/reference/api.md, @features/reference/data-model.md, and/or @features/reference/behavior.md in the same PR to match shipped code.
Update Feature 4 tests that still expect dayTodos to be an array of date strings so they expect { date, completed } objects.
Complete Definition of Done and the merge checklist in @features/framework.md.
Do not implement behavior not in this spec. Do not add sign-in, sessions, or userId.
```

**Reference updates for this feature:** `features/reference/api.md`, `features/reference/data-model.md`, `features/reference/behavior.md`.

## Definition of Done

*   [ ] Backend and frontend implemented per this spec (**FR-001** through **FR-010** satisfied)
*   [ ] **Success Criteria (SC-001** through **SC-004)** met
*   [ ] All mapped tests pass (`npm test`)
*   [ ] Test Coverage Map complete
*   [ ] `features/reference/data-model.md` updated
*   [ ] `features/reference/api.md` updated
*   [ ] `features/reference/behavior.md` updated

## Out of Scope

*   Sign-in and per-user completion
*   Completing a todo automatically completing its assignment
*   Clearing an assignment automatically clearing its day todos
*   Remembering the Unfinished/All choice after a reload
*   A separate title or notes field on a day todo
*   Dragging stripes or changing due dates from the calendar
