// === STATE ===
// selectedDate, selectedTime, currentMonth, currentYear

const calendarState = {
  selectedDate: null,
  selectedTime: null,
  currentMonth: null,
  currentYear: null,
  params: {}
};

const calendarDOM = {
  monthLabel: null,
  calendarGrid: null,
  slotsShell: null,
  confirmButton: null,
  calendarCard: null,
  confirmationCard: null,
  confirmLineMain: null,
  confirmLineEmail: null
};

const SLOT_TIMES = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM"
];

function getTodayMidnight() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function isSameDay(a, b) {
  return (
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatMonthLabel(month, year) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric"
  }).format(new Date(year, month, 1));
}

function formatFullDisplay(date, time) {
  const longPart = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
  return `${longPart} at ${time}`;
}

// === URL PARAMS ===
// Read name, email, and other fields passed from form.html

function readUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const patientName = params.get('name') || 'Patient';
  const patientEmail = params.get('email') || '';
  const patientPhone = params.get('phone') || '';
  calendarState.params = {
    name: patientName,
    email: patientEmail,
    phone: patientPhone
  };
}

// === CALENDAR RENDER ===
// renderCalendar(month, year)

function renderCalendar(month, year) {
  if (!calendarDOM.calendarGrid || !calendarDOM.monthLabel) return;

  calendarState.currentMonth = month;
  calendarState.currentYear = year;

  calendarDOM.monthLabel.textContent = formatMonthLabel(month, year);
  calendarDOM.calendarGrid.innerHTML = "";

  const firstOfMonth = new Date(year, month, 1);
  const firstDay = firstOfMonth.getDay(); // 0 = Sun, 1 = Mon...
  const offset = (firstDay + 6) % 7; // make Monday index 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayMidnight = getTodayMidnight();
  const today = new Date();

  for (let i = 0; i < offset; i += 1) {
    const empty = document.createElement("div");
    empty.className = "day-cell day-cell-empty";
    calendarDOM.calendarGrid.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const cell = document.createElement("button");
    cell.type = "button";
    cell.textContent = String(day);
    cell.className = "day-cell";

    const isSunday = date.getDay() === 0;
    const isPast = date < todayMidnight;
    const isToday = isSameDay(date, today);

    if (isSunday || isPast) {
      cell.classList.add("day-cell-disabled");
      cell.disabled = true;
    } else {
      cell.classList.add("day-cell-available");
      cell.dataset.date = date.toISOString();
      cell.addEventListener("click", () => handleDateClick(date));
    }

    if (isToday) {
      cell.classList.add("day-cell-today");
    }

    if (calendarState.selectedDate && isSameDay(date, calendarState.selectedDate)) {
      cell.classList.add("day-cell-selected");
    }

    calendarDOM.calendarGrid.appendChild(cell);
  }
}

function handleDateClick(date) {
  calendarState.selectedDate = new Date(date.getTime());
  calendarState.selectedTime = null;
  renderCalendar(calendarState.currentMonth, calendarState.currentYear);
  renderTimeSlots(calendarState.selectedDate.getDate());
}

function shiftMonth(delta) {
  let month = calendarState.currentMonth + delta;
  let year = calendarState.currentYear;
  if (month < 0) {
    month = 11;
    year -= 1;
  } else if (month > 11) {
    month = 0;
    year += 1;
  }
  calendarState.selectedDate = null;
  calendarState.selectedTime = null;
  if (calendarDOM.slotsShell) {
    calendarDOM.slotsShell.innerHTML = "";
  }
  if (calendarDOM.confirmButton) {
    calendarDOM.confirmButton.classList.remove("visible");
  }
  renderCalendar(month, year);
}

// === TIME SLOTS ===
// renderTimeSlots(dateNum) — includes seeded taken-slot logic

function renderTimeSlots(dateNum) {
  if (!calendarDOM.slotsShell) return;

  calendarDOM.slotsShell.innerHTML = "";

  const heading = document.createElement("div");
  heading.className = "slots-header";

  if (calendarState.selectedDate) {
    const pretty = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long"
    }).format(calendarState.selectedDate);
    heading.textContent = `Available times for ${pretty}`;
  } else {
    heading.textContent = "Available times";
  }

  calendarDOM.slotsShell.appendChild(heading);

  const grid = document.createElement("div");
  grid.className = "slots-grid";

  const takenIndices = new Set();
  const count = SLOT_TIMES.length;
  takenIndices.add(dateNum % count);
  takenIndices.add((dateNum + 3) % count);
  takenIndices.add((dateNum + 6) % count);

  SLOT_TIMES.forEach((time, index) => {
    const btn = document.createElement("button");
    btn.type = "button";

    if (takenIndices.has(index)) {
      btn.className = "slot-btn slot-taken";
      btn.textContent = `${time} — Taken`;
      btn.disabled = true;
    } else {
      btn.className = "slot-btn";
      btn.textContent = time;
      btn.dataset.time = time;
      btn.addEventListener("click", () => handleSlotClick(time, btn));
    }

    grid.appendChild(btn);
  });

  calendarDOM.slotsShell.appendChild(grid);
  slideUp(calendarDOM.slotsShell);
}

