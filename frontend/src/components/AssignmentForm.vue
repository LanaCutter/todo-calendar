<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  classes: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue"]);

const classItems = computed(() => props.classes.map((item) => ({ title: item.name, value: item.id })));

const nameRules = [(value) => !!String(value ?? "").trim() || "Name is required."];
const classRules = [(value) => !!value || "Class is required."];

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

function realDate(value) {
  if (!value) {
    return true;
  }
  if (!datePattern.test(value)) {
    return false;
  }
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

const startRules = [
  (value) => !value || realDate(value) || "Enter a valid date.",
  (value) => {
    const due = props.modelValue.dueDate;
    if (!value || !due || !realDate(value) || !realDate(due)) {
      return true;
    }
    return value <= due || "Start working by must be on or before the due date.";
  },
];

const dueRules = [(value) => !value || realDate(value) || "Enter a valid date."];

const timeRules = [
  (value) => !value || timePattern.test(value) || "Enter a valid due time.",
  (value) => !value || !!props.modelValue.dueDate || "Enter a due date before a due time.",
];

function field(key) {
  return computed({
    get: () => props.modelValue[key] ?? (key === "name" ? "" : null),
    set: (value) => emit("update:modelValue", { ...props.modelValue, [key]: value || null }),
  });
}

const name = computed({
  get: () => props.modelValue.name ?? "",
  set: (value) => emit("update:modelValue", { ...props.modelValue, name: value }),
});
const classId = field("classId");
const startWorkingBy = field("startWorkingBy");
const dueDate = field("dueDate");
const dueTime = field("dueTime");

const form = ref(null);

async function validate() {
  const result = await form.value.validate();
  return result.valid;
}

defineExpose({ validate });
</script>

<template>
  <v-form ref="form">
    <v-text-field v-model="name" label="Name" class="assignment-name-field" :rules="nameRules" />
    <v-select
      v-model="classId"
      label="Class"
      class="assignment-class-field"
      :items="classItems"
      item-title="title"
      item-value="value"
      :rules="classRules"
    />
    <v-text-field v-model="dueDate" label="Due date" type="date" class="assignment-due-field" :rules="dueRules" />
    <v-text-field v-model="dueTime" label="Due time" type="time" class="assignment-time-field" :rules="timeRules" />
    <v-text-field
      v-model="startWorkingBy"
      label="Start working by"
      type="date"
      class="assignment-start-field"
      :rules="startRules"
    />
  </v-form>
</template>
