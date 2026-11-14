<script setup>
</script>

<template>
  <v-navigation-drawer permanent color="primary" class="app-sidebar">
    <div class="sidebar-title px-4 pt-6 pb-2">Todo</div>
    <v-list nav density="comfortable" bg-color="transparent">
      <v-list-item to="/" exact title="Calendar" prepend-icon="mdi-calendar-month" />
      <v-list-item to="/assignments" title="Assignments" prepend-icon="mdi-format-list-bulleted" />
      <v-list-item :to="{ path: '/', query: { tab: 'todos' } }" exact title="Todos" prepend-icon="mdi-checkbox-marked-outline" />
      <v-list-item to="/classes" title="Classes" prepend-icon="mdi-palette" />
    </v-list>
  </v-navigation-drawer>
</template>

<style scoped>
.sidebar-title {
  color: rgb(var(--v-theme-on-primary));
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.app-sidebar :deep(.v-list-item-title),
.app-sidebar :deep(.v-icon) {
  color: rgb(var(--v-theme-on-primary));
}

.app-sidebar :deep(.v-list-item) {
  border-radius: 8px;
  margin-bottom: 4px;
}

.app-sidebar :deep(.v-list-item--active) {
  background: rgba(var(--v-theme-on-primary), 0.16);
}
</style>
