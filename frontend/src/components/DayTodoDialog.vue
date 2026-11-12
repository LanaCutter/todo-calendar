<script setup>
import { ref, watch } from "vue";
import MonthPicker from "./MonthPicker.vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  dates: {
    type: Array,
    default: () => [],
  },
  error: {
    type: String,
    default: "",
  },
  dueDate: {
    type: String,
    default: "",
  },
  startWorkingBy: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:modelValue", "save"]);

const selected = ref([]);

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      selected.value = [...props.dates];
    }
  },
);

function close() {
  emit("update:modelValue", false);
}

function save() {
  emit("save", [...selected.value]);
}
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="420" @update:model-value="emit('update:modelValue', $event)">
    <v-card>
      <v-card-title>Create todo</v-card-title>
      <v-card-text>
        <p class="mb-3">Select every day to do this assignment.</p>
        <MonthPicker
          v-if="modelValue"
          v-model:selected="selected"
          :due-date="dueDate"
          :start-working-by="startWorkingBy"
        />
        <v-alert v-if="error" type="error" class="mt-3">{{ error }}</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="secondary" variant="text" @click="close">Cancel</v-btn>
        <v-btn color="primary" variant="elevated" class="oc-cta" @click="save">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
