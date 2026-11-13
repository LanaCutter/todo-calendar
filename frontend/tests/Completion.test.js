/**
 * Feature 5 — Unfinished Filter and Day Dialog
 * Spec: features/feature-5-completion-and-filter.md
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Assignments from "../src/views/Assignments.vue";
import Calendar from "../src/views/Calendar.vue";
import assignmentServices from "../src/services/assignmentServices.js";
import classServices from "../src/services/classServices.js";
import dayTodoServices from "../src/services/dayTodoServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/assignmentServices.js", () => ({
  default: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    replaceDayTodos: vi.fn(),
    setCompleted: vi.fn(),
  },
}));

vi.mock("../src/services/classServices.js", () => ({
  default: {
    getAll: vi.fn(),
  },
}));

vi.mock("../src/services/dayTodoServices.js", () => ({
  default: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    setCompleted: vi.fn(),
  },
}));

const dialogStub = {
  props: ["modelValue"],
  template: '<div v-if="modelValue" class="dialog-stub"><slot /></div>',
};

const biology = { id: 1, name: "Biology", color: "green" };
const history = { id: 2, name: "History", color: "maroon" };

function assignment(overrides) {
  return {
    id: 1,
    name: "Lab report",
    classId: 1,
    class: biology,
    dueDate: null,
    dueTime: null,
    startWorkingBy: null,
    completed: false,
    dayTodos: [],
    ...overrides,
  };
}

function listItem(overrides) {
  return {
    id: 1,
    date: "2026-11-12",
    name: "Lab report",
    assignmentId: 1,
    class: biology,
    completed: false,
    ...overrides,
  };
}

let wrapper;

async function mountAssignments(rows) {
  assignmentServices.getAll.mockResolvedValue({ data: rows });
  classServices.getAll.mockResolvedValue({ data: [biology, history] });
  const mounted = await mountWithPlugins(Assignments, {
    attachTo: document.body,
    global: { stubs: { VDialog: dialogStub } },
  });
  wrapper = mounted.wrapper;
  await flushPromises();
  return wrapper;
}

async function mountCalendar(rows, todos = []) {
  assignmentServices.getAll.mockResolvedValue({ data: rows });
  dayTodoServices.getAll.mockResolvedValue({ data: todos });
  classServices.getAll.mockResolvedValue({ data: [biology, history] });
  const mounted = await mountWithPlugins(Calendar, {
    props: { showing: "2026-11" },
    attachTo: document.body,
    global: { stubs: { VDialog: dialogStub } },
  });
  wrapper = mounted.wrapper;
  await flushPromises();
  return wrapper;
}

async function choose(root, scope, label) {
  const button = root
    .find(`[data-filter="${scope}"]`)
    .findAll("button")
    .find((item) => item.text().trim() === label);
  expect(button, `${scope} ${label}`).toBeTruthy();
  await button.trigger("click");
  await flushPromises();
}

async function openTodosTab(root) {
  const todos = root.findAll(".v-tab").find((item) => item.text().trim() === "Todos");
  await todos.trigger("click");
  await flushPromises();
}

function stripe(root, id, iso) {
  return root.find(`.assignment-stripe[data-assignment-id="${id}"][data-date="${iso}"]`);
}

function checkbox(root, className) {
  return root.findAllComponents({ name: "VCheckboxBtn" }).find((item) => item.classes().includes(className));
}

describe("Feature 5 — Unfinished Filter and Day Dialog", () => {
  beforeEach(() => {
    assignmentServices.getAll.mockReset();
    assignmentServices.setCompleted.mockReset();
    classServices.getAll.mockReset();
    dayTodoServices.getAll.mockReset();
    dayTodoServices.setCompleted.mockReset();
    assignmentServices.getAll.mockResolvedValue({ data: [] });
    assignmentServices.setCompleted.mockResolvedValue({ data: assignment() });
    classServices.getAll.mockResolvedValue({ data: [biology] });
    dayTodoServices.getAll.mockResolvedValue({ data: [] });
    dayTodoServices.setCompleted.mockResolvedValue({ data: listItem({ completed: true, assignmentCompleted: false }) });
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    document.body.innerHTML = "";
  });

  describe("US-5.1 — Show unfinished items or everything", () => {
    it("User shows only unfinished assignments", async () => {
      const page = await mountAssignments([
        assignment({ completed: true }),
        assignment({ id: 2, name: "Essay", classId: 2, class: history, completed: false }),
      ]);

      const unfinished = page.find('[data-filter="assignments"]').findAll("button").find((item) => item.text().trim() === "Unfinished");
      expect(unfinished.classes()).toContain("v-btn--active");
      const names = page.findAll(".assignment-row").map((row) => row.text());
      expect(names.join(" ")).toContain("Essay");
      expect(names.join(" ")).not.toContain("Lab report");
    });

    it("User shows all assignments including completed ones", async () => {
      const page = await mountAssignments([
        assignment({ completed: true }),
        assignment({ id: 2, name: "Essay", classId: 2, class: history, completed: false }),
      ]);

      await choose(page, "assignments", "All");

      const all = page.find('[data-filter="assignments"]').findAll("button").find((item) => item.text().trim() === "All");
      expect(all.classes()).toContain("v-btn--active");
      const names = page.findAll(".assignment-row").map((row) => row.text());
      expect(names.join(" ")).toContain("Essay");
      expect(names.join(" ")).toContain("Lab report");
    });

    it("User shows only unfinished todos", async () => {
      const page = await mountCalendar(
        [],
        [
          listItem({ completed: true }),
          listItem({ id: 2, date: "2026-11-13", name: "Essay", assignmentId: 2, class: history, completed: false }),
        ],
      );

      await openTodosTab(page);

      const unfinished = page.find('[data-filter="todos"]').findAll("button").find((item) => item.text().trim() === "Unfinished");
      expect(unfinished.classes()).toContain("v-btn--active");
      const rows = page.findAll(".todo-row").map((row) => row.text());
      expect(rows.join(" ")).toContain("Essay");
      expect(rows.join(" ")).not.toContain("Lab report");
    });

    it("User shows all todos", async () => {
      const page = await mountCalendar(
        [],
        [
          listItem({ completed: true }),
          listItem({ id: 2, date: "2026-11-13", name: "Essay", assignmentId: 2, class: history, completed: false }),
        ],
      );

      await openTodosTab(page);
      await choose(page, "todos", "All");

      const all = page.find('[data-filter="todos"]').findAll("button").find((item) => item.text().trim() === "All");
      expect(all.classes()).toContain("v-btn--active");
      const rows = page.findAll(".todo-row").map((row) => row.text());
      expect(rows.join(" ")).toContain("Lab report");
      expect(rows.join(" ")).toContain("Essay");
    });

    it("User shows only unfinished assignments on the calendar", async () => {
      const page = await mountCalendar([
        assignment({
          completed: true,
          startWorkingBy: "2026-11-09",
          dueDate: "2026-11-13",
        }),
        assignment({
          id: 2,
          name: "Essay",
          class: history,
          completed: false,
          dueDate: "2026-11-18",
        }),
      ]);

      await choose(page, "calendar", "Unfinished");

      expect(page.find('[data-assignment-id="2"]').exists()).toBe(true);
      expect(page.find('[data-assignment-id="1"]').exists()).toBe(false);
    });

    it("User hides a finished todo star on the unfinished calendar", async () => {
      const page = await mountCalendar([
        assignment({
          completed: false,
          startWorkingBy: "2026-11-09",
          dueDate: "2026-11-13",
          dayTodos: [
            { date: "2026-11-11", completed: false },
            { date: "2026-11-12", completed: true },
          ],
        }),
      ]);

      await choose(page, "calendar", "Unfinished");

      expect(stripe(page, 1, "2026-11-12").exists()).toBe(true);
      expect(stripe(page, 1, "2026-11-12").find(".todo-star").exists()).toBe(false);
      expect(stripe(page, 1, "2026-11-11").find(".todo-star").exists()).toBe(true);
    });

    it("User sees no unfinished assignments", async () => {
      const page = await mountAssignments([
        assignment({ completed: true }),
        assignment({ id: 2, name: "Essay", completed: true }),
      ]);

      await choose(page, "assignments", "Unfinished");

      expect(page.text()).toContain("No unfinished assignments.");
    });
  });

  describe("US-5.2 — Finish work from a calendar day", () => {
    it("User finishes a todo from the day dialog", async () => {
      const todo = listItem();
      dayTodoServices.setCompleted.mockResolvedValue({
        data: { ...todo, completed: true, assignmentCompleted: false },
      });
      const page = await mountCalendar(
        [assignment({ startWorkingBy: "2026-11-12", dueDate: "2026-11-12", dayTodos: [{ date: "2026-11-12", completed: false }] })],
        [todo],
      );

      await page.find('[data-iso="2026-11-12"]').trigger("click");
      await flushPromises();
      const dialog = page.find(".day-dialog");
      const finish = checkbox(dialog, "finish-todo");
      await finish.vm.$emit("update:modelValue", true);
      await flushPromises();

      expect(dialog.exists()).toBe(true);
      expect(dayTodoServices.setCompleted).toHaveBeenCalledWith(1, { completed: true });
      expect(checkbox(dialog, "finish-todo").props("modelValue")).toBe(true);
      expect(checkbox(dialog, "complete-assignment").props("modelValue")).toBe(false);
    });

    it("User marks the assignment completed from the day dialog", async () => {
      const lab = assignment({
        dayTodos: [
          { date: "2026-11-12", completed: false },
          { date: "2026-11-14", completed: false },
        ],
      });
      const todos = [
        listItem({ id: 1, date: "2026-11-12" }),
        listItem({ id: 2, date: "2026-11-14" }),
      ];
      assignmentServices.setCompleted.mockResolvedValue({
        data: {
          ...lab,
          completed: true,
          dayTodos: [
            { date: "2026-11-12", completed: true },
            { date: "2026-11-14", completed: true },
          ],
        },
      });
      const page = await mountCalendar([lab], todos);

      await page.find('[data-iso="2026-11-12"]').trigger("click");
      await flushPromises();
      await checkbox(page.find(".day-dialog"), "complete-assignment").vm.$emit("update:modelValue", true);
      await flushPromises();

      const open = page.find(".day-dialog");
      expect(assignmentServices.setCompleted).toHaveBeenCalledWith(1, { completed: true });
      expect(checkbox(open, "complete-assignment").props("modelValue")).toBe(true);
      expect(checkbox(open, "finish-todo").props("modelValue")).toBe(true);

      await open.findAll("button").find((item) => item.text().trim() === "Close").trigger("click");
      await page.find('[data-iso="2026-11-14"]').trigger("click");
      await flushPromises();
      expect(checkbox(page.find(".day-dialog"), "finish-todo").props("modelValue")).toBe(true);
    });

    it("User opens a day that has no todos", async () => {
      const page = await mountCalendar([]);

      await page.find('[data-iso="2026-11-02"]').trigger("click");
      await flushPromises();

      expect(page.find(".day-dialog").text()).toContain("No todos on this day.");
    });

    it("User still sees a finished todo in the day dialog while unfinished is selected", async () => {
      const page = await mountCalendar(
        [assignment({ completed: false, dueDate: "2026-11-12", dayTodos: [{ date: "2026-11-12", completed: true }] })],
        [listItem({ completed: true })],
      );

      await choose(page, "calendar", "Unfinished");
      await page.find('[data-iso="2026-11-12"]').trigger("click");
      await flushPromises();

      expect(page.find(".day-dialog").text()).toContain("Lab report");
    });

    it("User does not see complete assignment on a todo with no assignment", async () => {
      const page = await mountCalendar(
        [],
        [listItem({ id: 5, name: "Buy a notebook", date: "2026-11-15", assignmentId: null, class: null })],
      );

      await page.find('[data-iso="2026-11-15"]').trigger("click");
      await flushPromises();

      const dialog = page.find(".day-dialog");
      expect(checkbox(dialog, "finish-todo")).toBeTruthy();
      expect(dialog.text()).not.toContain("Complete assignment");
      expect(checkbox(dialog, "complete-assignment")).toBeUndefined();
    });
  });
});
