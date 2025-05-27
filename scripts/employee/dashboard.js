/**
 * Employee Dashboard Module for Sistema de Nómina - Parroquia San Francisco de Asís
 * Manages employee dashboard functionality
 */

// Ensure user is authenticated and has employee role
window.Auth.requireEmployee();

// DOM Elements
const userNameElement = document.getElementById('user-name');
const welcomeNameElement = document.getElementById('welcome-name');
const lastSalaryElement = document.getElementById('last-salary');
const lastSalaryDateElement = document.getElementById('last-salary-date');
const serviceTimeElement = document.getElementById('service-time');
const joinDateElement = document.getElementById('join-date');
const receiptsCountElement = document.getElementById('receipts-count');
const recentPayrollsTable = document.getElementById('recent-payrolls-table');
const logoutLink = document.getElementById('logout-link');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebar = document.querySelector('.sidebar');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// Set current user name
const currentUser = window.Auth.getCurrentUser();
if (currentUser) {
  userNameElement.textContent = currentUser.name;
  welcomeNameElement.textContent = currentUser.name.split(' ')[0];
}

// Format currency function
function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount);
}

// Format date function
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('es-CO', options);
}

// Calculate service time
function calculateServiceTime(joinDate) {
  const join = new Date(joinDate);
  const today = new Date();
  
  let years = today.getFullYear() - join.getFullYear();
  let months = today.getMonth() - join.getMonth();
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  return {
    years,
    months
  };
}

// Load employee dashboard data
function loadEmployeeDashboard() {
  // Get current user ID
  const currentUser = window.Auth.getCurrentUser();
  
  if (!currentUser || !currentUser.employeeId) {
    showToast('Error: No se pudo identificar al empleado', 3000);
    return;
  }
  
  const employeeId = currentUser.employeeId;
  
  // Get employee data
  const employee = window.Storage.getEmployees().find(emp => emp.id === employeeId);
  
  if (!employee) {
    showToast('Error: Datos de empleado no encontrados', 3000);
    return;
  }
  
  // Get payroll items for this employee
  const payrollItems = window.Storage.getPayrollItemsByEmployeeId(employeeId);
  
  // Sort by date (most recent first)
  payrollItems.sort((a, b) => {
    const payrollA = window.Storage.getPayrollById(a.payrollId);
    const payrollB = window.Storage.getPayrollById(b.payrollId);
    
    if (!payrollA || !payrollB) return 0;
    
    return new Date(payrollB.endDate) - new Date(payrollA.endDate);
  });
  
  // Set last salary
  if (payrollItems.length > 0) {
    const lastPayrollItem = payrollItems[0];
    lastSalaryElement.textContent = formatCurrency(lastPayrollItem.netSalary);
    
    // Get payroll period
    const payroll = window.Storage.getPayrollById(lastPayrollItem.payrollId);
    if (payroll) {
      lastSalaryDateElement.textContent = `Período: ${payroll.period}`;
    }
  } else {
    lastSalaryElement.textContent = formatCurrency(employee.salary);
    lastSalaryDateElement.textContent = 'Salario base';
  }
  
  // Set service time
  const serviceTime = calculateServiceTime(employee.joinDate);
  serviceTimeElement.textContent = `${serviceTime.years} años, ${serviceTime.months} meses`;
  joinDateElement.textContent = `Fecha de ingreso: ${formatDate(employee.joinDate)}`;
  
  // Set receipts count
  receiptsCountElement.textContent = payrollItems.length;
  
  // Load recent payrolls
  loadRecentPayrolls(employeeId, payrollItems);
}

// Load recent payrolls
function loadRecentPayrolls(employeeId, payrollItems) {
  // Take only the most recent 5
  const recentPayrollItems = payrollItems.slice(0, 5);
  
  // Clear loading message
  recentPayrollsTable.querySelector('tbody').innerHTML = '';
  
  // Add payrolls to table
  recentPayrollItems.forEach(item => {
    const payroll = window.Storage.getPayrollById(item.payrollId);
    if (!payroll) return;
    
    const row = document.createElement('tr');
    
    const periodCell = document.createElement('td');
    periodCell.textContent = payroll.period;
    
    const dateCell = document.createElement('td');
    dateCell.textContent = formatDate(payroll.endDate);
    
    const grossCell = document.createElement('td');
    grossCell.textContent = formatCurrency(item.grossSalary);
    
    const deductionsCell = document.createElement('td');
    const totalDeductions = item.healthDeduction + item.pensionDeduction + (item.otherDeductions || 0);
    deductionsCell.textContent = formatCurrency(totalDeductions);
    
    const netCell = document.createElement('td');
    netCell.textContent = formatCurrency(item.netSalary);
    
    const actionsCell = document.createElement('td');
    
    const viewButton = document.createElement('a');
    viewButton.href = `employee-payroll-details.html?id=${item.id}`;
    viewButton.classList.add('action-link');
    viewButton.innerHTML = '<span class="icon">👁️</span>';
    viewButton.title = 'Ver detalles';
    
    const receiptButton = document.createElement('a');
    receiptButton.href = `employee-receipt.html?id=${item.id}`;
    receiptButton.classList.add('action-link');
    receiptButton.innerHTML = '<span class="icon">🧾</span>';
    receiptButton.title = 'Descargar comprobante';
    
    actionsCell.appendChild(viewButton);
    actionsCell.appendChild(receiptButton);
    
    row.appendChild(periodCell);
    row.appendChild(dateCell);
    row.appendChild(grossCell);
    row.appendChild(deductionsCell);
    row.appendChild(netCell);
    row.appendChild(actionsCell);
    
    recentPayrollsTable.querySelector('tbody').appendChild(row);
  });
  
  // If no payrolls, show message
  if (recentPayrollItems.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 6;
    cell.textContent = 'No hay nóminas recientes';
    cell.classList.add('text-center');
    row.appendChild(cell);
    recentPayrollsTable.querySelector('tbody').appendChild(row);
  }
}

// Show toast notification
function showToast(message, duration = 3000) {
  toastMessage.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

// Event handlers
document.addEventListener('DOMContentLoaded', function() {
  // Load dashboard data
  loadEmployeeDashboard();
  
  // Handle logout
  logoutLink.addEventListener('click', function(e) {
    e.preventDefault();
    window.Auth.logout();
  });
  
  // Handle sidebar toggle
  sidebarToggle.addEventListener('click', function() {
    sidebar.classList.toggle('show');
  });
  
  // Add animations to cards
  const statCards = document.querySelectorAll('.stat-card');
  statCards.forEach((card, index) => {
    setTimeout(() => {
      card.classList.add('fade-in');
    }, index * 100);
  });
  
  // Welcome animation
  setTimeout(() => {
    document.querySelector('.welcome-card').classList.add('fade-in');
  }, 100);
});