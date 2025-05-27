/**
 * Admin Import Module for Sistema de Nómina - Parroquia San Francisco de Asís
 * Manages data import functionality
 */

// Ensure user is authenticated and has admin role
window.Auth.requireAdmin();

// DOM Elements - General
const userNameElement = document.getElementById('user-name');
const logoutLink = document.getElementById('logout-link');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebar = document.querySelector('.sidebar');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const loadingOverlay = document.getElementById('loading-overlay');

// DOM Elements - Steps
const stepItems = document.querySelectorAll('.step-item');
const stepLines = document.querySelectorAll('.step-line');
const importSteps = document.querySelectorAll('.import-step');

// DOM Elements - Step 1
const importTypeItems = document.querySelectorAll('.import-type-item');
const step1NextButton = document.getElementById('step-1-next');

// DOM Elements - Step 2
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const uploadInfo = document.getElementById('upload-info');
const fileName = document.getElementById('file-name');
const fileSize = document.getElementById('file-size');
const removeFileButton = document.getElementById('remove-file');
const downloadExcelTemplateButton = document.getElementById('download-excel-template');
const downloadCsvTemplateButton = document.getElementById('download-csv-template');
const step2PrevButton = document.getElementById('step-2-prev');
const step2NextButton = document.getElementById('step-2-next');

// DOM Elements - Step 3
const validRowsElement = document.getElementById('valid-rows');
const errorRowsElement = document.getElementById('error-rows');
const totalRowsElement = document.getElementById('total-rows');
const validDataTable = document.getElementById('valid-data-table');
const errorList = document.getElementById('error-list');
const tabButtons = document.querySelectorAll('.tab-button');
const tabPanes = document.querySelectorAll('.tab-pane');
const step3PrevButton = document.getElementById('step-3-prev');
const step3NextButton = document.getElementById('step-3-next');

// DOM Elements - Step 4
const summaryTypeElement = document.getElementById('summary-type');
const summaryFileElement = document.getElementById('summary-file');
const summaryRecordsElement = document.getElementById('summary-records');
const importActionSelect = document.getElementById('import-action');
const step4PrevButton = document.getElementById('step-4-prev');
const step4ConfirmButton = document.getElementById('step-4-confirm');

// DOM Elements - Success
const successCountElement = document.getElementById('success-count');
const newImportButton = document.getElementById('new-import');
const goToDashboardButton = document.getElementById('go-to-dashboard');

// Set current user name
const currentUser = window.Auth.getCurrentUser();
if (currentUser) {
  userNameElement.textContent = currentUser.name;
}

// State variables
let currentStep = 1;
let selectedImportType = 'employees';
let selectedFile = null;
let parsedData = null;
let validData = [];
let errorData = [];

// Schemas for data validation
const schemas = {
  employees: {
    id: {
      type: 'string',
      required: true,
      label: 'ID'
    },
    firstName: {
      type: 'string',
      required: true,
      label: 'Nombre'
    },
    lastName: {
      type: 'string',
      required: true,
      label: 'Apellido'
    },
    document: {
      type: 'string',
      required: true,
      label: 'Documento'
    },
    position: {
      type: 'string',
      required: true,
      label: 'Cargo'
    },
    department: {
      type: 'string',
      required: true,
      label: 'Departamento'
    },
    joinDate: {
      type: 'date',
      required: true,
      label: 'Fecha de Ingreso'
    },
    salary: {
      type: 'number',
      required: true,
      label: 'Salario'
    },
    bankAccount: {
      type: 'string',
      required: false,
      label: 'Cuenta Bancaria'
    },
    bankName: {
      type: 'string',
      required: false,
      label: 'Banco'
    },
    accountType: {
      type: 'string',
      required: false,
      label: 'Tipo de Cuenta'
    },
    email: {
      type: 'string',
      required: false,
      label: 'Email'
    },
    phone: {
      type: 'string',
      required: false,
      label: 'Teléfono'
    }
  },
  events: {
    id: {
      type: 'string',
      required: true,
      label: 'ID'
    },
    employeeId: {
      type: 'string',
      required: true,
      label: 'ID Empleado'
    },
    type: {
      type: 'enum',
      required: true,
      label: 'Tipo',
      values: ['Incapacidad', 'Permiso', 'Licencia', 'Horas Extra', 'Vacaciones', 'Otro']
    },
    startDate: {
      type: 'date',
      required: true,
      label: 'Fecha Inicio'
    },
    endDate: {
      type: 'date',
      required: false,
      label: 'Fecha Fin'
    },
    days: {
      type: 'number',
      required: false,
      label: 'Días'
    },
    hours: {
      type: 'number',
      required: false,
      label: 'Horas'
    },
    description: {
      type: 'string',
      required: false,
      label: 'Descripción'
    },
    status: {
      type: 'enum',
      required: true,
      label: 'Estado',
      values: ['Pendiente', 'Aprobado', 'Rechazado']
    },
    documentRef: {
      type: 'string',
      required: false,
      label: 'Referencia Documento'
    }
  }
};

