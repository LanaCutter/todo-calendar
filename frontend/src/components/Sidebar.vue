<script setup>
</script>

<template>
  <v-navigation-drawer permanent color="primary" class="app-sidebar">
    <v-list nav density="comfortable" bg-color="transparent">
      <v-list-item to="/" exact title="Assignments" />
      <v-list-item to="/classes" title="Classes" />
    </v-list>
  </v-navigation-drawer>
</template>

<style scoped>
.app-sidebar :deep(.v-list-item-title) {
  color: rgb(var(--v-theme-on-primary));
}

.app-sidebar :deep(.v-list-item--active) {
  background: rgba(var(--v-theme-on-primary), 0.16);
}
</style>
