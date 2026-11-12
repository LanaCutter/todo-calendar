import db from "../models/index.js";
import logger from "../config/logger.js";

const Assignment = db.assignment;
const Class = db.class;
const DayTodo = db.dayTodo;

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const TIME_OF_DAY = /^([01]\d|2[0-3]):[0-5]\d$/;

const includeDetails = [
  { model: Class, as: "class", attributes: ["id", "name", "color"] },
  {
    model: DayTodo,
    as: "dayTodos",
    attributes: ["todoDate", "completed"],
    separate: true,
    order: [["todoDate", "ASC"]],
  },
];

const parseAssignmentId = (raw) => {
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

const readOptionalDate = (body, key) => {
  if (!Object.prototype.hasOwnProperty.call(body, key) || body[key] === null || body[key] === "") {
    return { value: null };
  }

  if (!isRealDate(body[key])) {
    return { error: "Enter a valid date." };
  }

  return { value: body[key] };
};

const validatePayload = (body) => {
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return { error: "Name is required." };
  }
  if (name.length > 200) {
    return { error: "Name must be 200 characters or fewer." };
  }

  if (body?.classId === undefined || body?.classId === null || body?.classId === "") {
    return { error: "Class is required." };
  }
  const classId = Number(body.classId);
  if (!Number.isInteger(classId) || classId < 1) {
    return { error: "Class is required." };
  }

  const dueDate = readOptionalDate(body ?? {}, "dueDate");
  if (dueDate.error) {
    return dueDate;
  }
  const startWorkingBy = readOptionalDate(body ?? {}, "startWorkingBy");
  if (startWorkingBy.error) {
    return startWorkingBy;
  }

  let dueTime = null;
  if (Object.prototype.hasOwnProperty.call(body, "dueTime") && body.dueTime !== null && body.dueTime !== "") {
    if (typeof body.dueTime !== "string" || !TIME_OF_DAY.test(body.dueTime)) {
      return { error: "Enter a valid due time." };
    }
    dueTime = body.dueTime;
  }

  if (dueTime && !dueDate.value) {
    return { error: "Enter a due date before a due time." };
  }

  if (dueDate.value && startWorkingBy.value && startWorkingBy.value > dueDate.value) {
    return { error: "Start working by must be on or before the due date." };
  }

  return {
    name,
    classId,
    dueDate: dueDate.value,
    dueTime,
    startWorkingBy: startWorkingBy.value,
  };
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

const toResponse = (row) => {
  const json = row.toJSON();
  return {
    id: json.id,
    name: json.name,
    classId: json.classId,
    class: json.class
      ? { id: json.class.id, name: json.class.name, color: json.class.color }
      : null,
    dueDate: dateOnlyString(json.dueDate),
    dueTime: json.dueTime ?? null,
    startWorkingBy: dateOnlyString(json.startWorkingBy),
    completed: Boolean(json.completed),
    dayTodos: (json.dayTodos ?? [])
      .map((item) => ({
        date: dateOnlyString(item.todoDate),
        completed: Boolean(item.completed),
      }))
      .sort((left, right) => left.date.localeCompare(right.date)),
    createdAt: json.createdAt,
    updatedAt: json.updatedAt,
  };
};

const listOrder = [
  [db.sequelize.literal("`assignment`.`dueDate` IS NULL"), "ASC"],
  ["dueDate", "ASC"],
  [db.sequelize.literal("LOWER(`assignment`.`name`)"), "ASC"],
];

const exports = {};

exports.findAll = async (_req, res) => {
  try {
    const rows = await Assignment.findAll({ include: includeDetails, order: listOrder });
    res.send(rows.map(toResponse));
  } catch (err) {
    logger.error(err.message);
    res.status(500).send({ message: "Unable to load assignments." });
  }
};

exports.create = async (req, res) => {
  try {
    const parsed = validatePayload(req.body ?? {});
    if (parsed.error) {
      res.status(400).send({ message: parsed.error });
      return;
    }

    const course = await Class.findByPk(parsed.classId);
    if (!course) {
      res.status(400).send({ message: `Class with id=${parsed.classId} not found.` });
      return;
    }

    const created = await Assignment.create({
      name: parsed.name,
      classId: parsed.classId,
      dueDate: parsed.dueDate,
      dueTime: parsed.dueTime,
      startWorkingBy: parsed.startWorkingBy,
    });
    const full = await Assignment.findByPk(created.id, { include: includeDetails });
    res.status(201).send(toResponse(full));
  } catch (err) {
    logger.error(err.message);
    res.status(500).send({ message: "Unable to create assignment." });
  }
};

exports.update = async (req, res) => {
  const id = parseAssignmentId(req.params.id);
  if (id == null) {
    res.status(400).send({ message: "Assignment id must be a number." });
    return;
  }

  try {
    const parsed = validatePayload(req.body ?? {});
    if (parsed.error) {
      res.status(400).send({ message: parsed.error });
      return;
    }

    const row = await Assignment.findByPk(id);
    if (!row) {
      res.status(404).send({ message: `Assignment with id=${id} not found.` });
      return;
    }

    const course = await Class.findByPk(parsed.classId);
    if (!course) {
      res.status(400).send({ message: `Class with id=${parsed.classId} not found.` });
      return;
    }

    await row.update({
      name: parsed.name,
      classId: parsed.classId,
      dueDate: parsed.dueDate,
      dueTime: parsed.dueTime,
      startWorkingBy: parsed.startWorkingBy,
    });
    const full = await Assignment.findByPk(id, { include: includeDetails });
    res.send(toResponse(full));
  } catch (err) {
    logger.error(err.message);
    res.status(500).send({ message: "Unable to update assignment." });
  }
};

exports.remove = async (req, res) => {
  const id = parseAssignmentId(req.params.id);
  if (id == null) {
    res.status(400).send({ message: "Assignment id must be a number." });
    return;
  }

  try {
    const row = await Assignment.findByPk(id);
    if (!row) {
      res.status(404).send({ message: `Assignment with id=${id} not found.` });
      return;
    }

    await row.destroy();
    res.send({ message: "Assignment deleted." });
  } catch (err) {
    logger.error(err.message);
    res.status(500).send({ message: "Unable to delete assignment." });
  }
};

exports.setCompleted = async (req, res) => {
  const id = parseAssignmentId(req.params.id);
  if (id == null) {
    res.status(400).send({ message: "Assignment id must be a number." });
    return;
  }

  if (typeof req.body?.completed !== "boolean") {
    res.status(400).send({ message: "Completed must be true or false." });
    return;
  }

  try {
    const row = await Assignment.findByPk(id);
    if (!row) {
      res.status(404).send({ message: `Assignment with id=${id} not found.` });
      return;
    }

    await db.sequelize.transaction(async (transaction) => {
      if (req.body.completed) {
        await DayTodo.update({ completed: true }, { where: { assignmentId: id }, transaction });
      }
      await row.update({ completed: req.body.completed }, { transaction });
    });

    const full = await Assignment.findByPk(id, { include: includeDetails });
    res.send(toResponse(full));
  } catch (err) {
    logger.error(err.message);
    res.status(500).send({ message: "Unable to update assignment." });
  }
};

export default exports;
