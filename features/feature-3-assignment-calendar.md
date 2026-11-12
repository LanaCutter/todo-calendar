# Feature: Assignment Calendar

**Feature ID:** 3
**Branch pattern:** `feature/3-assignment-calendar`
**Status:** Ready
**Created:** 2026-11-11
**Input:** A student can switch from the assignment table to a month calendar. Assignments appear as colored stripes from the start-working-by date through the due date, or as a one-day mark when only the due date is set.
**Depends on:** [Feature 2 — Assignment Management](./feature-2-assignment-management.md)
**Related:** [features/reference/api.md](./reference/api.md)

## User Stories

### US-3.1: Switch between table and calendar
**As a** student
**I want to** open my assignments as a table or as a calendar
**So that** I can pick the view that matches how I am planning

**Priority:** P1
**Independent test:** From the assignment table, open **Calendar** and land on the home page month grid; open **Assignments** and see the assignment table again. **Todos** does not list the assignment’s span days.
**Acceptance scenarios:** see ### US-3.1 under Acceptance Criteria

### US-3.2: See assignment stripes
**As a** student
**I want** each assignment drawn in its class color from the day I should start through the due date
**So that** I can see the stretch of days the work covers

**Priority:** P1
**Independent test:** With a start date and a due date set, the calendar shows that assignment on every day in the inclusive span, in the class color; a due-date-only assignment shows on that one day; an assignment with no due date does not show
**Acceptance scenarios:** see ### US-3.2 under Acceptance Criteria

## Requirements

### Functional Requirements

- **FR-001**: The student MUST be able to open a month calendar of assignments and return to the assignment table without signing in. The calendar MUST load assignments from `GET /api/assignments`. This feature MUST NOT add endpoints and MUST NOT require `Authorization`.
- **FR-002**: The calendar MUST show one month at a time, Sunday through Saturday, defaulting to the current local month. **Previous month** and **Next month** MUST change the visible month. The heading MUST name the visible month and year, for example `November 2026`.
- **FR-003**: When both `startWorkingBy` and `dueDate` are set, the assignment MUST appear on every calendar day from `startWorkingBy` through `dueDate`, inclusive. `dueTime` MUST NOT change which days are drawn.
- **FR-004**: When `dueDate` is set and `startWorkingBy` is empty, the assignment MUST appear only on `dueDate`.
- **FR-005**: When `dueDate` is empty, the assignment MUST NOT appear on the calendar. That includes a start-working-by date with no due date, and an assignment with neither date.
- **FR-006**: Each drawn day MUST include a stripe in the class color (`class.color`). The stripe element MUST set `data-assignment-id` to the assignment id, `data-date` to that day as `YYYY-MM-DD`, and `data-color` to the class color enum value. The assignment name appears only on the first day of that assignment’s range. The due date says **Due**. Days in between are the color bar with no name. One assignment keeps a single lane for the whole month, so another assignment on one of those days does not move its stripe. A stripe that continues into the next day in the same week runs through the shared edge with no gap.
- **FR-007**: A span that crosses months MUST show only the days that fall in the visible month. Moving to the next or previous month MUST show the rest of the span.
- **FR-008**: Two assignments on the same day MUST both be visible that day.
- **FR-009**: The month grid MUST still render when nothing is drawn. When the visible month has no stripe, the page MUST show "No assignments on this month's calendar." When the month has a stripe, that message MUST NOT appear.
- **FR-010**: `/` MUST be the calendar and is the home page. The assignment table MUST live at `/assignments`. The sidebar MUST show the app name **Todo**, then link **Calendar** to `/`, **Assignments** to `/assignments`, and **Classes** to `/classes`. The sidebar stays theme color `primary` with no top bar. The calendar page MUST offer tabs **Calendar** and **Todos**. **Calendar** shows the month grid. **Todos** does not list assignment stripes. Day todos are not part of this feature, so the tab shows "No todos yet."
- **FR-011**: Build the month grid with Vue and Vuetify. Do not add a calendar library.
- **FR-012**: The cell for the student's local today MUST be marked, including when that date is a neighboring-month cell in the grid. The cell MUST have class `is-today` and `data-iso` set to that date as `YYYY-MM-DD`. The day number MUST be visually distinct from the other days.
- **FR-013**: Above the month grid, the **Calendar** tab MUST show a color key of every class from `GET /api/classes`. Each entry MUST show a swatch with `data-color` set to the class color and the class name. Order follows the API. When there are no classes, the key is not shown.

## Assumptions

