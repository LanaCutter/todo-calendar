<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue"]);

const colors = [
  { title: "Maroon", value: "maroon" },
  { title: "Blue", value: "blue" },
  { title: "Green", value: "green" },
  { title: "Amber", value: "amber" },
  { title: "Purple", value: "purple" },
  { title: "Teal", value: "teal" },
  { title: "Orange", value: "orange" },
  { title: "Slate", value: "slate" },
];

const nameRules = [(value) => !!String(value ?? "").trim() || "Name is required."];
const colorRules = [(value) => !!value || "Choose a color from the list."];

const name = computed({
  get: () => props.modelValue.name ?? "",
  set: (value) => emit("update:modelValue", { ...props.modelValue, name: value }),
});

const color = computed({
  get: () => props.modelValue.color ?? null,
  set: (value) => emit("update:modelValue", { ...props.modelValue, color: value }),
});

const form = ref(null);

async function validate() {
  const result = await form.value.validate();
  return result.valid;
}

defineExpose({ validate });
</script>

<template>
  <v-form ref="form">
    <v-text-field v-model="name" label="Name" class="class-name-field" :rules="nameRules" />
    <v-select
      v-model="color"
      label="Color"
      class="class-color-field"
      :items="colors"
      item-title="title"
      item-value="value"
      :rules="colorRules"
    />
  </v-form>
</template>
