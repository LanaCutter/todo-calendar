# Feature: Unfinished Filter and Day Dialog

**Feature ID:** 5
**Branch pattern:** `feature/5-completion-and-filter`
**Status:** Ready
**Created:** 2026-11-11
**Input:** Feature 4 already stores completion and already shows **Finish todo** and **Complete assignment**. This feature adds **Unfinished** and **All** on the assignment list, the Todos tab, and the calendar, and a dialog opened by clicking a calendar day.
**Depends on:** [Feature 4 — Assignment Day Todos](./feature-4-assignment-day-todos.md)
**Related:** [docs/product-overview.md](../docs/product-overview.md)

## User Stories

### US-5.1: Show unfinished items or everything
**As a** student
**I want to** switch each list and the calendar between unfinished items and all items
**So that** I can focus on what is left or review what I already finished

**Priority:** P1
**Independent test:** With one completed and one open assignment, choose **Unfinished** and see only the open one, then choose **All** and see both
**Acceptance scenarios:** see ### US-5.1 under Acceptance Criteria

### US-5.2: Finish work from a calendar day
**As a** student
**I want to** click a calendar day and check off that day’s todo or the whole assignment
**So that** I can update completion while I am looking at the month

**Priority:** P1
**Independent test:** Click a day that has a todo, check **Finish todo**, and see that todo completed; check **Complete assignment** and see the assignment and all of its todos completed
**Acceptance scenarios:** see ### US-5.2 under Acceptance Criteria

## Requirements

### Functional Requirements

- **FR-001**: The assignment list (`/assignments`), the **Todos** tab, and the calendar (`/`) MUST each offer **Unfinished** and **All**. Each view opens on **All**. The choice is local to that view. It is not saved, not shared with the other views, and MUST NOT change stored data.
- **FR-002**: On the assignment list, **Unfinished** shows only assignments with `completed` false. **All** shows every assignment. When **Unfinished** hides every row, show "No unfinished assignments." The **All** empty state stays "No assignments yet. Add your first assignment."
- **FR-003**: On the **Todos** tab, **Unfinished** shows only todos with `completed` false. **All** shows every todo. When **Unfinished** hides every row, show "No unfinished todos." The **All** empty state stays "No todos yet."
- **FR-004**: On the calendar, **Unfinished** MUST NOT draw a stripe whose assignment is completed, and MUST NOT draw a star whose todo is completed. A not-completed assignment MUST still show its stripe, and a not-completed todo MUST still show its star. **All** shows the Feature 4 stripes and stars, including completed ones. If **Unfinished** leaves no stripe, show "No assignments on this month's calendar."
- **FR-005**: Clicking a calendar day cell MUST open a dialog for that date. The Feature 4 **Create todo** picker MUST NOT open from that click. The dialog lists every todo on that date, finished or not, even when the calendar filter is **Unfinished**. Each assignment todo has **Finish todo** and **Complete assignment**. A todo with no assignment has **Finish todo** and no **Complete assignment**. Checking either box saves immediately by calling the Feature 4 completion endpoint for that checkbox. A day with no todos shows "No todos on this day."
- **FR-006**: This feature MUST NOT add tables, columns, or endpoints, and MUST NOT require `Authorization`.

## Assumptions

- Features 1–4 are shipped, including completion, the todos list, stars, and the **Create todo** picker.
- **Finish todo** and **Complete assignment** already do what Feature 4 specifies. This feature only places those same checkboxes in the day dialog and adds the filter.
- The filter does not reload or rewrite rows. It hides them on screen.

## Edge Cases

- **Unfinished** on the assignment list when every assignment is completed → "No unfinished assignments."
- **Unfinished** on the Todos tab when every todo is completed → "No unfinished todos."
- **Unfinished** on the calendar when every drawn assignment is completed → the month grid and "No assignments on this month's calendar."
- **Unfinished** hides a completed todo’s star and still draws that assignment’s stripe when the assignment is not completed
- Day click when that date has no todo → "No todos on this day."
- Day click while **Unfinished** is selected → the dialog still lists finished todos on that date
- A todo with no assignment in the day dialog → **Finish todo** only
- Leaving the page or reloading → the view opens on **All** again
- Clicking **Create todo** still opens the Feature 4 picker

## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test before merge
- **SC-002**: **Unfinished** hides completed assignments on the assignment list and calendar, and hides completed todos on the Todos tab and calendar stars. **All** shows them
- **SC-003**: Clicking a calendar day opens a dialog for that date. From it, the student can finish that day’s todo or complete the assignment through Feature 4

## Data Ownership & Isolation

Single-user, same as Features 1–4. This feature does not create or update rows except by calling Feature 4’s completion endpoints from the day dialog.

| Rule | Requirement |
|------|-------------|
| **Read scope** | The filter reads `completed` from the Feature 4 payloads |
| **Write scope** | The day dialog calls `PUT /api/day-todos/:id/completion` or `PUT /api/assignments/:id/completion` |
| **UI scope** | **Unfinished** hides completed items on that view only |
| **Auth** | No `authenticate` middleware |

## Key Entities

No new entities. **Assignment** and **Day todo** stay as in Feature 4. This feature only filters them and opens a day dialog.

## API Requirements

No new or changed endpoints. The day dialog calls Feature 4:

| Checkbox | Endpoint |
|----------|----------|
| **Finish todo** | `PUT /api/day-todos/:id/completion` |
| **Complete assignment** | `PUT /api/assignments/:id/completion` |

Errors use the Feature 4 `message`. The checkbox returns to its previous checked state when the request fails.

## Screen Requirements

### [View: Assignments] — route name `assignments`

*   The Feature 4 table stays, including **Complete assignment**.
*   Display control: **Unfinished** and **All**. The view opens on **All**.
*   **Unfinished** shows only assignments with `completed` false.
*   When **Unfinished** hides every row, show "No unfinished assignments."

### [View: Todos] — the calendar **Todos** tab

*   The Feature 4 list stays, including **Finish todo**.
*   Display control: **Unfinished** and **All**. The view opens on **All**.
*   **Unfinished** shows only todos with `completed` false.
*   When **Unfinished** hides every row, show "No unfinished todos."

### [View: Calendar] — route name `calendar`

*   Same **Unfinished** and **All** control. The view opens on **All**.
*   **Unfinished** does not draw a stripe whose assignment is completed, and does not draw a star whose todo is completed.
*   If that leaves no stripe, show "No assignments on this month's calendar."
*   Clicking the day cell opens the day dialog. **Create todo** still opens the Feature 4 picker.

### Day dialog

*   Heading is the date in long form, for example **November 12, 2026**. The dialog root sets `data-date` to `YYYY-MM-DD`.
*   One row per todo on that date. An assignment todo shows the assignment name, the class swatch and name, **Finish todo**, and **Complete assignment**. A todo with no assignment shows its name, **Finish todo**, and no class and no **Complete assignment**.
*   Checking a box saves immediately. After **Complete assignment** succeeds with `true`, that row’s **Finish todo** is checked.
*   The dialog lists finished and unfinished todos on that date, including when the calendar control is **Unfinished**.
*   **Empty state:** "No todos on this day."
*   **Error:** `<v-alert type="error">` with the API `message`, and the checkbox returns to its previous checked state.
*   Close control: **Close**.

## Data Model Requirements

No schema changes.

## Acceptance Criteria

### US-5.1 — Show unfinished items or everything

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

#### Scenario: User shows only unfinished todos
*   **Given** a todo on `2026-11-12` for `Lab report` is completed
*   **And** a todo on `2026-11-13` for `Essay` is not completed
*   **And** I am on the Todos tab
*   **When** I click **Unfinished**
*   **Then** I see the Essay todo
*   **And** I do not see the Lab report todo

#### Scenario: User shows all todos
*   **Given** a completed todo and a not-completed todo exist
*   **When** I open the Todos tab
*   **Then** **All** is selected
*   **And** I see both todos

#### Scenario: User shows only unfinished assignments on the calendar
*   **Given** `Lab report` is completed and would otherwise be drawn from `2026-11-09` through `2026-11-13`
*   **And** `Essay` is not completed and is drawn on `2026-11-18`
*   **And** the calendar is showing November 2026
*   **When** I click **Unfinished**
*   **Then** Essay is drawn
*   **And** Lab report is not drawn

#### Scenario: User hides a finished todo star on the unfinished calendar
*   **Given** `Lab report` is not completed and is drawn from `2026-11-09` through `2026-11-13`
*   **And** its todo on `2026-11-12` is completed and its todo on `2026-11-11` is not completed
*   **And** the calendar is showing November 2026 on **All**
*   **When** I click **Unfinished**
*   **Then** the Lab report stripe is still drawn
*   **And** `2026-11-12` has no star
*   **And** `2026-11-11` still has a star

