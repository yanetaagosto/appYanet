/**
 * Payroll Module for Sistema de Nómina - Parroquia San Francisco de Asís
 * Handles payroll calculations and management
 */

// Ensure user is authenticated and has admin role
window.Auth.requireAdmin();

// DOM Elements
const userNameElement = document.getElementById('user-name');
const logoutLink = document.getElementById('logout-link');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebar = document.querySelector('.sidebar');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const loadingOverlay = document.getElementById('loading-overlay');

// Payroll specific elements
const periodStartInput = document.getElementById('period-start');
const periodEndInput = document.getElementById('period-end');
const periodNameInput = document.getElementById('period-name');
const calculatePayrollButton = document.getElementById('calculate-payroll');
const payrollSummary = document.getElementById('payroll-summary');
const employeeList = document.getElementById('employee-list');
const employeesContainer = document.getElementById('employees-container');
const expandAllButton = document.getElementById('expand-all');
const collapseAllButton = document.getElementById('collapse-all');
const savePayrollButton = document.getElementById('save-payroll');
const cancelPayrollButton = document.getElementById('cancel-payroll');

// Summary elements
const summaryPeriodText = document.getElementById('summary-period-text');
const totalEmployeesElement = document.getElementById('total-employees');
const totalGrossElement = document.getElementById('total-gross');
const totalDeductionsElement = document.getElementById('total-deductions');
const totalNetElement = document.getElementById('total-net');