- Feature 2 assignments, classes, and `GET /api/assignments` (including embedded `class.color`) are on `dev`.
- There is no sign-in. The calendar shows every assignment returned by the API.
- “Today” is the student’s local calendar day. Tests may open the calendar already showing a named month (`Given the calendar is showing November 2026`).
- Day todos and stars are Feature 4. Stripes in this feature have no star.
- Assignments with no due date stay available in the table.

## Edge Cases

- Start date and due date are the same day → one-day stripe on that day
- Span crosses a month boundary → each month shows its own days
- Span crosses a week boundary → the stripe continues on each day, not only the first week
- Only start-working-by, or neither date → no stripe
- Due time set or unset → same days
- Several assignments on one day → each name is shown
- Visible month has no stripe days → grid plus the empty copy
- Class color is the enum value from Feature 1, shown as `data-color`

## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test before merge
- **SC-002**: A student can switch between the table and the calendar from the menu
- **SC-003**: For a fixed set of assignments, the days that show a stripe match **FR-003**, **FR-004**, and **FR-005**

## Data Ownership & Isolation

Unchanged from Feature 2. The calendar is another view of every assignment. No new rows, no `userId`, no auth header.

| Rule | Requirement |
|------|-------------|
| **Read scope** | Calendar uses `GET /api/assignments` with no filter by user |
| **Write scope** | This feature does not create or update assignments |
| **UI scope** | Only assignments that pass **FR-003** through **FR-005** are drawn |
| **Auth** | No `authenticate` middleware |

## Key Entities

- **Assignment**: from Feature 2. This feature does not add fields. `startWorkingBy`, `dueDate`, and `class.color` decide the stripe.
- **Class**: from Feature 1. Its `color` paints the stripe.

No new entity.

## API Requirements

No new or changed endpoints. The calendar calls existing `GET /api/assignments` and `GET /api/classes`.

A stripe is drawn from fields already on that payload:

| Fields | What the calendar draws |
|--------|-------------------------|
| `startWorkingBy` and `dueDate` both set | Inclusive span, class color |
| `dueDate` set, `startWorkingBy` null | That due date only |
| `dueDate` null | Nothing |

`dueTime` is ignored for drawing.

## Screen Requirements

### App chrome

*   The sidebar shows **Todo** at the top.
*   Sidebar links: **Calendar** (`/`, route `calendar`), **Assignments** (`/assignments`, route `assignments`), **Classes** (`/classes`).
*   The assignment-list link is **Assignments**.

### [View: Calendar] — route name `calendar`

*   Path: `/`. This is the home page. Heading is the visible month and year, for example **November 2026**.
*   Tabs: **Calendar** and **Todos**. **Calendar** is selected when the page opens.
*   **Todos** is not a list of assignment stripes. Day todos are Feature 4. This tab shows "No todos yet."
*   Controls: **Previous month** (`aria-label` **Previous month**) and **Next month** (`aria-label` **Next month**).
*   Above the month grid, a color key lists each class: a swatch in `class.color` and the class name. No classes means no key.
*   The cell for local today has class `is-today`. Its day number is filled with theme color `primary`.
*   Month grid: week rows that cover the month, columns Sunday through Saturday. Days from neighboring months may show in the grid and MUST NOT show stripes. A stripe is drawn only on a date that belongs to the heading's month and is inside the assignment's range (**FR-007**).
*   On each day in an assignment’s drawn range, a thin stripe uses the class color, with `data-assignment-id`, `data-date`, and `data-color` as in **FR-006**. The assignment name is on the first day of the range only. The due date says **Due**. A continued stripe meets the next day with no gap. Each assignment stays in one lane for the month.
*   Implement the grid with Vuetify layout components. No new calendar dependency. No raw hex in the view; use the theme color name.
*   **Empty state:** the grid remains, and the page shows "No assignments on this month's calendar."
*   **Loading:** a progress indicator while assignments are loading.
*   **Error:** `<v-alert type="error">` with the API `message`.

The assignment table itself is unchanged aside from its path `/assignments` and the sidebar label **Assignments**. Classes are shown in a table with columns **Name** and **Color**, plus the same edit and delete actions.

## Data Model Requirements

No schema changes. Assignments and classes stay as in Feature 2 and Feature 1.

## Acceptance Criteria

### US-3.1 — Switch between table and calendar

#### Scenario: User opens the calendar from the menu
*   **Given** I am on the assignment table
*   **When** I click **Calendar**
*   **Then** I am on `/`
*   **And** I see a month grid and a heading with the month and year

