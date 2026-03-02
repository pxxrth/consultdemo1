// === SECTION 1: STATE ===
// Stores: selectedDate, selectedTime, currentMonth, currentYear

const bookingState = {
  selectedDate: null,
  selectedTime: null,
  currentMonth: null,
  currentYear: null
};

const bookingDOM = {
  calendarMonthLabel: null,
  calendarGrid: null,
  timeSlotsContainer: null,
  continueButton: null,
  calendarCard: null,
  tallyCard: null,
  confirmationHeader: null
};

const TIME_SLOTS = [
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

function isSameDay(a, b) {
  return (
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatCalendarMonth(month, year) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric"
  }).format(new Date(year, month, 1));
}

function formatFullDate(date, timeString) {
  const longDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
  return timeString ? `${longDate} at ${timeString}` : longDate;
}

function getTodayMidnight() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// === SECTION 2: CALENDAR RENDER ===
// renderCalendar(month, year) — builds the entire date grid from scratch

function renderCalendar(month, year) {
  if (!bookingDOM.calendarGrid || !bookingDOM.calendarMonthLabel) return;

  bookingState.currentMonth = month;
  bookingState.currentYear = year;

  bookingDOM.calendarMonthLabel.textContent = formatCalendarMonth(month, year);
  bookingDOM.calendarGrid.innerHTML = "";

  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // convert Sunday=0 to Monday=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayMidnight = getTodayMidnight();
  const today = new Date();

  for (let i = 0; i < startOffset; i += 1) {
    const empty = document.createElement("div");
    empty.className = "calendar-day calendar-day--empty";
    bookingDOM.calendarGrid.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const isSunday = date.getDay() === 0;
    const isPast = date < todayMidnight;
    const isToday = isSameDay(date, today);

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = String(day);
    button.className = "calendar-day";

    if (isToday) {
      button.classList.add("calendar-day--today");
    }

    const selectable = !isSunday && !isPast;

    if (!selectable) {
      button.classList.add("calendar-day--disabled");
      button.disabled = true;
    } else {
      button.classList.add("calendar-day--available");
      button.dataset.date = date.toISOString();
      button.addEventListener("click", () => handleDateClick(date));
    }

    if (bookingState.selectedDate && isSameDay(date, bookingState.selectedDate)) {
      button.classList.add("calendar-day--selected");
    }

    bookingDOM.calendarGrid.appendChild(button);
  }
}

function handleDateClick(date) {
  bookingState.selectedDate = new Date(date.getTime());
  bookingState.selectedTime = null;
  renderCalendar(bookingState.currentMonth, bookingState.currentYear);
  renderTimeSlots(bookingState.selectedDate);
}

function changeMonth(delta) {
  let month = bookingState.currentMonth + delta;
  let year = bookingState.currentYear;

  if (month < 0) {
    month = 11;
    year -= 1;
  } else if (month > 11) {
    month = 0;
    year += 1;
  }

  bookingState.selectedDate = null;
  bookingState.selectedTime = null;

  if (bookingDOM.timeSlotsContainer) {
    bookingDOM.timeSlotsContainer.innerHTML = "";
  }
  updateContinueButtonVisibility();

  renderCalendar(month, year);
}

// === SECTION 3: SLOT RENDER ===
// renderTimeSlots(date) — builds time slot buttons, applies seeded "taken" logic

function renderTimeSlots(date) {
  if (!bookingDOM.timeSlotsContainer || !date) return;

  bookingDOM.timeSlotsContainer.innerHTML = "";

  const heading = document.createElement("h3");
  heading.className = "time-slots-heading";
  heading.textContent = `Available times for ${formatFullDate(date, "").replace(/ at $/, "")}`;
  bookingDOM.timeSlotsContainer.appendChild(heading);

  const grid = document.createElement("div");
  grid.className = "time-slot-grid";

  const dayOfMonth = date.getDate();
  const taken = new Set();
  const count = TIME_SLOTS.length;
  taken.add(dayOfMonth % count);
  taken.add((dayOfMonth + 3) % count);
  taken.add((dayOfMonth + 6) % count);

  TIME_SLOTS.forEach((slot, index) => {
    const btn = document.createElement("button");
    btn.type = "button";

    if (taken.has(index)) {
      btn.className = "time-slot time-slot--taken";
      btn.textContent = `${slot} — Taken`;
      btn.disabled = true;
      btn.setAttribute("aria-disabled", "true");
    } else {
      btn.className = "time-slot";
      btn.textContent = slot;
      btn.dataset.time = slot;
      btn.addEventListener("click", () => handleTimeSlotClick(slot, btn));

      if (bookingState.selectedTime === slot) {
        btn.classList.add("time-slot--selected");
      }
    }

    grid.appendChild(btn);
  });

  bookingDOM.timeSlotsContainer.appendChild(grid);
  showTimeSlots();
  updateContinueButtonVisibility();
}

function handleTimeSlotClick(time, button) {
  bookingState.selectedTime = time;

  const buttons = bookingDOM.timeSlotsContainer.querySelectorAll(".time-slot");
  buttons.forEach((b) => b.classList.remove("time-slot--selected"));
  button.classList.add("time-slot--selected");

  updateContinueButtonVisibility();
}

// === SECTION 4: TRANSITIONS ===
// showTimeSlots() — fadeInUp animation
// showTallyForm() — fade calendar out, fade form in, build confirmation header