#### Scenario: User sees no unfinished assignments
*   **Given** every assignment is completed
*   **And** I am on the assignment list
*   **When** I click **Unfinished**
*   **Then** I see "No unfinished assignments."

### US-5.2 — Finish work from a calendar day

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
*   **Given** no todo falls on `2026-11-02`
*   **And** the calendar is showing November 2026
*   **When** I click the day cell for `2026-11-02`
*   **Then** I see "No todos on this day."

#### Scenario: User still sees a finished todo in the day dialog while unfinished is selected
*   **Given** `Lab report` has a completed todo on `2026-11-12`
*   **And** the calendar filter is **Unfinished**
*   **When** I click the day cell for `2026-11-12`
*   **Then** the dialog lists that todo

#### Scenario: User does not see complete assignment on a todo with no assignment
*   **Given** a todo named `Buy a notebook` on `2026-11-15` has no assignment
*   **When** I click the day cell for `2026-11-15`
*   **Then** that row has **Finish todo**
*   **And** that row has no **Complete assignment**

## Test Coverage Map

Each scenario above must map to at least one automated test. `it` names match the scenario titles.

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-5.1 | User shows only unfinished assignments | `frontend/tests/Completion.test.js` | `User shows only unfinished assignments` |
| US-5.1 | User shows all assignments including completed ones | `frontend/tests/Completion.test.js` | `User shows all assignments including completed ones` |
| US-5.1 | User shows only unfinished todos | `frontend/tests/Completion.test.js` | `User shows only unfinished todos` |
| US-5.1 | User shows all todos | `frontend/tests/Completion.test.js` | `User shows all todos` |
| US-5.1 | User shows only unfinished assignments on the calendar | `frontend/tests/Completion.test.js` | `User shows only unfinished assignments on the calendar` |
| US-5.1 | User hides a finished todo star on the unfinished calendar | `frontend/tests/Completion.test.js` | `User hides a finished todo star on the unfinished calendar` |
| US-5.1 | User sees no unfinished assignments | `frontend/tests/Completion.test.js` | `User sees no unfinished assignments` |
| US-5.2 | User finishes a todo from the day dialog | `frontend/tests/Completion.test.js` | `User finishes a todo from the day dialog` |
| US-5.2 | User marks the assignment completed from the day dialog | `frontend/tests/Completion.test.js` | `User marks the assignment completed from the day dialog` |
| US-5.2 | User opens a day that has no todos | `frontend/tests/Completion.test.js` | `User opens a day that has no todos` |
| US-5.2 | User still sees a finished todo in the day dialog while unfinished is selected | `frontend/tests/Completion.test.js` | `User still sees a finished todo in the day dialog while unfinished is selected` |
| US-5.2 | User does not see complete assignment on a todo with no assignment | `frontend/tests/Completion.test.js` | `User does not see complete assignment on a todo with no assignment` |

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 5 from @features/feature-5-completion-and-filter.md on branch `feature/5-completion-and-filter`.

Follow layer order in @features/framework.md. This feature has no new API or schema. Implement the filter, the day dialog, and frontend tests.
Map every Gherkin scenario in the Test Coverage Map; run `npm test` before finishing.
Update @features/reference/behavior.md for the filter and the day dialog. Do not change @features/reference/api.md or @features/reference/data-model.md unless the shipped code changes them.
Complete Definition of Done and the merge checklist in @features/framework.md.
Do not implement behavior not in this spec. Do not add sign-in, sessions, or userId. Do not change what Feature 4 completion does.
```

**Reference updates for this feature:** `features/reference/behavior.md`.

## Definition of Done

*   [ ] Frontend implemented per this spec (**FR-001** through **FR-006** satisfied)
*   [ ] **Success Criteria (SC-001** through **SC-003)** met
*   [ ] All mapped tests pass (`npm test`)
*   [ ] Test Coverage Map complete
*   [ ] `features/reference/behavior.md` updated

## Out of Scope

*   Sign-in and per-user data
*   New completion rules, columns, or endpoints
*   Remembering the **Unfinished** / **All** choice after leaving the view or reloading
*   A title on a todo that belongs to an assignment
*   Dragging stripes or changing due dates from the calendar
