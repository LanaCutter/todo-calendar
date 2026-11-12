/**
 * Feature 4 — Assignment Day Todos
 * Spec: features/feature-4-assignment-day-todos.md
 */
import request from "supertest";
import app from "../server.js";
import { syncTestDatabase } from "./helpers.js";

async function createClass(name = "Biology", color = "green") {
  const response = await request(app).post("/api/classes").send({ name, color });
  expect(response.status).toBe(201);
  return response.body;
}

async function createAssignment(classId, overrides = {}) {
  const response = await request(app).post("/api/assignments").send({
    name: "Lab report",
    classId,
    ...overrides,
  });
  expect(response.status).toBe(201);
  return response.body;
}

describe("Feature 4 — Assignment Day Todos", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-4.1 — Choose days for an assignment’s todos", () => {
    it("User saves one day as a todo", async () => {
      const course = await createClass();
      const assignment = await createAssignment(course.id);

      const response = await request(app).put(`/api/assignments/${assignment.id}/day-todos`).send({
        dates: ["2026-11-12"],
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ dates: ["2026-11-12"] });

      const listed = await request(app).get("/api/assignments");
      const row = listed.body.find((item) => item.id === assignment.id);
      expect(row.dayTodos).toEqual([{ date: "2026-11-12", completed: false }]);
      expect(row.completed).toBe(false);
    });

    it("User saves several days as todos for the same assignment", async () => {
      const course = await createClass();
      const assignment = await createAssignment(course.id);

      const response = await request(app).put(`/api/assignments/${assignment.id}/day-todos`).send({
        dates: ["2026-11-12", "2026-11-10", "2026-12-01"],
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ dates: ["2026-11-10", "2026-11-12", "2026-12-01"] });

      const listed = await request(app).get("/api/assignments");
      const row = listed.body.find((item) => item.id === assignment.id);
      expect(row.dayTodos.map((item) => item.date)).toEqual(["2026-11-10", "2026-11-12", "2026-12-01"]);
    });

    it("User saves todos for an assignment that does not exist", async () => {
      const response = await request(app).put("/api/assignments/99/day-todos").send({
        dates: ["2026-11-12"],
      });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: "Assignment with id=99 not found." });
    });

    it("User sends a date that is not a calendar date", async () => {
      const course = await createClass();
      const assignment = await createAssignment(course.id);
      await request(app).put(`/api/assignments/${assignment.id}/day-todos`).send({ dates: ["2026-11-12"] });

      const response = await request(app).put(`/api/assignments/${assignment.id}/day-todos`).send({
        dates: ["2026-11-31"],
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Enter a valid date." });

      const listed = await request(app).get("/api/assignments");
      expect(listed.body[0].dayTodos).toEqual([{ date: "2026-11-12", completed: false }]);
    });

    it("User sends duplicate dates", async () => {
      const course = await createClass();
      const assignment = await createAssignment(course.id);

      const response = await request(app).put(`/api/assignments/${assignment.id}/day-todos`).send({
        dates: ["2026-11-12", "2026-11-12"],
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ dates: ["2026-11-12"] });
    });

    it("User replaces day todos with an id that is not a number", async () => {
      const response = await request(app).put("/api/assignments/abc/day-todos").send({
        dates: ["2026-11-12"],
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Assignment id must be a number." });
    });

    it("User sends dates that are not a list", async () => {
      const course = await createClass();
      const assignment = await createAssignment(course.id);

      const response = await request(app).put(`/api/assignments/${assignment.id}/day-todos`).send({
        dates: "2026-11-12",
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Dates are required." });
    });
  });

  describe("US-4.2 — See todos in the todos list", () => {
    it("User keeps a todo on a day that has no stripe", async () => {
      const course = await createClass();
      const assignment = await createAssignment(course.id, { name: "Reading" });

      await request(app).put(`/api/assignments/${assignment.id}/day-todos`).send({ dates: ["2026-11-04"] });

      const listed = await request(app).get("/api/assignments");
      expect(listed.body[0].dueDate).toBeNull();
      expect(listed.body[0].dayTodos).toEqual([{ date: "2026-11-04", completed: false }]);

      const todos = await request(app).get("/api/day-todos");
      expect(todos.body).toEqual([
        expect.objectContaining({
          date: "2026-11-04",
          name: "Reading",
          assignmentId: assignment.id,
          completed: false,
        }),
      ]);
    });
  });

  describe("US-4.3 — Change the selected days", () => {
    it("User unselects a day and saving removes that todo", async () => {
      const course = await createClass();
      const assignment = await createAssignment(course.id);
      await request(app)
        .put(`/api/assignments/${assignment.id}/day-todos`)
        .send({ dates: ["2026-11-11", "2026-11-12"] });

      const response = await request(app).put(`/api/assignments/${assignment.id}/day-todos`).send({
        dates: ["2026-11-11"],
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ dates: ["2026-11-11"] });

      const todos = await request(app).get("/api/day-todos");
      expect(todos.body.map((item) => item.date)).toEqual(["2026-11-11"]);
    });

    it("User adds a day to an existing set", async () => {
      const course = await createClass();
      const assignment = await createAssignment(course.id);
      await request(app).put(`/api/assignments/${assignment.id}/day-todos`).send({ dates: ["2026-11-11"] });

      await request(app)
        .put(`/api/assignments/${assignment.id}/day-todos`)
        .send({ dates: ["2026-11-11", "2026-11-13"] });

      const listed = await request(app).get("/api/assignments");
      expect(listed.body[0].dayTodos).toEqual([
        { date: "2026-11-11", completed: false },
        { date: "2026-11-13", completed: false },
      ]);
    });

    it("User saves an empty set and all day todos are removed", async () => {
      const course = await createClass();
      const assignment = await createAssignment(course.id);
      await request(app).put(`/api/assignments/${assignment.id}/day-todos`).send({ dates: ["2026-11-12"] });

      const response = await request(app).put(`/api/assignments/${assignment.id}/day-todos`).send({ dates: [] });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ dates: [] });

      const listed = await request(app).get("/api/assignments");
      expect(listed.body[0].dayTodos).toEqual([]);
    });
  });

  describe("US-4.4 — Add a todo that is not an assignment", () => {
    it("User adds a todo that is not connected to an assignment", async () => {
      const response = await request(app).post("/api/day-todos").send({
        name: "Buy a notebook",
        date: "2026-11-15",
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(
        expect.objectContaining({
          date: "2026-11-15",
          name: "Buy a notebook",
          assignmentId: null,
          class: null,
          completed: false,
        }),
      );
    });

    it("User deletes a todo that is not connected to an assignment", async () => {
      const created = await request(app).post("/api/day-todos").send({
        name: "Buy a notebook",
        date: "2026-11-15",
      });

      const response = await request(app).delete(`/api/day-todos/${created.body.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "Todo deleted." });

      const listed = await request(app).get("/api/day-todos");
      expect(listed.body).toEqual([]);
    });

    it("User adds a todo with no name", async () => {
      const response = await request(app).post("/api/day-todos").send({
        name: "  ",
        date: "2026-11-15",
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Name is required." });
    });

    it("User adds a todo with no date", async () => {
      const response = await request(app).post("/api/day-todos").send({ name: "Buy a notebook" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Date is required." });
    });

    it("User updates an assignment todo through the standalone route", async () => {
      const course = await createClass();
      const assignment = await createAssignment(course.id);
      await request(app).put(`/api/assignments/${assignment.id}/day-todos`).send({ dates: ["2026-11-12"] });
      const todos = await request(app).get("/api/day-todos");

      const response = await request(app).put(`/api/day-todos/${todos.body[0].id}`).send({
        name: "Other",
        date: "2026-11-15",
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Change this todo from the assignment." });

      const again = await request(app).get("/api/day-todos");
      expect(again.body[0].date).toBe("2026-11-12");
      expect(again.body[0].name).toBe("Lab report");
    });
  });

  describe("US-4.5 — Remove an assignment’s todos when the assignment is deleted", () => {
    it("User deletes an assignment and its day todos are gone", async () => {
      const course = await createClass();
      const assignment = await createAssignment(course.id);
      await request(app)
        .put(`/api/assignments/${assignment.id}/day-todos`)
        .send({ dates: ["2026-11-10", "2026-11-12"] });
      await request(app).post("/api/day-todos").send({ name: "Buy a notebook", date: "2026-11-15" });

      const response = await request(app).delete(`/api/assignments/${assignment.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "Assignment deleted." });

      const assignments = await request(app).get("/api/assignments");
      expect(assignments.body.find((item) => item.name === "Lab report")).toBeUndefined();

      const todos = await request(app).get("/api/day-todos");
      expect(todos.body.map((item) => item.name)).toEqual(["Buy a notebook"]);
      expect(todos.body.every((item) => item.assignmentId !== assignment.id)).toBe(true);
    });

    it("User replaces day todos on a new assignment only", async () => {
      const course = await createClass();
      const first = await createAssignment(course.id);
      await request(app).put(`/api/assignments/${first.id}/day-todos`).send({ dates: ["2026-11-10"] });
      await request(app).delete(`/api/assignments/${first.id}`);
      const second = await createAssignment(course.id, { name: "Essay" });

      const response = await request(app).put(`/api/assignments/${second.id}/day-todos`).send({
        dates: ["2026-11-15"],
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ dates: ["2026-11-15"] });

      const todos = await request(app).get("/api/day-todos");
      expect(todos.body).toHaveLength(1);
      expect(todos.body[0].assignmentId).toBe(second.id);
      expect(todos.body[0].date).toBe("2026-11-15");
    });
  });

  describe("US-4.6 — Complete a todo", () => {
    it("User finishes a todo from the todos list", async () => {
      const course = await createClass();
      const assignment = await createAssignment(course.id);
      await request(app).put(`/api/assignments/${assignment.id}/day-todos`).send({ dates: ["2026-11-12"] });
      const todos = await request(app).get("/api/day-todos");

      const response = await request(app).put(`/api/day-todos/${todos.body[0].id}/completion`).send({
        completed: true,
      });

      expect(response.status).toBe(200);
      expect(response.body.completed).toBe(true);
      expect(response.body.assignmentCompleted).toBe(false);

      const listed = await request(app).get("/api/assignments");
      expect(listed.body[0].completed).toBe(false);
    });

    it("User finishes the only todo and the assignment stays open", async () => {
      const course = await createClass();
      const assignment = await createAssignment(course.id);
      await request(app).put(`/api/assignments/${assignment.id}/day-todos`).send({ dates: ["2026-11-12"] });
      const todos = await request(app).get("/api/day-todos");

      await request(app).put(`/api/day-todos/${todos.body[0].id}/completion`).send({ completed: true });

      const listed = await request(app).get("/api/assignments");
      expect(listed.body[0].dayTodos[0].completed).toBe(true);
      expect(listed.body[0].completed).toBe(false);
    });

    it("User clears a finished todo and the assignment stays open", async () => {
      const course = await createClass();
      const assignment = await createAssignment(course.id);
      await request(app).put(`/api/assignments/${assignment.id}/day-todos`).send({ dates: ["2026-11-12"] });
      const todos = await request(app).get("/api/day-todos");
      await request(app).put(`/api/day-todos/${todos.body[0].id}/completion`).send({ completed: true });

      const response = await request(app).put(`/api/day-todos/${todos.body[0].id}/completion`).send({
        completed: false,
      });

      expect(response.status).toBe(200);
      expect(response.body.completed).toBe(false);
      expect(response.body.assignmentCompleted).toBe(false);
    });

    it("User clears a todo on a completed assignment", async () => {
      const course = await createClass();
      const assignment = await createAssignment(course.id);
      await request(app).put(`/api/assignments/${assignment.id}/day-todos`).send({ dates: ["2026-11-12"] });
      await request(app).put(`/api/assignments/${assignment.id}/completion`).send({ completed: true });
      const todos = await request(app).get("/api/day-todos");

      const response = await request(app).put(`/api/day-todos/${todos.body[0].id}/completion`).send({
        completed: false,
      });

      expect(response.status).toBe(200);
      expect(response.body.completed).toBe(false);
      expect(response.body.assignmentCompleted).toBe(true);

      const listed = await request(app).get("/api/assignments");
      expect(listed.body[0].completed).toBe(true);
    });

    it("User finishes a todo that has no assignment", async () => {
      const created = await request(app).post("/api/day-todos").send({
        name: "Buy a notebook",
        date: "2026-11-15",
      });

      const response = await request(app).put(`/api/day-todos/${created.body.id}/completion`).send({
        completed: true,
      });

      expect(response.status).toBe(200);
      expect(response.body.completed).toBe(true);
      expect(response.body.assignmentCompleted).toBeNull();
    });

    it("User finishes a todo that does not exist", async () => {
      const response = await request(app).put("/api/day-todos/99/completion").send({ completed: true });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: "Todo with id=99 not found." });
    });

    it("User sends a completion value that is not true or false", async () => {
      const created = await request(app).post("/api/day-todos").send({
        name: "Buy a notebook",
        date: "2026-11-15",
      });

      const response = await request(app).put(`/api/day-todos/${created.body.id}/completion`).send({
        completed: "yes",
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Completed must be true or false." });
    });

    it("User saves day todos and a kept date stays finished", async () => {
      const course = await createClass();
      const assignment = await createAssignment(course.id);
      await request(app)
        .put(`/api/assignments/${assignment.id}/day-todos`)
        .send({ dates: ["2026-11-11", "2026-11-12"] });
      const todos = await request(app).get("/api/day-todos");
      const eleventh = todos.body.find((item) => item.date === "2026-11-11");
      await request(app).put(`/api/day-todos/${eleventh.id}/completion`).send({ completed: true });

      await request(app)
        .put(`/api/assignments/${assignment.id}/day-todos`)
        .send({ dates: ["2026-11-12", "2026-11-13"] });

      const listed = await request(app).get("/api/assignments");
      expect(listed.body[0].completed).toBe(false);
      expect(listed.body[0].dayTodos).toEqual([
        { date: "2026-11-12", completed: false },
        { date: "2026-11-13", completed: false },
      ]);
    });
  });

  describe("US-4.7 — Complete an assignment", () => {
    it("User marks an assignment completed and its todos are completed", async () => {
      const course = await createClass();
      const assignment = await createAssignment(course.id);
      await request(app)
        .put(`/api/assignments/${assignment.id}/day-todos`)
        .send({ dates: ["2026-11-11", "2026-11-13"] });

      const response = await request(app).put(`/api/assignments/${assignment.id}/completion`).send({
        completed: true,
      });

      expect(response.status).toBe(200);
      expect(response.body.completed).toBe(true);
      expect(response.body.dayTodos).toEqual([
        { date: "2026-11-11", completed: true },
        { date: "2026-11-13", completed: true },
      ]);
    });

    it("User marks an assignment completed when it has no todos", async () => {
      const course = await createClass();
      const assignment = await createAssignment(course.id, { name: "Reading" });

      const response = await request(app).put(`/api/assignments/${assignment.id}/completion`).send({
        completed: true,
      });

      expect(response.status).toBe(200);
      expect(response.body.completed).toBe(true);
      expect(response.body.dayTodos).toEqual([]);
    });

    it("User clears assignment completion and its todos stay completed", async () => {
      const course = await createClass();
      const assignment = await createAssignment(course.id);
      await request(app)
        .put(`/api/assignments/${assignment.id}/day-todos`)
        .send({ dates: ["2026-11-11", "2026-11-13"] });
      await request(app).put(`/api/assignments/${assignment.id}/completion`).send({ completed: true });

      const response = await request(app).put(`/api/assignments/${assignment.id}/completion`).send({
        completed: false,
      });

      expect(response.status).toBe(200);
      expect(response.body.completed).toBe(false);
      expect(response.body.dayTodos.every((item) => item.completed)).toBe(true);
    });

    it("User marks an assignment that does not exist", async () => {
      const response = await request(app).put("/api/assignments/99/completion").send({ completed: true });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: "Assignment with id=99 not found." });
    });
  });
});
