/**
 * Feature 4 — Assignment Day Todos
 * Spec: features/feature-4-assignment-day-todos.md
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import App from "../src/App.vue";
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

const stubs = { VDialog: dialogStub };
let wrapper;

async function mountAssignments(rows) {
  assignmentServices.getAll.mockResolvedValue({ data: rows });
  const mounted = await mountWithPlugins(Assignments, {
    attachTo: document.body,
    global: { stubs },
  });
  wrapper = mounted.wrapper;
  await flushPromises();
  return wrapper;
}

async function mountCalendar(rows, todos = []) {
  assignmentServices.getAll.mockResolvedValue({ data: rows });
  dayTodoServices.getAll.mockResolvedValue({ data: todos });
  classServices.getAll.mockResolvedValue({ data: [biology] });
  const mounted = await mountWithPlugins(Calendar, {
    props: { showing: "2026-11" },
    attachTo: document.body,
    global: { stubs },
  });
  wrapper = mounted.wrapper;
  await flushPromises();
  return wrapper;
}

async function mountApp(path) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "calendar", component: Calendar },
      { path: "/assignments", name: "assignments", component: Assignments },
      { path: "/classes", name: "classes", component: { template: "<div>Classes</div>" } },
    ],
  });
  await router.push(path);
  await router.isReady();
  const mounted = await mountWithPlugins(App, {
    router,
    attachTo: document.body,
    global: { stubs },
  });
  wrapper = mounted.wrapper;
  await flushPromises();
  return { wrapper, router };
}

function buttonByLabel(root, label) {
  return root.findAll("button").find((button) => {
    return button.attributes("aria-label") === label || button.text().trim() === label;
  });
}

async function clickLabel(root, label) {
  const button = buttonByLabel(root, label);
  expect(button, label).toBeTruthy();
  await button.trigger("click");
  await flushPromises();
}

async function openTodosTab(root) {
  const todos = root.findAll(".v-tab").find((item) => item.text().trim() === "Todos");
  expect(todos).toBeTruthy();
  await todos.trigger("click");
  await flushPromises();
}

function stripe(root, id, iso) {
  return root.find(`.assignment-stripe[data-assignment-id="${id}"][data-date="${iso}"]`);
}

describe("Feature 4 — Assignment Day Todos", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 12));
    assignmentServices.getAll.mockReset();
    assignmentServices.replaceDayTodos.mockReset();
    assignmentServices.setCompleted.mockReset();
    classServices.getAll.mockReset();
    dayTodoServices.getAll.mockReset();
    dayTodoServices.create.mockReset();
    dayTodoServices.update.mockReset();
    dayTodoServices.remove.mockReset();
    dayTodoServices.setCompleted.mockReset();
    assignmentServices.getAll.mockResolvedValue({ data: [] });
    assignmentServices.replaceDayTodos.mockResolvedValue({ data: { dates: [] } });
    assignmentServices.setCompleted.mockResolvedValue({ data: assignment() });
    classServices.getAll.mockResolvedValue({ data: [biology] });
    dayTodoServices.getAll.mockResolvedValue({ data: [] });
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  describe("US-4.1 — Choose days for an assignment’s todos", () => {
    it("User saves one day as a todo", async () => {
      const lab = assignment();
      assignmentServices.getAll.mockResolvedValue({ data: [lab] });
      const page = await mountAssignments([lab]);
      assignmentServices.replaceDayTodos.mockImplementation(async (_id, body) => {
        lab.dayTodos = body.dates.map((date) => ({ date, completed: false }));
        assignmentServices.getAll.mockResolvedValue({ data: [lab] });
        return { data: { dates: body.dates } };
      });

      await clickLabel(page, "Create todo");
      await page.find('[data-date="2026-11-12"]').trigger("click");
      await clickLabel(page, "Save");

      expect(assignmentServices.replaceDayTodos).toHaveBeenCalledWith(1, { dates: ["2026-11-12"] });
      await clickLabel(page, "Create todo");
      expect(page.find('[data-date="2026-11-12"]').attributes("aria-pressed")).toBe("true");
    });

    it("User selects days in two months and saves both", async () => {
      const page = await mountAssignments([assignment()]);

      await clickLabel(page, "Create todo");
      await page.find('[data-date="2026-11-12"]').trigger("click");
      await clickLabel(page, "Next month");
      await page.find('[data-date="2026-12-01"]').trigger("click");
      await clickLabel(page, "Save");

      const dates = assignmentServices.replaceDayTodos.mock.calls[0][1].dates;
      expect(dates).toContain("2026-11-12");
      expect(dates).toContain("2026-12-01");
    });

    it("User cancels without changing todos", async () => {
      const lab = assignment({ dayTodos: [{ date: "2026-11-12", completed: false }] });
      const page = await mountAssignments([lab]);

      await clickLabel(page, "Create todo");
      await clickLabel(page, "Next month");
      await page.find('[data-date="2026-12-01"]').trigger("click");
      await clickLabel(page, "Cancel");

      expect(assignmentServices.replaceDayTodos).not.toHaveBeenCalled();
      await clickLabel(page, "Create todo");
      expect(page.find('[data-date="2026-11-12"]').attributes("aria-pressed")).toBe("true");
      expect(page.find('[data-date="2026-12-01"]').exists()).toBe(false);
    });
  });

  describe("US-4.2 — See todos in the todos list", () => {
    it("User sees an assignment todo on the todos list", async () => {
      const page = await mountCalendar(
        [assignment({ startWorkingBy: "2026-11-09", dueDate: "2026-11-13" })],
        [listItem()],
      );

      await openTodosTab(page);

      const rows = page.findAll(".todo-row");
      expect(rows).toHaveLength(1);
      expect(rows[0].text()).toContain("2026-11-12");
      expect(rows[0].text()).toContain("Lab report");
      expect(rows[0].text()).toContain("Biology");
    });

    it("User opens todos from the sidebar", async () => {
      assignmentServices.getAll.mockResolvedValue({ data: [] });
      const { wrapper: page, router } = await mountApp("/assignments");

      const link = page.findAll("a").find((item) => item.text().trim() === "Todos");
      expect(link).toBeTruthy();
      await link.trigger("click");
      await flushPromises();

      expect(router.currentRoute.value.path).toBe("/");
      expect(router.currentRoute.value.query.tab).toBe("todos");
      const tab = page.findAll(".v-tab").find((item) => item.text().trim() === "Todos");
      expect(tab.attributes("aria-selected")).toBe("true");
    });

    it("User sees a star on the stripe for a day with a todo", async () => {
      const page = await mountCalendar([
        assignment({
          startWorkingBy: "2026-11-09",
          dueDate: "2026-11-13",
          dayTodos: [{ date: "2026-11-12", completed: false }],
        }),
      ]);

      expect(stripe(page, 1, "2026-11-12").find(".todo-star").attributes("aria-label")).toBe("Todo");
      expect(stripe(page, 1, "2026-11-11").find(".todo-star").exists()).toBe(false);
    });

    it("User keeps a todo on a day that has no stripe", async () => {
      const reading = assignment({
        id: 2,
        name: "Reading",
        dayTodos: [{ date: "2026-11-04", completed: false }],
      });
      assignmentServices.getAll.mockResolvedValue({ data: [reading] });
      dayTodoServices.getAll.mockResolvedValue({
        data: [listItem({ id: 2, date: "2026-11-04", name: "Reading", assignmentId: 2 })],
      });
      const { wrapper: page } = await mountApp("/");

      expect(page.find(".todo-star").exists()).toBe(false);
      await openTodosTab(page);
      expect(page.find(".todo-row").text()).toContain("2026-11-04");
      expect(page.find(".todo-row").text()).toContain("Reading");

      const link = page.findAll("a").find((item) => item.text().trim() === "Assignments");
      await link.trigger("click");
      await flushPromises();
      await clickLabel(page, "Create todo");
      expect(page.find('[data-date="2026-11-04"]').attributes("aria-pressed")).toBe("true");
    });

    it("User sees a star only on the assignment that has the todo", async () => {
      const page = await mountCalendar([
        assignment({
          dueDate: "2026-11-13",
          dayTodos: [{ date: "2026-11-13", completed: false }],
        }),
        assignment({
          id: 2,
          name: "Quiz",
          dueDate: "2026-11-13",
          dayTodos: [],
        }),
      ]);

      expect(stripe(page, 1, "2026-11-13").find(".todo-star").exists()).toBe(true);
      expect(stripe(page, 2, "2026-11-13").find(".todo-star").exists()).toBe(false);
    });
  });

  describe("US-4.3 — Change the selected days", () => {
    it("User unselects a day and saving removes that todo", async () => {
      const lab = assignment({
        startWorkingBy: "2026-11-09",
        dueDate: "2026-11-13",
        dayTodos: [
          { date: "2026-11-11", completed: false },
          { date: "2026-11-12", completed: false },
        ],
      });
      let todos = [
        listItem({ id: 1, date: "2026-11-11" }),
        listItem({ id: 2, date: "2026-11-12" }),
      ];
      assignmentServices.getAll.mockResolvedValue({ data: [lab] });
      dayTodoServices.getAll.mockImplementation(() => Promise.resolve({ data: todos }));
      assignmentServices.replaceDayTodos.mockImplementation(async (_id, body) => {
        lab.dayTodos = body.dates.map((date) => ({ date, completed: false }));
        todos = body.dates.map((date, index) => listItem({ id: index + 1, date }));
        return { data: { dates: body.dates } };
      });
      const { wrapper: page } = await mountApp("/assignments");

      await clickLabel(page, "Create todo");
      await page.find('[data-date="2026-11-12"]').trigger("click");
      await clickLabel(page, "Save");

      expect(assignmentServices.replaceDayTodos.mock.calls[0][1].dates).toEqual(["2026-11-11"]);

      const link = page.findAll("a").find((item) => item.text().trim() === "Calendar");
      await link.trigger("click");
      await flushPromises();

      expect(stripe(page, 1, "2026-11-11").find(".todo-star").exists()).toBe(true);
      expect(stripe(page, 1, "2026-11-12").find(".todo-star").exists()).toBe(false);
      await openTodosTab(page);
      const listed = page.findAll(".todo-row").map((row) => row.text());
      expect(listed.join(" ")).not.toContain("2026-11-12");
      expect(listed.join(" ")).toContain("2026-11-11");
    });
  });

  describe("US-4.4 — Add a todo that is not an assignment", () => {
    it("User adds a todo that is not connected to an assignment", async () => {
      let todos = [];
      dayTodoServices.create.mockImplementation(async (body) => {
        todos = [listItem({ id: 5, name: body.name, date: body.date, assignmentId: null, class: null })];
        return { data: todos[0], status: 201 };
      });
      const page = await mountCalendar([]);
      dayTodoServices.getAll.mockImplementation(() => Promise.resolve({ data: todos }));

      await openTodosTab(page);
      await clickLabel(page, "Add todo");
      await page.find(".todo-name-field input").setValue("Buy a notebook");
      await page.find('[data-date="2026-11-15"]').trigger("click");
      await clickLabel(page, "Save");

      expect(dayTodoServices.create).toHaveBeenCalledWith({ name: "Buy a notebook", date: "2026-11-15" });
      const row = page.find(".todo-row");
      expect(row.text()).toContain("2026-11-15");
      expect(row.text()).toContain("Buy a notebook");
      expect(row.text()).not.toContain("Biology");
    });

    it("User edits a todo that is not connected to an assignment", async () => {
      let todos = [listItem({ id: 5, name: "Buy a notebook", date: "2026-11-15", assignmentId: null, class: null })];
      dayTodoServices.update.mockImplementation(async (_id, body) => {
        todos = [{ ...todos[0], name: body.name, date: body.date }];
        return { data: todos[0] };
      });
      const page = await mountCalendar([], todos);
      dayTodoServices.getAll.mockImplementation(() => Promise.resolve({ data: todos }));

      await openTodosTab(page);
      await clickLabel(page, "Edit todo");
      await page.find(".todo-name-field input").setValue("Buy pencils");
      await clickLabel(page, "Save");

      expect(dayTodoServices.update).toHaveBeenCalledWith(5, { name: "Buy pencils", date: "2026-11-15" });
      expect(page.find(".todo-row").text()).toContain("Buy pencils");
      expect(page.find(".todo-row").text()).toContain("2026-11-15");
    });

    it("User deletes a todo that is not connected to an assignment", async () => {
      let todos = [listItem({ id: 5, name: "Buy a notebook", date: "2026-11-15", assignmentId: null, class: null })];
      dayTodoServices.remove.mockImplementation(async () => {
        todos = [];
        return { data: { message: "Todo deleted." } };
      });
      const page = await mountCalendar([], todos);
      dayTodoServices.getAll.mockImplementation(() => Promise.resolve({ data: todos }));

      await openTodosTab(page);
      await clickLabel(page, "Delete todo");
      expect(page.text()).toContain("Delete this todo?");
      await clickLabel(page, "Delete");

      expect(dayTodoServices.remove).toHaveBeenCalledWith(5);
      expect(page.find(".todo-row").exists()).toBe(false);
      expect(page.text()).not.toContain("Buy a notebook");
    });
  });

  describe("US-4.6 — Complete a todo", () => {
    it("User finishes a todo from the todos list", async () => {
      const lab = assignment({
        startWorkingBy: "2026-11-12",
        dueDate: "2026-11-12",
        completed: false,
        dayTodos: [{ date: "2026-11-12", completed: false }],
      });
      const todo = listItem();
      dayTodoServices.getAll.mockResolvedValue({ data: [todo] });
      dayTodoServices.setCompleted.mockResolvedValue({
        data: { ...todo, completed: true, assignmentCompleted: false },
      });
      const page = await mountCalendar([lab], [todo]);

      await openTodosTab(page);
      const box = page.find(".todo-row").findComponent({ name: "VCheckboxBtn" });
      expect(box.exists()).toBe(true);
      await box.vm.$emit("update:modelValue", true);
      await flushPromises();

      expect(dayTodoServices.setCompleted).toHaveBeenCalledWith(1, { completed: true });
      expect(page.findAll(".todo-row td")[2].classes()).toContain("text-decoration-line-through");

      const calendarTab = page.findAll(".v-tab").find((item) => item.text().trim() === "Calendar");
      await calendarTab.trigger("click");
      await flushPromises();
      const name = stripe(page, 1, "2026-11-12").find(".stripe-name");
      expect(name.classes()).not.toContain("text-decoration-line-through");
    });
  });

  describe("US-4.7 — Complete an assignment", () => {
    it("User marks an assignment completed and its todos are completed", async () => {
      const lab = assignment({
        dayTodos: [
          { date: "2026-11-11", completed: false },
          { date: "2026-11-13", completed: false },
        ],
      });
      const completed = {
        ...lab,
        completed: true,
        dayTodos: [
          { date: "2026-11-11", completed: true },
          { date: "2026-11-13", completed: true },
        ],
      };
      assignmentServices.setCompleted.mockResolvedValue({ data: completed });
      const page = await mountAssignments([lab]);

      const box = page.find(".assignment-row").findComponent({ name: "VCheckboxBtn" });
      expect(box.exists()).toBe(true);
      await box.vm.$emit("update:modelValue", true);
      await flushPromises();

      expect(assignmentServices.setCompleted).toHaveBeenCalledWith(1, { completed: true });
      const name = page.find(".assignment-row").findAll("td")[1];
      expect(name.text()).toBe("Lab report");
      expect(name.classes()).toContain("text-decoration-line-through");
      expect(page.getComponent({ name: "VCheckboxBtn" }).props("modelValue")).toBe(true);
    });

    it("User sees a completed todo star", async () => {
      const page = await mountCalendar([
        assignment({
          startWorkingBy: "2026-11-09",
          dueDate: "2026-11-13",
          dayTodos: [{ date: "2026-11-12", completed: true }],
        }),
      ]);

      expect(stripe(page, 1, "2026-11-12").find(".todo-star").attributes("aria-label")).toBe("Todo completed");
    });
  });
});
