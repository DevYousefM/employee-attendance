const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const os = require("os");

function populateMonthSelect() {
  const select = document.getElementById("monthSelect");
  const date = new Date();
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const currentMonthIndex = date.getMonth();
  const currentYear = date.getFullYear();

  for (let i = 1; i <= 2; i++) {
    const monthToShow = currentMonthIndex - i;
    let year = currentYear;

    if (monthToShow < 0) {
      year -= 1;
      monthToShow += 12;
    }

    const monthName = months[monthToShow];
    const monthValue = `${year}-${String(monthToShow + 1).padStart(2, "0")}`;
    console.log(
      `Generating Option: Month Name: ${monthName}, Year: ${year}, Value: ${monthValue}`
    );

    const option = document.createElement("option");
    option.value = monthValue;
    option.textContent = `${monthName} ${year}`;
    select.appendChild(option);
  }
}

function exportData() {
  const selectedMonth = document.getElementById("monthSelect").value;
  const [year, month] = selectedMonth.split("-");

  const monthIndex = parseInt(month, 10) - 1; // Adjusting to 0-based index
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const restDays = JSON.parse(localStorage.getItem("restDays")) || [];
  const employees = JSON.parse(localStorage.getItem("employees")) || [];

  const attendanceTime = localStorage.getItem("attendanceTime") || "7 صباحا";
  const leaveTime = localStorage.getItem("leaveTime") || "7 مساء";

  const employeeRecords = {};
  employees.forEach((employee) => {
    const [day, monthAdded, yearAdded] = employee.dateAdded
      .split("/")
      .map(Number);
    const dateAdded = new Date(yearAdded, monthAdded - 1, day);

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
    const [day, monthRecord, yearRecord] = record.date.split("/").map(Number);
    const restDay = new Date(yearRecord, monthRecord - 1, day);

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
    const month = date.getMonth() + 1; // Make it 1-based for display
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, monthIndex, day);
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
      const currentDate = new Date(year, monthIndex, day);
      const dateString = formatDate(currentDate);
      const isBeforeDateAdded = currentDate < dateAdded;
      const isFutureDate = currentDate > new Date();

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
    `Attendance_Report_${year}_${monthIndex + 1}.xlsx`
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
          monthIndex + 1
        }.xlsx' إذا كان مفتوحًا وحاول مرة أخرى.`
      );
    } else {
      alert("حدث خطأ أثناء تصدير البيانات. يرجى المحاولة مرة أخرى.");
    }
  }
}

window.onload = populateMonthSelect;
document.getElementById("exportButton").addEventListener("click", exportData);
