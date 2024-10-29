const fs = require("fs");
const path = require("path");
const logDiv = document.getElementById("log");
const employeeSelect = document.getElementById("employeeSelect");

// Data storage for attendance and rest days
const attendanceData = [];
const restDaysData = [];

// Function to load employees from Local Storage and populate the select dropdown
function loadEmployees() {
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

// Call loadEmployees and loadRestDays when the page loads
window.onload = function () {
    loadEmployees();
    loadRestDays();
};

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
            alert(`Employee ID ${employeeId} (${employeeName}) is already marked as on rest day for ${restDay}.`);
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

function exportData() {
    const filePath = path.join(__dirname, "attendance_records.json");
    const exportData = {
        attendance: attendanceData,
        restDays: restDaysData,
    };
    fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));
    alert(`Data exported to ${filePath}`);
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

    Array.from(logEntries).forEach(entry => {
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
