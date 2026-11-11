/**
 * Feature 2 — Assignment Management
 * Spec: features/feature-2-assignment-management.md
 */
import request from "supertest";
import app from "../server.js";
import { syncTestDatabase } from "./helpers.js";

async function createClass(name, color) {
  const response = await request(app).post("/api/classes").send({ name, color });
  expect(response.status).toBe(201);
  return response.body;
}

describe("Feature 2 — Assignment Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-2.1 — Enter an assignment", () => {
    it("User enters an assignment with a name and class", async () => {
      const course = await createClass("Biology", "green");

      const response = await request(app).post("/api/assignments").send({
        name: "Lab report",
        classId: course.id,
      });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe("Lab report");
      expect(response.body.classId).toBe(course.id);
      expect(response.body.dueDate).toBeNull();
      expect(response.body.dueTime).toBeNull();
      expect(response.body.startWorkingBy).toBeNull();
      expect(response.body.userId).toBeUndefined();
    });

    it("User enters an assignment with a due date, due time, and start working by date", async () => {
      const course = await createClass("Biology", "green");

      const response = await request(app).post("/api/assignments").send({
        name: "Lab report",
        classId: course.id,
        dueDate: "2026-11-20",
        dueTime: "23:59",
        startWorkingBy: "2026-11-16",
      });

      expect(response.status).toBe(201);
      expect(response.body.dueDate).toBe("2026-11-20");
      expect(response.body.dueTime).toBe("23:59");
      expect(response.body.startWorkingBy).toBe("2026-11-16");
      expect(response.body.class).toEqual({ id: course.id, name: "Biology", color: "green" });
    });

    it("User enters an assignment with a name that is only spaces", async () => {
      const course = await createClass("Biology", "green");

      const response = await request(app).post("/api/assignments").send({
        name: "   ",
        classId: course.id,
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Name is required." });
    });

    it("User enters an assignment without a class", async () => {
      await createClass("Biology", "green");

      const response = await request(app).post("/api/assignments").send({ name: "Lab report" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Class is required." });
    });

    it("User enters a due time without a due date", async () => {
      const course = await createClass("Biology", "green");

      const response = await request(app).post("/api/assignments").send({
        name: "Lab report",
        classId: course.id,
        dueTime: "23:59",
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Enter a due date before a due time." });
    });

    it("User enters a start working by date after the due date", async () => {
      const course = await createClass("Biology", "green");

      const response = await request(app).post("/api/assignments").send({
        name: "Lab report",
        classId: course.id,
        startWorkingBy: "2026-11-21",
        dueDate: "2026-11-20",
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Start working by must be on or before the due date." });
    });

    it("User enters an assignment for a class that does not exist", async () => {
      const response = await request(app).post("/api/assignments").send({
        name: "Lab report",
        classId: 9,
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Class with id=9 not found." });
    });

    it("User enters an assignment with a name longer than 200 characters", async () => {
      const course = await createClass("Biology", "green");

      const response = await request(app).post("/api/assignments").send({
        name: "a".repeat(201),
        classId: course.id,
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Name must be 200 characters or fewer." });
    });

    it("User enters a due time that is not a time of day", async () => {
      const course = await createClass("Biology", "green");

      const response = await request(app).post("/api/assignments").send({
        name: "Lab report",
        classId: course.id,
        dueDate: "2026-11-20",
        dueTime: "25:00",
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Enter a valid due time." });
    });

    it("User enters a due date that is not a real date", async () => {
      const course = await createClass("Biology", "green");

      const response = await request(app).post("/api/assignments").send({
        name: "Lab report",
        classId: course.id,
        dueDate: "2026-11-31",
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Enter a valid date." });
    });
  });

  describe("US-2.2 — View assignments in a table", () => {
    it("User sees assignments soonest due date first", async () => {
      const course = await createClass("Biology", "green");
      await request(app).post("/api/assignments").send({
        name: "Lab report",
        classId: course.id,
        dueDate: "2026-11-20",
      });
      await request(app).post("/api/assignments").send({
        name: "Essay",
        classId: course.id,
        dueDate: "2026-11-10",
      });

      const response = await request(app).get("/api/assignments");

      expect(response.status).toBe(200);
      expect(response.body.map((row) => row.name)).toEqual(["Essay", "Lab report"]);
    });

    it("User sees same-day assignments in name order", async () => {
      const course = await createClass("Biology", "green");
      await request(app).post("/api/assignments").send({
        name: "Quiz",
        classId: course.id,
        dueDate: "2026-11-10",
      });
      await request(app).post("/api/assignments").send({
        name: "Essay",
        classId: course.id,
        dueDate: "2026-11-10",
      });

      const response = await request(app).get("/api/assignments");

      expect(response.body.map((row) => row.name)).toEqual(["Essay", "Quiz"]);
    });

    it("User sees an assignment with no due date after dated assignments", async () => {
      const course = await createClass("Biology", "green");
      await request(app).post("/api/assignments").send({ name: "Reading", classId: course.id });
      await request(app).post("/api/assignments").send({
        name: "Essay",
        classId: course.id,
        dueDate: "2026-11-10",
      });

      const response = await request(app).get("/api/assignments");

      expect(response.body.map((row) => row.name)).toEqual(["Essay", "Reading"]);
    });
  });

  describe("US-2.3 — Edit an assignment", () => {
    it("User edits an assignment", async () => {
      const course = await createClass("Biology", "green");
      const created = await request(app).post("/api/assignments").send({
        name: "Lab report",
        classId: course.id,
        dueDate: "2026-11-20",
      });

      const response = await request(app).put(`/api/assignments/${created.body.id}`).send({
        name: "Lab report",
        classId: course.id,
        dueDate: "2026-11-22",
        dueTime: "18:00",
      });

      expect(response.status).toBe(200);
      expect(response.body.dueDate).toBe("2026-11-22");
      expect(response.body.dueTime).toBe("18:00");
    });

    it("User clears optional dates and time", async () => {
      const course = await createClass("Biology", "green");
      const created = await request(app).post("/api/assignments").send({
        name: "Lab report",
        classId: course.id,
        dueDate: "2026-11-20",
        dueTime: "23:59",
        startWorkingBy: "2026-11-16",
      });

      const response = await request(app).put(`/api/assignments/${created.body.id}`).send({
        name: "Lab report",
        classId: course.id,
        dueDate: null,
        dueTime: null,
        startWorkingBy: null,
      });

      expect(response.status).toBe(200);
      expect(response.body.dueDate).toBeNull();
      expect(response.body.dueTime).toBeNull();
      expect(response.body.startWorkingBy).toBeNull();
    });

    it("User edits an assignment that does not exist", async () => {
      const course = await createClass("Biology", "green");

      const response = await request(app).put("/api/assignments/99").send({
        name: "Lab report",
        classId: course.id,
      });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: "Assignment with id=99 not found." });
    });

    it("User updates an assignment with an id that is not a number", async () => {
      const course = await createClass("Biology", "green");

      const response = await request(app).put("/api/assignments/abc").send({
        name: "Lab report",
        classId: course.id,
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Assignment id must be a number." });
    });
  });

  describe("US-2.4 — Delete an assignment", () => {
    it("User deletes an assignment", async () => {
      const course = await createClass("Biology", "green");
      const created = await request(app).post("/api/assignments").send({
        name: "Lab report",
        classId: course.id,
      });

      const response = await request(app).delete(`/api/assignments/${created.body.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "Assignment deleted." });

      const listed = await request(app).get("/api/assignments");
      expect(listed.body).toEqual([]);
    });

    it("User deletes an assignment that does not exist", async () => {
      const response = await request(app).delete("/api/assignments/99");

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: "Assignment with id=99 not found." });
    });
  });

  describe("US-2.5 — Keep a class that still has assignments", () => {
    it("User cannot delete a class that has an assignment", async () => {
      const course = await createClass("Biology", "green");
      await request(app).post("/api/assignments").send({ name: "Lab report", classId: course.id });

      const response = await request(app).delete(`/api/classes/${course.id}`);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "This class still has assignments." });

      const classes = await request(app).get("/api/classes");
      const assignments = await request(app).get("/api/assignments");
      expect(classes.body.map((row) => row.name)).toContain("Biology");
      expect(assignments.body.map((row) => row.name)).toContain("Lab report");
    });

    it("User deletes a class that has no assignments", async () => {
      const course = await createClass("Art", "orange");

      const response = await request(app).delete(`/api/classes/${course.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "Class deleted." });

      const classes = await request(app).get("/api/classes");
      expect(classes.body.map((row) => row.name)).not.toContain("Art");
    });
  });
});
