/**
 * Settings Module for Sistema de Nómina - Parroquia San Francisco de Asís
 * Handles system configuration and settings management
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

// Forms
const organizationForm = document.getElementById('organization-form');
const payrollForm = document.getElementById('payroll-form');

// Organization form fields
const orgNameInput = document.getElementById('org-name');
const orgNitInput = document.getElementById('org-nit');
const orgAddressInput = document.getElementById('org-address');
const orgPhoneInput = document.getElementById('org-phone');
const orgEmailInput = document.getElementById('org-email');

// Payroll form fields
const healthRateInput = document.getElementById('health-rate');
const pensionRateInput = document.getElementById('pension-rate');
const overtimeRateInput = document.getElementById('overtime-rate');
const holidayOvertimeRateInput = document.getElementById('holiday-overtime-rate');
const nightOvertimeRateInput = document.getElementById('night-overtime-rate');

// Backup elements
const lastBackupDateElement = document.getElementById('last-backup-date');
const createBackupButton = document.getElementById('create-backup');
const restoreBackupButton = document.getElementById('restore-backup');
const backupFileInput = document.getElementById('backup-file');

// Modal elements
const confirmModal = document.getElementById('confirm-modal');
const confirmMessage = document.getElementById('confirm-message');
const confirmActionButton = document.getElementById('confirm-action');
const cancelActionButton = document.getElementById('cancel-action');
const closeModalButton = document.querySelector('.close-modal');

// Set current user name
const currentUser = window.Auth.getCurrentUser();
if (currentUser) {
  userNameElement.textContent = currentUser.name;
}

// Load settings
function loadSettings() {
  const settings = window.Storage.getSettings();
  
  // Organization settings
  orgNameInput.value = settings.organizationName || '';
  orgNitInput.value = settings.nit || '';
  orgAddressInput.value = settings.address || '';
  orgPhoneInput.value = settings.phone || '';
  orgEmailInput.value = settings.email || '';
  
  // Payroll settings
  healthRateInput.value = settings.healthContributionRate || 4;
  pensionRateInput.value = settings.pensionContributionRate || 4;
  overtimeRateInput.value = settings.overtimeRate || 1.25;
  holidayOvertimeRateInput.value = settings.holidayOvertimeRate || 1.75;
  nightOvertimeRateInput.value = settings.nightOvertimeRate || 1.35;
  
  // Backup info
  const lastBackup = settings.lastBackupDate;
  lastBackupDateElement.textContent = lastBackup ? 
    new Date(lastBackup).toLocaleString() : 'Nunca';
}

// Save organization settings
function saveOrganizationSettings(e) {
  e.preventDefault();
  
  const settings = window.Storage.getSettings();
  
  const updatedSettings = {
    ...settings,
    organizationName: orgNameInput.value,
    nit: orgNitInput.value,
    address: orgAddressInput.value,
    phone: orgPhoneInput.value,
    email: orgEmailInput.value
  };
  
  window.Storage.updateSettings(updatedSettings);
  showToast('Información de la organización actualizada');
}

// Save payroll settings
function savePayrollSettings(e) {
  e.preventDefault();
  
  const settings = window.Storage.getSettings();
  
  const updatedSettings = {
    ...settings,
    healthContributionRate: parseFloat(healthRateInput.value),
    pensionContributionRate: parseFloat(pensionRateInput.value),
    overtimeRate: parseFloat(overtimeRateInput.value),
    holidayOvertimeRate: parseFloat(holidayOvertimeRateInput.value),
    nightOvertimeRate: parseFloat(nightOvertimeRateInput.value)
  };
  
  window.Storage.updateSettings(updatedSettings);
  showToast('Configuración de nómina actualizada');
}

// Create backup
function createBackup() {
  const result = window.Storage.createBackup();
  
  if (result.success) {
    const settings = window.Storage.getSettings();
    lastBackupDateElement.textContent = new Date(settings.lastBackupDate).toLocaleString();
    showToast('Respaldo creado exitosamente');
  } else {
    showToast('Error al crear el respaldo: ' + result.message);
  }
}

// Restore backup
function restoreBackup() {
  backupFileInput.click();
}

// Handle backup file selection
async function handleBackupFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  try {
    const backupData = await window.Storage.loadBackupFromFile(file);
    
    // Show confirmation modal
    confirmMessage.textContent = '¿Está seguro que desea restaurar este respaldo? Esta acción reemplazará todos los datos actuales.';
    confirmModal.style.display = 'flex';
    
    // Store backup data for confirmation
    confirmActionButton.dataset.backupData = JSON.stringify(backupData);
    
  } catch (error) {
    showToast('Error al cargar el archivo de respaldo: ' + error.message);
  }
  
  // Clear input
  backupFileInput.value = '';
}

// Confirm restore backup
function confirmRestoreBackup() {
  const backupData = JSON.parse(confirmActionButton.dataset.backupData);
  const result = window.Storage.restoreBackup(backupData);
  
  if (result.success) {
    showToast('Respaldo restaurado exitosamente');
    loadSettings();
  } else {
    showToast('Error al restaurar el respaldo: ' + result.message);
  }
  
  confirmModal.style.display = 'none';
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
  // Load initial settings
  loadSettings();
  
  // Handle form submissions
  organizationForm.addEventListener('submit', saveOrganizationSettings);
  payrollForm.addEventListener('submit', savePayrollSettings);
  
  // Handle backup actions
  createBackupButton.addEventListener('click', createBackup);
  restoreBackupButton.addEventListener('click', restoreBackup);
  backupFileInput.addEventListener('change', handleBackupFile);
  
  // Handle modal actions
  confirmActionButton.addEventListener('click', confirmRestoreBackup);
  cancelActionButton.addEventListener('click', () => {
    confirmModal.style.display = 'none';
  });
  closeModalButton.addEventListener('click', () => {
    confirmModal.style.display = 'none';
  });
  
  // Close modal when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target === confirmModal) {
      confirmModal.style.display = 'none';
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