#### Scenario: User returns to the assignment table from the menu
*   **Given** I am on the calendar
*   **When** I click **Assignments**
*   **Then** I am on `/assignments`
*   **And** I see the assignment table

#### Scenario: User does not see assignment days as todos
*   **Given** assignment `Lab report` has `startWorkingBy` `2026-11-09` and `dueDate` `2026-11-13`
*   **And** the calendar is showing November 2026
*   **When** I click **Todos**
*   **Then** I see "No todos yet."
*   **And** Lab report is not listed there as a todo

### US-3.2 — See assignment stripes

#### Scenario: User sees a stripe from start working by through the due date
*   **Given** class `Biology` has color `green`
*   **And** assignment `Lab report` (id `1`) has `startWorkingBy` `2026-11-09` and `dueDate` `2026-11-13`
*   **And** the calendar is showing November 2026
*   **When** the calendar finishes loading
*   **Then** Lab report is drawn on `2026-11-09`, `2026-11-10`, `2026-11-11`, `2026-11-12`, and `2026-11-13`
*   **And** each of those stripes has `data-assignment-id` `1`, `data-color` `green`, and `data-date` of that day
*   **And** the name Lab report is only on `2026-11-09`
*   **And** `2026-11-13` says Due

#### Scenario: User sees a one-day mark when only the due date is set
*   **Given** assignment `Quiz` has due date `2026-11-18` and no start working by date
*   **And** the calendar is showing November 2026
*   **When** the calendar finishes loading
*   **Then** Quiz is drawn only on `2026-11-18`

#### Scenario: User sees a one-day stripe when start and due are the same day
*   **Given** assignment `Worksheet` has `startWorkingBy` `2026-11-11` and `dueDate` `2026-11-11`
*   **And** the calendar is showing November 2026
*   **When** the calendar finishes loading
*   **Then** Worksheet is drawn only on `2026-11-11`

#### Scenario: User does not see an assignment that has only a start working by date
*   **Given** assignment `Reading` has `startWorkingBy` `2026-11-02` and no due date
*   **And** the calendar is showing November 2026
*   **When** the calendar finishes loading
*   **Then** Reading is not drawn on any day

#### Scenario: User does not see an assignment that has neither date
*   **Given** assignment `Notes` has no start working by date and no due date
*   **And** the calendar is showing November 2026
*   **When** the calendar finishes loading
*   **Then** Notes is not drawn on any day

#### Scenario: User sees the stripe continue on the next month
*   **Given** assignment `Essay` has `startWorkingBy` `2026-11-28` and `dueDate` `2026-12-02`
*   **And** the calendar is showing November 2026
*   **When** the calendar finishes loading
*   **Then** Essay is drawn on `2026-11-28`, `2026-11-29`, and `2026-11-30`
*   **And** Essay is not drawn on `2026-12-01` in this month

#### Scenario: User sees the rest of a stripe in the next month
*   **Given** assignment `Essay` has `startWorkingBy` `2026-11-28` and `dueDate` `2026-12-02`
*   **And** the calendar is showing November 2026
*   **When** I click **Next month**
*   **Then** the heading is December 2026
*   **And** Essay is drawn on `2026-12-01` and `2026-12-02`

#### Scenario: User sees two assignments on the same day
*   **Given** `Lab report` and `Quiz` are both drawn on `2026-11-13`
*   **And** the calendar is showing November 2026
*   **When** the calendar finishes loading
*   **Then** `2026-11-13` shows a stripe for Lab report and a stripe for Quiz
*   **And** Lab report’s stripe on that day says Due
*   **And** Quiz’s stripe on that day shows Quiz

#### Scenario: Due time does not change the stripe days
*   **Given** assignment `Lab report` has `startWorkingBy` `2026-11-09`, `dueDate` `2026-11-13`, and `dueTime` `09:00`
*   **And** the calendar is showing November 2026
*   **When** the calendar finishes loading
*   **Then** Lab report is drawn on each day from `2026-11-09` through `2026-11-13`

#### Scenario: User sees today marked on the calendar
*   **Given** the calendar is showing the current local month
*   **When** the calendar finishes loading
*   **Then** the cell for today's date has class `is-today` and `data-iso` of that date

#### Scenario: User sees a color key for each class
*   **Given** class `Biology` has color `green`
*   **And** class `History` has color `amber`
*   **And** the calendar is showing November 2026
*   **When** the calendar finishes loading
*   **Then** the color key lists Biology with `data-color` `green` and History with `data-color` `amber`

