# Feature: Assignment Day Todos

**Feature ID:** 4
**Branch pattern:** `feature/4-assignment-day-todos`
**Status:** Ready
**Created:** 2026-11-11
**Input:** From the assignment list, a calendar icon opens a date calendar. The days the student selects become todos for that assignment and show on the todos list. The student can also add a todo from the todos list that is not connected to an assignment. A star shows on an assignment stripe when that day is one of its todos. The student can mark a todo completed without completing its assignment, and can mark an assignment completed, which also completes every todo on that assignment. There is no sign-in.
**Depends on:** [Feature 3 — Assignment Calendar](./feature-3-assignment-calendar.md)
**Related:** [features/reference/api.md](./reference/api.md)

## User Stories

### US-4.1: Choose days for an assignment’s todos
**As a** student
**I want to** open a date calendar from an assignment and select the days I will do it
**So that** those days become todos for that assignment

**Priority:** P1
**Independent test:** Click the calendar icon on an assignment, select two days, save, and see both dates stored for that assignment
**Acceptance scenarios:** see ### US-4.1 under Acceptance Criteria

### US-4.2: See todos in the todos list
**As a** student
**I want** the days I selected to show on the todos list, with a star on the assignment’s stripe
**So that** I can see the work I planned, separate from the days the assignment merely spans

**Priority:** P1
**Independent test:** Save a todo on a day inside the stripe and see that date on the Todos tab and a star on that day’s stripe
**Acceptance scenarios:** see ### US-4.2 under Acceptance Criteria

### US-4.3: Change the selected days
**As a** student
**I want to** add or remove days and save again
**So that** the assignment’s todos match the days I actually intend to work

**Priority:** P1
**Independent test:** Open the calendar icon for an assignment that already has days, unselect one, save, and see only the remaining dates
**Acceptance scenarios:** see ### US-4.3 under Acceptance Criteria

### US-4.4: Add a todo that is not an assignment
**As a** student
**I want to** add a todo from the todos list that is not connected to an assignment
**So that** I can track a task that is not coursework

**Priority:** P1
**Independent test:** On the Todos tab, add a named todo on a date and see that row with no assignment
**Acceptance scenarios:** see ### US-4.4 under Acceptance Criteria

### US-4.5: Remove an assignment’s todos when the assignment is deleted
**As a** student
**I want** an assignment’s todos to disappear when I delete the assignment
**So that** I do not keep work days for coursework that is gone

**Priority:** P1
**Independent test:** Delete an assignment that has todos and confirm those todos are gone while a todo with no assignment remains
**Acceptance scenarios:** see ### US-4.5 under Acceptance Criteria

### US-4.6: Complete a todo
**As a** student
**I want to** cross off a todo
**So that** I can record that I did that day’s work without closing the assignment

**Priority:** P1
**Independent test:** Check a todo on the todos list and see that todo completed while its assignment stays not completed
**Acceptance scenarios:** see ### US-4.6 under Acceptance Criteria

### US-4.7: Complete an assignment
**As a** student
**I want to** mark an assignment completed and have its todos completed too
**So that** finishing the coursework clears every planned day at once

**Priority:** P1
**Independent test:** Check an assignment that has two todos and see the assignment and both todos completed
**Acceptance scenarios:** see ### US-4.7 under Acceptance Criteria

## Requirements

### Functional Requirements

