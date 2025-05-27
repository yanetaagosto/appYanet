/**
 * Employee Payrolls Module for Sistema de Nómina - Parroquia San Francisco de Asís
 * Handles employee payroll viewing functionality
 */

// Ensure user is authenticated and has employee role
window.Auth.requireEmployee();

// DOM Elements
const userNameElement = document.getElementById('user-name');
const logoutLink = document.getElementById('logout-link');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebar = document.querySelector('.sidebar');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// Filter elements
const periodFilter = document.getElementById('period-filter');
const dateStartInput = document.getElementById('date-start');
const dateEndInput = document.getElementById('date-end');
const applyFiltersButton = document.getElementById('apply-filters');
const payrollsTable = document.getElementById('payrolls-table');

// Modal elements
const detailModal = document.getElementById('detail-modal');
const closeDetailButton = document.getElementById('close-detail');
const downloadReceiptButton = document.getElementById('download-receipt');

// Detail elements
const detailPeriodElement = document.getElementById('detail-period');
const detailDateElement = document.getElementById('detail-date');
const detailBaseSalaryElement = document.getElementById('detail-base-salary');
const detailWorkedDaysElement = document.getElementById('detail-worked-days');
const detailDaysSalaryElement = document.getElementById('detail-days-salary');
const detailEventsElement = document.getElementById('detail-events');
const detailHealthElement = document.getElementById('detail-health');
const detailPensionElement = document.getElementById('detail-pension');
const detailOtherElement = document.getElementById('detail-other');
const detailGrossElement = document.getElementById('detail-gross');
const detailDeductionsElement = document.getElementById('detail-deductions');
const detailNetElement = document.getElementById('detail-net');

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

// Load filter options
function loadFilterOptions() {
  // Get payrolls for this employee
  const payrollItems = window.Storage.getPayrollItemsByEmployeeId(currentUser.employeeId);
  const payrolls = window.Storage.getPayrolls();
  
  // Get unique periods
  const periods = [...new Set(payrollItems.map(item => {
    const payroll = payrolls.find(p => p.id === item.payrollId);
    return payroll ? payroll.period : null;
  }).filter(Boolean))];
  
  // Sort periods by date (most recent first)
  periods.sort((a, b) => {
    const payrollA = payrolls.find(p => p.period === a);
    const payrollB = payrolls.find(p => p.period === b);
    return new Date(payrollB.endDate) - new Date(payrollA.endDate);
  });
  
  // Add period options
  periodFilter.innerHTML = '<option value="">Todos los períodos</option>';
  periods.forEach(period => {
    const option = document.createElement('option');
    option.value = period;
    option.textContent = period;
    periodFilter.appendChild(option);
  });
  
  // Set default dates to current month
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  dateStartInput.value = firstDay.toISOString().split('T')[0];
  dateEndInput.value = lastDay.toISOString().split('T')[0];
}

// Load payrolls table
function loadPayrolls() {
  const selectedPeriod = periodFilter.value;
  const startDate = dateStartInput.value;
  const endDate = dateEndInput.value;
  
  // Get payroll items for this employee
  let payrollItems = window.Storage.getPayrollItemsByEmployeeId(currentUser.employeeId);
  const payrolls = window.Storage.getPayrolls();
  
  // Filter by period
  if (selectedPeriod) {
    payrollItems = payrollItems.filter(item => {
      const payroll = payrolls.find(p => p.id === item.payrollId);
      return payroll && payroll.period === selectedPeriod;
    });
  }
  
  // Filter by date range
  if (startDate && endDate) {
    payrollItems = payrollItems.filter(item => {
      const payroll = payrolls.find(p => p.id === item.payrollId);
      return payroll && payroll.endDate >= startDate && payroll.startDate <= endDate;
    });
  }
  
  // Sort by date (most recent first)
  payrollItems.sort((a, b) => {
    const payrollA = payrolls.find(p => p.id === a.payrollId);
    const payrollB = payrolls.find(p => p.id === b.payrollId);
    return new Date(payrollB.endDate) - new Date(payrollA.endDate);
  });
  
  // Clear table
  const tbody = payrollsTable.querySelector('tbody');
  tbody.innerHTML = '';
  
  // Add items to table
  payrollItems.forEach(item => {
    const payroll = payrolls.find(p => p.id === item.payrollId);
    if (!payroll) return;
    
    const row = document.createElement('tr');
    
    // Period
    const periodCell = document.createElement('td');
    periodCell.textContent = payroll.period;
    
    // Date
    const dateCell = document.createElement('td');
    dateCell.textContent = formatDate(payroll.endDate);
    
    // Gross Salary
    const grossCell = document.createElement('td');
    grossCell.textContent = formatCurrency(item.grossSalary);
    
    // Deductions
    const deductionsCell = document.createElement('td');
    const totalDeductions = item.healthDeduction + item.pensionDeduction + (item.otherDeductions || 0);
    deductionsCell.textContent = formatCurrency(totalDeductions);
    
    // Net Salary
    const netCell = document.createElement('td');
    netCell.textContent = formatCurrency(item.netSalary);
    
    // Status
    const statusCell = document.createElement('td');
    const statusBadge = document.createElement('span');
    statusBadge.textContent = payroll.status;
    statusBadge.classList.add('badge');
    
    switch (payroll.status) {
      case 'Pendiente':
        statusBadge.classList.add('badge-pending');
        break;
      case 'Aprobado':
        statusBadge.classList.add('badge-approved');
        break;
      case 'Rechazado':
        statusBadge.classList.add('badge-rejected');
        break;
    }
    
    statusCell.appendChild(statusBadge);
    
    // Actions
    const actionsCell = document.createElement('td');
    const actionButtons = document.createElement('div');
    actionButtons.classList.add('action-buttons');
    
    // View button
    const viewButton = document.createElement('button');
    viewButton.classList.add('action-button');
    viewButton.innerHTML = '👁️';
    viewButton.title = 'Ver detalles';
    viewButton.addEventListener('click', () => showPayrollDetail(item, payroll));
    
    // Download button
    const downloadButton = document.createElement('button');
    downloadButton.classList.add('action-button');
    downloadButton.innerHTML = '📥';
    downloadButton.title = 'Descargar comprobante';
    downloadButton.addEventListener('click', () => downloadReceipt(item, payroll));
    
    actionButtons.appendChild(viewButton);
    actionButtons.appendChild(downloadButton);
    actionsCell.appendChild(actionButtons);
    
    // Add cells to row
    row.appendChild(periodCell);
    row.appendChild(dateCell);
    row.appendChild(grossCell);
    row.appendChild(deductionsCell);
    row.appendChild(netCell);
    row.appendChild(statusCell);
    row.appendChild(actionsCell);
    
    tbody.appendChild(row);
  });
  
  // Show message if no items
  if (payrollItems.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 7;
    cell.textContent = 'No hay nóminas para mostrar';
    cell.classList.add('text-center');
    row.appendChild(cell);
    tbody.appendChild(row);
  }
}

