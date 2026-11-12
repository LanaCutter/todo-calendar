<script setup>
import { onMounted, ref } from "vue";
import AssignmentForm from "../components/AssignmentForm.vue";
import assignmentServices from "../services/assignmentServices.js";
import classServices from "../services/classServices.js";

const assignments = ref([]);
const classes = ref([]);
const loading = ref(true);
const error = ref("");
const formOpen = ref(false);
const formError = ref("");
const saving = ref(false);
const editingId = ref(null);
const draft = ref(emptyDraft());
const form = ref(null);
const deleteOpen = ref(false);
const deleting = ref(null);

function emptyDraft() {
  return { name: "", classId: null, startWorkingBy: null, dueDate: null, dueTime: null };
}

async function loadAssignments() {
  loading.value = true;
  error.value = "";

  try {
    const [assignmentResponse, classResponse] = await Promise.all([
      assignmentServices.getAll(),
      classServices.getAll(),
    ]);
    assignments.value = assignmentResponse.data;
    classes.value = classResponse.data;
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to load assignments.";
  } finally {
    loading.value = false;
  }
}

function openAdd() {
  editingId.value = null;
  draft.value = emptyDraft();
  formError.value = "";
  formOpen.value = true;
}

function openEdit(item) {
  editingId.value = item.id;
  draft.value = {
    name: item.name,
    classId: item.classId,
    startWorkingBy: item.startWorkingBy,
    dueDate: item.dueDate,
    dueTime: item.dueTime,
  };
  formError.value = "";
  formOpen.value = true;
}

function closeForm() {
  formOpen.value = false;
  formError.value = "";
}

function payloadFromDraft() {
  return {
    name: draft.value.name,
    classId: draft.value.classId,
    startWorkingBy: draft.value.startWorkingBy || null,
    dueDate: draft.value.dueDate || null,
    dueTime: draft.value.dueTime || null,
  };
}

async function save() {
  if (classes.value.length === 0) {
    return;
  }

  const valid = await form.value.validate();
  if (!valid) {
    return;
  }

  saving.value = true;
  formError.value = "";

  try {
    const payload = payloadFromDraft();
    if (editingId.value == null) {
      await assignmentServices.create(payload);
    } else {
      await assignmentServices.update(editingId.value, payload);
    }
    formOpen.value = false;
    await loadAssignments();
  } catch (err) {
    formError.value = err.response?.data?.message || "Unable to save assignment.";
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
    await assignmentServices.remove(deleting.value.id);
    deleteOpen.value = false;
    deleting.value = null;
    await loadAssignments();
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to delete assignment.";
    deleteOpen.value = false;
  }
}

onMounted(loadAssignments);
</script>

<template>
  <v-container class="py-6">
    <v-card class="page-card pa-6" rounded="lg" elevation="0">
    <div class="d-flex align-center justify-space-between flex-wrap ga-4 mb-6">
      <h1 class="text-h4">Assignments</h1>
      <v-btn color="primary" variant="elevated" class="oc-cta" @click="openAdd">Add assignment</v-btn>
    </div>

    <v-progress-linear v-if="loading" indeterminate color="primary" />

    <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>

    <p v-if="!loading && assignments.length === 0 && !error">No assignments yet. Add your first assignment.</p>

    <v-table v-if="!loading && assignments.length" class="assignment-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Class</th>
          <th>Due date</th>
          <th>Due time</th>
          <th>Start working by</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in assignments" :key="item.id" class="assignment-row">
          <td>{{ item.name }}</td>
          <td>
            <span class="d-inline-flex align-center">
              <v-sheet
                :color="item.class.color"
                width="16"
                height="16"
                rounded
                class="class-swatch mr-2"
                :data-color="item.class.color"
              />
              {{ item.class.name }}
            </span>
          </td>
          <td>{{ item.dueDate || "" }}</td>
          <td>{{ item.dueTime || "" }}</td>
          <td>{{ item.startWorkingBy || "" }}</td>
          <td class="text-right">
            <v-btn icon="mdi-pencil" size="small" aria-label="Edit assignment" @click="openEdit(item)" />
            <v-btn icon="mdi-delete" size="small" aria-label="Delete assignment" @click="openDelete(item)" />
          </td>
        </tr>
      </tbody>
    </v-table>

    <v-dialog v-model="formOpen" max-width="520">
      <v-card>
        <v-card-title>{{ editingId == null ? "Add assignment" : "Edit assignment" }}</v-card-title>
        <v-card-text>
          <v-alert v-if="classes.length === 0" type="error" class="mb-2">
            Add a class before creating an assignment.
          </v-alert>
          <AssignmentForm v-else ref="form" v-model="draft" :classes="classes" />
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
        <v-card-text class="pt-6">Delete this assignment?</v-card-text>
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
