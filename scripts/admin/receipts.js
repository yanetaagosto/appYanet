/**
 * Receipts Module for Sistema de Nómina - Parroquia San Francisco de Asís
 * Handles pay stub generation and management
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

// Filters
const periodFilter = document.getElementById('period-filter');
const employeeFilter = document.getElementById('employee-filter');
const statusFilter = document.getElementById('status-filter');

// Table
const receiptsTable = document.getElementById('receipts-table');

// Bulk actions
const generateSelectedButton = document.getElementById('generate-selected');
const generateAllButton = document.getElementById('generate-all');

// Modal elements
const previewModal = document.getElementById('preview-modal');
const closePreviewButton = document.getElementById('close-preview');
const downloadReceiptButton = document.getElementById('download-receipt');
const receiptPreview = document.getElementById('receipt-preview');

// Loading overlay
const loadingOverlay = document.getElementById('loading-overlay');

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
  // Load periods
  const payrolls = window.Storage.getPayrolls();
  const periods = [...new Set(payrolls.map(p => p.period))];
  
  periodFilter.innerHTML = '<option value="">Todos los períodos</option>';
  periods.forEach(period => {
    const option = document.createElement('option');
    option.value = period;
    option.textContent = period;
    periodFilter.appendChild(option);
  });
  
  // Load employees
  const employees = window.Storage.getEmployees();
  
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
  const payrolls = window.Storage.getPayrolls();
  const employees = window.Storage.getEmployees();
  
  // Get filter values
  const selectedPeriod = periodFilter.value;
  const selectedEmployee = employeeFilter.value;
  const selectedStatus = statusFilter.value;
  
  // Get all payroll items
  let allPayrollItems = [];
  payrolls.forEach(payroll => {
    const items = window.Storage.getPayrollItemsByPayrollId(payroll.id);
    items.forEach(item => {
      allPayrollItems.push({
        ...item,
        payroll,
        employee: employees.find(e => e.id === item.employeeId)
      });
    });
  });
  
  // Apply filters
  let filteredItems = allPayrollItems;
  
  if (selectedPeriod) {
    filteredItems = filteredItems.filter(item => item.payroll.period === selectedPeriod);
  }
  
  if (selectedEmployee) {
    filteredItems = filteredItems.filter(item => item.employeeId === selectedEmployee);
  }
  
  if (selectedStatus) {
    filteredItems = filteredItems.filter(item => item.payroll.status === selectedStatus);
  }
  
  // Sort by date (most recent first)
  filteredItems.sort((a, b) => new Date(b.payroll.endDate) - new Date(a.payroll.endDate));
  
  // Clear table
  const tbody = receiptsTable.querySelector('tbody');
  tbody.innerHTML = '';
  
  // Add items to table
  filteredItems.forEach(item => {
    const row = document.createElement('tr');
    
    const periodCell = document.createElement('td');
    periodCell.textContent = item.payroll.period;
    
    const employeeCell = document.createElement('td');
    employeeCell.textContent = `${item.employee.firstName} ${item.employee.lastName}`;
    
    const dateCell = document.createElement('td');
    dateCell.textContent = formatDate(item.payroll.endDate);
    
    const grossCell = document.createElement('td');
    grossCell.textContent = formatCurrency(item.grossSalary);
    
    const deductionsCell = document.createElement('td');
    const totalDeductions = item.healthDeduction + item.pensionDeduction + (item.otherDeductions || 0);
    deductionsCell.textContent = formatCurrency(totalDeductions);
    
    const netCell = document.createElement('td');
    netCell.textContent = formatCurrency(item.netSalary);
    
    const statusCell = document.createElement('td');
    const statusBadge = document.createElement('span');
    statusBadge.textContent = item.payroll.status;
    statusBadge.classList.add('badge');
    
    switch (item.payroll.status) {
      case 'Pendiente':
        statusBadge.classList.add('badge-pending');
        break;
      case 'Aprobado':
        statusBadge.classList.add('badge-approved');
        break;
      case 'Pagado':
        statusBadge.classList.add('badge-paid');
        break;
    }
    
    statusCell.appendChild(statusBadge);
    
    const actionsCell = document.createElement('td');
    const actionButtons = document.createElement('div');
    actionButtons.classList.add('action-buttons');
    
    const previewButton = document.createElement('button');
    previewButton.classList.add('action-button');
    previewButton.innerHTML = '👁️';
    previewButton.title = 'Vista previa';
    previewButton.addEventListener('click', () => previewReceipt(item));
    
    const downloadButton = document.createElement('button');
    downloadButton.classList.add('action-button');
    downloadButton.innerHTML = '📥';
    downloadButton.title = 'Descargar';
    downloadButton.addEventListener('click', () => downloadReceipt(item));
    
    actionButtons.appendChild(previewButton);
    actionButtons.appendChild(downloadButton);
    actionsCell.appendChild(actionButtons);
    
    row.appendChild(periodCell);
    row.appendChild(employeeCell);
    row.appendChild(dateCell);
    row.appendChild(grossCell);
    row.appendChild(deductionsCell);
    row.appendChild(netCell);
    row.appendChild(statusCell);
    row.appendChild(actionsCell);
    
    tbody.appendChild(row);
  });
  
  // Show message if no items
  if (filteredItems.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 8;
    cell.textContent = 'No hay comprobantes para mostrar';
    cell.classList.add('text-center');
    row.appendChild(cell);
    tbody.appendChild(row);
  }
}

// Preview receipt
async function previewReceipt(item) {
  try {
    showLoading();
    
    // Generate receipt preview
    const preview = await window.PDFGenerator.generatePayrollReceipt(
      item,
      item.employee,
      item.payroll
    );
    
    // Create preview iframe
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '600px';
    iframe.style.border = 'none';
    
    // Set preview content
    const blob = new Blob([preview], { type: 'application/pdf' });
    iframe.src = URL.createObjectURL(blob);
    
    // Clear and add iframe to preview container
    receiptPreview.innerHTML = '';
    receiptPreview.appendChild(iframe);
    
    // Store item data for download
    downloadReceiptButton.dataset.itemId = item.id;
    
    // Show modal
    previewModal.style.display = 'flex';
    
    hideLoading();
  } catch (error) {
    console.error('Error generating preview:', error);
    hideLoading();
    showToast('Error al generar la vista previa', 3000);
  }
}

// Download receipt
async function downloadReceipt(item) {
  try {
    showLoading();
    
    // Generate PDF
    const pdf = await window.PDFGenerator.generatePayrollReceipt(
      item,
      item.employee,
      item.payroll
    );
    
    // Create download link
    const blob = new Blob([pdf], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comprobante_${item.payroll.period.replace(/\s/g, '_')}_${item.employee.lastName}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    hideLoading();
    showToast('Comprobante descargado exitosamente');
  } catch (error) {
    console.error('Error downloading receipt:', error);
    hideLoading();
    showToast('Error al descargar el comprobante', 3000);
  }
}

// Show loading overlay
function showLoading() {
  loadingOverlay.classList.remove('hide');
}

// Hide loading overlay
function hideLoading() {
  loadingOverlay.classList.add('hide');
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
  
  // Handle filters change
  periodFilter.addEventListener('change', loadReceipts);
  employeeFilter.addEventListener('change', loadReceipts);
  statusFilter.addEventListener('change', loadReceipts);
  
  // Handle bulk actions
  generateSelectedButton.addEventListener('click', () => {
    // TODO: Implement bulk generation for selected items
    showToast('Función en desarrollo');
  });
  
  generateAllButton.addEventListener('click', () => {
    // TODO: Implement bulk generation for all filtered items
    showToast('Función en desarrollo');
  });
  
  // Handle modal close
  closePreviewButton.addEventListener('click', () => {
    previewModal.style.display = 'none';
  });
  
  // Handle download from preview
  downloadReceiptButton.addEventListener('click', () => {
    const itemId = downloadReceiptButton.dataset.itemId;
    const payrollItems = window.Storage.getPayrollItems();
    const item = payrollItems.find(i => i.id === itemId);
    
    if (item) {
      const employee = window.Storage.getEmployeeById(item.employeeId);
      const payroll = window.Storage.getPayrollById(item.payrollId);
      
      if (employee && payroll) {
        downloadReceipt({
          ...item,
          employee,
          payroll
        });
      }
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