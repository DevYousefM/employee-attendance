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
                <div class="alert alert-info my-2 log-entry" data-id="${record.employeeId}" data-name="${record.employeeName}">
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
    const restDay = new Date().toLocaleDateString();
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
            <div class="alert alert-info my-2 log-entry" data-id="${employeeId}" data-name="${employeeName}">
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
  
  // Log the employee object
  const employees = JSON.parse(localStorage.getItem("employees")) || [];
  console.log('Employees:', employees);

  // Get the current month, year, and today's date
  const date = new Date();
  const month = date.getMonth(); // 0-indexed month
  const year = date.getFullYear();
  const today = date.getDate();

  // Create a list of all days in the month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create a dictionary of employees with dateAdded and restDays
  const employeeRecords = {};

  // Populate employeeRecords with employees data
  employees.forEach((employee) => {
    employeeRecords[employee.name] = {
      dateAdded: new Date(employee.dateAdded),
      restDays: [],
    };
  });

  // Populate employeeRecords with rest days from restDays
  restDays.forEach((record) => {
    if (employeeRecords[record.employeeName]) {
      employeeRecords[record.employeeName].restDays.push(record.date);
    }
  });

  // Create the header rows in Arabic with dates, with each date covering two columns for "حضور" and "انصراف"
  const data = [];
  const dateHeader = ["اسم الموظف"]; // Start with "اسم الموظف" for employee names
  const attendanceHeader = [""]; // Leave the first cell empty under "اسم الموظف"

  // Populate headers with dates spanning two columns
  for (let day = 1; day <= daysInMonth; day++) {
    const dateString = new Date(year, month, day).toLocaleDateString();
    dateHeader.push(dateString, ""); // Span two columns for each date
    attendanceHeader.push("حضور", "انصراف"); // Add "حضور" and "انصراف" directly under each date
  }
  data.push(dateHeader);
  data.push(attendanceHeader);

  // Populate the data rows with employee names and attendance/rest status
  Object.keys(employeeRecords).forEach((name) => {
    const { dateAdded, restDays } = employeeRecords[name];
    const row = [name]; // Start with the employee name in the first column

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const dateString = currentDate.toLocaleDateString();
      const isFutureDate = day > today;

      const isBeforeDateAdded = currentDate < dateAdded;
      console.log('currentDate', currentDate);
      console.log('dateAdded', dateAdded);

      const isRestDay = restDays.includes(dateString);

      if (isBeforeDateAdded) {
        // Leave cells empty if the date is before the employee's date added
        row.push("");
        row.push("");
      } else if (isRestDay) {
        // Mark as "راحة" for rest days
        row.push("راحة");
        row.push(""); // Leave the next cell blank for merged effect
      } else if (isFutureDate) {
        // Leave cells empty if the date is in the future
        row.push("");
        row.push("");
      } else {
        // Default times for "حضور" and "انصراف" for past and current dates after the date added
        row.push("7 صباحا");
        row.push("7 مساء");
      }
    }

    data.push(row);
  });

  // Create a worksheet from the data
  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  worksheet["!cols"] = [{ wch: 22 }]; // Set "اسم الموظف" column to approximately 6 cm width
  for (let i = 1; i <= daysInMonth * 2; i++) {
    worksheet["!cols"].push({ wch: 10 }); // Set other columns to a standard width
  }

  // Merge cells for date headers and "راحة" cells
  for (let col = 1; col <= daysInMonth * 2; col += 2) {
    // Merge the date cells (two columns per date)
    worksheet["!merges"] = worksheet["!merges"] || [];
    worksheet["!merges"].push({ s: { r: 0, c: col }, e: { r: 0, c: col + 1 } }); // Merge date cell

    // Merge "راحة" cells for rest days
    data.slice(2).forEach((row, rowIndex) => {
      if (row[col + 1] === "") {
        worksheet["!merges"].push({
          s: { r: rowIndex + 2, c: col },
          e: { r: rowIndex + 2, c: col + 1 },
        });
      }
    });
  }

  // Create a new workbook and append the worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "سجل الحضور والانصراف");

  // Define a path to save the file, e.g., Desktop
  const filePath = path.join(
    os.homedir(),
    "Desktop",
    `Attendance_Report_${year}_${month + 1}.xlsx`
  );

  // Attempt to save the workbook to the specified path with error handling
  try {
    XLSX.writeFile(workbook, filePath);
    alert(`تم تصدير البيانات إلى ${filePath}`);
  } catch (error) {
    console.error("خطأ في كتابة الملف:", error);
    // Check for the EBUSY error
    if (error.message.includes("EBUSY")) {
      alert(
        "الملف مفتوح حاليًا أو مؤمن. الرجاء إغلاق 'Attendance_Report_2024_10.xlsx' إذا كان مفتوحًا وحاول مرة أخرى."
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
    // Show the entry if it matches the search term
    if (employeeId.includes(searchTerm) || employeeName.includes(searchTerm)) {
      entry.style.display = "";
    } else {
      entry.style.display = "none";
    }
  });
}