- **FR-001**: A todo is one calendar date. It MAY belong to one assignment. It MUST NOT have its own name when it belongs to an assignment. A todo with no assignment MUST have a name. Many todos MAY belong to the same assignment. The pair (`assignmentId`, `todoDate`) MUST be unique when `assignmentId` is set.
- **FR-002**: Each assignment row MUST have a calendar icon (`aria-label` **Create todo**) with no button background. The icon MUST open a month calendar for that assignment. Days that already have a todo for that assignment MUST start selected. The student MUST be able to select one or more days and move between months without losing the current selection. **Save** MUST replace that assignment’s todos with exactly the selected dates. **Cancel** MUST close without saving. The calendar stripe MUST NOT have this control.
- **FR-003**: `PUT /api/assignments/:id/day-todos` with `{ "dates": ["YYYY-MM-DD", ...] }` MUST replace that assignment’s todos. The response MUST be `200` with `{ "dates": [...] }` sorted ascending. Duplicate dates in the request MUST be stored once. An empty array MUST remove every todo for that assignment. This request MUST NOT change todos that have no assignment. A date that stays in the set MUST keep its `completed` value. A newly added date MUST be `completed: false`. Replacing dates MUST NOT change the assignment’s `completed` flag or `dueDate`. When the assignment has a due date and the earliest saved todo is before the range, `startWorkingBy` MUST become that earliest date. The range starts at `startWorkingBy` when that date is set and on or before `dueDate`; otherwise it starts at `dueDate`. An assignment with no due date keeps its `startWorkingBy`.
- **FR-004**: An assignment MUST have `completed` (boolean, default `false`). `GET /api/assignments`, `POST /api/assignments`, and `PUT /api/assignments/:id` responses MUST include `completed` and `dayTodos`. `dayTodos` is an array of `{ "date": "YYYY-MM-DD", "completed": true|false }` sorted by `date` ascending, for that assignment only. Assignments with none MUST include `dayTodos: []`. A new assignment MUST start `completed: false`.
- **FR-005**: `GET /api/day-todos` MUST return every todo. Each item has `id`, `date` (`YYYY-MM-DD`), `name`, `assignmentId`, `class`, and `completed`. For an assignment todo, `name` is the assignment name, `assignmentId` is that assignment’s id, and `class` is `{ "id", "name", "color" }`. For a todo with no assignment, `assignmentId` and `class` are `null` and `name` is the todo’s own name. Sort by `date` ascending, then `name` case-insensitively. A new todo MUST start `completed: false`.
- **FR-006**: `POST /api/day-todos` with `{ "name", "date" }` MUST create one todo with no assignment and return `201` with the **FR-005** item. `PUT /api/day-todos/:id` with `{ "name", "date" }` MUST update that todo and return `200` with the item. `DELETE /api/day-todos/:id` MUST delete it and return `200` with `{ "message": "Todo deleted." }`. These three routes MUST refuse a todo that belongs to an assignment with `400` and `{ "message": "Change this todo from the assignment." }` on update or delete.
- **FR-007**: These routes MUST NOT require `Authorization` and MUST NOT return `401`. There is no `userId` on a todo.
- **FR-008**: For the assignment replace route, a missing `dates` value, or a `dates` value that is not an array, MUST return `400` with `{ "message": "Dates are required." }`. A value that is not a real `YYYY-MM-DD` date MUST return `400` with `{ "message": "Enter a valid date." }`. An unknown assignment MUST return `404` with `{ "message": "Assignment with id=<id> not found." }`. A non-integer assignment id MUST return `400` with `{ "message": "Assignment id must be a number." }`.
- **FR-009**: For a todo with no assignment, name is trimmed, required, and at most 200 characters. Empty MUST return `400` with `{ "message": "Name is required." }`. Longer than 200 MUST return `400` with `{ "message": "Name must be 200 characters or fewer." }`. A missing or invalid `date` MUST return `400` with `{ "message": "Date is required." }` or `{ "message": "Enter a valid date." }`. An unknown todo id MUST return `404` with `{ "message": "Todo with id=<id> not found." }`. A non-integer todo id MUST return `400` with `{ "message": "Todo id must be a number." }`.
- **FR-010**: The sidebar MUST link **Todos** after **Assignments** and before **Classes**. **Todos** opens `/` with the **Todos** tab selected. That tab MUST list every todo from `GET /api/day-todos`. It MUST NOT list the days an assignment’s stripe merely passes through. Columns are **Done**, **Todo**, and **Class**. The date is a heading listed once before the todos on that day. An assignment todo shows the assignment name and the class swatch plus class name. A todo with no assignment shows its own name and a blank class. The tab shows "No todos yet." when the list is empty. **Done** is specified in **FR-016**.
- **FR-011**: On the calendar, a stripe day that has a todo for that assignment MUST show a star on that stripe. A stripe day with no todo MUST NOT show a star. A todo on a date that has no stripe MUST stay stored, MUST appear on the todos list, MUST appear selected in that assignment’s picker, and MUST show on that calendar day as its own mark with the todo name and a star. A todo with no assignment shows the same kind of mark on its date. Star labels are in **FR-016**.
- **FR-012**: Deleting an assignment MUST delete its todos. The database MUST use `ON DELETE CASCADE` from `assignments` to `day_todos`. Todos with no assignment MUST remain.
- **FR-013**: The student MAY select any calendar day for an assignment, including days outside the stripe and days for an assignment that is not drawn on the calendar.
- **FR-014**: `PUT /api/day-todos/:id/completion` with `{ "completed": true|false }` MUST set only that todo’s `completed` flag. It MUST NOT change any assignment’s `completed` flag, including when the todo is the assignment’s last open todo. The response MUST be `200` with the **FR-005** item and `assignmentCompleted`. `assignmentCompleted` is the assignment’s `completed` value when the todo has an assignment, and `null` when it does not. A value other than boolean MUST return `400` with `{ "message": "Completed must be true or false." }`. An unknown todo MUST return `404` with `{ "message": "Todo with id=<id> not found." }`. A non-integer id MUST return `400` with `{ "message": "Todo id must be a number." }`.
- **FR-015**: `PUT /api/assignments/:id/completion` with `{ "completed": true }` MUST set that assignment’s `completed` to true and MUST set `completed` true on every one of its todos. `{ "completed": false }` MUST set only the assignment’s `completed` to false and MUST leave each of its todos as they were. Todos with no assignment MUST stay unchanged. The response MUST be `200` with the assignment, including `completed` and `dayTodos`. A value other than boolean MUST return `400` with `{ "message": "Completed must be true or false." }`. An unknown assignment MUST return `404` with `{ "message": "Assignment with id=<id> not found." }`. A non-integer id MUST return `400` with `{ "message": "Assignment id must be a number." }`.
- **FR-016**: The todos list MUST include checkbox **Finish todo** on each row. The assignment list MUST include checkbox **Complete assignment** on each row. Checking or unchecking either box MUST save immediately. A completed todo’s name and a completed assignment’s name MUST render with a line through the name, and the checkbox MUST be checked. A completed todo’s star uses `aria-label` **Todo completed**. A not-completed todo’s star uses `aria-label` **Todo**. Completed items stay visible. Hiding them is Feature 5.

## Assumptions

