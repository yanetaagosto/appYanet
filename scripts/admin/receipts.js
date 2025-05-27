/**
 * Receipts Module for Sistema de Nómina - Parroquia San Francisco de Asís
 * Handles payroll receipts generation and management
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

// Receipts specific elements
const periodFilter = document.getElementById('period-filter');
const employeeFilter = document.getElementById('employee-filter');
const applyFiltersButton = document.getElementById('apply-filters');
const downloadAllButton = document.getElementById('download-all');
const receiptsTable = document.getElementById('receipts-table');

// Preview modal elements
const previewModal = document.getElementById('preview-modal');
const closePreviewButton = document.getElementById('close-preview');
const downloadReceiptButton = document.getElementById('download-receipt');

// Receipt preview elements
const receiptPeriodElement = document.getElementById('receipt-period');
const employeeNameElement = document.getElementById('employee-name');
const employeeDocumentElement = document.getElementById('employee-document');
const employeePositionElement = document.getElementById('employee-position');
const employeeDepartmentElement = document.getElementById('employee-department');
const baseSalaryElement = document.getElementById('base-salary');
const workedDaysElement = document.getElementById('worked-days');
const overtimeElement = document.getElementById('overtime');
const totalEarnedElement = document.getElementById('total-earned');
const healthDeductionElement = document.getElementById('health-deduction');
const pensionDeductionElement = document.getElementById('pension-deduction');
const otherDeductionsElement = document.getElementById('other-deductions');
const totalDeductionsElement = document.getElementById('total-deductions');
const totalPaymentElement = document.getElementById('total-payment');
const issueDateElement = document.getElementById('issue-date');

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

// Load filters
function loadFilters() {
  // Get unique periods from payrolls
  const payrolls = window.Storage.getPayrolls();
  const periods = [...new Set(payrolls.map(p => p.period))];
  
  // Sort periods by date (most recent first)
  periods.sort((a, b) => {
    const dateA = payrolls.find(p => p.period === a).endDate;
    const dateB = payrolls.find(p => p.period === b).endDate;
    return new Date(dateB) - new Date(dateA);
  });
  
  // Add period options
  periodFilter.innerHTML = '<option value="">Todos los períodos</option>';
  periods.forEach(period => {
    const option = document.createElement('option');
    option.value = period;
    option.textContent = period;
    periodFilter.appendChild(option);
  });
  
  // Get employees
  const employees = window.Storage.getEmployees();
  
  // Sort employees by name
  employees.sort((a, b) => {
    const nameA = `${a.firstName} ${a.lastName}`;
    const nameB = `${b.firstName} ${b.lastName}`;
    return nameA.localeCompare(nameB);
  });
  
  // Add employee options
  employeeFilter.innerHTML = '<option value="">Todos los empleados</option>';
  employees.forEach(employee => {
    const option = document.createElement('option');
    option.value = employee.id;
    option.textContent = `${employee.firstName} ${employee.lastName}`;
    employeeFilter.appendChild(option);
  });
}

// Load receipts table
function loadReceipts() {
  const selectedPeriod = periodFilter.value;
  const selectedEmployee = employeeFilter.value;
  
  // Get payroll items
  let payrollItems = window.Storage.getPayrollItems();
  const payrolls = window.Storage.getPayrolls();
  const employees = window.Storage.getEmployees();
  
  // Filter by period
  if (selectedPeriod) {
    const payroll = payrolls.find(p => p.period === selectedPeriod);
    if (payroll) {
      payrollItems = payrollItems.filter(item => item.payrollId === payroll.id);
    }
  }
  
  // Filter by employee
  if (selectedEmployee) {
    payrollItems = payrollItems.filter(item => item.employeeId === selectedEmployee);
  }
  
  // Clear table
  const tbody = receiptsTable.querySelector('tbody');
  tbody.innerHTML = '';
  
  // Add items to table
  payrollItems.forEach(item => {
    const payroll = payrolls.find(p => p.id === item.payrollId);
    const employee = employees.find(e => e.id === item.employeeId);
    
    if (!payroll || !employee) return;
    
    const row = document.createElement('tr');
    
    // Employee
    const employeeCell = document.createElement('td');
    employeeCell.textContent = `${employee.firstName} ${employee.lastName}`;
    
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
    
    // Actions
    const actionsCell = document.createElement('td');
    const actionButtons = document.createElement('div');
    actionButtons.classList.add('action-buttons');
    
    // Preview button
    const previewButton = document.createElement('button');
    previewButton.classList.add('action-button');
    previewButton.innerHTML = '👁️';
    previewButton.title = 'Vista Previa';
    previewButton.addEventListener('click', () => showPreview(item, employee, payroll));
    
    // Download button
    const downloadButton = document.createElement('button');
    downloadButton.classList.add('action-button');
    downloadButton.innerHTML = '📥';
    downloadButton.title = 'Descargar PDF';
    downloadButton.addEventListener('click', () => {
      showPreview(item, employee, payroll);
      downloadReceipt(item, employee, payroll);
    });
    
    actionButtons.appendChild(previewButton);
    actionButtons.appendChild(downloadButton);
    actionsCell.appendChild(actionButtons);
    
    // Add cells to row
    row.appendChild(employeeCell);
    row.appendChild(periodCell);
    row.appendChild(dateCell);
    row.appendChild(grossCell);
    row.appendChild(deductionsCell);
    row.appendChild(netCell);
    row.appendChild(actionsCell);
    
    tbody.appendChild(row);
  });
  
  // Show message if no items
  if (payrollItems.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 7;
    cell.textContent = 'No hay comprobantes para mostrar';
    cell.classList.add('text-center');
    row.appendChild(cell);
    tbody.appendChild(row);
  }
}

// Show receipt preview
function showPreview(payrollItem, employee, payroll) {
  // Set receipt information
  receiptPeriodElement.textContent = `Período: ${payroll.period}`;
  employeeNameElement.textContent = `${employee.firstName} ${employee.lastName}`;
  employeeDocumentElement.textContent = employee.document;
  employeePositionElement.textContent = employee.position;
  employeeDepartmentElement.textContent = employee.department;
  
  baseSalaryElement.textContent = formatCurrency(employee.salary);
  workedDaysElement.textContent = payrollItem.daysWorked;
  overtimeElement.textContent = formatCurrency(payrollItem.overtime || 0);
  totalEarnedElement.textContent = formatCurrency(payrollItem.grossSalary);
  
  healthDeductionElement.textContent = formatCurrency(payrollItem.healthDeduction);
  pensionDeductionElement.textContent = formatCurrency(payrollItem.pensionDeduction);
  otherDeductionsElement.textContent = formatCurrency(payrollItem.otherDeductions || 0);
  
  const totalDeductions = payrollItem.healthDeduction + payrollItem.pensionDeduction + (payrollItem.otherDeductions || 0);
  totalDeductionsElement.textContent = formatCurrency(totalDeductions);
  
  totalPaymentElement.textContent = formatCurrency(payrollItem.netSalary);
  issueDateElement.textContent = formatDate(new Date().toISOString());
  
  // Store data for download
  downloadReceiptButton.dataset.itemId = payrollItem.id;
  
  // Show modal
  previewModal.style.display = 'flex';
}


// Download all receipts
async function downloadAllReceipts() {
  const selectedPeriod = periodFilter.value;
  const selectedEmployee = employeeFilter.value;
  
  // Get filtered items
  let payrollItems = window.Storage.getPayrollItems();
  const payrolls = window.Storage.getPayrolls();
  const employees = window.Storage.getEmployees();
  
  if (selectedPeriod) {
    const payroll = payrolls.find(p => p.period === selectedPeriod);
    if (payroll) {
      payrollItems = payrollItems.filter(item => item.payrollId === payroll.id);
    }
  }
  
  if (selectedEmployee) {
    payrollItems = payrollItems.filter(item => item.employeeId === selectedEmployee);
  }
  
  if (payrollItems.length === 0) {
    showToast('No hay comprobantes para descargar');
    return;
  }
  
  try {
    showToast(`Generando ${payrollItems.length} comprobantes...`);
    
    // Create zip file
    const zip = new JSZip();
    
    // Add each receipt to zip
    for (const item of payrollItems) {
      const payroll = payrolls.find(p => p.id === item.payrollId);
      const employee = employees.find(e => e.id === item.employeeId);
      
      if (!payroll || !employee) continue;
      
      const pdf = await window.PDFGenerator.generatePayrollReceipt(item, employee, payroll);
      const fileName = `comprobante_${payroll.period.replace(/\s/g, '_')}_${employee.lastName}.pdf`;
      
      zip.file(fileName, pdf);
    }
    
    // Generate and download zip
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'comprobantes.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Comprobantes descargados exitosamente');
  } catch (error) {
    console.error('Error generating PDFs:', error);
    showToast('Error al generar los comprobantes');
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
  // Load initial data
  loadFilters();
  loadReceipts();
  
  // Handle filter changes
  applyFiltersButton.addEventListener('click', loadReceipts);
  
  // Handle download all
  downloadAllButton.addEventListener('click', downloadAllReceipts);
  
  // Handle preview modal
  closePreviewButton.addEventListener('click', () => {
    previewModal.style.display = 'none';
  });
  
  // Handle download from preview
  downloadReceiptButton.addEventListener('click', function() {
    const itemId = this.dataset.itemId;
    const item = window.Storage.getPayrollItems().find(i => i.id === itemId);
    if (!item) return;
    
    const payroll = window.Storage.getPayrollById(item.payrollId);
    const employee = window.Storage.getEmployees().find(e => e.id === item.employeeId);
    
    if (payroll && employee) {
      downloadReceipt(item, employee, payroll);
    }
  });
  
  // Close modal when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target === previewModal) {
      previewModal.style.display = 'none';
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