function showTimeSlots() {
  if (!bookingDOM.timeSlotsContainer) return;
  bookingDOM.timeSlotsContainer.classList.remove("fade-in-up");
  // Force reflow so the animation can restart
  void bookingDOM.timeSlotsContainer.offsetWidth;
  bookingDOM.timeSlotsContainer.classList.add("fade-in-up");
}

function updateContinueButtonVisibility() {
  if (!bookingDOM.continueButton) return;

  const ready = bookingState.selectedDate && bookingState.selectedTime;

  if (ready) {
    bookingDOM.continueButton.style.display = "block";
    bookingDOM.continueButton.classList.add("fade-in-up");
  } else {
    bookingDOM.continueButton.style.display = "none";
    bookingDOM.continueButton.classList.remove("fade-in-up");
  }
}

function showTallyForm() {
  if (
    !bookingDOM.calendarCard ||
    !bookingDOM.tallyCard ||
    !bookingState.selectedDate ||
    !bookingState.selectedTime
  ) {
    return;
  }

  const fullText = formatFullDate(bookingState.selectedDate, bookingState.selectedTime);

  if (bookingDOM.confirmationHeader) {
    bookingDOM.confirmationHeader.textContent =
      `You're booking a consultation for ${fullText}`;
  }

  try {
    sessionStorage.setItem(
      "maConsultationBooking",
      JSON.stringify({
        dateISO: bookingState.selectedDate.toISOString(),
        time: bookingState.selectedTime,
        display: fullText
      })
    );
  } catch (e) {
    // ignore storage issues
  }

  bookingDOM.calendarCard.classList.add("fade-out");

  const onTransitionEnd = () => {
    bookingDOM.calendarCard.removeEventListener("transitionend", onTransitionEnd);
    bookingDOM.calendarCard.style.display = "none";
    bookingDOM.tallyCard.style.display = "block";
    bookingDOM.tallyCard.classList.add("fade-in-up");
  };

  bookingDOM.calendarCard.addEventListener("transitionend", onTransitionEnd);
}

// === SECTION 5: URL PARAMS ===
// buildConfirmationURL() — constructs the confirmation.html URL with date/time params
// readConfirmationParams() — reads params on confirmation.html page load

function buildConfirmationURL() {
  if (!bookingState.selectedDate || !bookingState.selectedTime) {
    return "confirmation.html";
  }

  const dateISO = encodeURIComponent(bookingState.selectedDate.toISOString());
  const time = encodeURIComponent(bookingState.selectedTime);
  return `confirmation.html?date=${dateISO}&time=${time}`;
}

function readConfirmationParams() {
  const params = new URLSearchParams(window.location.search);
  let dateISO = params.get("date");
  let time = params.get("time");
  let fullText = "";

  if (dateISO) {
    const date = new Date(dateISO);
    if (!Number.isNaN(date.getTime())) {
      fullText = formatFullDate(date, time || "");
    }
  }

  if (!fullText) {
    try {
      const stored = JSON.parse(sessionStorage.getItem("maConsultationBooking") || "{}");
      if (stored.dateISO) {
        const date = new Date(stored.dateISO);
        if (!Number.isNaN(date.getTime())) {
          fullText = formatFullDate(date, stored.time || "");
        }
      }
    } catch (e) {
      // ignore
    }
  }

  const lineEl = document.getElementById("confirmationDateTime");
  if (lineEl && fullText) {
    lineEl.textContent = `Your appointment is confirmed for ${fullText}`;
  }
}

// expose for manual configuration of Tally redirect URL
window.buildConfirmationURL = buildConfirmationURL;

// === SECTION 6: EVENT LISTENERS ===
// All click handlers attached here, never inline in HTML

function initIntakePage() {
  bookingDOM.calendarMonthLabel = document.getElementById("calendarMonthLabel");
  bookingDOM.calendarGrid = document.getElementById("calendarGrid");
  bookingDOM.timeSlotsContainer = document.getElementById("timeSlotsContainer");
  bookingDOM.continueButton = document.getElementById("continueToForm");
  bookingDOM.calendarCard = document.getElementById("calendarCard");
  bookingDOM.tallyCard = document.getElementById("tallyCard");
  bookingDOM.confirmationHeader = document.getElementById("bookingConfirmationHeader");

  if (!bookingDOM.calendarGrid || !bookingDOM.calendarMonthLabel) {
    return;
  }

  const today = new Date();
  bookingState.currentMonth = today.getMonth();
  bookingState.currentYear = today.getFullYear();

  renderCalendar(bookingState.currentMonth, bookingState.currentYear);

  const prev = document.getElementById("calendarPrev");
  const next = document.getElementById("calendarNext");

  if (prev) {
    prev.addEventListener("click", () => changeMonth(-1));
  }
  if (next) {
    next.addEventListener("click", () => changeMonth(1));
  }

  if (bookingDOM.continueButton) {
    bookingDOM.continueButton.addEventListener("click", showTallyForm);
  }

  try {
    const stored = sessionStorage.getItem("maConsultationBooking");
    if (stored) {
      const parsed = JSON.parse(stored);
      const banner = document.getElementById("appointmentBanner");
      const datetimeEl = document.getElementById("appointmentDatetime");
      if (banner && datetimeEl && parsed.display) {
        datetimeEl.textContent = parsed.display;
        banner.classList.add("has-booking");
      }
    }
  } catch (e) {
    // ignore storage issues
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;

  if (page === "intake") {
    initIntakePage();
  } else if (page === "confirmation") {
    readConfirmationParams();
  }
});