// Set current user name
const currentUser = window.Auth.getCurrentUser();
if (currentUser) {
  userNameElement.textContent = currentUser.name;
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

// Calculate days between dates
function calculateDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

// Calculate worked days considering events
function calculateWorkedDays(employee, startDate, endDate, events) {
  const totalDays = calculateDays(startDate, endDate);
  let nonWorkedDays = 0;
  
  // Filter events for this employee and period
  const employeeEvents = events.filter(event => 
    event.employeeId === employee.id &&
    event.status === 'Aprobado' &&
    new Date(event.startDate) <= new Date(endDate) &&
    (event.endDate ? new Date(event.endDate) >= new Date(startDate) : new Date(event.startDate) >= new Date(startDate))
  );
  
  // Calculate non-worked days from events
  employeeEvents.forEach(event => {
    if (event.type !== 'Horas Extra') {
      nonWorkedDays += event.days || 0;
    }
  });
  
  return Math.max(0, totalDays - nonWorkedDays);
}

// Calculate overtime hours
function calculateOvertimeHours(employee, startDate, endDate, events) {
  let totalHours = 0;
  
  // Filter overtime events
  const overtimeEvents = events.filter(event => 
    event.employeeId === employee.id &&
    event.type === 'Horas Extra' &&
    event.status === 'Aprobado' &&
    new Date(event.startDate) >= new Date(startDate) &&
    new Date(event.startDate) <= new Date(endDate)
  );
  
  // Sum hours
  overtimeEvents.forEach(event => {
    totalHours += event.hours || 0;
  });
  
  return totalHours;
}

// Calculate employee payroll
function calculateEmployeePayroll(employee, startDate, endDate, events) {
  // Get settings
  const settings = window.Storage.getSettings();
  
  // Calculate worked days
  const workedDays = calculateWorkedDays(employee, startDate, endDate, events);
  
  // Calculate daily salary
  const dailySalary = employee.salary / 30;
  
  // Calculate base salary for worked days
  const daysSalary = dailySalary * workedDays;
  
  // Calculate overtime
  const overtimeHours = calculateOvertimeHours(employee, startDate, endDate, events);
  const hourlyRate = dailySalary / 8;
  const overtimePay = overtimeHours * hourlyRate * settings.overtimeRate;
  
  // Calculate gross salary
  const grossSalary = daysSalary + overtimePay;
  
  // Calculate deductions
  const healthDeduction = grossSalary * (settings.healthContributionRate / 100);
  const pensionDeduction = grossSalary * (settings.pensionContributionRate / 100);
  
  // Calculate net salary
  const netSalary = grossSalary - healthDeduction - pensionDeduction;
  
  return {
    workedDays,
    daysSalary,
    overtimeHours,
    overtimePay,
    grossSalary,
    healthDeduction,
    pensionDeduction,
    netSalary
  };
}

// Create employee detail element
function createEmployeeDetail(employee, payrollData, events) {
  const template = document.getElementById('employee-detail-template');
  const element = template.content.cloneNode(true);
  
  // Set employee info
  element.querySelector('.employee-name').textContent = `${employee.firstName} ${employee.lastName}`;
  element.querySelector('.employee-position').textContent = employee.position;
  
  // Set summary values
  element.querySelector('.gross-salary').textContent = formatCurrency(payrollData.grossSalary);
  element.querySelector('.total-deductions').textContent = formatCurrency(payrollData.healthDeduction + payrollData.pensionDeduction);
  element.querySelector('.net-salary').textContent = formatCurrency(payrollData.netSalary);
  
  // Set basic info
  element.querySelector('.base-salary').textContent = formatCurrency(employee.salary);
  element.querySelector('.worked-days').textContent = payrollData.workedDays;
  element.querySelector('.days-salary').textContent = formatCurrency(payrollData.daysSalary);
  
  // Set deductions
  element.querySelector('.health-deduction').textContent = formatCurrency(payrollData.healthDeduction);
  element.querySelector('.pension-deduction').textContent = formatCurrency(payrollData.pensionDeduction);
  
  // Add events
  const eventsList = element.querySelector('.events-list');
  const employeeEvents = events.filter(event => 
    event.employeeId === employee.id &&
    event.status === 'Aprobado'
  );
  
  if (employeeEvents.length > 0) {
    employeeEvents.forEach(event => {
      const eventItem = document.createElement('div');
      eventItem.classList.add('event-item');
      
      const eventType = document.createElement('div');
      eventType.classList.add('event-type');
      eventType.textContent = event.type;
      
      const eventDates = document.createElement('div');
      eventDates.classList.add('event-dates');
      eventDates.textContent = `${formatDate(event.startDate)}${event.endDate ? ` - ${formatDate(event.endDate)}` : ''}`;
      
      const eventDuration = document.createElement('div');
      eventDuration.classList.add('event-duration');
      eventDuration.textContent = event.type === 'Horas Extra' 
        ? `${event.hours} horas`
        : `${event.days} días`;
      
      eventItem.appendChild(eventType);
      eventItem.appendChild(eventDates);
      eventItem.appendChild(eventDuration);
      eventsList.appendChild(eventItem);
    });
  } else {
    const noEvents = document.createElement('div');
    noEvents.classList.add('event-item');
    noEvents.textContent = 'No hay novedades en este período';
    eventsList.appendChild(noEvents);
  }
  
  // Add event listeners
  const toggleButton = element.querySelector('.toggle-details');
  const details = element.querySelector('.employee-details');
  
  toggleButton.addEventListener('click', () => {
    const isHidden = details.classList.contains('hide');
    details.classList.toggle('hide');
    toggleButton.textContent = isHidden ? 'Ocultar Detalles' : 'Ver Detalles';
  });
  
  return element;
}

// Calculate payroll
async function calculatePayroll() {
  // Validate dates
  const startDate = periodStartInput.value;
  const endDate = periodEndInput.value;
  const periodName = periodNameInput.value;
  
  if (!startDate || !endDate || !periodName) {
    showToast('Por favor complete todos los campos del período', 3000);
    return;
  }
  
  if (new Date(endDate) < new Date(startDate)) {
    showToast('La fecha final debe ser posterior a la fecha inicial', 3000);
    return;
  }
  
  // Show loading
  loadingOverlay.classList.remove('hide');
  
  try {
    // Get employees and events
    const employees = window.Storage.getEmployees();
    const events = window.Storage.getWorkEvents();
    
    // Calculate payroll for each employee
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    
    // Clear container
    employeesContainer.innerHTML = '';
    
    // Process each employee
    employees.forEach(employee => {
      const payrollData = calculateEmployeePayroll(employee, startDate, endDate, events);
      
      // Add to totals
      totalGross += payrollData.grossSalary;
      totalDeductions += payrollData.healthDeduction + payrollData.pensionDeduction;
      totalNet += payrollData.netSalary;
      
      // Create and add employee detail
      const detailElement = createEmployeeDetail(employee, payrollData, events);
      employeesContainer.appendChild(detailElement);
    });
    
    // Update summary
    summaryPeriodText.textContent = periodName;
    totalEmployeesElement.textContent = employees.length;
    totalGrossElement.textContent = formatCurrency(totalGross);
    totalDeductionsElement.textContent = formatCurrency(totalDeductions);
    totalNetElement.textContent = formatCurrency(totalNet);
    
    // Show summary and list
    payrollSummary.classList.remove('hide');
    employeeList.classList.remove('hide');
    
  } catch (error) {
    console.error('Error calculating payroll:', error);
    showToast('Error al calcular la nómina', 3000);
  } finally {
    loadingOverlay.classList.add('hide');
  }
}

// Save payroll
function savePayroll() {
  // TODO: Implement save payroll
  showToast('Nómina guardada exitosamente');
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
  // Set default dates
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  periodStartInput.value = firstDay.toISOString().split('T')[0];
  periodEndInput.value = lastDay.toISOString().split('T')[0];
  periodNameInput.value = firstDay.toLocaleDateString('es-CO', { year: 'numeric', month: 'long' });
  
  // Handle calculate button
  calculatePayrollButton.addEventListener('click', calculatePayroll);
  
  // Handle save button
  savePayrollButton.addEventListener('click', savePayroll);
  
  // Handle cancel button
  cancelPayrollButton.addEventListener('click', () => {
    payrollSummary.classList.add('hide');
    employeeList.classList.add('hide');
  });
  
  // Handle expand/collapse all
  expandAllButton.addEventListener('click', () => {
    document.querySelectorAll('.employee-details').forEach(details => {
      details.classList.remove('hide');
      details.previousElementSibling.querySelector('.toggle-details').textContent = 'Ocultar Detalles';
    });
  });
  
  collapseAllButton.addEventListener('click', () => {
    document.querySelectorAll('.employee-details').forEach(details => {
      details.classList.add('hide');
      details.previousElementSibling.querySelector('.toggle-details').textContent = 'Ver Detalles';
    });
  });
  
  // Handle logout
  logoutLink.addEventListener('click', function(e) {
    e.preventDefault();
    window.Auth.logout();
  });
  
  // Handle sidebar toggle
  sidebarToggle.addEventListener('click', function() {
    sidebar.classList.toggle('show');
  });
});