- Features 1–3 are on `dev`: classes, the assignment table, and calendar stripes. The calendar page already has a **Todos** tab.
- There is no sign-in. Any caller may replace assignment todos and create todos with no assignment.
- The assignment picker is a month grid in a dialog, built with Vuetify, same Sunday-first layout as Feature 3. It does not add a calendar library.
- **Save** on that dialog sends every selected date, including dates in months that are not currently visible.
- Each selected date becomes one todo. Selecting two days creates two todos for that assignment.
- A todo on a stripe day is a star on that stripe. A todo on a day with no stripe is drawn on that calendar day.
- A todo with no assignment is one name and one date. Adding another day is another todo.

## Edge Cases

- One selected day → one todo for that assignment
- Several days, including days in different months → one todo per distinct date
- Duplicate dates in one replace request → a single stored date
- Empty `dates` array → no todos remain for that assignment
- Cancel → previous todos unchanged and no `PUT`
- Invalid date or non-array `dates` → `400` as in **FR-008**
- Unknown assignment or non-integer id → `404` or `400` as in **FR-008**
- Todo on a day the stripe does not cover → stored, listed, and shown on that calendar day
- Todo on a day the stripe does cover → listed, and a star on that day’s stripe
- Delete assignment → its todos are gone; a todo with no assignment stays
- Two assignments on the same day → the star is only on the assignment that has the todo
- Blank standalone name, or a name over 200 characters → `400` as in **FR-009**
- Update or delete of an assignment’s todo through `/api/day-todos/:id` → `400`
- Finish one todo on an assignment that has another open todo → only that todo is completed; the assignment stays not completed
- Finish the only todo → the assignment stays not completed
- Clear a todo → only that todo is not completed
- Mark an assignment completed → every todo on it is completed
- Mark an assignment completed when it has no todos → the assignment is completed
- Clear assignment completion → its todos stay as they were
- Replace the date set → kept dates keep `completed`; new dates start not completed; the assignment’s `completed` flag is unchanged
- `completed` is not a boolean → `400`

## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test before merge
- **SC-002**: From the calendar icon, a student can save several days for one assignment and see them on the todos list
- **SC-003**: A star appears on a stripe day if and only if that assignment has a todo on that date
- **SC-004**: A student can add a todo from the todos list that has no assignment
- **SC-005**: Deleting an assignment leaves no todos for that assignment id and leaves todos with no assignment in place
- **SC-006**: Checking a todo never changes `assignment.completed`
- **SC-007**: Checking an assignment sets `completed` true on the assignment and on all of its todos. Unchecking the assignment leaves those todos as they were

## Data Ownership & Isolation

Single-user, same as Features 1–3. A todo belongs to an assignment or to no assignment. It does not belong to an account.

| Rule | Requirement |
|------|-------------|
| **Read scope** | Assignment todos come back on `GET /api/assignments`. Every todo comes back on `GET /api/day-todos` |
| **Write scope** | `PUT /api/assignments/:id/day-todos` replaces todos for that assignment id only. `POST`, `PUT`, and `DELETE` on `/api/day-todos` apply only to todos with no assignment. Completion updates one todo, or one assignment and that assignment’s todos |
| **Create scope** | The replace request is the whole set for an assignment. `POST /api/day-todos` creates one todo with no assignment |
| **Delete scope** | Removing a date from the assignment set deletes that todo. Deleting the assignment deletes its todos. `DELETE /api/day-todos/:id` deletes one todo that has no assignment |
| **Cross-user access** | Not applicable. Do not add `userId` |
| **UI scope** | The picker, the todos list, and stars show only the dates returned by the API |
| **Auth** | No `authenticate` middleware |

## Key Entities

- **Assignment**: from Feature 2. It now has many todos and a `completed` flag. Completing it completes its todos. Clearing it does not reopen those todos. Those todos use the assignment’s name.
- **Day todo**: a calendar date with its own `completed` flag. When it has an assignment, it has no title of its own. When it has no assignment, its name is the title. Completing or clearing a todo does not change the assignment. The star on the calendar is the visible mark for an assignment todo that falls on that assignment’s stripe.

## API Requirements

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `PUT` | `/api/assignments/:id/day-todos` | No | Replace one assignment’s todos |
| `GET` | `/api/day-todos` | No | List every todo for the Todos tab |
| `POST` | `/api/day-todos` | No | Create a todo with no assignment |
| `PUT` | `/api/day-todos/:id` | No | Update a todo that has no assignment |
| `DELETE` | `/api/day-todos/:id` | No | Delete a todo that has no assignment |
| `PUT` | `/api/day-todos/:id/completion` | No | Set one todo completed or not. Does not change the assignment |
| `PUT` | `/api/assignments/:id/completion` | No | Set the assignment completed flag. `true` also completes its todos |
| `GET` | `/api/assignments` | No | List, plus `completed` and `dayTodos` on each assignment |
| `POST` | `/api/assignments` | No | Unchanged create; response includes `dayTodos` (empty for a new row) |
| `PUT` | `/api/assignments/:id` | No | Unchanged assignment update; response includes current `dayTodos` |
| `DELETE` | `/api/assignments/:id` | No | Feature 2 delete; also removes that assignment’s todos (**FR-012**) |

**Replace request body:**

```json
{ "dates": ["2026-11-10", "2026-11-12"] }
```

**Replace success** (`200`):

```json
{ "dates": ["2026-11-10", "2026-11-12"] }
```

`dates` in the response is sorted ascending and contains each date once.

**Assignment objects** add `completed` and `dayTodos`:

