/**
 * Feature 3 — Assignment Calendar
 * Spec: features/feature-3-assignment-calendar.md
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
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
    ...overrides,
  };
}

async function mountCalendar(showing, rows = []) {
  assignmentServices.getAll.mockResolvedValue({ data: rows });
  const mounted = await mountWithPlugins(Calendar, { props: { showing } });
  await flushPromises();
  return mounted.wrapper;
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
  const mounted = await mountWithPlugins(App, { router });
  await flushPromises();
  return { ...mounted, router };
}

function stripeDates(wrapper, id) {
  return wrapper
    .findAll(".assignment-stripe")
    .filter((stripe) => stripe.attributes("data-assignment-id") === String(id))
    .map((stripe) => stripe.attributes("data-date"));
}

async function clickLink(wrapper, label) {
  const link = wrapper.findAll("a").find((item) => item.text().trim() === label);
  expect(link, label).toBeTruthy();
  const push = vi.spyOn(wrapper.vm.$router, "push");
  await link.trigger("click");
  if (push.mock.results[0]) {
    await push.mock.results[0].value;
  }
  push.mockRestore();
  await flushPromises();
}

async function clickLabel(wrapper, label) {
  const button = wrapper.findAll("button").find((item) => item.attributes("aria-label") === label);
  expect(button, label).toBeTruthy();
  await button.trigger("click");
  await flushPromises();
}

describe("Feature 3 — Assignment Calendar", () => {
  beforeEach(() => {
    assignmentServices.getAll.mockReset();
    classServices.getAll.mockReset();
    assignmentServices.getAll.mockResolvedValue({ data: [] });
    classServices.getAll.mockResolvedValue({ data: [biology] });
    dayTodoServices.getAll.mockResolvedValue({ data: [] });
  });

  describe("US-3.1 — Switch between table and calendar", () => {
    it("User opens the calendar from the menu", async () => {
      const { wrapper, router } = await mountApp("/assignments");
      await clickLink(wrapper, "Calendar");

      expect(router.currentRoute.value.path).toBe("/");
      expect(wrapper.find("h1").text()).toMatch(/^[A-Z][a-z]+ \d{4}$/);
      expect(wrapper.find(".month-grid").exists()).toBe(true);
    });

    it("User returns to the assignment table from the menu", async () => {
      const { wrapper, router } = await mountApp("/");
      await clickLink(wrapper, "Assignments");

      expect(router.currentRoute.value.path).toBe("/assignments");
      expect(wrapper.find("h1").text()).toBe("Assignments");
    });

    it("User does not see assignment days as todos", async () => {
      const wrapper = await mountCalendar("2026-11", [
        assignment({
          startWorkingBy: "2026-11-09",
          dueDate: "2026-11-13",
        }),
      ]);

      const todos = wrapper.findAll(".v-tab").find((item) => item.text().trim() === "Todos");
      expect(todos).toBeTruthy();
      await todos.trigger("click");
      await flushPromises();

      const panel = wrapper.find(".todos-empty");
      expect(panel.text()).toBe("No todos yet.");
      expect(wrapper.find(".todo-day").exists()).toBe(false);
      expect(panel.text()).not.toContain("Lab report");
    });
  });

  describe("US-3.2 — See assignment stripes", () => {
    it("User sees a stripe from start working by through the due date", async () => {
      const wrapper = await mountCalendar("2026-11", [
        assignment({
          startWorkingBy: "2026-11-09",
          dueDate: "2026-11-13",
        }),
      ]);

      const stripes = wrapper.findAll(".assignment-stripe");
      expect(stripeDates(wrapper, 1)).toEqual([
        "2026-11-09",
        "2026-11-10",
        "2026-11-11",
        "2026-11-12",
        "2026-11-13",
      ]);
      for (const stripe of stripes) {
        expect(stripe.attributes("data-assignment-id")).toBe("1");
        expect(stripe.attributes("data-color")).toBe("green");
      }
      expect(wrapper.find('[data-date="2026-11-09"].assignment-stripe').text()).toContain("Lab report");
      expect(wrapper.find('[data-date="2026-11-10"].assignment-stripe').text()).not.toContain("Lab report");
      expect(wrapper.find('[data-date="2026-11-13"].assignment-stripe').text()).toContain("Due");
      expect(wrapper.find('[data-date="2026-11-13"].assignment-stripe').text()).not.toContain("Lab report");
      const laneOn = (iso) =>
        wrapper.find(`[data-date="${iso}"].assignment-stripe`).element.closest(".lane").dataset.lane;
      expect(laneOn("2026-11-09")).toBe(laneOn("2026-11-13"));
      expect(wrapper.text()).not.toContain("No assignments on this month's calendar.");
    });

    it("User sees a one-day mark when only the due date is set", async () => {
      const wrapper = await mountCalendar("2026-11", [
        assignment({ id: 2, name: "Quiz", dueDate: "2026-11-18" }),
      ]);

      expect(stripeDates(wrapper, 2)).toEqual(["2026-11-18"]);
      expect(wrapper.findAll(".assignment-stripe")).toHaveLength(1);
    });

    it("User sees a one-day stripe when start and due are the same day", async () => {
      const wrapper = await mountCalendar("2026-11", [
        assignment({ id: 3, name: "Worksheet", startWorkingBy: "2026-11-11", dueDate: "2026-11-11" }),
      ]);

      expect(stripeDates(wrapper, 3)).toEqual(["2026-11-11"]);
    });

    it("User does not see an assignment that has only a start working by date", async () => {
      const wrapper = await mountCalendar("2026-11", [
        assignment({ id: 4, name: "Reading", startWorkingBy: "2026-11-02" }),
      ]);

      expect(wrapper.find(".assignment-stripe").exists()).toBe(false);
      expect(wrapper.text()).not.toContain("Reading");
    });

    it("User does not see an assignment that has neither date", async () => {
      const wrapper = await mountCalendar("2026-11", [assignment({ id: 5, name: "Notes" })]);

      expect(wrapper.find(".assignment-stripe").exists()).toBe(false);
      expect(wrapper.text()).not.toContain("Notes");
    });

    it("User sees the stripe continue on the next month", async () => {
      const wrapper = await mountCalendar("2026-11", [
        assignment({ id: 6, name: "Essay", startWorkingBy: "2026-11-28", dueDate: "2026-12-02" }),
      ]);

      expect(stripeDates(wrapper, 6)).toEqual(["2026-11-28", "2026-11-29", "2026-11-30"]);
      expect(wrapper.find('[data-date="2026-12-01"]').exists()).toBe(false);
    });

    it("User sees the rest of a stripe in the next month", async () => {
      const wrapper = await mountCalendar("2026-11", [
        assignment({ id: 6, name: "Essay", startWorkingBy: "2026-11-28", dueDate: "2026-12-02" }),
      ]);

      await clickLabel(wrapper, "Next month");

      expect(wrapper.find("h1").text()).toBe("December 2026");
      expect(stripeDates(wrapper, 6)).toEqual(["2026-12-01", "2026-12-02"]);
    });

    it("User sees two assignments on the same day", async () => {
      const wrapper = await mountCalendar("2026-11", [
        assignment({ startWorkingBy: "2026-11-09", dueDate: "2026-11-13" }),
        assignment({ id: 2, name: "Quiz", dueDate: "2026-11-13" }),
      ]);

      const day = wrapper.findAll('[data-date="2026-11-13"]');
      expect(day).toHaveLength(2);
      const lab = day.find((stripe) => stripe.attributes("data-assignment-id") === "1");
      const quiz = day.find((stripe) => stripe.attributes("data-assignment-id") === "2");
      expect(lab.text()).toContain("Due");
      expect(lab.text()).not.toContain("Lab report");
      expect(quiz.text()).toContain("Quiz");
      expect(lab.element.closest(".lane").dataset.lane).toBe(
        wrapper.find('[data-date="2026-11-09"][data-assignment-id="1"]').element.closest(".lane").dataset.lane,
      );
    });

    it("Due time does not change the stripe days", async () => {
      const wrapper = await mountCalendar("2026-11", [
        assignment({
          startWorkingBy: "2026-11-09",
          dueDate: "2026-11-13",
          dueTime: "09:00",
        }),
      ]);

      expect(stripeDates(wrapper, 1)).toEqual([
        "2026-11-09",
        "2026-11-10",
        "2026-11-11",
        "2026-11-12",
        "2026-11-13",
      ]);
    });

    it("User sees today marked on the calendar", async () => {
      const today = new Date();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      const iso = `${today.getFullYear()}-${month}-${day}`;
      const wrapper = await mountCalendar(`${today.getFullYear()}-${month}`, []);

      const marked = wrapper.find(".calendar-day.is-today");
      expect(marked.exists()).toBe(true);
      expect(marked.attributes("data-iso")).toBe(iso);
      expect(wrapper.findAll(".calendar-day.is-today")).toHaveLength(1);
    });

    it("User sees a color key for each class", async () => {
      classServices.getAll.mockResolvedValue({
        data: [biology, { id: 2, name: "History", color: "amber" }],
      });
      const wrapper = await mountCalendar("2026-11", []);

      const items = wrapper.findAll(".legend-item");
      expect(items.map((item) => item.text())).toEqual(["Biology", "History"]);
      expect(items[0].find(".legend-swatch").attributes("data-color")).toBe("green");
      expect(items[1].find(".legend-swatch").attributes("data-color")).toBe("amber");
    });

    it("User sees an empty month message when nothing is drawn", async () => {
      const wrapper = await mountCalendar("2026-12", [
        assignment({ startWorkingBy: "2026-11-09", dueDate: "2026-11-13" }),
      ]);

      expect(wrapper.find(".month-grid").exists()).toBe(true);
      expect(wrapper.find(".calendar-week").exists()).toBe(true);
      expect(wrapper.text()).toContain("No assignments on this month's calendar.");
      expect(wrapper.find(".assignment-stripe").exists()).toBe(false);
    });
  });
});
