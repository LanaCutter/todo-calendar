<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import assignmentServices from "../services/assignmentServices.js";
import classServices from "../services/classServices.js";
import dayTodoServices from "../services/dayTodoServices.js";
import TodoDialog from "../components/TodoDialog.vue";

const props = defineProps({
  showing: {
    type: String,
    default: "",
  },
});

const route = useRoute();
const router = useRouter();

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const assignments = ref([]);
const classes = ref([]);
const todos = ref([]);
const loading = ref(true);
const error = ref("");
const year = ref(0);
const monthIndex = ref(0);
const tabName = ref("calendar");
const tab = computed({
  get() {
    return tabName.value;
  },
  set(value) {
    tabName.value = value === "todos" ? "todos" : "calendar";
    router.replace(tabName.value === "todos" ? { path: "/", query: { tab: "todos" } } : { path: "/" });
  },
});
watch(
  () => route.query.tab,
  (value) => {
    tabName.value = value === "todos" ? "todos" : "calendar";
  },
  { immediate: true },
);
const todoOpen = ref(false);
const editingTodo = ref(null);
const todoDialog = ref(null);
const deleteOpen = ref(false);
const deletingTodo = ref(null);

const initial = initialMonth(props.showing);
year.value = initial.year;
monthIndex.value = initial.monthIndex;

const todayIso = isoFromDate(new Date());

const heading = computed(() =>
  new Date(year.value, monthIndex.value, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  }),
);

const weeks = computed(() => buildWeeks(year.value, monthIndex.value));

const hasStripe = computed(() =>
  weeks.value.some((week) => week.some((day) => day.inMonth && stripesOn(day.iso).length > 0)),
);

const lanes = computed(() =>
  assignments.value
    .filter((assignment) => weeks.value.some((week) => week.some((day) => day.inMonth && covers(assignment, day.iso))))
    .slice()
    .sort((left, right) => {
      const byStart = rangeStart(left).localeCompare(rangeStart(right));
      if (byStart !== 0) {
        return byStart;
      }
      const byName = left.name.localeCompare(right.name, undefined, { sensitivity: "base" });
      if (byName !== 0) {
        return byName;
      }
      return left.id - right.id;
    }),
);

function rangeStart(assignment) {
  if (!assignment.dueDate) {
    return "";
  }
  if (assignment.startWorkingBy && assignment.startWorkingBy <= assignment.dueDate) {
    return assignment.startWorkingBy;
  }
  return assignment.dueDate;
}

function showsName(assignment, iso) {
  return iso === rangeStart(assignment);
}

function neighborIso(iso, delta) {
  const [yearPart, monthPart, dayPart] = iso.split("-").map(Number);
  const date = new Date(yearPart, monthPart - 1, dayPart);
  if (delta < 0 && date.getDay() === 0) {
    return null;
  }
  if (delta > 0 && date.getDay() === 6) {
    return null;
  }
  date.setDate(date.getDate() + delta);
  if (date.getFullYear() !== year.value || date.getMonth() !== monthIndex.value) {
    return null;
  }
  return isoFromDate(date);
}

function continues(assignment, iso, delta) {
  const next = neighborIso(iso, delta);
  return !!next && covers(assignment, next);
}

function initialMonth(showing) {
  const match = /^(\d{4})-(\d{2})$/.exec(showing);
  if (match) {
    return { year: Number(match[1]), monthIndex: Number(match[2]) - 1 };
  }
  const today = new Date();
  return { year: today.getFullYear(), monthIndex: today.getMonth() };
}

function isoFromDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function buildWeeks(visibleYear, visibleMonth) {
  const first = new Date(visibleYear, visibleMonth, 1);
  const cursor = new Date(visibleYear, visibleMonth, 1 - first.getDay());
  const lastTime = new Date(visibleYear, visibleMonth + 1, 0).getTime();
  const rows = [];

  do {
    const week = [];
    for (let index = 0; index < 7; index += 1) {
      week.push({
        iso: isoFromDate(cursor),
        number: cursor.getDate(),
        inMonth: cursor.getFullYear() === visibleYear && cursor.getMonth() === visibleMonth,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    rows.push(week);
  } while (cursor.getTime() <= lastTime);

  return rows;
}

function covers(assignment, iso) {
  if (!assignment.dueDate) {
    return false;
  }
  if (assignment.startWorkingBy && assignment.startWorkingBy <= assignment.dueDate) {
    return iso >= assignment.startWorkingBy && iso <= assignment.dueDate;
  }
  return iso === assignment.dueDate;
}

function todoFor(assignment, iso) {
  return (assignment.dayTodos ?? []).find((item) => item.date === iso) ?? null;
}

function stripesOn(iso) {
  return assignments.value.filter((assignment) => covers(assignment, iso));
}

function shiftMonth(delta) {
  const next = new Date(year.value, monthIndex.value + delta, 1);
  year.value = next.getFullYear();
  monthIndex.value = next.getMonth();
}

async function loadCalendar() {
  loading.value = true;
  error.value = "";
  try {
    const [assignmentResponse, classResponse, todoResponse] = await Promise.all([
      assignmentServices.getAll(),
      classServices.getAll(),
      dayTodoServices.getAll(),
    ]);
    assignments.value = assignmentResponse.data;
    classes.value = classResponse.data;
    todos.value = todoResponse.data;
  } catch (err) {
    assignments.value = [];
    classes.value = [];
    todos.value = [];
    error.value = err.response?.data?.message || "Unable to load assignments.";
  } finally {
    loading.value = false;
  }
}

onMounted(loadCalendar);

function openAddTodo() {
  editingTodo.value = null;
  todoOpen.value = true;
}

function openEditTodo(todo) {
  editingTodo.value = todo;
  todoOpen.value = true;
}

function openDeleteTodo(todo) {
  deletingTodo.value = todo;
  deleteOpen.value = true;
}

async function saveTodo(payload) {
  try {
    if (editingTodo.value) {
      await dayTodoServices.update(editingTodo.value.id, payload);
    } else {
      await dayTodoServices.create(payload);
    }
    todoOpen.value = false;
    await loadCalendar();
  } catch (err) {
    todoDialog.value?.showError(err.response?.data?.message || "Unable to save todo.");
  }
}

async function confirmDeleteTodo() {
  try {
    await dayTodoServices.remove(deletingTodo.value.id);
    deleteOpen.value = false;
    await loadCalendar();
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to delete todo.";
  }
}

async function finishTodo(todo, completed) {
  if (completed === todo.completed) {
    return;
  }
  error.value = "";
  try {
    const response = await dayTodoServices.setCompleted(todo.id, { completed });
    const index = todos.value.findIndex((item) => item.id === todo.id);
    if (index >= 0) {
      todos.value[index] = { ...todos.value[index], completed: response.data.completed };
    }
    const assignment = assignments.value.find((item) => item.id === todo.assignmentId);
    const day = assignment?.dayTodos?.find((item) => item.date === todo.date);
    if (day) {
      day.completed = response.data.completed;
    }
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to update todo.";
  }
}
</script>

<template>
  <v-container class="py-6">
    <v-card class="page-card pa-6" rounded="lg" elevation="0">
      <div class="d-flex align-center justify-center mb-2">
        <v-btn icon="mdi-chevron-left" variant="text" aria-label="Previous month" @click="shiftMonth(-1)" />
        <h1 class="text-h4 text-no-wrap mx-4">{{ heading }}</h1>
        <v-btn icon="mdi-chevron-right" variant="text" aria-label="Next month" @click="shiftMonth(1)" />
      </div>

      <v-tabs v-model="tab" color="primary" align-tabs="center" class="mb-4">
        <v-tab value="calendar">Calendar</v-tab>
        <v-tab value="todos">Todos</v-tab>
      </v-tabs>

      <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />
      <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>

      <v-window v-model="tab">
        <v-window-item value="calendar">
          <div v-if="classes.length" class="class-legend">
            <div v-for="item in classes" :key="item.id" class="legend-item">
              <span class="legend-swatch" :class="`bg-${item.color}`" :data-color="item.color" />
              <span>{{ item.name }}</span>
            </div>
          </div>
          <div class="month-grid">
            <v-row class="flex-nowrap" no-gutters>
              <v-col v-for="label in weekdayLabels" :key="label" class="calendar-weekday text-caption text-center py-2">
                {{ label }}
              </v-col>
            </v-row>
            <v-row v-for="(week, weekIndex) in weeks" :key="weekIndex" class="calendar-week flex-nowrap" no-gutters>
              <v-col
                v-for="day in week"
                :key="day.iso"
                class="calendar-day"
                :data-iso="day.iso"
                :class="{ 'is-outside': !day.inMonth, 'is-today': day.iso === todayIso }"
              >
                <div class="day-number" :class="{ 'text-medium-emphasis': !day.inMonth && day.iso !== todayIso }">
                  <span class="day-number-label">{{ day.number }}</span>
                </div>
                <div v-if="day.inMonth" class="day-lanes">
                  <div v-for="(assignment, laneIndex) in lanes" :key="assignment.id" class="lane" :data-lane="laneIndex">
                    <div
                      v-if="covers(assignment, day.iso)"
                      class="assignment-stripe"
                      :class="[
                        `bg-${assignment.class.color}`,
                        {
                          'is-start': !continues(assignment, day.iso, -1),
                          'is-end': !continues(assignment, day.iso, 1),
                          'continues-left': continues(assignment, day.iso, -1),
                          'continues-right': continues(assignment, day.iso, 1),
                        },
                      ]"
                      :data-assignment-id="assignment.id"
                      :data-date="day.iso"
                      :data-color="assignment.class.color"
                    >
                      <span
                        v-if="todoFor(assignment, day.iso)"
                        class="todo-star"
                        :aria-label="todoFor(assignment, day.iso).completed ? 'Todo completed' : 'Todo'"
                      >★</span>
                      <span
                        v-if="showsName(assignment, day.iso)"
                        class="stripe-name"
                        :class="{ 'text-decoration-line-through': assignment.completed }"
                      >{{ assignment.name }}</span>
                      <span v-if="day.iso === assignment.dueDate" class="stripe-due">Due</span>
                    </div>
                  </div>
                </div>
              </v-col>
            </v-row>
          </div>
          <p v-if="!loading && !error && !hasStripe" class="mt-4">No assignments on this month's calendar.</p>
        </v-window-item>

        <v-window-item value="todos">
          <div class="d-flex justify-end mb-4">
            <v-btn color="primary" variant="elevated" class="oc-cta" @click="openAddTodo">Add todo</v-btn>
          </div>
          <p v-if="!loading && !error && todos.length === 0" class="todos-empty">No todos yet.</p>
          <v-table v-if="todos.length" class="todo-table">
            <thead>
              <tr>
                <th>Done</th>
                <th>Date</th>
                <th>Todo</th>
                <th>Class</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="todo in todos" :key="todo.id" class="todo-row">
                <td>
                  <v-checkbox-btn
                    :model-value="Boolean(todo.completed)"
                    aria-label="Finish todo"
                    density="compact"
                    @update:model-value="(value) => finishTodo(todo, value)"
                  />
                </td>
                <td>{{ todo.date }}</td>
                <td :class="{ 'text-decoration-line-through': todo.completed }">{{ todo.name }}</td>
                <td>
                  <span v-if="todo.class" class="d-inline-flex align-center">
                    <v-sheet
                      :color="todo.class.color"
                      width="12"
                      height="12"
                      rounded
                      class="mr-2"
                      :data-color="todo.class.color"
                    />
                    {{ todo.class.name }}
                  </span>
                </td>
                <td class="text-right">
                  <template v-if="todo.assignmentId == null">
                    <v-btn icon="mdi-pencil" size="small" variant="text" aria-label="Edit todo" @click="openEditTodo(todo)" />
                    <v-btn icon="mdi-delete" size="small" variant="text" aria-label="Delete todo" @click="openDeleteTodo(todo)" />
                  </template>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-window-item>
      </v-window>
    </v-card>
    <TodoDialog ref="todoDialog" v-model="todoOpen" :todo="editingTodo" @save="saveTodo" />
    <v-dialog v-model="deleteOpen" max-width="420">
      <v-card>
        <v-card-text class="pt-6">Delete this todo?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="deleteOpen = false">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" class="oc-cta" @click="confirmDeleteTodo">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.month-grid {
  border: 1px solid rgba(var(--v-theme-outline), 0.35);
  border-radius: 8px;
  overflow: hidden;
}

.month-grid :deep(.v-row) {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.month-grid :deep(.v-col) {
  width: auto;
  max-width: none;
  min-width: 0;
  flex: none;
}

.calendar-weekday,
.calendar-day {
  border-inline-end: 1px solid rgba(var(--v-theme-outline), 0.28);
  border-block-end: 1px solid rgba(var(--v-theme-outline), 0.28);
}

.month-grid :deep(.v-col:nth-child(7n)) {
  border-inline-end: none;
}

.calendar-week:last-child :deep(.calendar-day) {
  border-block-end: none;
}

.calendar-weekday {
  background: rgba(var(--v-theme-surface-variant), 0.7);
  font-weight: 600;
}

.calendar-day {
  min-height: 72px;
  overflow: visible;
}

.calendar-day.is-outside {
  background: rgba(var(--v-theme-surface-variant), 0.35);
}

.class-legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px 16px;
  margin-bottom: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.legend-swatch {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.day-number {
  height: 18px;
  padding: 1px 4px 0;
  font-size: 11px;
  font-weight: 600;
  line-height: 16px;
}

.calendar-day.is-today .day-number-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-size: 9px;
  line-height: 1;
}

.day-lanes {
  padding-bottom: 4px;
}

.lane {
  position: relative;
  height: 12px;
  margin-top: 2px;
}

.assignment-stripe {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  gap: 2px;
  overflow: hidden;
  font-size: 9px;
  line-height: 12px;
  white-space: nowrap;
  padding: 0 3px;
  z-index: 1;
}

.assignment-stripe.is-start {
  left: 2px;
  border-radius: 4px 0 0 4px;
}

.assignment-stripe.is-end {
  right: 2px;
  border-radius: 0 4px 4px 0;
}

.assignment-stripe.is-start.is-end {
  border-radius: 4px;
}

.assignment-stripe.continues-left {
  left: -1px;
}

.assignment-stripe.continues-right {
  right: -1px;
}

.todo-star,
.stripe-due {
  flex: none;
}

.stripe-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stripe-due {
  margin-left: auto;
}
</style>
