import db from "../models/index.js";
import logger from "../config/logger.js";

const Class = db.class;

const COLORS = ["maroon", "blue", "green", "amber", "purple", "teal", "orange", "slate"];

const parseClassId = (raw) => {
  if (typeof raw !== "string" || !/^[1-9]\d*$/.test(raw)) {
    return null;
  }

  const id = Number(raw);
  return Number.isSafeInteger(id) ? id : null;
};

const validatePayload = (body) => {
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name) {
    return { error: "Name is required." };
  }

  if (name.length > 100) {
    return { error: "Name must be 100 characters or fewer." };
  }

  if (typeof body?.color !== "string" || !COLORS.includes(body.color)) {
    return { error: "Choose a color from the list." };
  }

  return { name, color: body.color };
};

const findNameConflict = async (name, excludeId) => {
  const existing = await Class.findOne({
    where: db.sequelize.where(db.sequelize.fn("LOWER", db.sequelize.col("name")), name.toLowerCase()),
  });

  if (!existing || existing.id === excludeId) {
    return null;
  }

  return existing;
};

const exports = {};

exports.findAll = async (_req, res) => {
  try {
    const rows = await Class.findAll({
      order: [[db.sequelize.literal("LOWER(name)"), "ASC"]],
    });
    res.send(rows);
  } catch (err) {
    logger.error(err.message);
    res.status(500).send({ message: "Unable to load classes." });
  }
};

exports.create = async (req, res) => {
  try {
    const parsed = validatePayload(req.body);
    if (parsed.error) {
      res.status(400).send({ message: parsed.error });
      return;
    }

    const conflict = await findNameConflict(parsed.name);
    if (conflict) {
      res.status(400).send({ message: "A class with that name already exists." });
      return;
    }

    const created = await Class.create({ name: parsed.name, color: parsed.color });
    res.status(201).send(created);
  } catch (err) {
    logger.error(err.message);
    res.status(500).send({ message: "Unable to create class." });
  }
};

exports.update = async (req, res) => {
  const id = parseClassId(req.params.id);
  if (id == null) {
    res.status(400).send({ message: "Class id must be a number." });
    return;
  }

  try {
    const parsed = validatePayload(req.body);
    if (parsed.error) {
      res.status(400).send({ message: parsed.error });
      return;
    }

    const row = await Class.findByPk(id);
    if (!row) {
      res.status(404).send({ message: `Class with id=${id} not found.` });
      return;
    }

    const conflict = await findNameConflict(parsed.name, id);
    if (conflict) {
      res.status(400).send({ message: "A class with that name already exists." });
      return;
    }

    await row.update({ name: parsed.name, color: parsed.color });
    res.send(row);
  } catch (err) {
    logger.error(err.message);
    res.status(500).send({ message: "Unable to update class." });
  }
};

exports.remove = async (req, res) => {
  const id = parseClassId(req.params.id);
  if (id == null) {
    res.status(400).send({ message: "Class id must be a number." });
    return;
  }

  try {
    const row = await Class.findByPk(id);
    if (!row) {
      res.status(404).send({ message: `Class with id=${id} not found.` });
      return;
    }

    await row.destroy();
    res.send({ message: "Class deleted." });
  } catch (err) {
    logger.error(err.message);
    res.status(500).send({ message: "Unable to delete class." });
  }
};

export default exports;