// Show payroll detail
function showPayrollDetail(payrollItem, payroll) {
  const employee = window.Storage.getEmployees().find(emp => emp.id === currentUser.employeeId);
  if (!employee) return;
  
  // Set basic information
  detailPeriodElement.textContent = payroll.period;
  detailDateElement.textContent = formatDate(payroll.endDate);
  detailBaseSalaryElement.textContent = formatCurrency(employee.salary);
  detailWorkedDaysElement.textContent = payrollItem.daysWorked;
  detailDaysSalaryElement.textContent = formatCurrency(payrollItem.daysSalary);
  
  // Set deductions
  detailHealthElement.textContent = formatCurrency(payrollItem.healthDeduction);
  detailPensionElement.textContent = formatCurrency(payrollItem.pensionDeduction);
  detailOtherElement.textContent = formatCurrency(payrollItem.otherDeductions || 0);
  
  // Set totals
  detailGrossElement.textContent = formatCurrency(payrollItem.grossSalary);
  const totalDeductions = payrollItem.healthDeduction + payrollItem.pensionDeduction + (payrollItem.otherDeductions || 0);
  detailDeductionsElement.textContent = formatCurrency(totalDeductions);
  detailNetElement.textContent = formatCurrency(payrollItem.netSalary);
  
  // Load events
  const events = window.Storage.getWorkEventsByEmployeeId(employee.id);
  const periodEvents = events.filter(event => 
    event.status === 'Aprobado' &&
    new Date(event.startDate) <= new Date(payroll.endDate) &&
    (event.endDate ? new Date(event.endDate) >= new Date(payroll.startDate) : new Date(event.startDate) >= new Date(payroll.startDate))
  );
  
  detailEventsElement.innerHTML = '';
  
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
      
      detailEventsElement.appendChild(eventDiv);
    });
  } else {
    detailEventsElement.innerHTML = '<div class="text-center">No hay novedades en este período</div>';
  }
  
  // Store payroll item ID for download
  downloadReceiptButton.dataset.itemId = payrollItem.id;
  
  // Show modal
  detailModal.style.display = 'flex';
}

// Download receipt
function downloadReceipt(payrollItem, payroll) {
  const employee = window.Storage.getEmployees().find(emp => emp.id === currentUser.employeeId);
  if (!employee) return;
  
  window.PDFGenerator.generatePayrollReceipt(payrollItem, employee, payroll)
    .then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comprobante_${payroll.period.replace(/\s/g, '_')}_${employee.lastName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast('Comprobante descargado exitosamente');
    })
    .catch(error => {
      console.error('Error generating PDF:', error);
      showToast('Error al generar el comprobante');
    });
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
  loadFilterOptions();
  loadPayrolls();
  
  // Handle filter changes
  applyFiltersButton.addEventListener('click', loadPayrolls);
  
  // Handle modal close
  closeDetailButton.addEventListener('click', () => {
    detailModal.style.display = 'none';
  });
  
  // Handle download from detail
  downloadReceiptButton.addEventListener('click', function() {
    const itemId = this.dataset.itemId;
    const item = window.Storage.getPayrollItems().find(i => i.id === itemId);
    if (!item) return;
    
    const payroll = window.Storage.getPayrollById(item.payrollId);
    if (payroll) {
      downloadReceipt(item, payroll);
    }
  });
  
  // Close modal when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target === detailModal) {
      detailModal.style.display = 'none';
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