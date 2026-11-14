<script setup>
defineProps({
  modelValue: {
    type: String,
    default: "unfinished",
  },
});

const emit = defineEmits(["update:modelValue"]);
</script>

<template>
  <v-btn-toggle
    :model-value="modelValue"
    mandatory
    density="compact"
    divided
    color="primary"
    class="display-filter"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-btn value="unfinished">Unfinished</v-btn>
    <v-btn value="all">All</v-btn>
  </v-btn-toggle>
</template>
