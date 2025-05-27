/**
 * Admin Dashboard Module for Sistema de Nómina - Parroquia San Francisco de Asís
 * Manages dashboard functionality including stats, charts, and quick actions
 */

// Ensure user is authenticated and has admin role
window.Auth.requireAdmin();

// DOM Elements
const currentDateElement = document.getElementById('current-date');
const employeesCountElement = document.getElementById('employees-count');
const pendingEventsCountElement = document.getElementById('pending-events-count');
const processedPayrollsCountElement = document.getElementById('processed-payrolls-count');
const monthlyTotalElement = document.getElementById('monthly-total');
const recentActivityTable = document.getElementById('recent-activity-table');
const recentPayrollsTable = document.getElementById('recent-payrolls-table');
const userNameElement = document.getElementById('user-name');
const logoutLink = document.getElementById('logout-link');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebar = document.querySelector('.sidebar');
const backupButton = document.getElementById('backup-button');
const backupModal = document.getElementById('backup-modal');
const confirmBackupButton = document.getElementById('confirm-backup');
const cancelBackupButton = document.getElementById('cancel-backup');
const closeModalButton = document.querySelector('.close-modal');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

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

// Set current date
function setCurrentDate() {
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  const today = new Date().toLocaleDateString('es-CO', options);
  currentDateElement.textContent = today.charAt(0).toUpperCase() + today.slice(1);
}

// Load dashboard statistics
function loadDashboardStats() {
  // Get data from storage
  const employees = window.Storage.getEmployees();
  const workEvents = window.Storage.getWorkEvents();
  const payrolls = window.Storage.getPayrolls();
  const payrollItems = window.Storage.getPayrollItems();
  
  // Count employees
  employeesCountElement.textContent = employees.length;
  
  // Count pending events
  const pendingEvents = workEvents.filter(event => event.status === 'Pendiente');
  pendingEventsCountElement.textContent = pendingEvents.length;
  
  // Count processed payrolls
  processedPayrollsCountElement.textContent = payrolls.length;
  
  // Calculate monthly total
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthPayrolls = payrolls.filter(payroll => {
    const payrollDate = new Date(payroll.endDate);
    return payrollDate.getMonth() === currentMonth && payrollDate.getFullYear() === currentYear;
  });
  
  let monthlyTotal = 0;
  if (currentMonthPayrolls.length > 0) {
    monthlyTotal = currentMonthPayrolls.reduce((total, payroll) => total + payroll.totalNet, 0);
  }
  
  monthlyTotalElement.textContent = formatCurrency(monthlyTotal);
}

// Load recent activity
function loadRecentActivity() {
  // In a real app, this would come from an activity log
  // For the prototype, we'll create some sample activities
  const activities = [
    {
      date: '2023-07-30T15:45:20',
      activity: 'Aprobación de Nómina',
      user: 'Administrador',
      detail: 'Nómina de Julio 2023'
    },
    {
      date: '2023-07-28T10:15:30',
      activity: 'Liquidación de Nómina',
      user: 'Administrador',
      detail: 'Período: Julio 2023'
    },
    {
      date: '2023-07-20T14:30:45',
      activity: 'Registro de Novedad',
      user: 'Administrador',
      detail: 'Horas extra para María Rodríguez'
    },
    {
      date: '2023-07-15T09:20:10',
      activity: 'Importación de Empleados',
      user: 'Administrador',
      detail: '2 empleados importados'
    }
  ];
  
  // Clear loading message
  recentActivityTable.querySelector('tbody').innerHTML = '';
  
  // Add activities to table
  activities.forEach(activity => {
    const row = document.createElement('tr');
    
    const dateCell = document.createElement('td');
    dateCell.textContent = formatDate(activity.date);
    
    const activityCell = document.createElement('td');
    activityCell.textContent = activity.activity;
    
    const userCell = document.createElement('td');
    userCell.textContent = activity.user;
    
    const detailCell = document.createElement('td');
    detailCell.textContent = activity.detail;
    
    row.appendChild(dateCell);
    row.appendChild(activityCell);
    row.appendChild(userCell);
    row.appendChild(detailCell);
    
    recentActivityTable.querySelector('tbody').appendChild(row);
  });
}