```json
"completed": false,
"dayTodos": [
  { "date": "2026-11-10", "completed": false },
  { "date": "2026-11-12", "completed": true }
]
```

**Todo with an assignment:**

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

**Todo with no assignment:**

```json
{
  "id": 2,
  "date": "2026-11-15",
  "name": "Buy a notebook",
  "assignmentId": null,
  "class": null,
  "completed": false
}
```

**Create body:** `{ "name": "Buy a notebook", "date": "2026-11-15" }`

**Complete a todo:** `{ "completed": true }`

**Todo completion success** (`200`): the **FR-005** item, plus `assignmentCompleted`. Example for an open assignment: `"completed": true, "assignmentCompleted": false`.

**Complete an assignment:** `{ "completed": true }`

**Assignment completion success** (`200`): the assignment, including `completed` and `dayTodos`. When the request is `true`, every `dayTodos[].completed` is `true`.

**Error response:** `{ "message": "Human-readable explanation." }`

| Condition | Status | `message` |
|-----------|--------|-----------|
| `dates` missing or not an array | `400` | `Dates are required.` |
| Any entry is not a real `YYYY-MM-DD` date | `400` | `Enter a valid date.` |
| Assignment `:id` is not an integer | `400` | `Assignment id must be a number.` |
| No assignment with that id | `404` | `Assignment with id=<id> not found.` |
| Standalone name missing or blank | `400` | `Name is required.` |
| Standalone name longer than 200 characters | `400` | `Name must be 200 characters or fewer.` |
| Standalone `date` missing | `400` | `Date is required.` |
| Standalone `date` is not a real date | `400` | `Enter a valid date.` |
| Todo `:id` is not an integer | `400` | `Todo id must be a number.` |
| No todo with that id | `404` | `Todo with id=<id> not found.` |
| Update or delete targets an assignment’s todo | `400` | `Change this todo from the assignment.` |
| `completed` is missing or not a boolean | `400` | `Completed must be true or false.` |

`dates: []` is valid and clears that assignment’s todos. Flat JSON only.

## Screen Requirements

### App chrome

*   Sidebar links, in order: **Calendar** (`/`), **Assignments** (`/assignments`), **Todos** (opens `/` with the **Todos** tab selected), **Classes** (`/classes`).

### [View: Assignments] — route name `assignments`

*   Each row has a calendar icon (`aria-label` **Create todo**) in addition to Feature 2’s edit and delete icons. The icon has no button background.
*   The icon opens the day-todo dialog for that assignment.
*   Each row has checkbox **Complete assignment**. Checking it saves immediately and completes every todo on that assignment. Unchecking it saves immediately and leaves those todos unchanged.
*   A completed assignment’s name uses line-through. The checkbox is checked.

### [View: Calendar] — route name `calendar`

*   The **Todos** tab lists todos. It does not list stripe days that are not todos.
*   The date is a heading listed once before the todos on that day. Columns: **Done**, **Todo**, **Class**.
*   **Done** is checkbox `aria-label` **Finish todo**. It saves immediately and does not change the assignment’s completed flag. A completed todo’s name uses line-through.
*   **Add todo** opens the dialog for a todo with no assignment.
*   An assignment todo’s row has no edit or delete action. Change those days from the assignment’s calendar icon.
*   A todo with no assignment has icon **Edit todo** and icon **Delete todo**, with no button background.
*   **Empty state:** "No todos yet."
*   On a stripe segment whose date is in that assignment’s `dayTodos`, show a star, left-aligned in that day. `aria-label` is **Todo** when that todo is not completed and **Todo completed** when it is. Other stripe segments for that assignment have no star.
*   A todo on a day with no stripe is drawn on that calendar day, with the same star and the todo name. A todo with no assignment is drawn the same way.
*   **Due** is right-aligned on the due-date segment.
*   When the assignment is completed, the name on the first day of its stripe uses line-through.
*   Feature 3 `data-assignment-id`, `data-date`, and `data-color` stay on the stripe.
*   The stripe has no create-todo control.

### Day-todo dialog

*   Title: **Create todo**
*   Text: "Select every day to do this assignment."
*   Month grid for one month at a time, Sunday through Saturday, with **Previous month** and **Next month** (`aria-label` values **Previous month** and **Next month**).
*   A day button is selected or not. Selected days use `aria-pressed="true"`. Clicking a day toggles it. Changing months keeps the selection.
*   The grid marks the assignment’s due date with **Due**, its start-working-by date with **Start**, and the current date with **Today**, when that date is set and visible.
*   Days already stored for this assignment start selected, including days outside the visible month.
*   Actions, outside `v-card-title`: **Save** and **Cancel**.
*   **Save** sends `PUT /api/assignments/:id/day-todos` with every selected date, then closes and refreshes assignments and the todos list so the list and stars match.
*   **Cancel** closes and does not call the API.
*   **Error:** `<v-alert type="error">` with the API `message`. The dialog stays open.
*   Build the grid with Vuetify. No new calendar library. No raw hex in the component.

### Todo dialog (no assignment)

*   Title **Add todo** or **Edit todo**.
*   Fields: **Name** and **Date**. **Date** is chosen on a month calendar in the dialog.
*   Actions, outside `v-card-title`: **Save** and **Cancel**.
*   **Save** sends `POST /api/day-todos` or `PUT /api/day-todos/:id`, then closes and refreshes the list.
*   **Cancel** closes and does not call the API.
*   **Delete todo** asks **Delete this todo?** Actions: **Delete** and **Cancel**.
*   **Error:** `<v-alert type="error">` with the API `message`.

