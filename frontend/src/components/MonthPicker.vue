<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  selected: {
    type: Array,
    default: () => [],
  },
  multiple: {
    type: Boolean,
    default: true,
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

const emit = defineEmits(["update:selected"]);

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const year = ref(0);
const monthIndex = ref(0);

const heading = computed(() =>
  new Date(year.value, monthIndex.value, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  }),
);

const weeks = computed(() => buildWeeks(year.value, monthIndex.value));

watch(
  () => props.selected,
  (dates) => {
    if (!dates.length || year.value !== 0) {
      return;
    }
    show(dates[0]);
  },
  { immediate: true },
);

if (year.value === 0) {
  const today = new Date();
  year.value = today.getFullYear();
  monthIndex.value = today.getMonth();
}

function show(iso) {
  const [yearPart, monthPart] = iso.split("-").map(Number);
  year.value = yearPart;
  monthIndex.value = monthPart - 1;
}

function isoFromDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

const todayIso = isoFromDate(new Date());

function dayFlags(iso) {
  const flags = [];
  if (props.dueDate && iso === props.dueDate) {
    flags.push("Due");
  }
  if (props.startWorkingBy && iso === props.startWorkingBy) {
    flags.push("Start");
  }
  if (iso === todayIso) {
    flags.push("Today");
  }
  return flags;
}

function dayLabel(day) {
  const flags = dayFlags(day.iso);
  if (!flags.length) {
    return undefined;
  }
  return `${day.number}, ${flags.join(", ")}`;
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

function shiftMonth(delta) {
  const next = new Date(year.value, monthIndex.value + delta, 1);
  year.value = next.getFullYear();
  monthIndex.value = next.getMonth();
}

function choose(day) {
  if (!day.inMonth) {
    return;
  }
  if (!props.multiple) {
    emit("update:selected", [day.iso]);
    return;
  }
  const next = new Set(props.selected);
  if (next.has(day.iso)) {
    next.delete(day.iso);
  } else {
    next.add(day.iso);
  }
  emit("update:selected", [...next].sort());
}
</script>

<template>
  <div>
    <div class="d-flex align-center justify-center mb-2">
      <v-btn icon="mdi-chevron-left" variant="text" aria-label="Previous month" @click="shiftMonth(-1)" />
      <div class="text-subtitle-1 mx-2">{{ heading }}</div>
      <v-btn icon="mdi-chevron-right" variant="text" aria-label="Next month" @click="shiftMonth(1)" />
    </div>
    <div class="picker-grid">
      <div v-for="label in weekdayLabels" :key="label" class="picker-weekday">{{ label }}</div>
      <template v-for="(week, weekIndex) in weeks" :key="weekIndex">
        <button
          v-for="day in week"
          :key="day.iso"
          type="button"
          class="picker-day"
          :data-date="day.inMonth ? day.iso : undefined"
          :aria-pressed="day.inMonth && selected.includes(day.iso) ? 'true' : 'false'"
          :aria-label="dayLabel(day)"
          :disabled="!day.inMonth"
          @click="choose(day)"
        >
          <span class="picker-number" :class="{ 'is-today': day.iso === todayIso }">{{ day.number }}</span>
          <span v-if="dayFlags(day.iso).length" class="picker-flags">{{ dayFlags(day.iso).join(" ") }}</span>
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.picker-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
}

.picker-weekday,
.picker-day {
  text-align: center;
  font-size: 12px;
}

.picker-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  min-height: 36px;
  padding: 2px 0;
  cursor: pointer;
}

.picker-number.is-today {
  min-width: 16px;
  border-radius: 999px;
  box-shadow: inset 0 0 0 1px currentColor;
}

.picker-flags {
  font-size: 8px;
  line-height: 9px;
}

.picker-day[aria-pressed="true"] {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}

.picker-day:disabled {
  color: rgba(var(--v-theme-on-surface), 0.38);
  cursor: default;
}
</style>