#### Scenario: User sees an empty month message when nothing is drawn
*   **Given** no assignment has a due date in December 2026 or a span that includes a day in December 2026
*   **And** the calendar is showing December 2026
*   **When** the calendar finishes loading
*   **Then** I see the month grid
*   **And** I see "No assignments on this month's calendar."

## Test Coverage Map

Each scenario above must map to at least one automated test. `it` names match the scenario titles. These scenarios are UI behavior over the Feature 2 payload, so they live in the frontend test file.

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-3.1 | User opens the calendar from the menu | `frontend/tests/Calendar.test.js` | `User opens the calendar from the menu` |
| US-3.1 | User returns to the assignment table from the menu | `frontend/tests/Calendar.test.js` | `User returns to the assignment table from the menu` |
| US-3.1 | User does not see assignment days as todos | `frontend/tests/Calendar.test.js` | `User does not see assignment days as todos` |
| US-3.2 | User sees a stripe from start working by through the due date | `frontend/tests/Calendar.test.js` | `User sees a stripe from start working by through the due date` |
| US-3.2 | User sees a one-day mark when only the due date is set | `frontend/tests/Calendar.test.js` | `User sees a one-day mark when only the due date is set` |
| US-3.2 | User sees a one-day stripe when start and due are the same day | `frontend/tests/Calendar.test.js` | `User sees a one-day stripe when start and due are the same day` |
| US-3.2 | User does not see an assignment that has only a start working by date | `frontend/tests/Calendar.test.js` | `User does not see an assignment that has only a start working by date` |
| US-3.2 | User does not see an assignment that has neither date | `frontend/tests/Calendar.test.js` | `User does not see an assignment that has neither date` |
| US-3.2 | User sees the stripe continue on the next month | `frontend/tests/Calendar.test.js` | `User sees the stripe continue on the next month` |
| US-3.2 | User sees the rest of a stripe in the next month | `frontend/tests/Calendar.test.js` | `User sees the rest of a stripe in the next month` |
| US-3.2 | User sees two assignments on the same day | `frontend/tests/Calendar.test.js` | `User sees two assignments on the same day` |
| US-3.2 | Due time does not change the stripe days | `frontend/tests/Calendar.test.js` | `Due time does not change the stripe days` |
| US-3.2 | User sees today marked on the calendar | `frontend/tests/Calendar.test.js` | `User sees today marked on the calendar` |
| US-3.2 | User sees a color key for each class | `frontend/tests/Calendar.test.js` | `User sees a color key for each class` |
| US-3.2 | User sees an empty month message when nothing is drawn | `frontend/tests/Calendar.test.js` | `User sees an empty month message when nothing is drawn` |

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 3 from @features/feature-3-assignment-calendar.md on branch `feature/3-assignment-calendar`.

Follow layer order in @features/framework.md. This feature has no new API or schema; implement the calendar screen and frontend tests.
Map every Gherkin scenario in the Test Coverage Map; run `npm test` before finishing.
Update @features/reference/behavior.md for the stripe rules and menu labels. Do not change @features/reference/api.md or @features/reference/data-model.md unless the shipped code changes them.
Complete Definition of Done and the merge checklist in @features/framework.md.
Do not implement behavior not in this spec. Do not add sign-in, day todos, or stars.
```

**Reference updates for this feature:** `features/reference/behavior.md`.

## Definition of Done

*   [ ] Frontend implemented per this spec (**FR-001** through **FR-011** satisfied)
*   [ ] **Success Criteria (SC-001** through **SC-003)** met
*   [ ] All mapped tests pass (`npm test`)
*   [ ] Test Coverage Map complete
*   [ ] `features/reference/data-model.md` left unchanged (no schema change)
*   [ ] `features/reference/api.md` left unchanged (no API change)
*   [ ] `features/reference/behavior.md` updated

## Out of Scope

*   Sign-in and per-user calendars
*   New assignment fields or endpoints
*   Day todos and stars on a stripe ([Feature 4](./feature-4-assignment-day-todos.md))
*   Week view, drag-to-reschedule, and a third-party calendar component
*   Editing an assignment from the stripe (the table remains the editor)
*   Completion, day-click checkboxes, and the unfinished/all filter ([Feature 5](./feature-5-completion-and-filter.md))

## Delivered to Feature 4

*   Stripes expose `data-assignment-id`, `data-date`, and `data-color` on each drawn day. Feature 4 places a star on a stripe day that has a day todo, and adds **Create todo** on the table row and on the stripe.