// Load recent payrolls
function loadRecentPayrolls() {
  const payrolls = window.Storage.getPayrolls();
  
  // Sort payrolls by date (most recent first)
  payrolls.sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
  
  // Take only the most recent 5
  const recentPayrolls = payrolls.slice(0, 5);
  
  // Clear loading message
  recentPayrollsTable.querySelector('tbody').innerHTML = '';
  
  // Add payrolls to table
  recentPayrolls.forEach(payroll => {
    const row = document.createElement('tr');
    
    const periodCell = document.createElement('td');
    periodCell.textContent = payroll.period;
    
    const statusCell = document.createElement('td');
    const statusBadge = document.createElement('span');
    statusBadge.textContent = payroll.status;
    statusBadge.classList.add('badge');
    
    if (payroll.status === 'Aprobado') {
      statusBadge.classList.add('badge-success');
    } else if (payroll.status === 'Pendiente') {
      statusBadge.classList.add('badge-warning');
    } else {
      statusBadge.classList.add('badge-info');
    }
    
    statusCell.appendChild(statusBadge);
    
    const grossCell = document.createElement('td');
    grossCell.textContent = formatCurrency(payroll.totalGross);
    
    const netCell = document.createElement('td');
    netCell.textContent = formatCurrency(payroll.totalNet);
    
    const actionsCell = document.createElement('td');
    
    const viewButton = document.createElement('a');
    viewButton.href = `admin-payroll-details.html?id=${payroll.id}`;
    viewButton.classList.add('action-link');
    viewButton.innerHTML = '<span class="icon">👁️</span>';
    viewButton.title = 'Ver detalles';
    
    const receiptButton = document.createElement('a');
    receiptButton.href = `admin-receipts.html?payroll=${payroll.id}`;
    receiptButton.classList.add('action-link');
    receiptButton.innerHTML = '<span class="icon">🧾</span>';
    receiptButton.title = 'Comprobantes';
    
    actionsCell.appendChild(viewButton);
    actionsCell.appendChild(receiptButton);
    
    row.appendChild(periodCell);
    row.appendChild(statusCell);
    row.appendChild(grossCell);
    row.appendChild(netCell);
    row.appendChild(actionsCell);
    
    recentPayrollsTable.querySelector('tbody').appendChild(row);
  });
  
  // If no payrolls, show message
  if (recentPayrolls.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 5;
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
  // Set current date
  setCurrentDate();
  
  // Load dashboard data
  loadDashboardStats();
  loadRecentActivity();
  loadRecentPayrolls();
  
  // Handle logout
  logoutLink.addEventListener('click', function(e) {
    e.preventDefault();
    window.Auth.logout();
  });
  
  // Handle sidebar toggle
  sidebarToggle.addEventListener('click', function() {
    sidebar.classList.toggle('show');
  });
  
  // Handle backup button
  backupButton.addEventListener('click', function(e) {
    e.preventDefault();
    backupModal.style.display = 'flex';
  });
  
  // Handle confirm backup
  confirmBackupButton.addEventListener('click', function() {
    const result = window.Storage.createBackup();
    backupModal.style.display = 'none';
    
    if (result.success) {
      showToast('Respaldo creado exitosamente');
    } else {
      showToast('Error al crear el respaldo: ' + result.message, 5000);
    }
  });
  
  // Handle cancel backup
  cancelBackupButton.addEventListener('click', function() {
    backupModal.style.display = 'none';
  });
  
  // Handle close modal
  closeModalButton.addEventListener('click', function() {
    backupModal.style.display = 'none';
  });
  
  // Close modal when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target === backupModal) {
      backupModal.style.display = 'none';
    }
  });
  
  // Add animations to cards
  const statCards = document.querySelectorAll('.stat-card');
  statCards.forEach((card, index) => {
    setTimeout(() => {
      card.classList.add('fade-in');
    }, index * 100);
  });
});

// Add CSS for the badge and action link elements
const style = document.createElement('style');
style.textContent = `
  .badge {
    display: inline-block;
    padding: 0.25em 0.6em;
    font-size: 0.75em;
    font-weight: 700;
    line-height: 1;
    text-align: center;
    white-space: nowrap;
    vertical-align: baseline;
    border-radius: 0.25rem;
  }
  
  .badge-success {
    color: #fff;
    background-color: var(--success);
  }
  
  .badge-warning {
    color: #212529;
    background-color: var(--warning);
  }
  
  .badge-info {
    color: #fff;
    background-color: var(--info);
  }
  
  .badge-danger {
    color: #fff;
    background-color: var(--danger);
  }
  
  .action-link {
    display: inline-block;
    margin-right: 8px;
    color: var(--primary);
    cursor: pointer;
  }
  
  .action-link:hover {
    color: var(--primary-dark);
  }
  
  .fade-in {
    animation: fadeIn 0.5s ease forwards;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .shake {
    animation: shake 0.5s ease-in-out;
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }
  
  .fade-out {
    animation: fadeOut 0.5s ease forwards;
  }
  
  @keyframes fadeOut {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(-20px); }
  }
`;
document.head.appendChild(style);