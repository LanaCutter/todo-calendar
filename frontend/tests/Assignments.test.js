/**
 * Feature 2 — Assignment Management
 * Spec: features/feature-2-assignment-management.md
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Assignments from "../src/views/Assignments.vue";
import assignmentServices from "../src/services/assignmentServices.js";
import classServices from "../src/services/classServices.js";
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
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

const dialogStub = {
  props: ["modelValue"],
  template: '<div v-if="modelValue" class="dialog-stub"><slot /></div>',
};

const biology = { id: 1, name: "Biology", color: "green" };

async function mountAssignments() {
  const mounted = await mountWithPlugins(Assignments, {
    attachTo: document.body,
    global: {
      stubs: {
        VDialog: dialogStub,
      },
    },
  });
  await flushPromises();
  return mounted;
}

function buttonByLabel(wrapper, label) {
  return wrapper.findAll("button").find((button) => {
    return button.attributes("aria-label") === label || button.text().trim() === label;
  });
}

async function clickLabel(wrapper, label) {
  const button = buttonByLabel(wrapper, label);
  expect(button, label).toBeTruthy();
  await button.trigger("click");
  await flushPromises();
}

describe("Feature 2 — Assignment Management", () => {
  beforeEach(() => {
    assignmentServices.getAll.mockReset();
    assignmentServices.create.mockReset();
    assignmentServices.update.mockReset();
    assignmentServices.remove.mockReset();
    classServices.getAll.mockReset();
    assignmentServices.getAll.mockResolvedValue({ data: [] });
    classServices.getAll.mockResolvedValue({ data: [biology] });
  });

  describe("US-2.1 — Enter an assignment", () => {
    it("User enters an assignment with a name and class", async () => {
      const created = {
        id: 1,
        name: "Lab report",
        classId: 1,
        class: biology,
        dueDate: null,
        dueTime: null,
        startWorkingBy: null,
      };
      assignmentServices.getAll.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({ data: [created] });
      assignmentServices.create.mockResolvedValue({ data: created });

      const { wrapper } = await mountAssignments();
      await clickLabel(wrapper, "Add assignment");
      const fields = wrapper.findAllComponents({ name: "VTextField" });
      await fields[0].setValue("Lab report");
      await wrapper.findComponent({ name: "VSelect" }).setValue(1);
      await clickLabel(wrapper, "Save");

      expect(assignmentServices.create).toHaveBeenCalledWith({
        name: "Lab report",
        classId: 1,
        startWorkingBy: null,
        dueDate: null,
        dueTime: null,
      });
      const row = wrapper.find(".assignment-row");
      expect(row.text()).toContain("Lab report");
      expect(row.text()).toContain("Biology");
    });

    it("User enters an assignment with an empty name", async () => {
      const { wrapper } = await mountAssignments();
      await clickLabel(wrapper, "Add assignment");
      await wrapper.findComponent({ name: "VSelect" }).setValue(1);
      await clickLabel(wrapper, "Save");

      expect(assignmentServices.create).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Name is required.");
    });

    it("User enters an assignment when no class exists", async () => {
      classServices.getAll.mockResolvedValue({ data: [] });

      const { wrapper } = await mountAssignments();
      await clickLabel(wrapper, "Add assignment");
      await clickLabel(wrapper, "Save");

      expect(assignmentServices.create).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Add a class before creating an assignment.");
    });
  });

  describe("US-2.2 — View assignments in a table", () => {
    it("User sees assignments soonest due date first", async () => {
      assignmentServices.getAll.mockResolvedValue({
        data: [
          { id: 2, name: "Essay", classId: 1, class: biology, dueDate: "2026-11-10", dueTime: null, startWorkingBy: null },
          {
            id: 1,
            name: "Lab report",
            classId: 1,
            class: biology,
            dueDate: "2026-11-20",
            dueTime: null,
            startWorkingBy: null,
          },
        ],
      });

      const { wrapper } = await mountAssignments();
      const rows = wrapper.findAll(".assignment-row");
      expect(rows[0].text()).toContain("Essay");
      expect(rows[1].text()).toContain("Lab report");
    });

    it("User sees an empty assignment table", async () => {
      const { wrapper } = await mountAssignments();
      expect(wrapper.text()).toContain("No assignments yet. Add your first assignment.");
    });

    it("User sees the class color and name on the row", async () => {
      assignmentServices.getAll.mockResolvedValue({
        data: [
          {
            id: 1,
            name: "Lab report",
            classId: 1,
            class: biology,
            dueDate: null,
            dueTime: null,
            startWorkingBy: null,
          },
        ],
      });

      const { wrapper } = await mountAssignments();
      const row = wrapper.find(".assignment-row");
      expect(row.text()).toContain("Biology");
      expect(row.find(".class-swatch").attributes("data-color")).toBe("green");
    });
  });

  describe("US-2.3 — Edit an assignment", () => {
    it("User edits an assignment", async () => {
      const original = {
        id: 1,
        name: "Lab report",
        classId: 1,
        class: biology,
        dueDate: "2026-11-20",
        dueTime: null,
        startWorkingBy: null,
      };
      const updated = { ...original, dueDate: "2026-11-22", dueTime: "18:00" };
      assignmentServices.getAll.mockResolvedValueOnce({ data: [original] }).mockResolvedValueOnce({ data: [updated] });
      assignmentServices.update.mockResolvedValue({ data: updated });

      const { wrapper } = await mountAssignments();
      await clickLabel(wrapper, "Edit assignment");
      const textFields = wrapper.findAllComponents({ name: "VTextField" });
      const due = textFields.find((field) => field.classes().includes("assignment-due-field"));
      const time = textFields.find((field) => field.classes().includes("assignment-time-field"));
      await due.setValue("2026-11-22");
      await time.setValue("18:00");
      await clickLabel(wrapper, "Save");

      expect(assignmentServices.update).toHaveBeenCalledWith(1, {
        name: "Lab report",
        classId: 1,
        startWorkingBy: null,
        dueDate: "2026-11-22",
        dueTime: "18:00",
      });
      expect(wrapper.find('.date-heading[data-date="2026-11-22"]').exists()).toBe(true);
      expect(wrapper.find(".assignment-row").text()).toContain("18:00");
    });
  });

  describe("US-2.4 — Delete an assignment", () => {
    it("User deletes an assignment", async () => {
      const row = {
        id: 1,
        name: "Lab report",
        classId: 1,
        class: biology,
        dueDate: null,
        dueTime: null,
        startWorkingBy: null,
      };
      assignmentServices.getAll.mockResolvedValueOnce({ data: [row] }).mockResolvedValueOnce({ data: [] });
      assignmentServices.remove.mockResolvedValue({ data: { message: "Assignment deleted." } });

      const { wrapper } = await mountAssignments();
      await clickLabel(wrapper, "Delete assignment");
      expect(wrapper.text()).toContain("Delete this assignment?");
      await clickLabel(wrapper, "Delete");

      expect(assignmentServices.remove).toHaveBeenCalledWith(1);
      expect(wrapper.text()).not.toContain("Lab report");
    });

    it("User cancels deleting an assignment", async () => {
      assignmentServices.getAll.mockResolvedValue({
        data: [
          {
            id: 1,
            name: "Lab report",
            classId: 1,
            class: biology,
            dueDate: null,
            dueTime: null,
            startWorkingBy: null,
          },
        ],
      });

      const { wrapper } = await mountAssignments();
      await clickLabel(wrapper, "Delete assignment");
      await clickLabel(wrapper, "Cancel");

      expect(assignmentServices.remove).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Lab report");
    });
  });
});
