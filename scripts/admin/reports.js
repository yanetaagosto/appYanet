/**
 * Reports Module for Sistema de Nómina - Parroquia San Francisco de Asís
 * Handles generation and display of financial reports
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

// Report specific elements
const reportTypeSelect = document.getElementById('report-type');
const employeeSelect = document.getElementById('employee');
const periodSelect = document.getElementById('period');
const departmentSelect = document.getElementById('department');
const dateStartInput = document.getElementById('date-start');
const dateEndInput = document.getElementById('date-end');
const generateReportButton = document.getElementById('generate-report');
const exportExcelButton = document.getElementById('export-excel');
const exportPdfButton = document.getElementById('export-pdf');

// Summary elements
const totalEmployeesElement = document.getElementById('total-employees');
const totalSalariesElement = document.getElementById('total-salaries');
const totalDeductionsElement = document.getElementById('total-deductions');
const totalNetElement = document.getElementById('total-net');

// Table element
const reportTable = document.getElementById('report-table');

// Chart elements
const departmentChart = document.getElementById('department-chart');
const salaryTrendChart = document.getElementById('salary-trend-chart');

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
  // Load employees
  const employees = window.Storage.getEmployees();
  employees.sort((a, b) => {
    const nameA = `${a.firstName} ${a.lastName}`;
    const nameB = `${b.firstName} ${b.lastName}`;
    return nameA.localeCompare(nameB);
  });

  employeeSelect.innerHTML = '<option value="">Todos los empleados</option>';
  employees.forEach(employee => {
    const option = document.createElement('option');
    option.value = employee.id;
    option.textContent = `${employee.firstName} ${employee.lastName}`;
    employeeSelect.appendChild(option);
  });

  // Load periods
  const payrolls = window.Storage.getPayrolls();
  const periods = [...new Set(payrolls.map(p => p.period))];
  periods.sort((a, b) => {
    const dateA = payrolls.find(p => p.period === a).endDate;
    const dateB = payrolls.find(p => p.period === b).endDate;
    return new Date(dateB) - new Date(dateA);
  });

  periodSelect.innerHTML = '<option value="">Todos los períodos</option>';
  periods.forEach(period => {
    const option = document.createElement('option');
    option.value = period;
    option.textContent = period;
    periodSelect.appendChild(option);
  });

  // Load departments
  const departments = [...new Set(employees.map(e => e.department))];
  departments.sort();

  departmentSelect.innerHTML = '<option value="">Todos los departamentos</option>';
  departments.forEach(department => {
    const option = document.createElement('option');
    option.value = department;
    option.textContent = department;
    departmentSelect.appendChild(option);
  });

  // Set default dates
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  dateStartInput.value = firstDay.toISOString().split('T')[0];
  dateEndInput.value = lastDay.toISOString().split('T')[0];
}

// Generate report
function generateReport() {
  const reportType = reportTypeSelect.value;
  const selectedEmployee = employeeSelect.value;
  const selectedPeriod = periodSelect.value;
  const selectedDepartment = departmentSelect.value;
  const startDate = dateStartInput.value;
  const endDate = dateEndInput.value;

  // Show loading
  loadingOverlay.classList.remove('hide');

  try {
    // Get data
    let payrollItems = window.Storage.getPayrollItems();
    const payrolls = window.Storage.getPayrolls();
    const employees = window.Storage.getEmployees();

    // Filter by date range
    payrollItems = payrollItems.filter(item => {
      const payroll = payrolls.find(p => p.id === item.payrollId);
      if (!payroll) return false;
      return payroll.endDate >= startDate && payroll.startDate <= endDate;
    });

    // Apply filters
    if (selectedEmployee) {
      payrollItems = payrollItems.filter(item => item.employeeId === selectedEmployee);
    }

    if (selectedPeriod) {
      payrollItems = payrollItems.filter(item => {
        const payroll = payrolls.find(p => p.id === item.payrollId);
        return payroll && payroll.period === selectedPeriod;
      });
    }

    if (selectedDepartment) {
      payrollItems = payrollItems.filter(item => {
        const employee = employees.find(e => e.id === item.employeeId);
        return employee && employee.department === selectedDepartment;
      });
    }

    // Calculate totals
    const uniqueEmployees = [...new Set(payrollItems.map(item => item.employeeId))];
    const totalSalaries = payrollItems.reduce((sum, item) => sum + item.grossSalary, 0);
    const totalDeductions = payrollItems.reduce((sum, item) => 
      sum + item.healthDeduction + item.pensionDeduction + (item.otherDeductions || 0), 0);
    const totalNet = payrollItems.reduce((sum, item) => sum + item.netSalary, 0);

    // Update summary
    totalEmployeesElement.textContent = uniqueEmployees.length;
    totalSalariesElement.textContent = formatCurrency(totalSalaries);
    totalDeductionsElement.textContent = formatCurrency(totalDeductions);
    totalNetElement.textContent = formatCurrency(totalNet);

    // Update table
    const tbody = reportTable.querySelector('tbody');
    tbody.innerHTML = '';

    payrollItems.forEach(item => {
      const employee = employees.find(e => e.id === item.employeeId);
      const payroll = payrolls.find(p => p.id === item.payrollId);
      
      if (!employee || !payroll) return;

      const row = document.createElement('tr');
      
      const employeeCell = document.createElement('td');
      employeeCell.textContent = `${employee.firstName} ${employee.lastName}`;
      
      const departmentCell = document.createElement('td');
      departmentCell.textContent = employee.department;
      
      const periodCell = document.createElement('td');
      periodCell.textContent = payroll.period;
      
      const baseSalaryCell = document.createElement('td');
      baseSalaryCell.textContent = formatCurrency(employee.salary);
      
      const extrasCell = document.createElement('td');
      const extras = (item.overtime || 0) + (item.bonuses || 0);
      extrasCell.textContent = formatCurrency(extras);
      
      const deductionsCell = document.createElement('td');
      const deductions = item.healthDeduction + item.pensionDeduction + (item.otherDeductions || 0);
      deductionsCell.textContent = formatCurrency(deductions);
      
      const netCell = document.createElement('td');
      netCell.textContent = formatCurrency(item.netSalary);

      row.appendChild(employeeCell);
      row.appendChild(departmentCell);
      row.appendChild(periodCell);
      row.appendChild(baseSalaryCell);
      row.appendChild(extrasCell);
      row.appendChild(deductionsCell);
      row.appendChild(netCell);

      tbody.appendChild(row);
    });

    // Update charts
    updateCharts(payrollItems, employees, payrolls);

  } catch (error) {
    console.error('Error generating report:', error);
    showToast('Error al generar el reporte');
  } finally {
    loadingOverlay.classList.add('hide');
  }
}

// Update charts
function updateCharts(payrollItems, employees, payrolls) {
  // Department distribution chart
  const departmentData = {};
  payrollItems.forEach(item => {
    const employee = employees.find(e => e.id === item.employeeId);
    if (!employee) return;

    if (!departmentData[employee.department]) {
      departmentData[employee.department] = {
        count: 0,
        total: 0
      };
    }

    departmentData[employee.department].count++;
    departmentData[employee.department].total += item.netSalary;
  });

  const departmentCtx = departmentChart.getContext('2d');
  if (window.departmentChartInstance) {
    window.departmentChartInstance.destroy();
  }

  window.departmentChartInstance = new Chart(departmentCtx, {
    type: 'pie',
    data: {
      labels: Object.keys(departmentData),
      datasets: [{
        data: Object.values(departmentData).map(d => d.total),
        backgroundColor: [
          '#1a3a6c',
          '#2d5699',
          '#0d2348',
          '#c9a227',
          '#e6be45'
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'right'
        },
        title: {
          display: true,
          text: 'Distribución por Departamento'
        }
      }
    }
  });

  // Salary trend chart
  const periodData = {};
  payrollItems.forEach(item => {
    const payroll = payrolls.find(p => p.id === item.payrollId);
    if (!payroll) return;

    if (!periodData[payroll.period]) {
      periodData[payroll.period] = {
        gross: 0,
        net: 0
      };
    }

    periodData[payroll.period].gross += item.grossSalary;
    periodData[payroll.period].net += item.netSalary;
  });

  const periods = Object.keys(periodData).sort((a, b) => {
    const dateA = payrolls.find(p => p.period === a).startDate;
    const dateB = payrolls.find(p => p.period === b).startDate;
    return new Date(dateA) - new Date(dateB);
  });

  const salaryCtx = salaryTrendChart.getContext('2d');
  if (window.salaryChartInstance) {
    window.salaryChartInstance.destroy();
  }

  window.salaryChartInstance = new Chart(salaryCtx, {
    type: 'line',
    data: {
      labels: periods,
      datasets: [
        {
          label: 'Salario Bruto',
          data: periods.map(p => periodData[p].gross),
          borderColor: '#1a3a6c',
          tension: 0.1
        },
        {
          label: 'Salario Neto',
          data: periods.map(p => periodData[p].net),
          borderColor: '#c9a227',
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top'
        },
        title: {
          display: true,
          text: 'Tendencia Salarial'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => formatCurrency(value)
          }
        }
      }
    }
  });
}

// Export to Excel
function exportToExcel() {
  // Create Excel-like CSV content
  const rows = [];
  
  // Add headers
  rows.push([
    'Empleado',
    'Departamento',
    'Período',
    'Salario Base',
    'Extras',
    'Deducciones',
    'Neto'
  ]);

  // Add data rows
  const tbody = reportTable.querySelector('tbody');
  tbody.querySelectorAll('tr').forEach(row => {
    const cells = row.querySelectorAll('td');
    rows.push([...cells].map(cell => cell.textContent));
  });

  // Convert to CSV
  const csv = rows.map(row => row.join(',')).join('\n');

  // Create download link
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'reporte_nomina.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export to PDF
function exportToPDF() {
  // Create PDF content
  const content = document.createElement('div');
  content.innerHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
      <h1>Reporte de Nómina</h1>
      <p>Parroquia San Francisco de Asís</p>
      <p>Fecha: ${new Date().toLocaleDateString()}</p>
    </div>
    
    <div style="margin-bottom: 20px;">
      <h2>Resumen</h2>
      <p>Total Empleados: ${totalEmployeesElement.textContent}</p>
      <p>Total Salarios: ${totalSalariesElement.textContent}</p>
      <p>Total Deducciones: ${totalDeductionsElement.textContent}</p>
      <p>Total Neto: ${totalNetElement.textContent}</p>
    </div>
    
    ${reportTable.outerHTML}
  `;

  // Use html2pdf to generate PDF
  const opt = {
    margin: 1,
    filename: 'reporte_nomina.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'cm', format: 'a4', orientation: 'landscape' }
  };

  html2pdf().from(content).set(opt).save();
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
  generateReport();

  // Handle report type change
  reportTypeSelect.addEventListener('change', function() {
    const type = this.value;
    
    // Show/hide relevant filters
    document.getElementById('employee-filter').style.display = 
      type === 'employee' ? 'block' : 'none';
    document.getElementById('period-filter').style.display = 
      type === 'period' ? 'block' : 'none';
    document.getElementById('department-filter').style.display = 
      type === 'department' ? 'block' : 'none';
  });

  // Handle generate report
  generateReportButton.addEventListener('click', generateReport);

  // Handle exports
  exportExcelButton.addEventListener('click', exportToExcel);
  exportPdfButton.addEventListener('click', exportToPDF);

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