## Data Model Requirements

Feature 2 `assignments` gains one column. New table:

### `assignments` (changed)

| Field | Type | Rules |
|-------|------|-------|
| `completed` | BOOLEAN | Required; default `false` |

### `day_todos` table

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `assignmentId` | INTEGER FK | Optional; references `assignments.id`; `ON DELETE CASCADE`; null when the todo has no assignment |
| `name` | STRING | Required only when `assignmentId` is null; trimmed; max 200; null when the todo belongs to an assignment |
| `todoDate` | DATEONLY | Required; `YYYY-MM-DD` |
| `completed` | BOOLEAN | Required; default `false` |
| `createdAt` | DATE | Sequelize timestamp |
| `updatedAt` | DATE | Sequelize timestamp |

Unique (`assignmentId`, `todoDate`) for rows that have an assignment. No `userId`.

### Associations

*   **Assignment hasMany DayTodo**
*   **DayTodo belongsTo Assignment** (optional)
*   Deleting an assignment deletes its day todos

`GET /api/assignments` includes that assignment’s `dayTodos` as `{ "date", "completed" }` objects, sorted by date.

## Acceptance Criteria

### US-4.1 — Choose days for an assignment’s todos

#### Scenario: User saves one day as a todo
*   **Given** assignment `Lab report` has id `1` and no todos
*   **And** I am on the assignment table
*   **When** I click **Create todo** on Lab report
*   **And** I select `2026-11-12`
*   **And** I click **Save**
*   **Then** the API returns `200` with `{ "dates": ["2026-11-12"] }`
*   **And** Lab report’s `dayTodos` is `[{ "date": "2026-11-12", "completed": false }]`

#### Scenario: User saves several days as todos for the same assignment
*   **Given** assignment `Lab report` has id `1`
*   **When** I send `PUT /api/assignments/1/day-todos` with `{ "dates": ["2026-11-12", "2026-11-10", "2026-12-01"] }`
*   **Then** the API returns `200` with `{ "dates": ["2026-11-10", "2026-11-12", "2026-12-01"] }`
*   **And** `GET /api/assignments` includes those three dates on Lab report, sorted ascending

#### Scenario: User moves start working by to the earliest todo outside the range
*   **Given** `Lab report` is due `2026-11-16` and starts `2026-11-14`
*   **When** I replace its todos with `2026-11-12` and `2026-11-15`
*   **Then** `startWorkingBy` is `2026-11-12`
*   **And** `dueDate` is still `2026-11-16`

#### Scenario: User selects days in two months and saves both
*   **Given** the day-todo dialog is open for `Lab report`
*   **When** I select `2026-11-12`
*   **And** I go to the next month and select `2026-12-01`
*   **And** I click **Save**
*   **Then** the request body dates include both `2026-11-12` and `2026-12-01`

#### Scenario: User cancels without changing todos
*   **Given** `Lab report` has a todo on `2026-11-12`
*   **And** the day-todo dialog is open
*   **When** I select another day
*   **And** I click **Cancel**
*   **Then** the API is not called
*   **And** Lab report’s todos are still only `2026-11-12`

#### Scenario: User saves todos for an assignment that does not exist
*   **Given** no assignment has id `99`
*   **When** I send `PUT /api/assignments/99/day-todos` with `{ "dates": ["2026-11-12"] }`
*   **Then** the API returns `404` with `{ "message": "Assignment with id=99 not found." }`

#### Scenario: User sends a date that is not a calendar date
*   **Given** assignment id `1` exists
*   **When** I send `PUT /api/assignments/1/day-todos` with `{ "dates": ["2026-11-31"] }`
*   **Then** the API returns `400` with `{ "message": "Enter a valid date." }`
*   **And** the assignment’s todos are unchanged

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

### US-4.2 — See todos in the todos list

#### Scenario: User sees an assignment todo on the todos list
*   **Given** `Lab report` has a todo on `2026-11-12`
*   **And** the class is `Biology` with color `green`
*   **When** I open the **Todos** tab
*   **Then** I see a row for `2026-11-12` named Lab report
*   **And** that row shows Biology
*   **And** the days between Lab report’s start and due date are not listed unless they are todos

#### Scenario: User opens todos from the sidebar
*   **Given** I am on the assignment table
*   **When** I click **Todos**
*   **Then** I am on `/`
*   **And** the **Todos** tab is selected

#### Scenario: User sees a star on the stripe for a day with a todo
*   **Given** `Lab report` is drawn from `2026-11-09` through `2026-11-13`
*   **And** Lab report has a todo on `2026-11-12`
*   **And** the calendar is showing November 2026
*   **When** the calendar finishes loading
*   **Then** the Lab report stripe on `2026-11-12` shows a star with `aria-label` **Todo**
*   **And** the Lab report stripe on `2026-11-11` does not show that star

#### Scenario: User keeps a todo on a day that has no stripe
*   **Given** `Reading` has no due date, so it has no stripe
*   **And** Reading has a todo on `2026-11-04`
*   **And** the calendar is showing November 2026
*   **When** the calendar finishes loading
*   **Then** `2026-11-04` shows Reading on the calendar
*   **And** no assignment stripe is drawn
*   **And** the **Todos** tab lists `2026-11-04` for Reading
*   **And** opening **Create todo** for Reading shows `2026-11-04` selected

