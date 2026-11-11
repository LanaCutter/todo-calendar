/**
 * Feature 1 — Class Management
 * Spec: features/feature-1-class-management.md
 */
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import { syncTestDatabase } from "./helpers.js";

describe("Feature 1 — Class Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe("US-1.1 — Add a class", () => {
    it("User adds a class with a name and color", async () => {
      const response = await request(app).post("/api/classes").send({ name: "Biology", color: "green" });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe("Biology");
      expect(response.body.color).toBe("green");
      expect(response.body.userId).toBeUndefined();
    });

    it("User adds a class with a name that is only spaces", async () => {
      const response = await request(app).post("/api/classes").send({ name: "   ", color: "green" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Name is required." });
    });

    it("User adds a class with a color that is not in the list", async () => {
      const response = await request(app).post("/api/classes").send({ name: "Biology", color: "pink" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Choose a color from the list." });
    });

    it("User adds a class with a name that matches an existing class ignoring case", async () => {
      await request(app).post("/api/classes").send({ name: "Biology", color: "green" });

      const response = await request(app).post("/api/classes").send({ name: "biology", color: "blue" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "A class with that name already exists." });
    });

    it("User adds a class with a name longer than 100 characters", async () => {
      const response = await request(app)
        .post("/api/classes")
        .send({ name: "a".repeat(101), color: "teal" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Name must be 100 characters or fewer." });
    });
  });

  describe("US-1.2 — View classes", () => {
    it("User sees classes in name order", async () => {
      await request(app).post("/api/classes").send({ name: "Chemistry", color: "maroon" });
      await request(app).post("/api/classes").send({ name: "algebra", color: "blue" });

      const response = await request(app).get("/api/classes");

      expect(response.status).toBe(200);
      expect(response.body.map((row) => row.name)).toEqual(["algebra", "Chemistry"]);
    });
  });

  describe("US-1.3 — Edit a class", () => {
    it("User edits a class name and color", async () => {
      const created = await request(app).post("/api/classes").send({ name: "Biology", color: "green" });

      const response = await request(app)
        .put(`/api/classes/${created.body.id}`)
        .send({ name: "Chemistry", color: "blue" });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("Chemistry");
      expect(response.body.color).toBe("blue");
    });

    it("User edits a class and keeps its own name", async () => {
      const created = await request(app).post("/api/classes").send({ name: "Biology", color: "green" });

      const response = await request(app)
        .put(`/api/classes/${created.body.id}`)
        .send({ name: "Biology", color: "amber" });

      expect(response.status).toBe(200);
      expect(response.body.color).toBe("amber");
      expect(response.body.message).not.toBe("A class with that name already exists.");
    });

    it("User edits a class to a name another class already uses", async () => {
      const biology = await request(app).post("/api/classes").send({ name: "Biology", color: "green" });
      await request(app).post("/api/classes").send({ name: "Chemistry", color: "maroon" });

      const response = await request(app)
        .put(`/api/classes/${biology.body.id}`)
        .send({ name: "chemistry", color: "green" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "A class with that name already exists." });

      const listed = await request(app).get("/api/classes");
      const stillBiology = listed.body.find((row) => row.id === biology.body.id);
      expect(stillBiology.name).toBe("Biology");
    });

    it("User edits a class that does not exist", async () => {
      const response = await request(app).put("/api/classes/99").send({ name: "Art", color: "orange" });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: "Class with id=99 not found." });
    });

    it("User updates a class with an id that is not a number", async () => {
      const response = await request(app).put("/api/classes/abc").send({ name: "Art", color: "orange" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Class id must be a number." });
    });
  });

  describe("US-1.4 — Delete a class", () => {
    it("User deletes a class", async () => {
      const created = await request(app).post("/api/classes").send({ name: "Biology", color: "green" });

      const response = await request(app).delete(`/api/classes/${created.body.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "Class deleted." });

      const listed = await request(app).get("/api/classes");
      expect(listed.body).toEqual([]);
    });

    it("User deletes a class that does not exist", async () => {
      const response = await request(app).delete("/api/classes/99");

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: "Class with id=99 not found." });
    });

    it("User deletes a class with an id that is not a number", async () => {
      const response = await request(app).delete("/api/classes/abc");

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Class id must be a number." });
    });
  });
});
