/**
 * Events Module for Sistema de Nómina - Parroquia San Francisco de Asís
 * Manages work events (absences, overtime, etc.)
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

// Events specific elements
const newEventButton = document.getElementById('new-event-button');
const eventModal = document.getElementById('event-modal');
const closeModalButton = document.querySelector('.close-modal');
const eventForm = document.getElementById('event-form');
const saveEventButton = document.getElementById('save-event');
const cancelEventButton = document.getElementById('cancel-event');
const eventsTable = document.getElementById('events-table');
const employeeFilter = document.getElementById('employee-filter');
const typeFilter = document.getElementById('type-filter');
const statusFilter = document.getElementById('status-filter');

// Form elements
const eventEmployee = document.getElementById('event-employee');
const eventType = document.getElementById('event-type');
const eventStartDate = document.getElementById('event-start-date');
const eventEndDate = document.getElementById('event-end-date');
const eventDays = document.getElementById('event-days');
const eventHours = document.getElementById('event-hours');
const eventDescription = document.getElementById('event-description');
const eventDocument = document.getElementById('event-document');
const daysGroup = document.getElementById('days-group');
const hoursGroup = document.getElementById('hours-group');

// Set current user name
const currentUser = window.Auth.getCurrentUser();
if (currentUser) {
  userNameElement.textContent = currentUser.name;
}

// Format date function
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('es-CO', options);
}

// Calculate days between dates
function calculateDays(startDate, endDate) {
  if (!endDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

// Load employees into select elements
function loadEmployees() {
  const employees = window.Storage.getEmployees();
  
  // Sort employees by name
  employees.sort((a, b) => {
    const nameA = `${a.firstName} ${a.lastName}`;
    const nameB = `${b.firstName} ${b.lastName}`;
    return nameA.localeCompare(nameB);
  });
  
  // Clear existing options
  employeeFilter.innerHTML = '<option value="">Todos los empleados</option>';
  eventEmployee.innerHTML = '';
  
  // Add employee options
  employees.forEach(employee => {
    const filterOption = document.createElement('option');
    filterOption.value = employee.id;
    filterOption.textContent = `${employee.firstName} ${employee.lastName}`;
    employeeFilter.appendChild(filterOption);
    
    const formOption = filterOption.cloneNode(true);
    eventEmployee.appendChild(formOption);
  });
}

// Load events table
function loadEvents() {
  const events = window.Storage.getWorkEvents();
  const employees = window.Storage.getEmployees();
  
  // Get filter values
  const selectedEmployee = employeeFilter.value;
  const selectedType = typeFilter.value;
  const selectedStatus = statusFilter.value;
  
  // Filter events
  let filteredEvents = events;
  
  if (selectedEmployee) {
    filteredEvents = filteredEvents.filter(event => event.employeeId === selectedEmployee);
  }
  
  if (selectedType) {
    filteredEvents = filteredEvents.filter(event => event.type === selectedType);
  }
  
  if (selectedStatus) {
    filteredEvents = filteredEvents.filter(event => event.status === selectedStatus);
  }
  
  // Sort events by date (most recent first)
  filteredEvents.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  
  // Clear table
  const tbody = eventsTable.querySelector('tbody');
  tbody.innerHTML = '';
  
  // Add events to table
  filteredEvents.forEach(event => {
    const employee = employees.find(emp => emp.id === event.employeeId);
    if (!employee) return;
    
    const row = document.createElement('tr');
    
    // Employee
    const employeeCell = document.createElement('td');
    employeeCell.textContent = `${employee.firstName} ${employee.lastName}`;
    
    // Type
    const typeCell = document.createElement('td');
    typeCell.textContent = event.type;
    
    // Start Date
    const startDateCell = document.createElement('td');
    startDateCell.textContent = formatDate(event.startDate);
    
    // End Date
    const endDateCell = document.createElement('td');
    endDateCell.textContent = event.endDate ? formatDate(event.endDate) : '-';
    
    // Days/Hours
    const durationCell = document.createElement('td');
    if (event.type === 'Horas Extra') {
      durationCell.textContent = `${event.hours} horas`;
    } else {
      durationCell.textContent = `${event.days} días`;
    }
    
    // Status
    const statusCell = document.createElement('td');
    const statusBadge = document.createElement('span');
    statusBadge.textContent = event.status;
    statusBadge.classList.add('badge');
    
    switch (event.status) {
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
    viewButton.addEventListener('click', () => viewEvent(event));
    
    // Edit button
    const editButton = document.createElement('button');
    editButton.classList.add('action-button');
    editButton.innerHTML = '✏️';
    editButton.title = 'Editar';
    editButton.addEventListener('click', () => editEvent(event));
    
    // Approve button (only for pending events)
    if (event.status === 'Pendiente') {
      const approveButton = document.createElement('button');
      approveButton.classList.add('action-button', 'approve');
      approveButton.innerHTML = '✓';
      approveButton.title = 'Aprobar';
      approveButton.addEventListener('click', () => approveEvent(event));
      actionButtons.appendChild(approveButton);
      
      const rejectButton = document.createElement('button');
      rejectButton.classList.add('action-button', 'reject');
      rejectButton.innerHTML = '✗';
      rejectButton.title = 'Rechazar';
      rejectButton.addEventListener('click', () => rejectEvent(event));
      actionButtons.appendChild(rejectButton);
    }
    
    actionButtons.appendChild(viewButton);
    actionButtons.appendChild(editButton);
    actionsCell.appendChild(actionButtons);
    
    // Add cells to row
    row.appendChild(employeeCell);
    row.appendChild(typeCell);
    row.appendChild(startDateCell);
    row.appendChild(endDateCell);
    row.appendChild(durationCell);
    row.appendChild(statusCell);
    row.appendChild(actionsCell);
    
    tbody.appendChild(row);
  });
  
  // Show message if no events
  if (filteredEvents.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 7;
    cell.textContent = 'No hay novedades para mostrar';
    cell.classList.add('text-center');
    row.appendChild(cell);
    tbody.appendChild(row);
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

// Reset form
function resetForm() {
  eventForm.reset();
  eventStartDate.value = new Date().toISOString().split('T')[0];
  eventEndDate.value = '';
  eventDays.value = '1';
  eventHours.value = '';
  
  // Show/hide days/hours inputs based on type
  const type = eventType.value;
  daysGroup.classList.toggle('hide', type === 'Horas Extra');
  hoursGroup.classList.toggle('hide', type !== 'Horas Extra');
}

// Open modal
function openModal(title = 'Nueva Novedad Laboral') {
  const modalTitle = eventModal.querySelector('.modal-header h3');
  modalTitle.textContent = title;
  eventModal.style.display = 'flex';
  resetForm();
}

// Close modal
function closeModal() {
  eventModal.style.display = 'none';
}

// Save event
function saveEvent() {
  // Get form values
  const employeeId = eventEmployee.value;
  const type = eventType.value;
  const startDate = eventStartDate.value;
  const endDate = eventEndDate.value || null;
  const days = type === 'Horas Extra' ? null : parseInt(eventDays.value);
  const hours = type === 'Horas Extra' ? parseFloat(eventHours.value) : null;
  const description = eventDescription.value;
  const documentRef = eventDocument.value;
  
  // Validate required fields
  if (!employeeId || !type || !startDate || (type === 'Horas Extra' && !hours) || (type !== 'Horas Extra' && !days)) {
    showToast('Por favor complete todos los campos requeridos', 3000);
    return;
  }
  
  // Create event object
  const event = {
    id: `E${Date.now()}`,
    employeeId,
    type,
    startDate,
    endDate,
    days,
    hours,
    description,
    documentRef,
    status: 'Pendiente',
    createdAt: new Date().toISOString()
  };
  
  // Save event
  window.Storage.addWorkEvent(event);
  
  // Close modal and refresh table
  closeModal();
  loadEvents();
  
  showToast('Novedad guardada exitosamente');
}

// View event
function viewEvent(event) {
  // TODO: Implement view event details
  console.log('View event:', event);
}

// Edit event
function editEvent(event) {
  // TODO: Implement edit event
  console.log('Edit event:', event);
}

// Approve event
function approveEvent(event) {
  const updatedEvent = {
    ...event,
    status: 'Aprobado',
    approvedAt: new Date().toISOString(),
    approvedBy: currentUser.name
  };
  
  window.Storage.updateWorkEvent(updatedEvent);
  loadEvents();
  showToast('Novedad aprobada exitosamente');
}

// Reject event
function rejectEvent(event) {
  const updatedEvent = {
    ...event,
    status: 'Rechazado',
    rejectedAt: new Date().toISOString(),
    rejectedBy: currentUser.name
  };
  
  window.Storage.updateWorkEvent(updatedEvent);
  loadEvents();
  showToast('Novedad rechazada');
}

// Event handlers
document.addEventListener('DOMContentLoaded', function() {
  // Load initial data
  loadEmployees();
  loadEvents();
  
  // Handle new event button
  newEventButton.addEventListener('click', () => openModal());
  
  // Handle modal close
  closeModalButton.addEventListener('click', closeModal);
  cancelEventButton.addEventListener('click', closeModal);
  
  // Handle save event
  saveEventButton.addEventListener('click', saveEvent);
  
  // Handle filters change
  employeeFilter.addEventListener('change', loadEvents);
  typeFilter.addEventListener('change', loadEvents);
  statusFilter.addEventListener('change', loadEvents);
  
  // Handle event type change
  eventType.addEventListener('change', function() {
    const type = this.value;
    daysGroup.classList.toggle('hide', type === 'Horas Extra');
    hoursGroup.classList.toggle('hide', type !== 'Horas Extra');
  });
  
  // Handle start date change
  eventStartDate.addEventListener('change', function() {
    const startDate = this.value;
    eventEndDate.min = startDate;
    
    if (eventEndDate.value) {
      eventDays.value = calculateDays(startDate, eventEndDate.value);
    }
  });
  
  // Handle end date change
  eventEndDate.addEventListener('change', function() {
    if (this.value) {
      eventDays.value = calculateDays(eventStartDate.value, this.value);
    }
  });
  
  // Close modal when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target === eventModal) {
      closeModal();
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