/**
 * Feature 1 — Class Management
 * Spec: features/feature-1-class-management.md
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Classes from "../src/views/Classes.vue";
import classServices from "../src/services/classServices.js";
import { mountWithPlugins } from "./testUtils.js";

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

async function mountClasses() {
  const mounted = await mountWithPlugins(Classes, {
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

describe("Feature 1 — Class Management", () => {
  beforeEach(() => {
    classServices.getAll.mockReset();
    classServices.create.mockReset();
    classServices.update.mockReset();
    classServices.remove.mockReset();
    classServices.getAll.mockResolvedValue({ data: [] });
  });

  describe("US-1.1 — Add a class", () => {
    it("User adds a class with a name and color", async () => {
      const created = { id: 1, name: "Biology", color: "green" };
      classServices.getAll
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [created] });
      classServices.create.mockResolvedValue({ data: created });

      const { wrapper } = await mountClasses();
      await clickLabel(wrapper, "Add class");

      await wrapper.findComponent({ name: "VTextField" }).setValue("Biology");
      await wrapper.findComponent({ name: "VSelect" }).setValue("green");
      await clickLabel(wrapper, "Save");

      expect(classServices.create).toHaveBeenCalledWith({ name: "Biology", color: "green" });
      const row = wrapper.find(".class-row");
      expect(row.text()).toContain("Biology");
      expect(row.find(".class-swatch").attributes("data-color")).toBe("green");
    });

    it("User adds a class with an empty name", async () => {
      const { wrapper } = await mountClasses();
      await clickLabel(wrapper, "Add class");
      await wrapper.findComponent({ name: "VSelect" }).setValue("green");
      await clickLabel(wrapper, "Save");

      expect(classServices.create).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Name is required.");
    });

    it("User adds a class without a color", async () => {
      const { wrapper } = await mountClasses();
      await clickLabel(wrapper, "Add class");
      await wrapper.findComponent({ name: "VTextField" }).setValue("Biology");
      await clickLabel(wrapper, "Save");

      expect(classServices.create).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Choose a color from the list.");
    });
  });

  describe("US-1.2 — View classes", () => {
    it("User sees classes in name order", async () => {
      classServices.getAll.mockResolvedValue({
        data: [
          { id: 2, name: "algebra", color: "blue" },
          { id: 1, name: "Chemistry", color: "maroon" },
        ],
      });

      const { wrapper } = await mountClasses();
      const rows = wrapper.findAll(".class-row");

      expect(rows[0].text()).toContain("algebra");
      expect(rows[0].find(".class-swatch").attributes("data-color")).toBe("blue");
      expect(rows[1].text()).toContain("Chemistry");
      expect(rows[1].find(".class-swatch").attributes("data-color")).toBe("maroon");
    });

    it("User sees an empty class list", async () => {
      const { wrapper } = await mountClasses();
      expect(wrapper.text()).toContain("No classes yet. Add your first class.");
    });
  });

  describe("US-1.3 — Edit a class", () => {
    it("User edits a class name and color", async () => {
      const original = { id: 1, name: "Biology", color: "green" };
      const updated = { id: 1, name: "Chemistry", color: "blue" };
      classServices.getAll
        .mockResolvedValueOnce({ data: [original] })
        .mockResolvedValueOnce({ data: [updated] });
      classServices.update.mockResolvedValue({ data: updated });

      const { wrapper } = await mountClasses();
      await clickLabel(wrapper, "Edit class");
      await wrapper.findComponent({ name: "VTextField" }).setValue("Chemistry");
      await wrapper.findComponent({ name: "VSelect" }).setValue("blue");
      await clickLabel(wrapper, "Save");

      expect(classServices.update).toHaveBeenCalledWith(1, { name: "Chemistry", color: "blue" });
      const row = wrapper.find(".class-row");
      expect(row.text()).toContain("Chemistry");
      expect(row.find(".class-swatch").attributes("data-color")).toBe("blue");
    });
  });

  describe("US-1.4 — Delete a class", () => {
    it("User deletes a class", async () => {
      classServices.getAll
        .mockResolvedValueOnce({ data: [{ id: 1, name: "Biology", color: "green" }] })
        .mockResolvedValueOnce({ data: [] });
      classServices.remove.mockResolvedValue({ data: { message: "Class deleted." } });

      const { wrapper } = await mountClasses();
      await clickLabel(wrapper, "Delete class");
      expect(wrapper.text()).toContain("Delete this class?");
      await clickLabel(wrapper, "Delete");

      expect(classServices.remove).toHaveBeenCalledWith(1);
      expect(wrapper.text()).not.toContain("Biology");
    });

    it("User cancels deleting a class", async () => {
      classServices.getAll.mockResolvedValue({
        data: [{ id: 1, name: "Biology", color: "green" }],
      });

      const { wrapper } = await mountClasses();
      await clickLabel(wrapper, "Delete class");
      await clickLabel(wrapper, "Cancel");

      expect(classServices.remove).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Biology");
    });
  });
});