#### Scenario: User sees a star only on the assignment that has the todo
*   **Given** `Lab report` and `Quiz` are both drawn on `2026-11-13`
*   **And** only Lab report has a todo on `2026-11-13`
*   **And** the calendar is showing November 2026
*   **When** the calendar finishes loading
*   **Then** the Lab report stripe on `2026-11-13` shows a star
*   **And** the Quiz stripe on `2026-11-13` does not show a star

### US-4.3 — Change the selected days

#### Scenario: User unselects a day and saving removes that todo
*   **Given** `Lab report` is drawn from `2026-11-09` through `2026-11-13`
*   **And** `Lab report` has todos on `2026-11-11` and `2026-11-12`
*   **And** the day-todo dialog is open with both days selected
*   **When** I unselect `2026-11-12`
*   **And** I click **Save**
*   **Then** the API returns `200` with `{ "dates": ["2026-11-11"] }`
*   **And** the todos list no longer shows `2026-11-12` for Lab report
*   **And** the star remains on `2026-11-11` and is gone from `2026-11-12`

#### Scenario: User adds a day to an existing set
*   **Given** `Lab report` has a todo on `2026-11-11`
*   **When** I save the set `2026-11-11` and `2026-11-13`
*   **Then** Lab report’s `dayTodos` are `[{ "date": "2026-11-11", "completed": false }, { "date": "2026-11-13", "completed": false }]`

#### Scenario: User saves an empty set and all day todos are removed
*   **Given** assignment id `1` has todos
*   **When** I send `PUT /api/assignments/1/day-todos` with `{ "dates": [] }`
*   **Then** the API returns `200` with `{ "dates": [] }`
*   **And** that assignment’s `dayTodos` is `[]`

### US-4.4 — Add a todo that is not an assignment

#### Scenario: User adds a todo that is not connected to an assignment
*   **Given** I am on the **Todos** tab
*   **When** I click **Add todo**
*   **And** I enter name `Buy a notebook` and date `2026-11-15`
*   **And** I click **Save**
*   **Then** the API returns `201`
*   **And** the list shows `2026-11-15` and Buy a notebook
*   **And** that row has no class

#### Scenario: User edits a todo that is not connected to an assignment
*   **Given** a todo named `Buy a notebook` on `2026-11-15` has no assignment
*   **When** I change the name to `Buy pencils` and save
*   **Then** the list shows Buy pencils on `2026-11-15`

#### Scenario: User deletes a todo that is not connected to an assignment
*   **Given** a todo named `Buy a notebook` has no assignment
*   **When** I delete that todo and confirm **Delete this todo?**
*   **Then** the API returns `200` with `{ "message": "Todo deleted." }`
*   **And** the list no longer shows Buy a notebook

#### Scenario: User adds a todo with no name
*   **When** I send `POST /api/day-todos` with `{ "name": "  ", "date": "2026-11-15" }`
*   **Then** the API returns `400` with `{ "message": "Name is required." }`

#### Scenario: User adds a todo with no date
*   **When** I send `POST /api/day-todos` with `{ "name": "Buy a notebook" }`
*   **Then** the API returns `400` with `{ "message": "Date is required." }`

#### Scenario: User updates an assignment todo through the standalone route
*   **Given** todo id `1` belongs to an assignment
*   **When** I send `PUT /api/day-todos/1` with `{ "name": "Other", "date": "2026-11-15" }`
*   **Then** the API returns `400` with `{ "message": "Change this todo from the assignment." }`
*   **And** that todo is unchanged

### US-4.5 — Remove an assignment’s todos when the assignment is deleted

#### Scenario: User deletes an assignment and its day todos are gone
*   **Given** assignment `Lab report` has id `1` and todos on `2026-11-10` and `2026-11-12`
*   **And** a todo named `Buy a notebook` has no assignment
*   **When** I delete Lab report
*   **Then** the API returns `200` with `{ "message": "Assignment deleted." }`
*   **And** `GET /api/assignments` does not include Lab report
*   **And** no todos remain stored for assignment id `1`
*   **And** Buy a notebook is still listed

#### Scenario: User replaces day todos on a new assignment only
*   **Given** assignment id `1` was deleted with its todos
*   **And** a new assignment id `2` exists
*   **When** I send `PUT /api/assignments/2/day-todos` with `{ "dates": ["2026-11-15"] }`
*   **Then** the API returns `200` with `{ "dates": ["2026-11-15"] }`
*   **And** those dates are stored for assignment id `2` only

### US-4.6 — Complete a todo

#### Scenario: User finishes a todo from the todos list
*   **Given** assignment `Lab report` is not completed
*   **And** Lab report has a todo on `2026-11-12` that is not completed
*   **And** I am on the **Todos** tab
*   **When** I check **Finish todo** for that row
*   **Then** that todo is completed
*   **And** its name has a line through it
*   **And** Lab report stays not completed

#### Scenario: User finishes the only todo and the assignment stays open
*   **Given** `Lab report` is not completed and its only todo is `2026-11-12`
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

#### Scenario: User finishes a todo that has no assignment
*   **Given** a todo named `Buy a notebook` has no assignment and is not completed
*   **When** I check **Finish todo** for that row
*   **Then** the API returns `200` with `completed` true and `assignmentCompleted` null
*   **And** Buy a notebook’s name has a line through it

