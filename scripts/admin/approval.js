/**
 * Approval Module for Sistema de Nómina - Parroquia San Francisco de Asís
 * Handles payroll approval functionality
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

// Table elements
const pendingPayrollsTable = document.getElementById('pending-payrolls-table');

// Modal elements
const reviewModal = document.getElementById('review-modal');
const closeReviewButton = document.getElementById('close-review');
const approvePayrollButton = document.getElementById('approve-payroll');
const rejectPayrollButton = document.getElementById('reject-payroll');
const approvalNotesTextarea = document.getElementById('approval-notes');

// Review elements
const reviewPeriodElement = document.getElementById('review-period');
const reviewDatesElement = document.getElementById('review-dates');
const reviewTotalEmployeesElement = document.getElementById('review-total-employees');
const reviewTotalGrossElement = document.getElementById('review-total-gross');
const reviewTotalDeductionsElement = document.getElementById('review-total-deductions');
const reviewTotalNetElement = document.getElementById('review-total-net');
const reviewDetailsTable = document.getElementById('review-details-table');

// Employee detail modal elements
const employeeDetailModal = document.getElementById('employee-detail-modal');
const closeDetailButton = document.getElementById('close-detail');
const detailEmployeeName = document.getElementById('detail-employee-name');
const detailEmployeePosition = document.getElementById('detail-employee-position');
const detailBaseSalary = document.getElementById('detail-base-salary');
const detailWorkedDays = document.getElementById('detail-worked-days');
const detailDaysSalary = document.getElementById('detail-days-salary');
const detailEvents = document.getElementById('detail-events');
const detailHealth = document.getElementById('detail-health');
const detailPension = document.getElementById('detail-pension');
const detailOther = document.getElementById('detail-other');
const detailGross = document.getElementById('detail-gross');
const detailDeductions = document.getElementById('detail-deductions');
const detailNet = document.getElementById('detail-net');

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

// Load pending payrolls
function loadPendingPayrolls() {
  const payrolls = window.Storage.getPayrolls();
  const pendingPayrolls = payrolls.filter(p => p.status === 'Pendiente');
  
  // Clear table
  const tbody = pendingPayrollsTable.querySelector('tbody');
  tbody.innerHTML = '';
  
  // Add payrolls to table
  pendingPayrolls.forEach(payroll => {
    const row = document.createElement('tr');
    
    const periodCell = document.createElement('td');
    periodCell.textContent = payroll.period;
    
    const startDateCell = document.createElement('td');
    startDateCell.textContent = formatDate(payroll.startDate);
    
    const endDateCell = document.createElement('td');
    endDateCell.textContent = formatDate(payroll.endDate);
    
    const employeesCell = document.createElement('td');
    const payrollItems = window.Storage.getPayrollItemsByPayrollId(payroll.id);
    employeesCell.textContent = payrollItems.length;
    
    const grossCell = document.createElement('td');
    grossCell.textContent = formatCurrency(payroll.totalGross);
    
    const netCell = document.createElement('td');
    netCell.textContent = formatCurrency(payroll.totalNet);
    
    const actionsCell = document.createElement('td');
    const reviewButton = document.createElement('button');
    reviewButton.classList.add('primary-button');
    reviewButton.innerHTML = '<span class="icon">👁️</span> Revisar';
    reviewButton.addEventListener('click', () => openReviewModal(payroll));
    actionsCell.appendChild(reviewButton);
    
    row.appendChild(periodCell);
    row.appendChild(startDateCell);
    row.appendChild(endDateCell);
    row.appendChild(employeesCell);
    row.appendChild(grossCell);
    row.appendChild(netCell);
    row.appendChild(actionsCell);
    
    tbody.appendChild(row);
  });
  
  // Show message if no pending payrolls
  if (pendingPayrolls.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 7;
    cell.textContent = 'No hay nóminas pendientes de aprobación';
    cell.classList.add('text-center');
    row.appendChild(cell);
    tbody.appendChild(row);
  }
}

// Calculate totals from payroll items
function calculateTotals(payrollItems) {
  return payrollItems.reduce((totals, item) => {
    totals.gross += item.grossSalary;
    totals.deductions += item.healthDeduction + item.pensionDeduction + (item.otherDeductions || 0);
    totals.net += item.netSalary;
    return totals;
  }, { gross: 0, deductions: 0, net: 0 });
}

// Update payroll item
function updatePayrollItem(item, field, value) {
  const updatedItem = { ...item };
  
  switch (field) {
    case 'workedDays':
      updatedItem.daysWorked = parseInt(value);
      updatedItem.grossSalary = (updatedItem.baseSalary / 30) * updatedItem.daysWorked;
      break;
      
    case 'otherDeductions':
      updatedItem.otherDeductions = parseFloat(value) || 0;
      break;
  }
  
  // Recalculate deductions
  updatedItem.healthDeduction = updatedItem.grossSalary * 0.04;
  updatedItem.pensionDeduction = updatedItem.grossSalary * 0.04;
  
  // Recalculate net salary
  updatedItem.netSalary = updatedItem.grossSalary - 
    (updatedItem.healthDeduction + updatedItem.pensionDeduction + updatedItem.otherDeductions);
  
  // Update storage
  window.Storage.updatePayrollItem(updatedItem);
  
  return updatedItem;
}

// Open review modal
function openReviewModal(payroll) {
  // Get payroll items and employees
  const payrollItems = window.Storage.getPayrollItemsByPayrollId(payroll.id);
  const employees = window.Storage.getEmployees();
  
  // Set summary information
  reviewPeriodElement.textContent = payroll.period;
  reviewDatesElement.textContent = `${formatDate(payroll.startDate)} - ${formatDate(payroll.endDate)}`;
  reviewTotalEmployeesElement.textContent = payrollItems.length;
  
  // Calculate and display totals
  function updateTotals() {
    const totals = calculateTotals(payrollItems);
    reviewTotalGrossElement.textContent = formatCurrency(totals.gross);
    reviewTotalDeductionsElement.textContent = formatCurrency(totals.deductions);
    reviewTotalNetElement.textContent = formatCurrency(totals.net);
  }
  
  updateTotals();
  
  // Clear details table
  const tbody = reviewDetailsTable.querySelector('tbody');
  tbody.innerHTML = '';
  
  // Add items to details table
  payrollItems.forEach(item => {
    const employee = employees.find(emp => emp.id === item.employeeId);
    if (!employee) return;
    
    const row = document.createElement('tr');
    
    const employeeCell = document.createElement('td');
    employeeCell.textContent = `${employee.firstName} ${employee.lastName}`;
    
    const positionCell = document.createElement('td');
    positionCell.textContent = employee.position;
    
    const daysCell = document.createElement('td');
    const daysInput = document.createElement('input');
    daysInput.type = 'number';
    daysInput.value = item.daysWorked;
    daysInput.min = '0';
    daysInput.max = '30';
    daysInput.addEventListener('change', function() {
      const updatedItem = updatePayrollItem(item, 'workedDays', this.value);
      item.daysWorked = updatedItem.daysWorked;
      item.grossSalary = updatedItem.grossSalary;
      item.netSalary = updatedItem.netSalary;
      
      // Update row values
      grossCell.textContent = formatCurrency(updatedItem.grossSalary);
      deductionsCell.textContent = formatCurrency(
        updatedItem.healthDeduction + updatedItem.pensionDeduction + updatedItem.otherDeductions
      );
      netCell.textContent = formatCurrency(updatedItem.netSalary);
      
      // Update totals
      updateTotals();
    });
    daysCell.appendChild(daysInput);
    
    const grossCell = document.createElement('td');
    grossCell.textContent = formatCurrency(item.grossSalary);
    
    const deductionsCell = document.createElement('td');
    const totalDeductions = item.healthDeduction + item.pensionDeduction + (item.otherDeductions || 0);
    deductionsCell.textContent = formatCurrency(totalDeductions);
    
    const netCell = document.createElement('td');
    netCell.textContent = formatCurrency(item.netSalary);
    
    const actionsCell = document.createElement('td');
    const detailButton = document.createElement('button');
    detailButton.classList.add('ghost-button');
    detailButton.innerHTML = '<span class="icon">👁️</span>';
    detailButton.addEventListener('click', () => openEmployeeDetail(item, employee));
    actionsCell.appendChild(detailButton);
    
    row.appendChild(employeeCell);
    row.appendChild(positionCell);
    row.appendChild(daysCell);
    row.appendChild(grossCell);
    row.appendChild(deductionsCell);
    row.appendChild(netCell);
    row.appendChild(actionsCell);
    
    tbody.appendChild(row);
  });
  
  // Store payroll ID for approval/rejection
  reviewModal.dataset.payrollId = payroll.id;
  
  // Show modal
  reviewModal.style.display = 'flex';
}

// Open employee detail modal
function openEmployeeDetail(payrollItem, employee) {
  // Set employee information
  detailEmployeeName.textContent = `${employee.firstName} ${employee.lastName}`;
  detailEmployeePosition.textContent = employee.position;
  
  // Set basic information
  detailBaseSalary.textContent = formatCurrency(employee.salary);
  
  const daysInput = document.createElement('input');
  daysInput.type = 'number';
  daysInput.value = payrollItem.daysWorked;
  daysInput.min = '0';
  daysInput.max = '30';
  daysInput.addEventListener('change', function() {
    const updatedItem = updatePayrollItem(payrollItem, 'workedDays', this.value);
    payrollItem = updatedItem;
    
    // Update values
    detailDaysSalary.textContent = formatCurrency(updatedItem.grossSalary);
    detailHealth.textContent = formatCurrency(updatedItem.healthDeduction);
    detailPension.textContent = formatCurrency(updatedItem.pensionDeduction);
    detailGross.textContent = formatCurrency(updatedItem.grossSalary);
    detailDeductions.textContent = formatCurrency(
      updatedItem.healthDeduction + updatedItem.pensionDeduction + updatedItem.otherDeductions
    );
    detailNet.textContent = formatCurrency(updatedItem.netSalary);
  });
  detailWorkedDays.innerHTML = '';
  detailWorkedDays.appendChild(daysInput);
  
  detailDaysSalary.textContent = formatCurrency(payrollItem.grossSalary);
  
  // Set deductions
  detailHealth.textContent = formatCurrency(payrollItem.healthDeduction);
  detailPension.textContent = formatCurrency(payrollItem.pensionDeduction);
  
  const otherInput = document.createElement('input');
  otherInput.type = 'number';
  otherInput.value = payrollItem.otherDeductions || 0;
  otherInput.min = '0';
  otherInput.step = '1000';
  otherInput.addEventListener('change', function() {
    const updatedItem = updatePayrollItem(payrollItem, 'otherDeductions', this.value);
    payrollItem = updatedItem;
    
    // Update values
    detailDeductions.textContent = formatCurrency(
      updatedItem.healthDeduction + updatedItem.pensionDeduction + updatedItem.otherDeductions
    );
    detailNet.textContent = formatCurrency(updatedItem.netSalary);
  });
  detailOther.innerHTML = '';
  detailOther.appendChild(otherInput);
  
  // Set totals
  detailGross.textContent = formatCurrency(payrollItem.grossSalary);
  const totalDeductions = payrollItem.healthDeduction + payrollItem.pensionDeduction + (payrollItem.otherDeductions || 0);
  detailDeductions.textContent = formatCurrency(totalDeductions);
  detailNet.textContent = formatCurrency(payrollItem.netSalary);
  
  // Get and display events
  const events = window.Storage.getWorkEventsByEmployeeId(employee.id);
  const payroll = window.Storage.getPayrollById(payrollItem.payrollId);
  
  detailEvents.innerHTML = '';
  
  const periodEvents = events.filter(event => 
    new Date(event.startDate) <= new Date(payroll.endDate) &&
    (event.endDate ? new Date(event.endDate) >= new Date(payroll.startDate) : new Date(event.startDate) >= new Date(payroll.startDate))
  );
  
  if (periodEvents.length > 0) {
    periodEvents.forEach(event => {
      const eventDiv = document.createElement('div');
      eventDiv.classList.add('event-item');
      
      const eventType = document.createElement('div');
      eventType.classList.add('event-type');
      eventType.textContent = event.type;
      
      const eventDates = document.createElement('div');
      eventDates.classList.add('event-dates');
      eventDates.textContent = event.endDate 
        ? `${formatDate(event.startDate)} - ${formatDate(event.endDate)}`
        : formatDate(event.startDate);
      
      const eventDuration = document.createElement('div');
      eventDuration.classList.add('event-duration');
      eventDuration.textContent = event.type === 'Horas Extra'
        ? `${event.hours} horas`
        : `${event.days} días`;
      
      eventDiv.appendChild(eventType);
      eventDiv.appendChild(eventDates);
      eventDiv.appendChild(eventDuration);
      
      detailEvents.appendChild(eventDiv);
    });
  } else {
    detailEvents.innerHTML = '<div class="text-center">No hay novedades en este período</div>';
  }
  
  // Show modal
  employeeDetailModal.style.display = 'flex';
}

// Approve payroll
function approvePayroll() {
  const payrollId = reviewModal.dataset.payrollId;
  const notes = approvalNotesTextarea.value.trim();
  
  const payroll = window.Storage.getPayrollById(payrollId);
  if (!payroll) return;
  
  // Get updated totals
  const payrollItems = window.Storage.getPayrollItemsByPayrollId(payrollId);
  const totals = calculateTotals(payrollItems);
  
  const updatedPayroll = {
    ...payroll,
    status: 'Aprobado',
    approvedAt: new Date().toISOString(),
    approvedBy: currentUser.name,
    approvalNotes: notes,
    totalGross: totals.gross,
    totalDeductions: totals.deductions,
    totalNet: totals.net
  };
  
  window.Storage.updatePayroll(updatedPayroll);
  
  // Close modal and refresh table
  reviewModal.style.display = 'none';
  loadPendingPayrolls();
  
  showToast('Nómina aprobada exitosamente');
}

// Reject payroll
function rejectPayroll() {
  const payrollId = reviewModal.dataset.payrollId;
  const notes = approvalNotesTextarea.value.trim();
  
  if (!notes) {
    showToast('Por favor ingrese un motivo para el rechazo', 3000);
    return;
  }
  
  const payroll = window.Storage.getPayrollById(payrollId);
  if (!payroll) return;
  
  const updatedPayroll = {
    ...payroll,
    status: 'Rechazado',
    rejectedAt: new Date().toISOString(),
    rejectedBy: currentUser.name,
    rejectionNotes: notes
  };
  
  window.Storage.updatePayroll(updatedPayroll);
  
  // Close modal and refresh table
  reviewModal.style.display = 'none';
  loadPendingPayrolls();
  
  showToast('Nómina rechazada');
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
  // Load initial data
  loadPendingPayrolls();
  
  // Handle modal close buttons
  closeReviewButton.addEventListener('click', () => {
    reviewModal.style.display = 'none';
  });
  
  closeDetailButton.addEventListener('click', () => {
    employeeDetailModal.style.display = 'none';
  });
  
  // Handle approval/rejection
  approvePayrollButton.addEventListener('click', approvePayroll);
  rejectPayrollButton.addEventListener('click', rejectPayroll);
  
  // Close modals when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target === reviewModal) {
      reviewModal.style.display = 'none';
    }
    if (event.target === employeeDetailModal) {
      employeeDetailModal.style.display = 'none';
    }
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