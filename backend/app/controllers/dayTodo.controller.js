import db from "../models/index.js";
import logger from "../config/logger.js";

const Assignment = db.assignment;
const Class = db.class;
const DayTodo = db.dayTodo;

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const includeAssignment = [
  {
    model: Assignment,
    as: "assignment",
    required: false,
    attributes: ["id", "name", "completed"],
    include: [{ model: Class, as: "class", attributes: ["id", "name", "color"] }],
  },
];

const parseId = (raw) => {
  if (typeof raw !== "string" || !/^[1-9]\d*$/.test(raw)) {
    return null;
  }
  const id = Number(raw);
  return Number.isSafeInteger(id) ? id : null;
};

const isRealDate = (value) => {
  if (typeof value !== "string" || !DATE_ONLY.test(value)) {
    return false;
  }
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
};

const dateOnlyString = (value) => {
  if (!value) {
    return null;
  }
  if (typeof value === "string") {
    return value.slice(0, 10);
  }
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toListItem = (row) => {
  const json = row.toJSON();
  const assignment = json.assignment ?? null;
  return {
    id: json.id,
    date: dateOnlyString(json.todoDate),
    name: assignment ? assignment.name : json.name,
    assignmentId: json.assignmentId ?? null,
    class: assignment?.class
      ? { id: assignment.class.id, name: assignment.class.name, color: assignment.class.color }
      : null,
    completed: Boolean(json.completed),
  };
};

const sortItems = (rows) =>
  rows
    .map(toListItem)
    .sort((left, right) => {
      const byDate = left.date.localeCompare(right.date);
      if (byDate !== 0) {
        return byDate;
      }
      return left.name.localeCompare(right.name, undefined, { sensitivity: "base" });
    });

const parseName = (body) => {
  if (typeof body?.name !== "string") {
    return { error: "Name is required." };
  }
  const name = body.name.trim();
  if (!name) {
    return { error: "Name is required." };
  }
  if (name.length > 200) {
    return { error: "Name must be 200 characters or fewer." };
  }
  return { name };
};

const parseRequiredDate = (body) => {
  if (!Object.prototype.hasOwnProperty.call(body ?? {}, "date") || body.date === null || body.date === "") {
    return { error: "Date is required." };
  }
  if (!isRealDate(body.date)) {
    return { error: "Enter a valid date." };
  }
  return { date: body.date };
};

const loadTodo = (id) => DayTodo.findByPk(id, { include: includeAssignment });

const exports = {};

exports.findAll = async (_req, res) => {
  try {
    const rows = await DayTodo.findAll({ include: includeAssignment });
    res.send(sortItems(rows));
  } catch (err) {
    logger.error(err.message);
    res.status(500).send({ message: "Unable to load todos." });
  }
};

exports.create = async (req, res) => {
  const name = parseName(req.body ?? {});
  if (name.error) {
    res.status(400).send({ message: name.error });
    return;
  }
  const date = parseRequiredDate(req.body ?? {});
  if (date.error) {
    res.status(400).send({ message: date.error });
    return;
  }

  try {
    const created = await DayTodo.create({
      assignmentId: null,
      name: name.name,
      todoDate: date.date,
      completed: false,
    });
    const full = await loadTodo(created.id);
    res.status(201).send(toListItem(full));
  } catch (err) {
    logger.error(err.message);
    res.status(500).send({ message: "Unable to create todo." });
  }
};

exports.update = async (req, res) => {
  const id = parseId(req.params.id);
  if (id == null) {
    res.status(400).send({ message: "Todo id must be a number." });
    return;
  }

  const name = parseName(req.body ?? {});
  if (name.error) {
    res.status(400).send({ message: name.error });
    return;
  }
  const date = parseRequiredDate(req.body ?? {});
  if (date.error) {
    res.status(400).send({ message: date.error });
    return;
  }

  try {
    const row = await DayTodo.findByPk(id);
    if (!row) {
      res.status(404).send({ message: `Todo with id=${id} not found.` });
      return;
    }
    if (row.assignmentId != null) {
      res.status(400).send({ message: "Change this todo from the assignment." });
      return;
    }

    await row.update({ name: name.name, todoDate: date.date });
    const full = await loadTodo(id);
    res.send(toListItem(full));
  } catch (err) {
    logger.error(err.message);
    res.status(500).send({ message: "Unable to update todo." });
  }
};

exports.remove = async (req, res) => {
  const id = parseId(req.params.id);
  if (id == null) {
    res.status(400).send({ message: "Todo id must be a number." });
    return;
  }

  try {
    const row = await DayTodo.findByPk(id);
    if (!row) {
      res.status(404).send({ message: `Todo with id=${id} not found.` });
      return;
    }
    if (row.assignmentId != null) {
      res.status(400).send({ message: "Change this todo from the assignment." });
      return;
    }

    await row.destroy();
    res.send({ message: "Todo deleted." });
  } catch (err) {
    logger.error(err.message);
    res.status(500).send({ message: "Unable to delete todo." });
  }
};

exports.setCompleted = async (req, res) => {
  const id = parseId(req.params.id);
  if (id == null) {
    res.status(400).send({ message: "Todo id must be a number." });
    return;
  }
  if (typeof req.body?.completed !== "boolean") {
    res.status(400).send({ message: "Completed must be true or false." });
    return;
  }

  try {
    const row = await DayTodo.findByPk(id);
    if (!row) {
      res.status(404).send({ message: `Todo with id=${id} not found.` });
      return;
    }

    await row.update({ completed: req.body.completed });
    const full = await loadTodo(id);
    const item = toListItem(full);
    item.assignmentCompleted = full.assignment ? Boolean(full.assignment.completed) : null;
    res.send(item);
  } catch (err) {
    logger.error(err.message);
    res.status(500).send({ message: "Unable to update todo." });
  }
};

exports.replaceForAssignment = async (req, res) => {
  const id = parseId(req.params.id);
  if (id == null) {
    res.status(400).send({ message: "Assignment id must be a number." });
    return;
  }
  if (!Array.isArray(req.body?.dates)) {
    res.status(400).send({ message: "Dates are required." });
    return;
  }

  const dates = [];
  const seen = new Set();
  for (const value of req.body.dates) {
    if (!isRealDate(value)) {
      res.status(400).send({ message: "Enter a valid date." });
      return;
    }
    if (!seen.has(value)) {
      seen.add(value);
      dates.push(value);
    }
  }
  dates.sort();

  try {
    const assignment = await Assignment.findByPk(id);
    if (!assignment) {
      res.status(404).send({ message: `Assignment with id=${id} not found.` });
      return;
    }

    await db.sequelize.transaction(async (transaction) => {
      const existing = await DayTodo.findAll({ where: { assignmentId: id }, transaction });
      const existingDates = new Set(existing.map((row) => dateOnlyString(row.todoDate)));

      for (const row of existing) {
        if (!seen.has(dateOnlyString(row.todoDate))) {
          await row.destroy({ transaction });
        }
      }

      for (const date of dates) {
        if (!existingDates.has(date)) {
          await DayTodo.create(
            { assignmentId: id, name: null, todoDate: date, completed: false },
            { transaction },
          );
        }
      }

      if (dates.length) {
        const due = dateOnlyString(assignment.dueDate);
        const start = dateOnlyString(assignment.startWorkingBy);
        const rangeStart = due ? (start && start <= due ? start : due) : null;
        if (rangeStart && dates[0] < rangeStart) {
          await assignment.update({ startWorkingBy: dates[0] }, { transaction });
        }
      }
    });

    res.send({ dates });
  } catch (err) {
    logger.error(err.message);
    res.status(500).send({ message: "Unable to save todos." });
  }
};

export default exports;
