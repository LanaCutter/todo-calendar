<script setup>
import { onMounted, ref } from "vue";
import ClassForm from "../components/ClassForm.vue";
import classServices from "../services/classServices.js";

const classes = ref([]);
const loading = ref(true);
const error = ref("");
const formOpen = ref(false);
const formError = ref("");
const saving = ref(false);
const editingId = ref(null);
const draft = ref({ name: "", color: null });

function colorLabel(color) {
  if (!color) {
    return "";
  }
  return color.charAt(0).toUpperCase() + color.slice(1);
}
const form = ref(null);
const deleteOpen = ref(false);
const deleting = ref(null);

async function loadClasses() {
  loading.value = true;
  error.value = "";

  try {
    const response = await classServices.getAll();
    classes.value = response.data;
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to load classes.";
  } finally {
    loading.value = false;
  }
}

function openAdd() {
  editingId.value = null;
  draft.value = { name: "", color: null };
  formError.value = "";
  formOpen.value = true;
}

function openEdit(item) {
  editingId.value = item.id;
  draft.value = { name: item.name, color: item.color };
  formError.value = "";
  formOpen.value = true;
}

function closeForm() {
  formOpen.value = false;
  formError.value = "";
}

async function save() {
  const valid = await form.value.validate();
  if (!valid) {
    return;
  }

  saving.value = true;
  formError.value = "";

  try {
    const payload = { name: draft.value.name, color: draft.value.color };
    if (editingId.value == null) {
      await classServices.create(payload);
    } else {
      await classServices.update(editingId.value, payload);
    }
    formOpen.value = false;
    await loadClasses();
  } catch (err) {
    formError.value = err.response?.data?.message || "Unable to save class.";
  } finally {
    saving.value = false;
  }
}

function openDelete(item) {
  deleting.value = item;
  deleteOpen.value = true;
}

function cancelDelete() {
  deleteOpen.value = false;
  deleting.value = null;
}

async function confirmDelete() {
  if (!deleting.value) {
    return;
  }

  error.value = "";

  try {
    await classServices.remove(deleting.value.id);
    deleteOpen.value = false;
    deleting.value = null;
    await loadClasses();
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to delete class.";
    deleteOpen.value = false;
  }
}

onMounted(loadClasses);
</script>

<template>
  <v-container class="py-6">
    <v-card class="page-card pa-6" rounded="lg" elevation="0">
    <div class="d-flex align-center justify-space-between flex-wrap ga-4 mb-6">
      <h1 class="text-h4">Classes</h1>
      <v-btn color="primary" variant="elevated" class="oc-cta" @click="openAdd">Add class</v-btn>
    </div>

    <v-progress-linear v-if="loading" indeterminate color="primary" />

    <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>

    <p v-if="!loading && classes.length === 0 && !error">No classes yet. Add your first class.</p>

    <v-table v-if="!loading && classes.length" class="class-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Color</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in classes" :key="item.id" class="class-row">
          <td>{{ item.name }}</td>
          <td>
            <span class="d-inline-flex align-center">
              <v-sheet
                :color="item.color"
                width="16"
                height="16"
                rounded
                class="class-swatch mr-2"
                :data-color="item.color"
              />
              {{ colorLabel(item.color) }}
            </span>
          </td>
          <td class="text-right">
            <v-btn icon="mdi-pencil" size="small" aria-label="Edit class" @click="openEdit(item)" />
            <v-btn icon="mdi-delete" size="small" aria-label="Delete class" @click="openDelete(item)" />
          </td>
        </tr>
      </tbody>
    </v-table>

    <v-dialog v-model="formOpen" max-width="480">
      <v-card>
        <v-card-title>{{ editingId == null ? "Add class" : "Edit class" }}</v-card-title>
        <v-card-text>
          <ClassForm ref="form" v-model="draft" />
          <v-alert v-if="formError" type="error" class="mt-2">{{ formError }}</v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="closeForm">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" class="oc-cta" :loading="saving" @click="save">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteOpen" max-width="420">
      <v-card>
        <v-card-text class="pt-6">Delete this class?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="cancelDelete">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" class="oc-cta" @click="confirmDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    </v-card>
  </v-container>
</template>