function handleSlotClick(time, button) {
  calendarState.selectedTime = time;
  const buttons = calendarDOM.slotsShell.querySelectorAll(".slot-btn");
  buttons.forEach((b) => b.classList.remove("slot-selected"));
  button.classList.add("slot-selected");
  if (calendarDOM.confirmButton) {
    calendarDOM.confirmButton.classList.add("visible");
    slideUp(calendarDOM.confirmButton);
  }
}

// === ANIMATIONS ===
// fadeIn(el), fadeOut(el), slideUp(el)

function fadeIn(el) {
  if (!el) return;
  el.style.animation = "fadeIn 0.3s ease forwards";
}

function fadeOut(el, callback) {
  if (!el) return;
  el.style.animation = "fadeOut 0.35s ease forwards";
  const handler = () => {
    el.removeEventListener("animationend", handler);
    if (typeof callback === "function") callback();
  };
  el.addEventListener("animationend", handler);
}

function slideUp(el) {
  if (!el) return;
  el.style.animation = "slideUp 0.3s ease forwards";
}

// === CONFIRMATION ===
// showConfirmation() — builds and animates in the confirmation card

function showConfirmation() {
  // when user has chosen date/time, redirect to the standalone confirmation page
  if (!calendarState.selectedDate || !calendarState.selectedTime) {
    return;
  }

  // construct outgoing params
  const outParams = new URLSearchParams();
  outParams.set('name', calendarState.params.name || '');
  outParams.set('email', calendarState.params.email || '');
  outParams.set('phone', calendarState.params.phone || '');

  // human-readable date and time values
  const dateStr = calendarState.selectedDate
    ? new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(calendarState.selectedDate)
    : '';
  const timeStr = calendarState.selectedTime || '';

  outParams.set('date', dateStr);
  outParams.set('time', timeStr);

  // Update CRM record with appointment date and time
  var patientEmail = calendarState.params.email || '';

  if (patientEmail) {
    fetch('https://preview-sandbox--69a50682df9af07889300c56.base44.app/functions/new-patient-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'K7mP3xQn9vR2tY8wA4jB6cD1eF5gH0iL'
      },
      body: JSON.stringify({
        updateOnly: true,
        email: patientEmail,
        appointmentDate: dateStr,
        appointmentTime: timeStr
      })
    })
    .then(function(r) { return r.json(); })
    .then(function(d) { console.log('Appointment updated in CRM:', d); })
    .catch(function(e) { console.error('Appointment update failed:', e); });
  }

  window.location.href = 'confirmation.html?' + outParams.toString();
}

// === EVENT LISTENERS ===
// All handlers here, no inline onclick in HTML

function initCalendar() {
  calendarDOM.monthLabel = document.getElementById("monthLabel");
  calendarDOM.calendarGrid = document.getElementById("calendarGrid");
  calendarDOM.slotsShell = document.getElementById("slotsShell");
  calendarDOM.confirmButton = document.getElementById("confirmButton");
  calendarDOM.calendarCard = document.getElementById("calendarCard");
  calendarDOM.confirmationCard = document.getElementById("confirmationCard");
  calendarDOM.confirmLineMain = document.getElementById("confirmLineMain");
  calendarDOM.confirmLineEmail = document.getElementById("confirmLineEmail");

  readUrlParams();

  const today = new Date();
  calendarState.currentMonth = today.getMonth();
  calendarState.currentYear = today.getFullYear();

  renderCalendar(calendarState.currentMonth, calendarState.currentYear);

  const prev = document.getElementById("prevMonth");
  const next = document.getElementById("nextMonth");

  if (prev) {
    prev.addEventListener("click", () => shiftMonth(-1));
  }
  if (next) {
    next.addEventListener("click", () => shiftMonth(1));
  }

  if (calendarDOM.confirmButton) {
    calendarDOM.confirmButton.addEventListener("click", showConfirmation);
  }
}

document.addEventListener("DOMContentLoaded", initCalendar);