#### Scenario: User finishes a todo that does not exist
*   **Given** no todo has id `99`
*   **When** I send `PUT /api/day-todos/99/completion` with `{ "completed": true }`
*   **Then** the API returns `404` with `{ "message": "Todo with id=99 not found." }`

#### Scenario: User sends a completion value that is not true or false
*   **Given** todo id `1` exists
*   **When** I send `PUT /api/day-todos/1/completion` with `{ "completed": "yes" }`
*   **Then** the API returns `400` with `{ "message": "Completed must be true or false." }`

#### Scenario: User saves day todos and a kept date stays finished
*   **Given** `Lab report` has `2026-11-11` completed and `2026-11-12` not completed
*   **When** I replace its dates with `2026-11-12` and `2026-11-13`
*   **Then** `2026-11-11` is gone
*   **And** `2026-11-12` is not completed
*   **And** `2026-11-13` is not completed
*   **And** the assignment’s `completed` flag is unchanged

### US-4.7 — Complete an assignment

#### Scenario: User marks an assignment completed and its todos are completed
*   **Given** `Lab report` is not completed
*   **And** it has todos on `2026-11-11` and `2026-11-13`, both not completed
*   **And** I am on the assignment list
*   **When** I check **Complete assignment** on Lab report
*   **Then** `Lab report` is completed
*   **And** its name has a line through it
*   **And** both todos are completed

#### Scenario: User marks an assignment completed when it has no todos
*   **Given** `Reading` is not completed and has no todos
*   **When** I set `Reading` completed
*   **Then** `Reading` is completed
*   **And** it still has no todos

#### Scenario: User clears assignment completion and its todos stay completed
*   **Given** `Lab report` is completed
*   **And** its todos on `2026-11-11` and `2026-11-13` are completed
*   **When** I uncheck **Complete assignment**
*   **Then** `Lab report` is not completed
*   **And** both todos stay completed

#### Scenario: User marks an assignment that does not exist
*   **Given** no assignment has id `99`
*   **When** I send `PUT /api/assignments/99/completion` with `{ "completed": true }`
*   **Then** the API returns `404` with `{ "message": "Assignment with id=99 not found." }`

#### Scenario: User sees a completed todo star
*   **Given** `Lab report` has a completed todo on `2026-11-12`
*   **And** the stripe covers that day
*   **And** the calendar is showing November 2026
*   **When** the calendar finishes loading
*   **Then** the Lab report stripe on `2026-11-12` shows a star with `aria-label` **Todo completed**

## Test Coverage Map

