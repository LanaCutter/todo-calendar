# Product overview

A short reading guide for the assignment calendar. The feature specs in `features/` are the source of truth. This page summarizes them.

There is no sign-in. One person uses the app, and every class, assignment, and day todo is shared in that single set of data.

## What you can do

Add a class with a name and a color. Enter an assignment under that class, with an optional due date, an optional due time, and an optional date to start working. Read assignments in a table or as colored stripes on a month calendar. Turn an assignment into day todos by picking days on a calendar. A star marks a todo on that assignment’s stripe.

Cross off a day todo without closing the assignment. Mark an assignment completed to cross off that assignment and every day todo on it. On the assignment list, the todo list, and the calendar, switch between **Unfinished** and **All**.

## Features

| Feature | Spec | What it adds |
|---------|------|----------------|
| 1 | [Class Management](../features/feature-1-class-management.md) | Create, view, edit, and delete classes. Each class has a unique name and one color: maroon, blue, green, amber, purple, teal, orange, or slate. |
| 2 | [Assignment Management](../features/feature-2-assignment-management.md) | Create, view, edit, and delete assignments. The assignment page is a table: name, class, due date, due time, and start working by. A class that still has assignments cannot be deleted. |
| 3 | [Assignment Calendar](../features/feature-3-assignment-calendar.md) | The home page is a month calendar with **Calendar** and **Todos** tabs. Both dates set: a stripe from start-working-by through the due date, inclusive, in the class color. The name is on the first day and **Due** is on the last day. Due date only: a mark on that day. No due date: the assignment stays off the calendar and remains in the table. **Todos** is empty until day todos exist. |
| 4 | [Assignment Day Todos](../features/feature-4-assignment-day-todos.md) | A calendar icon on an assignment opens a date picker. The selected days are todos and show on the **Todos** tab. The sidebar links **Todos** to that tab. The tab can also add a todo with no assignment. A star marks a todo on that assignment’s stripe. Checking a todo does not complete the assignment. Checking an assignment completes it and every todo on it. |
| 5 | [Completion and Unfinished Filter](../features/feature-5-completion-and-filter.md) | **Unfinished** and **All** on the assignment list, the todo list, and the calendar. A calendar day dialog uses Feature 4’s completion actions. |

Implement in that order, each on its own `feature/N-…` branch from `dev`.

## Screens

The menu, once Feature 4 is in place, links to:

*   **Calendar** (`/`) — home page. **Calendar** tab is the month of stripes. **Todos** lists day todos. Feature 5 adds the unfinished filter and a day dialog here.
*   **Assignments** (`/assignments`) — assignment table, including **Complete assignment**. Feature 5 adds **Unfinished** and **All**.
*   **Todos** — opens the calendar **Todos** tab. Feature 5 adds **Unfinished** and **All**.
*   **Classes** (`/classes`) — class table

Each of the first three opens showing **All**. **Unfinished** hides completed assignments (list and stripes) or completed todos (todo list and stars). The day dialog still lists every todo on that date, so a finished todo can be unchecked.

## Completion rules

*   Checking a todo changes only that todo. The assignment stays as it was, even if that was the last open todo.
*   Unchecking a todo changes only that todo. A completed assignment stays completed.
*   Checking an assignment marks the assignment completed and marks every one of its day todos completed.
*   Unchecking an assignment marks only the assignment not completed. Its day todos stay as they were.
*   Saving a new set of days keeps the finished flag on days that remain, and new days start unfinished.

## Calendar stripe rules

Due time does not change which days are drawn. The stripe uses the class color. A star is drawn only on a stripe day that has a day todo. A todo on a day with no stripe is stored and can be finished from the todo list, and it does not get a star.

## Entity relationship diagram

```mermaid
erDiagram
  Class ||--o{ Assignment : has
  Assignment ||--o{ DayTodo : has

  Class {
    int id PK
    string name
    string color
  }

  Assignment {
    int id PK
    int classId FK
    string name
    date dueDate
    string dueTime
    date startWorkingBy
    boolean completed
  }

  DayTodo {
    int id PK
    int assignmentId FK
    date todoDate
    boolean completed
  }
```

`Class.color` is one of the eight named colors. `Assignment.dueDate`, `Assignment.dueTime`, and `Assignment.startWorkingBy` are optional. `dueTime` is allowed only when `dueDate` is set. When both dates are set, `startWorkingBy` is on or before `dueDate`. A class cannot be deleted while an assignment points at it. Deleting an assignment deletes its day todos. `completed` on both tables is added by Feature 4 and defaults to false.

## Where to read the detail

Stories, rules, API shapes, screens, and Gherkin live in the feature files linked above. The catalog is [features/README.md](../features/README.md).
