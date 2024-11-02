const employeeList = document.querySelector('#employeeList .list-group');
let employees = [];

// Initialize the next available employee ID
let nextEmployeeId = 1;

// Function to load employees from Local Storage
function loadEmployees() {
    const storedEmployees = localStorage.getItem('employees');
    if (storedEmployees) {
        employees = JSON.parse(storedEmployees);

        // Update nextEmployeeId based on existing employees
        if (employees.length > 0) {
            nextEmployeeId = Math.max(...employees.map(emp => emp.id)) + 1; // Increment the max ID for the next employee
        }
    }
    displayEmployees();
}

// Function to add an employee
function addEmployee() {
    const employeeName = document.getElementById('employeeName').value.trim();

    if (employeeName) {
        // Assign the current ID and increment for the next one
        const employeeId = nextEmployeeId++; // Use current ID and then increment
        
        // Get today's date and format it as "DD/MM/YYYY"
        const today = new Date();
        const dateAdded = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
        
        employees.push({ id: employeeId, name: employeeName, dateAdded });
        updateLocalStorage();
        displayEmployees();
        clearFields();

        // Set focus back to the input field
        document.getElementById('employeeName').focus(); // Focus on the employee name input
    } else {
        alert("Please enter Employee Name");
    }
}

// Function to check if Enter key is pressed
function checkEnter(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent any default form submission behavior
        addEmployee(); // Call addEmployee function when Enter key is pressed
    }
}

// Function to display the employees
function displayEmployees() {
    employeeList.innerHTML = '';
    employees.forEach(employee => {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
        listItem.textContent = `ID: ${employee.id} - Name: ${employee.name} - Date Added: ${employee.dateAdded}`;
        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-danger btn-sm';
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = () => deleteEmployee(employee.id);
        listItem.appendChild(deleteButton);
        listItem.onclick = () => loadEmployee(employee.id);
        employeeList.appendChild(listItem);
    });
}

// Function to clear input fields
function clearFields() {
    document.getElementById('employeeName').value = '';
}

// Function to load employee data into the form for editing
function loadEmployee(id) {
    const employee = employees.find(emp => emp.id === id);
    if (employee) {
        document.getElementById('employeeName').value = employee.name;
    }
}

// Function to delete an employee
function deleteEmployee(id) {
    employees = employees.filter(emp => emp.id !== id);
    updateLocalStorage();
    displayEmployees();
}

// Function to update Local Storage
function updateLocalStorage() {
    localStorage.setItem('employees', JSON.stringify(employees));
}

// Load employees on page load
window.onload = loadEmployees;
