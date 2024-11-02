const fs = require("fs");
const path = require("path");
const os = require("os");
const logDiv = document.getElementById("log");
const employeeSelect = document.getElementById("employeeSelect");

// Data storage for attendance and rest days
const attendanceData = [];
const restDaysData = [];

// Function to load employees from Local Storage and populate the select dropdown
function loadEmployees() {
  console.log("HERE");

  const storedEmployees = localStorage.getItem("employees");
  if (storedEmployees) {
    const employees = JSON.parse(storedEmployees);
    employees.forEach((employee) => {
      const option = document.createElement("option");
      option.value = employee.id; // Use the employee ID as the value
      option.textContent = employee.name; // Display the employee name
      employeeSelect.appendChild(option);
    });
  }
}

// Load rest days from local storage
function loadRestDays() {
  const storedRestDays = localStorage.getItem("restDays");

  if (storedRestDays) {
    const restDays = JSON.parse(storedRestDays);
    restDays.forEach((record) => {
      logDiv.innerHTML += `
                <div class="alert alert-info my-2 log-entry" data-id="${record.employeeId}" data-date="${record.date}" data-name="${record.employeeName}">
                    <strong>Employee ID: ${record.employeeId} (${record.employeeName})</strong><br>
                    Marked as on rest day for <strong>${record.date}</strong>
                </div>`;
    });
  }
}

function markRest() {
  const selectedOption = employeeSelect.selectedOptions[0]; // Get the selected option
  const employeeId = selectedOption.value; // Get selected employee ID
  const employeeName = selectedOption.text; // Get selected employee name directly

  if (employeeId) {
    // Format the date as "DD/MM/YYYY"
    const today = new Date();
    const restDay = `${today.getDate()}/${
      today.getMonth() + 1
    }/${today.getFullYear()}`;
    const record = { employeeId, employeeName, date: restDay }; // Store employee name in the log record

    // Check for existing rest days for the same employee on the same day
    const existingRestDays = JSON.parse(localStorage.getItem("restDays")) || [];
    const isAlreadyResting = existingRestDays.some(
      (rest) => rest.employeeId === employeeId && rest.date === restDay
    );

    if (isAlreadyResting) {
      alert(
        `Employee ID ${employeeId} (${employeeName}) is already marked as on rest day for ${restDay}.`
      );
      return; // Prevent adding the same entry
    }

    // Append to restDaysData array
    restDaysData.push(record);

    // Update local storage
    saveRestDaysToLocalStorage(record);

    // Log the entry
    logDiv.innerHTML += `
      <div class="alert alert-info my-2 log-entry" data-id="${employeeId}" data-name="${employeeName}" data-date="${restDay}">
        <i class="fas fa-bed"></i>
        <strong>Employee ID: ${employeeId} (${employeeName})</strong><br>
        Marked as on rest day for <strong>${restDay}</strong>
      </div>`;
  } else {
    alert("Please select an Employee");
  }
}

// Function to save rest days to local storage
function saveRestDaysToLocalStorage(record) {
  const existingRestDays = JSON.parse(localStorage.getItem("restDays")) || [];
  existingRestDays.push(record);
  localStorage.setItem("restDays", JSON.stringify(existingRestDays));
}
const XLSX = require("xlsx");

window.onload = function () {
  loadEmployees();
  loadRestDays();
  if (typeof XLSX === "undefined" || typeof XLSX.utils === "undefined") {
    console.error("XLSX library or utils not loaded.");
    alert("Failed to load the XLSX library. Check the console for errors.");
  } else {
    console.log("XLSX library loaded successfully:", XLSX.utils);
  }
};

