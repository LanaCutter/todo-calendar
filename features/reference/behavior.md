# Behavior & Rules Reference

**Living snapshot** of product rules currently in force on this branch (Feature 5).

These files answer: *"What rules does the app enforce right now?"*  
They do **not** authorize new scope — implement only from `features/feature-*.md`.

| File | Role |
|------|------|
| [api.md](./api.md) | Routes / payloads |
| [data-model.md](./data-model.md) | Tables / columns |
| **This file** | Ownership, sort, validation, UI rules |

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| No sign-in. Class and assignment routes accept any caller and do not return `401`. | No `authenticate` middleware on `/api/classes` or `/api/assignments` | Feature 1 |
| One shared set of classes. Rows have no `userId`. | `classes` table | Feature 1 |
| Name is trimmed, required, and at most 100 characters. | `400` `Name is required.` or `Name must be 100 characters or fewer.` | Feature 1 |
| Names are unique case-insensitively. Stored casing is kept. | `400` `A class with that name already exists.` | Feature 1 |
| Color is one of maroon, blue, green, amber, purple, teal, orange, slate. | `400` `Choose a color from the list.` | Feature 1 |
| Class list is ordered by name, case-insensitive. | `GET /api/classes` `ORDER BY LOWER(name)` | Feature 1 |
| Unknown class id is `404`. A non-integer id is `400`. | `Class with id=<id> not found.` / `Class id must be a number.` | Feature 1 |
| Delete asks for confirmation. Cancel leaves the class. | Dialog **Delete this class?** | Feature 1 |
| Empty class list shows the empty state, not an error. | "No classes yet. Add your first class." | Feature 1 |
| `/` is the calendar home page. The sidebar shows **Todo**, then **Calendar**, **Assignments**, **Todos**, and **Classes**. There is no top bar. | **Calendar** at `/`; **Assignments** at `/assignments`; **Todos** opens `/` with the Todos tab; **Classes** at `/classes` | Feature 3, Todos link in Feature 4 |
| The calendar page has **Calendar** and **Todos** tabs. The Todos tab lists stored todos, not stripe days that are not todos. | Columns Done, Todo, Class. The date is a heading once per day. Empty state "No todos yet." | Feature 3, list in Feature 4 |
| Each assignment row has a calendar icon that replaces that assignment’s todo dates, and a Complete assignment checkbox. | `PUT /api/assignments/:id/day-todos` and `PUT /api/assignments/:id/completion` | Feature 4 |
| A todo date on an assignment’s stripe shows a star. A todo on a day with no stripe is drawn on that calendar day. Completing a todo does not complete the assignment. Completing an assignment completes its todos; clearing the assignment leaves those todos as they were. | Star `aria-label` Todo or Todo completed; line-through on a completed name | Feature 4 |
| A todo with no assignment has its own name and one date. Edit and delete apply only to those todos. | `POST`, `PUT`, and `DELETE /api/day-todos` | Feature 4 |
| Deleting an assignment deletes its todos. Todos with no assignment remain. | `ON DELETE CASCADE` | Feature 4 |
| The assignment list, Todos tab, and calendar each open on **Unfinished**. **Unfinished** hides completed assignments or todos on that view only and is not saved. **All** shows completed items again. | **Unfinished** / **All** on each view | Feature 5 |
| The calendar and the Todos tab share a class filter. It opens on **All classes** and is not saved. **All classes** shows every class. Choosing a class hides other classes’ stripes and todos. | Class select on the calendar and Todos tab | Feature 5 |
| The assignment list groups rows under one due-date heading. The Todos tab groups rows under one date heading. | Heading once per date; undated assignments under **No due date** | Feature 2, Feature 4 |
| Clicking a calendar day opens that date’s todos in a table. The checkbox headings are **Todo** and **Assignment**. Those checkboxes call the Feature 4 completion endpoints. | Day dialog `data-date`; empty state "No todos on this day." | Feature 5 |
| A stripe keeps one lane for the month. The name is on the first day only. The due date says Due. A continued stripe has no gap between days. | Calendar stripes with `data-assignment-id`, `data-date`, and `data-color` | Feature 3 |
| The local today cell is marked. A color key above the grid lists each class name and color. | `is-today` with `data-iso`; legend swatches with `data-color` | Feature 3 |
| Classes are a table with name, color swatch, and row actions. | `/classes` | Feature 3 |
| A stripe runs from start working by through the due date, inclusive, in the class color. Due date alone is one day. No due date is not drawn. Due time does not change the days. Saving todos sets start working by to the earliest todo when that date is before the range. | Calendar stripes with `data-assignment-id`, `data-date`, and `data-color` | Feature 3, Feature 4 |
| Stripes appear only on days that belong to the heading month. | Neighbor cells in the month grid have no stripes | Feature 3 |
| A visible month with no stripe still shows the grid and the empty copy. | "No assignments on this month's calendar." | Feature 3 |
| The assignment form shows due date, then due time, then start working by. The table shows due time, then start working by, under the due-date heading. | Add and edit dialog field order; table column order | Feature 2 |
| Assignment name is trimmed, required, and at most 200 characters. Duplicate names are allowed. | `400` `Name is required.` or `Name must be 200 characters or fewer.` | Feature 2 |
| An assignment requires an existing class. | `400` `Class is required.` or `Class with id=<id> not found.` | Feature 2 |
| Due date and start-working-by are optional calendar dates. Due time is optional `HH:mm` and requires a due date. Start is on or before the due date when both are set. | `400` with the date and time messages in the feature spec | Feature 2 |
| Assignment list is soonest due date first, undated last, then name case-insensitively. | `GET /api/assignments` | Feature 2 |
| Each assignment response includes `class` with `id`, `name`, and `color`. | Nested `class` object | Feature 2 |
| A class that still has assignments cannot be deleted. | `400` `This class still has assignments.` | Feature 2 |
| Delete assignment asks for confirmation. Cancel leaves the row. | Dialog **Delete this assignment?** | Feature 2 |
| Empty assignment table shows the empty state. | "No assignments yet. Add your first assignment." | Feature 2 |
| Adding an assignment with no classes does not submit. | "Add a class before creating an assignment." | Feature 2 |
