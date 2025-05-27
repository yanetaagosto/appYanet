/**
 * Storage Module for Sistema de Nómina Parroquia San Francisco de Asís
 * Handles data persistence using localStorage
 */

// Define storage namespace
window.Storage = (function() {
  // Constants for storage keys
  const KEYS = {
    EMPLOYEES: 'nomina_employees',
    WORK_EVENTS: 'nomina_work_events',
    PAYROLL: 'nomina_payroll',
    PAYROLL_ITEMS: 'nomina_payroll_items',
    PAYROLL_EVENTS: 'nomina_payroll_events',
    SETTINGS: 'nomina_settings',
    BACKUP: 'nomina_backup_'
  };
  
  // Initialize storage with sample data if empty
  function initializeStorage() {
    // Sample employees data
    if (!localStorage.getItem(KEYS.EMPLOYEES)) {
      const sampleEmployees = [
        {
          id: "1001",
          firstName: "Juan",
          lastName: "Pérez",
          document: "1234567890",
          position: "Asistente Administrativo",
          department: "Administración",
          joinDate: "2020-01-15",
          salary: 1200000,
          bankAccount: "123456789",
          bankName: "Bancolombia",
          accountType: "Ahorros",
          email: "juan.perez@ejemplo.com",
          phone: "3001234567"
        },
        {
          id: "1002",
          firstName: "María",
          lastName: "Rodríguez",
          document: "0987654321",
          position: "Contadora",
          department: "Finanzas",
          joinDate: "2019-03-10",
          salary: 1800000,
          bankAccount: "987654321",
          bankName: "Banco de Bogotá",
          accountType: "Corriente",
          email: "maria.rodriguez@ejemplo.com",
          phone: "3109876543"
        }
      ];
      localStorage.setItem(KEYS.EMPLOYEES, JSON.stringify(sampleEmployees));
    }
    
    // Sample work events data
    if (!localStorage.getItem(KEYS.WORK_EVENTS)) {
      const sampleWorkEvents = [
        {
          id: "E001",
          employeeId: "1001",
          type: "Incapacidad",
          startDate: "2023-07-10",
          endDate: "2023-07-15",
          days: 5,
          description: "Incapacidad médica por gripe",
          status: "Aprobado",
          documentRef: "INC-2023-001"
        },
        {
          id: "E002",
          employeeId: "1002",
          type: "Horas Extra",
          date: "2023-07-20",
          hours: 3,
          description: "Trabajo adicional para cierre contable",
          status: "Aprobado",
          approvedBy: "Admin"
        }
      ];
      localStorage.setItem(KEYS.WORK_EVENTS, JSON.stringify(sampleWorkEvents));
    }
    
    // Sample payroll data
    if (!localStorage.getItem(KEYS.PAYROLL)) {
      const samplePayroll = [
        {
          id: "P2023-08",
          period: "Agosto 2023",
          startDate: "2023-08-01",
          endDate: "2023-08-31",
          status: "Pendiente",
          createdAt: "2023-08-28T10:15:30",
          totalGross: 3000000,
          totalDeductions: 750000,
          totalNet: 2250000
        },
        {
          id: "P2023-07",
          period: "Julio 2023",
          startDate: "2023-07-01",
          endDate: "2023-07-31",
          status: "Aprobado",
          createdAt: "2023-07-28T10:15:30",
          approvedAt: "2023-07-30T15:45:20",
          approvedBy: "Administrador",
          totalGross: 3000000,
          totalDeductions: 750000,
          totalNet: 2250000
        }
      ];
      localStorage.setItem(KEYS.PAYROLL, JSON.stringify(samplePayroll));
    }
    
    // Sample payroll items data
    if (!localStorage.getItem(KEYS.PAYROLL_ITEMS)) {
      const samplePayrollItems = [
        {
          id: "PI00001",
          payrollId: "P2023-08",
          employeeId: "1001",
          baseSalary: 1200000,
          daysWorked: 30,
          grossSalary: 1200000,
          overtime: 0,
          bonuses: 0,
          healthDeduction: 48000,
          pensionDeduction: 48000,
          otherDeductions: 0,
          netSalary: 1104000,
          notes: ""
        },
        {
          id: "PI00002",
          payrollId: "P2023-08",
          employeeId: "1002",
          baseSalary: 1800000,
          daysWorked: 30,
          grossSalary: 1800000,
          overtime: 50000,
          bonuses: 0,
          healthDeduction: 72000,
          pensionDeduction: 72000,
          otherDeductions: 0,
          netSalary: 1706000,
          notes: "Incluye 3 horas extra"
        }
      ];
      localStorage.setItem(KEYS.PAYROLL_ITEMS, JSON.stringify(samplePayrollItems));
    }
    
    // Sample settings
    if (!localStorage.getItem(KEYS.SETTINGS)) {
      const sampleSettings = {
        organizationName: "Parroquia San Francisco de Asís",
        nit: "123456789-0",
        address: "Calle Principal #123, Quibdó, Chocó",
        phone: "(4) 123-4567",
        email: "parroquia.sanfrancisco@ejemplo.com",
        healthContributionRate: 4,
        pensionContributionRate: 4,
        overtimeRate: 1.25,
        holidayOvertimeRate: 1.75,
        nightOvertimeRate: 1.35,
        lastBackupDate: null
      };
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(sampleSettings));
    }
  }
  
  // Generic functions to work with localStorage
  function getItem(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error retrieving data for key ${key}:`, error);
      return null;
    }
  }
  
  function setItem(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Error storing data for key ${key}:`, error);
      return false;
    }
  }
  
  // Employee specific functions
  function getEmployees() {
    return getItem(KEYS.EMPLOYEES) || [];
  }
  
  function getEmployeeById(id) {
    const employees = getEmployees();
    return employees.find(emp => emp.id === id) || null;
  }
  
  function saveEmployees(employees) {
    return setItem(KEYS.EMPLOYEES, employees);
  }
  
  function addEmployee(employee) {
    const employees = getEmployees();
    employees.push(employee);
    return saveEmployees(employees);
  }
  
  function updateEmployee(updatedEmployee) {
    const employees = getEmployees();
    const index = employees.findIndex(emp => emp.id === updatedEmployee.id);
    
    if (index !== -1) {
      employees[index] = updatedEmployee;
      return saveEmployees(employees);
    }
    return false;
  }
  
  function deleteEmployee(id) {
    const employees = getEmployees();
    const filteredEmployees = employees.filter(emp => emp.id !== id);
    
    if (filteredEmployees.length < employees.length) {
      return saveEmployees(filteredEmployees);
    }
    return false;
  }
  
  // Work events specific functions
  function getWorkEvents() {
    return getItem(KEYS.WORK_EVENTS) || [];
  }
  
  function getWorkEventsByEmployeeId(employeeId) {
    const events = getWorkEvents();
    return events.filter(event => event.employeeId === employeeId);
  }
  
  function getWorkEventsByDate(startDate, endDate) {
    const events = getWorkEvents();
    return events.filter(event => {
      const eventDate = event.date || event.startDate;
      return eventDate >= startDate && (event.endDate || eventDate) <= endDate;
    });
  }
  
  function saveWorkEvents(events) {
    return setItem(KEYS.WORK_EVENTS, events);
  }
  
  function addWorkEvent(event) {
    const events = getWorkEvents();
    events.push(event);
    return saveWorkEvents(events);
  }
  
  function updateWorkEvent(updatedEvent) {
    const events = getWorkEvents();
    const index = events.findIndex(e => e.id === updatedEvent.id);
    
    if (index !== -1) {
      events[index] = updatedEvent;
      return saveWorkEvents(events);
    }
    return false;
  }
  
  function deleteWorkEvent(id) {
    const events = getWorkEvents();
    const filteredEvents = events.filter(e => e.id !== id);
    
    if (filteredEvents.length < events.length) {
      return saveWorkEvents(filteredEvents);
    }
    return false;
  }
  
  // Payroll specific functions
  function getPayrolls() {
    return getItem(KEYS.PAYROLL) || [];
  }
  
  function getPayrollById(id) {
    const payrolls = getPayrolls();
    return payrolls.find(p => p.id === id) || null;
  }
  
  function savePayrolls(payrolls) {
    return setItem(KEYS.PAYROLL, payrolls);
  }
  
  function addPayroll(payroll) {
    const payrolls = getPayrolls();
    payrolls.push(payroll);
    return savePayrolls(payrolls);
  }
  
  function updatePayroll(updatedPayroll) {
    const payrolls = getPayrolls();
    const index = payrolls.findIndex(p => p.id === updatedPayroll.id);
    
    if (index !== -1) {
      payrolls[index] = updatedPayroll;
      return savePayrolls(payrolls);
    }
    return false;
  }
  
  function deletePayroll(id) {
    const payrolls = getPayrolls();
    const filteredPayrolls = payrolls.filter(p => p.id !== id);
    
    if (filteredPayrolls.length < payrolls.length) {
      return savePayrolls(filteredPayrolls);
    }
    return false;
  }
  
  // Payroll items specific functions
  function getPayrollItems() {
    return getItem(KEYS.PAYROLL_ITEMS) || [];
  }
  
  function getPayrollItemsByPayrollId(payrollId) {
    const items = getPayrollItems();
    return items.filter(item => item.payrollId === payrollId);
  }
  
  function getPayrollItemsByEmployeeId(employeeId) {
    const items = getPayrollItems();
    return items.filter(item => item.employeeId === employeeId);
  }
  
  function savePayrollItems(items) {
    return setItem(KEYS.PAYROLL_ITEMS, items);
  }
  
  function addPayrollItem(item) {
    const items = getPayrollItems();
    items.push(item);
    return savePayrollItems(items);
  }
  
  function updatePayrollItem(updatedItem) {
    const items = getPayrollItems();
    const index = items.findIndex(i => i.id === updatedItem.id);
    
    if (index !== -1) {
      items[index] = updatedItem;
      return savePayrollItems(items);
    }
    return false;
  }
  
  function deletePayrollItem(id) {
    const items = getPayrollItems();
    const filteredItems = items.filter(i => i.id !== id);
    
    if (filteredItems.length < items.length) {
      return savePayrollItems(filteredItems);
    }
    return false;
  }
  
  // Settings specific functions
  function getSettings() {
    return getItem(KEYS.SETTINGS) || {};
  }
  
  function updateSettings(settings) {
    return setItem(KEYS.SETTINGS, settings);
  }
  
  // Backup and restore functions
  function createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupData = {
      timestamp: timestamp,
      employees: getEmployees(),
      workEvents: getWorkEvents(),
      payrolls: getPayrolls(),
      payrollItems: getPayrollItems(),
      settings: getSettings()
    };
    
    try {
      // Create backup in localStorage
      const backupKey = `${KEYS.BACKUP}${timestamp}`;
      localStorage.setItem(backupKey, JSON.stringify(backupData));
      
      // Update settings with last backup date
      const settings = getSettings();
      settings.lastBackupDate = timestamp;
      updateSettings(settings);
      
      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nomina_backup_${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return {
        success: true,
        message: 'Backup creado exitosamente',
        timestamp: timestamp
      };
    } catch (error) {
      console.error('Error creating backup:', error);
      return {
        success: false,
        message: 'Error al crear el backup',
        error: error.message
      };
    }
  }
  
  function restoreBackup(backupData) {
    try {
      // Validate backup data
      if (!backupData.employees || !backupData.workEvents || 
          !backupData.payrolls || !backupData.payrollItems || 
          !backupData.settings) {
        throw new Error('Datos de backup inválidos o incompletos');
      }
      
      // Restore all data
      setItem(KEYS.EMPLOYEES, backupData.employees);
      setItem(KEYS.WORK_EVENTS, backupData.workEvents);
      setItem(KEYS.PAYROLL, backupData.payrolls);
      setItem(KEYS.PAYROLL_ITEMS, backupData.payrollItems);
      setItem(KEYS.SETTINGS, backupData.settings);
      
      return {
        success: true,
        message: 'Backup restaurado exitosamente',
        timestamp: backupData.timestamp
      };
    } catch (error) {
      console.error('Error restoring backup:', error);
      return {
        success: false,
        message: 'Error al restaurar el backup',
        error: error.message
      };
    }
  }
  
  // Load backup from file
  function loadBackupFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = function(event) {
        try {
          const backupData = JSON.parse(event.target.result);
          resolve(backupData);
        } catch (error) {
          reject(new Error('El archivo no contiene un backup válido'));
        }
      };
      
      reader.onerror = function() {
        reject(new Error('Error al leer el archivo'));
      };
      
      reader.readAsText(file);
    });
  }
  
  // Initialize on load
  initializeStorage();
  
  // Public API
  return {
    // Employee functions
    getEmployees,
    getEmployeeById,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    
    // Work events functions
    getWorkEvents,
    getWorkEventsByEmployeeId,
    getWorkEventsByDate,
    addWorkEvent,
    updateWorkEvent,
    deleteWorkEvent,
    
    // Payroll functions
    getPayrolls,
    getPayrollById,
    addPayroll,
    updatePayroll,
    deletePayroll,
    
    // Payroll items functions
    getPayrollItems,
    getPayrollItemsByPayrollId,
    getPayrollItemsByEmployeeId,
    addPayrollItem,
    updatePayrollItem,
    deletePayrollItem,
    
    // Settings functions
    getSettings,
    updateSettings,
    
    // Backup functions
    createBackup,
    restoreBackup,
    loadBackupFromFile,
    
    // Constants
    KEYS
  };
})();