function exportData() {
  const restDays = JSON.parse(localStorage.getItem("restDays")) || [];
  const employees = JSON.parse(localStorage.getItem("employees")) || [];
  console.log("Loaded Employees:", employees);
  console.log("Loaded Rest Days:", restDays);

  const date = new Date();
  let month = date.getMonth();
  let year = date.getFullYear();

  const attendanceTime = localStorage.getItem("attendanceTime") || "7 صباحا";
  const leaveTime = localStorage.getItem("leaveTime") || "7 مساء";

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const employeeRecords = {};
  employees.forEach((employee) => {
    const [day, month, year] = employee.dateAdded.split("/").map(Number);
    const dateAdded = new Date(year, month - 1, day);

    if (isNaN(dateAdded.getTime())) {
      console.error(`Invalid date added for employee: ${employee.name}`);
      return;
    }
    employeeRecords[employee.id] = {
      name: employee.name,
      dateAdded: dateAdded,
      restDays: [],
    };
  });

  restDays.forEach((record) => {
    const [day, month, year] = record.date.split("/").map(Number);
    const restDay = new Date(year, month - 1, day);

    if (isNaN(restDay.getTime())) {
      return;
    }

    if (employeeRecords[record.employeeId]) {
      employeeRecords[record.employeeId].restDays.push(restDay);
    }
  });

  const data = [];
  const dateHeader = ["اسم الموظف"];
  const attendanceHeader = [""];

  function formatDate(date) {

    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month, day);
    const dateString = formatDate(currentDate);
    dateHeader.push(dateString, "");
    attendanceHeader.push("حضور", "انصراف");
  }
  data.push(dateHeader);
  data.push(attendanceHeader);

  Object.keys(employeeRecords).forEach((employeeId) => {
    const { name, dateAdded, restDays } = employeeRecords[employeeId];
    const row = [name];

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const dateString = formatDate(currentDate);
      const isBeforeDateAdded = currentDate < dateAdded;
      const isFutureDate = currentDate > date;

      const isRestDay = restDays.some((restDay) => {
        return (
          restDay.getFullYear() === currentDate.getFullYear() &&
          restDay.getMonth() === currentDate.getMonth() &&
          restDay.getDate() === currentDate.getDate()
        );
      });

      if (isFutureDate || isBeforeDateAdded) {
        row.push("", "");
        console.log(`- ${dateString} is outside of valid attendance period`);
      } else if (isRestDay) {
        row.push("راحة", "");
        console.log(`- Marked Rest Day for ${name} on ${dateString}`);
      } else {
        row.push(attendanceTime, leaveTime);
        console.log(`- Recorded Attendance for ${name} on ${dateString}`);
      }
    }

    data.push(row);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  worksheet["!cols"] = [{ wch: 22 }];
  for (let i = 1; i <= daysInMonth * 2; i++) {
    worksheet["!cols"].push({ wch: 12 });
  }

  data.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
      if (!worksheet[cellAddress]) worksheet[cellAddress] = {};
      worksheet[cellAddress].s = {
        alignment: {
          horizontal: "center",
          vertical: "center",
        },
      };
    });
  });

  worksheet["!merges"] = [];
  for (let col = 1; col <= daysInMonth * 2; col += 2) {
    worksheet["!merges"].push({ s: { r: 0, c: col }, e: { r: 0, c: col + 1 } });

    data.slice(2).forEach((row, rowIndex) => {
      if (row[col + 1] === "") {
        worksheet["!merges"].push({
          s: { r: rowIndex + 2, c: col },
          e: { r: rowIndex + 2, c: col + 1 },
        });
      }
    });
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "سجل الحضور والانصراف");

  const filePath = path.join(
    os.homedir(),
    "Desktop",
    `Attendance_Report_${year}_${month + 1}.xlsx`
  );

  try {
    XLSX.writeFile(workbook, filePath);
    console.log(`Exported data to ${filePath}`);
    alert(`تم تصدير البيانات إلى ${filePath}`);
  } catch (error) {
    console.error("خطأ في كتابة الملف:", error);
    if (error.message.includes("EBUSY")) {
      alert(
        `الملف مفتوح حاليًا أو مؤمن. الرجاء إغلاق 'Attendance_Report_${year}_${
          month + 1
        }.xlsx' إذا كان مفتوحًا وحاول مرة أخرى.`
      );
    } else {
      alert("حدث خطأ أثناء تصدير البيانات. يرجى المحاولة مرة أخرى.");
    }
  }
}

function clearLog() {
  // Clear the logDiv display
  logDiv.innerHTML = "";

  // Clear rest days from local storage
  localStorage.removeItem("restDays");

  restDaysData.length = 0; // Clear the array in memory

  // Inform the user
  alert("The log has been cleared.");
}

// Function to filter logs based on search input
function filterLogs() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const logEntries = logDiv.getElementsByClassName("log-entry");

  Array.from(logEntries).forEach((entry) => {
    const employeeId = entry.getAttribute("data-id").toLowerCase();
    const employeeName = entry.getAttribute("data-name").toLowerCase();
    const recordDate = entry.getAttribute("data-date");
    // Show the entry if it matches the search term
    if (
      employeeId.includes(searchTerm) ||
      employeeName.includes(searchTerm) ||
      recordDate.includes(searchTerm)
    ) {
      entry.style.display = "";
    } else {
      entry.style.display = "none";
    }
  });
}
