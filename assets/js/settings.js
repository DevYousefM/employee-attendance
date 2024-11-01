function saveSettings() {
    const attendanceTime = document.getElementById("attendanceTime").value;
    const leaveTime = document.getElementById("leaveTime").value;

    if (attendanceTime && leaveTime) {
      localStorage.setItem("attendanceTime", attendanceTime);
      localStorage.setItem("leaveTime", leaveTime);
      alert("Settings saved successfully!");
    } else {
      alert("Please enter both attendance and leave times.");
    }
  }

  function loadSettings() {
    const savedAttendanceTime = localStorage.getItem("attendanceTime");
    const savedLeaveTime = localStorage.getItem("leaveTime");

    if (savedAttendanceTime) {
      document.getElementById("attendanceTime").value = savedAttendanceTime;
    }
    if (savedLeaveTime) {
      document.getElementById("leaveTime").value = savedLeaveTime;
    }
  }

  // Load settings on page load
  window.onload = loadSettings;