Each scenario above must map to at least one automated test. `it` names match the scenario titles. When a scenario checks both the API and the page, use that title in each mapped file.

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-4.1 | User saves one day as a todo | `backend/tests/dayTodos.test.js` | `User saves one day as a todo` |
| US-4.1 | User saves one day as a todo | `frontend/tests/DayTodos.test.js` | `User saves one day as a todo` |
| US-4.1 | User saves several days as todos for the same assignment | `backend/tests/dayTodos.test.js` | `User saves several days as todos for the same assignment` |
| US-4.1 | User moves start working by to the earliest todo outside the range | `backend/tests/dayTodos.test.js` | `User moves start working by to the earliest todo outside the range` |
| US-4.1 | User selects days in two months and saves both | `frontend/tests/DayTodos.test.js` | `User selects days in two months and saves both` |
| US-4.1 | User cancels without changing todos | `frontend/tests/DayTodos.test.js` | `User cancels without changing todos` |
| US-4.1 | User saves todos for an assignment that does not exist | `backend/tests/dayTodos.test.js` | `User saves todos for an assignment that does not exist` |
| US-4.1 | User sends a date that is not a calendar date | `backend/tests/dayTodos.test.js` | `User sends a date that is not a calendar date` |
| US-4.1 | User sends duplicate dates | `backend/tests/dayTodos.test.js` | `User sends duplicate dates` |
| US-4.1 | User replaces day todos with an id that is not a number | `backend/tests/dayTodos.test.js` | `User replaces day todos with an id that is not a number` |
| US-4.1 | User sends dates that are not a list | `backend/tests/dayTodos.test.js` | `User sends dates that are not a list` |
| US-4.2 | User sees an assignment todo on the todos list | `frontend/tests/DayTodos.test.js` | `User sees an assignment todo on the todos list` |
| US-4.2 | User opens todos from the sidebar | `frontend/tests/DayTodos.test.js` | `User opens todos from the sidebar` |
| US-4.2 | User sees a star on the stripe for a day with a todo | `frontend/tests/DayTodos.test.js` | `User sees a star on the stripe for a day with a todo` |
| US-4.2 | User keeps a todo on a day that has no stripe | `frontend/tests/DayTodos.test.js` | `User keeps a todo on a day that has no stripe` |
| US-4.2 | User keeps a todo on a day that has no stripe | `backend/tests/dayTodos.test.js` | `User keeps a todo on a day that has no stripe` |
| US-4.2 | User sees a star only on the assignment that has the todo | `frontend/tests/DayTodos.test.js` | `User sees a star only on the assignment that has the todo` |
| US-4.3 | User unselects a day and saving removes that todo | `backend/tests/dayTodos.test.js` | `User unselects a day and saving removes that todo` |
| US-4.3 | User unselects a day and saving removes that todo | `frontend/tests/DayTodos.test.js` | `User unselects a day and saving removes that todo` |
| US-4.3 | User adds a day to an existing set | `backend/tests/dayTodos.test.js` | `User adds a day to an existing set` |
| US-4.3 | User saves an empty set and all day todos are removed | `backend/tests/dayTodos.test.js` | `User saves an empty set and all day todos are removed` |
| US-4.4 | User adds a todo that is not connected to an assignment | `backend/tests/dayTodos.test.js` | `User adds a todo that is not connected to an assignment` |
| US-4.4 | User adds a todo that is not connected to an assignment | `frontend/tests/DayTodos.test.js` | `User adds a todo that is not connected to an assignment` |
| US-4.4 | User edits a todo that is not connected to an assignment | `frontend/tests/DayTodos.test.js` | `User edits a todo that is not connected to an assignment` |
| US-4.4 | User deletes a todo that is not connected to an assignment | `backend/tests/dayTodos.test.js` | `User deletes a todo that is not connected to an assignment` |
| US-4.4 | User deletes a todo that is not connected to an assignment | `frontend/tests/DayTodos.test.js` | `User deletes a todo that is not connected to an assignment` |
| US-4.4 | User adds a todo with no name | `backend/tests/dayTodos.test.js` | `User adds a todo with no name` |
| US-4.4 | User adds a todo with no date | `backend/tests/dayTodos.test.js` | `User adds a todo with no date` |
| US-4.4 | User updates an assignment todo through the standalone route | `backend/tests/dayTodos.test.js` | `User updates an assignment todo through the standalone route` |
| US-4.5 | User deletes an assignment and its day todos are gone | `backend/tests/dayTodos.test.js` | `User deletes an assignment and its day todos are gone` |
| US-4.5 | User replaces day todos on a new assignment only | `backend/tests/dayTodos.test.js` | `User replaces day todos on a new assignment only` |
| US-4.6 | User finishes a todo from the todos list | `frontend/tests/DayTodos.test.js` | `User finishes a todo from the todos list` |
| US-4.6 | User finishes a todo from the todos list | `backend/tests/dayTodos.test.js` | `User finishes a todo from the todos list` |
| US-4.6 | User finishes the only todo and the assignment stays open | `backend/tests/dayTodos.test.js` | `User finishes the only todo and the assignment stays open` |
| US-4.6 | User clears a finished todo and the assignment stays open | `backend/tests/dayTodos.test.js` | `User clears a finished todo and the assignment stays open` |
| US-4.6 | User clears a todo on a completed assignment | `backend/tests/dayTodos.test.js` | `User clears a todo on a completed assignment` |
| US-4.6 | User finishes a todo that has no assignment | `backend/tests/dayTodos.test.js` | `User finishes a todo that has no assignment` |
| US-4.6 | User finishes a todo that does not exist | `backend/tests/dayTodos.test.js` | `User finishes a todo that does not exist` |
| US-4.6 | User sends a completion value that is not true or false | `backend/tests/dayTodos.test.js` | `User sends a completion value that is not true or false` |
| US-4.6 | User saves day todos and a kept date stays finished | `backend/tests/dayTodos.test.js` | `User saves day todos and a kept date stays finished` |
| US-4.7 | User marks an assignment completed and its todos are completed | `frontend/tests/DayTodos.test.js` | `User marks an assignment completed and its todos are completed` |
| US-4.7 | User marks an assignment completed and its todos are completed | `backend/tests/dayTodos.test.js` | `User marks an assignment completed and its todos are completed` |
| US-4.7 | User marks an assignment completed when it has no todos | `backend/tests/dayTodos.test.js` | `User marks an assignment completed when it has no todos` |
| US-4.7 | User clears assignment completion and its todos stay completed | `backend/tests/dayTodos.test.js` | `User clears assignment completion and its todos stay completed` |
| US-4.7 | User marks an assignment that does not exist | `backend/tests/dayTodos.test.js` | `User marks an assignment that does not exist` |
| US-4.7 | User sees a completed todo star | `frontend/tests/DayTodos.test.js` | `User sees a completed todo star` |

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

*   [x] Backend and frontend implemented per this spec (**FR-001** through **FR-016** satisfied)
*   [x] **Success Criteria (SC-001** through **SC-007)** met
*   [x] All mapped tests pass (`npm test`)
*   [x] Test Coverage Map complete
*   [x] `features/reference/data-model.md` updated
*   [x] `features/reference/api.md` updated
*   [x] `features/reference/behavior.md` updated

## Out of Scope

*   Sign-in, registration, sessions, and per-user todos
*   A title on a todo that belongs to an assignment
*   The **Unfinished** / **All** filter and the calendar day dialog ([Feature 5](./feature-5-completion-and-filter.md))
*   A create-todo control on the calendar stripe
*   Dragging stripes or changing due dates from the calendar
*   Reminders and notifications

## Delivered to Feature 5

*   Assignments have `completed`. `dayTodos` is an array of `{ "date", "completed" }`.
*   Todos have `completed`. `PUT /api/day-todos/:id/completion` changes one todo and does not change the assignment. `PUT /api/assignments/:id/completion` with `true` completes the assignment and its todos. `false` clears only the assignment.
*   The sidebar links **Todos** to the **Todos** tab. That tab has **Finish todo** on each row. The assignment list has **Complete assignment**.
*   A row is either an assignment todo or a todo with `assignmentId` null and its own `name`.
*   Feature 5 adds **Unfinished** / **All** and the calendar day dialog. It uses these completion endpoints and does not add the `completed` columns.
