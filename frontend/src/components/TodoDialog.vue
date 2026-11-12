<script setup>
import { ref, watch } from "vue";
import MonthPicker from "./MonthPicker.vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  todo: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "save"]);

const name = ref("");
const selected = ref([]);
const error = ref("");

watch(
  () => props.modelValue,
  (open) => {
    if (!open) {
      return;
    }
    name.value = props.todo?.name ?? "";
    selected.value = props.todo?.date ? [props.todo.date] : [];
    error.value = "";
  },
);

function close() {
  emit("update:modelValue", false);
}

function save() {
  emit("save", { name: name.value, date: selected.value[0] ?? "" });
}

function showError(message) {
  error.value = message;
}

defineExpose({ showError });
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="420" @update:model-value="emit('update:modelValue', $event)">
    <v-card>
      <v-card-title>{{ todo ? "Edit todo" : "Add todo" }}</v-card-title>
      <v-card-text>
        <v-text-field v-model="name" label="Name" class="todo-name-field" />
        <MonthPicker v-if="modelValue" v-model:selected="selected" :multiple="false" />
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