// Show toast notification
function showToast(message, duration = 3000) {
  toastMessage.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

// Show loading overlay
function showLoading() {
  loadingOverlay.classList.remove('hide');
}

// Hide loading overlay
function hideLoading() {
  loadingOverlay.classList.add('hide');
}

// Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Navigate to a step
function goToStep(step) {
  // Update current step
  currentStep = step;
  
  // Update step indicators
  stepItems.forEach((item, index) => {
    const itemStep = parseInt(item.dataset.step, 10);
    
    if (itemStep < step) {
      item.classList.add('completed');
      item.classList.remove('active');
    } else if (itemStep === step) {
      item.classList.add('active');
      item.classList.remove('completed');
    } else {
      item.classList.remove('active', 'completed');
    }
  });
  
  // Update step lines
  stepLines.forEach((line, index) => {
    if (index < step - 1) {
      line.classList.add('active');
    } else {
      line.classList.remove('active');
    }
  });
  
  // Show current step content and hide others
  importSteps.forEach((stepContent, index) => {
    if (index === step - 1) {
      stepContent.classList.remove('hide');
    } else {
      stepContent.classList.add('hide');
    }
  });
  
  // Special case for success step
  if (step === 5) {
    document.getElementById('import-success').classList.remove('hide');
  } else {
    document.getElementById('import-success').classList.add('hide');
  }
}

// Handle file selection
function handleFileSelect(file) {
  if (!file) return;
  
  const allowedTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/csv'
  ];
  
  if (!allowedTypes.includes(file.type) && 
      !(file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
    showToast('Formato de archivo no válido. Use Excel (.xlsx, .xls) o CSV (.csv)', 4000);
    return;
  }
  
  selectedFile = file;
  
  // Update UI
  uploadArea.classList.add('hide');
  uploadInfo.classList.remove('hide');
  fileName.textContent = file.name;
  fileSize.textContent = formatFileSize(file.size);
  
  // Enable next button
  step2NextButton.disabled = false;
}

// Reset file selection
function resetFileSelection() {
  selectedFile = null;
  fileInput.value = '';
  uploadArea.classList.remove('hide');
  uploadInfo.classList.add('hide');
  step2NextButton.disabled = true;
}

// Parse the selected file
async function parseSelectedFile() {
  showLoading();
  
  try {
    // Determine file type
    const isExcel = selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls');
    
    // Parse file
    if (isExcel) {
      parsedData = await window.CSVParser.parseExcel(selectedFile, {
        hasHeader: true
      });
    } else {
      parsedData = await window.CSVParser.parseCSV(selectedFile, {
        delimiter: ',',
        hasHeader: true
      });
    }
    
    // Validate data
    const validationResult = window.CSVParser.validateImportData(parsedData, schemas[selectedImportType]);
    
    validData = validationResult.data;
    errorData = validationResult.errors;
    
    // Update validation stats
    validRowsElement.textContent = validData.length;
    errorRowsElement.textContent = errorData.length;
    totalRowsElement.textContent = parsedData.length;
    
    // Update tables
    updateValidDataTable();
    updateErrorList();
    
    // Enable/disable next button based on validation
    step3NextButton.disabled = validData.length === 0;
    
    // Update summary data
    summaryTypeElement.textContent = selectedImportType === 'employees' ? 'Empleados' : 'Novedades';
    summaryFileElement.textContent = selectedFile.name;
    summaryRecordsElement.textContent = validData.length;
    
    hideLoading();
  } catch (error) {
    hideLoading();
    showToast('Error al procesar el archivo: ' + error.message, 5000);
    console.error('Error parsing file:', error);
  }
}

// Update valid data table
function updateValidDataTable() {
  if (validData.length === 0) {
    validDataTable.innerHTML = '<tbody><tr><td colspan="5" class="text-center">No hay datos válidos para mostrar</td></tr></tbody>';
    return;
  }
  
  // Create table headers
  const headers = Object.keys(schemas[selectedImportType])
    .filter(key => schemas[selectedImportType][key].required)
    .map(key => schemas[selectedImportType][key].label || key);
  
  let headerRow = '<tr>';
  headers.forEach(header => {
    headerRow += `<th>${header}</th>`;
  });
  headerRow += '</tr>';
  
  // Create table body
  let tableBody = '';
  validData.slice(0, 10).forEach(item => {
    let row = '<tr>';
    Object.keys(schemas[selectedImportType])
      .filter(key => schemas[selectedImportType][key].required)
      .forEach(key => {
        row += `<td>${item[key] || ''}</td>`;
      });
    row += '</tr>';
    tableBody += row;
  });
  
  // If there are more than 10 rows, add a message
  if (validData.length > 10) {
    tableBody += `<tr><td colspan="${headers.length}" class="text-center">... y ${validData.length - 10} registros más</td></tr>`;
  }
  
  validDataTable.innerHTML = `<thead>${headerRow}</thead><tbody>${tableBody}</tbody>`;
}

// Update error list
function updateErrorList() {
  if (errorData.length === 0) {
    errorList.innerHTML = '<p class="text-center">No hay errores que mostrar</p>';
    return;
  }
  
  let errorListHTML = '';
  
  errorData.forEach(error => {
    let errorItem = `
      <div class="error-item">
        <div class="error-header">
          <div class="error-row">Fila ${error.row}</div>
        </div>
        <ul class="error-message-list">
    `;
    
    error.errors.forEach(errorMessage => {
      errorItem += `<li>${errorMessage}</li>`;
    });
    
    errorItem += `
        </ul>
      </div>
    `;
    
    errorListHTML += errorItem;
  });
  
  errorList.innerHTML = errorListHTML;
}

// Import data
async function importData() {
  showLoading();
  
  try {
    // Get import action
    const action = importActionSelect.value;
    
    // Process data based on type and action
    if (selectedImportType === 'employees') {
      const existingEmployees = window.Storage.getEmployees();
      
      if (action === 'add') {
        // Only add new employees
        const newEmployees = validData.filter(employee => 
          !existingEmployees.some(existing => existing.id === employee.id)
        );
        
        // Add to storage
        newEmployees.forEach(employee => window.Storage.addEmployee(employee));
        
        successCountElement.textContent = newEmployees.length;
      } else if (action === 'update') {
        // Only update existing employees
        let updateCount = 0;
        
        validData.forEach(employee => {
          const existingIndex = existingEmployees.findIndex(existing => existing.id === employee.id);
          
          if (existingIndex !== -1) {
            window.Storage.updateEmployee(employee);
            updateCount++;
          }
        });
        
        successCountElement.textContent = updateCount;
      } else {
        // Add new and update existing
        validData.forEach(employee => {
          const existingIndex = existingEmployees.findIndex(existing => existing.id === employee.id);
          
          if (existingIndex !== -1) {
            window.Storage.updateEmployee(employee);
          } else {
            window.Storage.addEmployee(employee);
          }
        });
        
        successCountElement.textContent = validData.length;
      }
    } else if (selectedImportType === 'events') {
      const existingEvents = window.Storage.getWorkEvents();
      
      if (action === 'add') {
        // Only add new events
        const newEvents = validData.filter(event => 
          !existingEvents.some(existing => existing.id === event.id)
        );
        
        // Add to storage
        newEvents.forEach(event => window.Storage.addWorkEvent(event));
        
        successCountElement.textContent = newEvents.length;
      } else if (action === 'update') {
        // Only update existing events
        let updateCount = 0;
        
        validData.forEach(event => {
          const existingIndex = existingEvents.findIndex(existing => existing.id === event.id);
          
          if (existingIndex !== -1) {
            window.Storage.updateWorkEvent(event);
            updateCount++;
          }
        });
        
        successCountElement.textContent = updateCount;
      } else {
        // Add new and update existing
        validData.forEach(event => {
          const existingIndex = existingEvents.findIndex(existing => existing.id === event.id);
          
          if (existingIndex !== -1) {
            window.Storage.updateWorkEvent(event);
          } else {
            window.Storage.addWorkEvent(event);
          }
        });
        
        successCountElement.textContent = validData.length;
      }
    }
    
    // Simulate a delay for UX
    setTimeout(() => {
      hideLoading();
      goToStep(5); // Show success message
    }, 1500);
  } catch (error) {
    hideLoading();
    showToast('Error al importar datos: ' + error.message, 5000);
    console.error('Error importing data:', error);
  }
}

// Download template
function downloadTemplate(type) {
  const templateType = type === 'excel' ? 'excel' : 'csv';
  const templateSchema = schemas[selectedImportType];
  
  // Generate template
  const template = window.CSVParser.generateTemplate(templateSchema, templateType);
  
  // Create download link
  const url = URL.createObjectURL(template);
  const a = document.createElement('a');
  const fileName = `plantilla_${selectedImportType}_${templateType === 'excel' ? 'excel' : 'csv'}.${templateType === 'excel' ? 'xlsx' : 'csv'}`;
  
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast(`Plantilla de ${selectedImportType} descargada como ${fileName}`, 3000);
}

// Event handlers
document.addEventListener('DOMContentLoaded', function() {
  // Set event handlers for import type selection
  importTypeItems.forEach(item => {
    item.addEventListener('click', function() {
      // Remove selected class from all items
      importTypeItems.forEach(i => i.classList.remove('selected'));
      // Add selected class to clicked item
      this.classList.add('selected');
      // Update selected import type
      selectedImportType = this.dataset.type;
    });
  });
  
  // Step 1 Next button
  step1NextButton.addEventListener('click', function() {
    goToStep(2);
  });
  
  // Step 2 Previous button
  step2PrevButton.addEventListener('click', function() {
    goToStep(1);
  });
  
  // Step 2 Next button
  step2NextButton.addEventListener('click', function() {
    parseSelectedFile().then(() => {
      goToStep(3);
    });
  });
  
  // Step 3 Previous button
  step3PrevButton.addEventListener('click', function() {
    goToStep(2);
  });
  
  // Step 3 Next button
  step3NextButton.addEventListener('click', function() {
    goToStep(4);
  });
  
  // Step 4 Previous button
  step4PrevButton.addEventListener('click', function() {
    goToStep(3);
  });
  
  // Step 4 Confirm button
  step4ConfirmButton.addEventListener('click', function() {
    importData();
  });
  
  // File input change
  fileInput.addEventListener('change', function(e) {
    if (this.files.length > 0) {
      handleFileSelect(this.files[0]);
    }
  });
  
  // Upload area click
  uploadArea.addEventListener('click', function() {
    fileInput.click();
  });
  
  // Upload area drag and drop
  uploadArea.addEventListener('dragover', function(e) {
    e.preventDefault();
    this.classList.add('drag-over');
  });
  
  uploadArea.addEventListener('dragleave', function() {
    this.classList.remove('drag-over');
  });
  
  uploadArea.addEventListener('drop', function(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  });
  
  // Remove file button
  removeFileButton.addEventListener('click', function() {
    resetFileSelection();
  });
  
  // Template download buttons
  downloadExcelTemplateButton.addEventListener('click', function() {
    downloadTemplate('excel');
  });
  
  downloadCsvTemplateButton.addEventListener('click', function() {
    downloadTemplate('csv');
  });
  
  // Tab navigation
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const tabId = this.dataset.tab;
      
      // Deactivate all tabs
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanes.forEach(pane => pane.classList.remove('active'));
      
      // Activate selected tab
      this.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    });
  });
  
  // Success screen buttons
  newImportButton.addEventListener('click', function() {
    // Reset state
    resetFileSelection();
    validData = [];
    errorData = [];
    parsedData = null;
    
    // Go to step 1
    goToStep(1);
  });
  
  goToDashboardButton.addEventListener('click', function() {
    window.location.href = 'admin.html';
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