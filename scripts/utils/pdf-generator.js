/**
 * PDF Generator Module for Sistema de Nómina - Parroquia San Francisco de Asís
 * Handles PDF generation for payroll receipts and reports
 * Uses jsPDF library for PDF generation
 */

// Define PDF Generator namespace
window.PDFGenerator = (function() {
  /**
   * Generate a payroll receipt PDF for an employee
   * @param {Object} payrollItem - The payroll item data
   * @param {Object} employee - The employee data
   * @param {Object} payroll - The payroll data
   * @returns {Blob} - PDF file as a Blob
   */
  function generatePayrollReceipt(payrollItem, employee, payroll) {
    // Create a container for the PDF content
    const container = document.createElement('div');
    container.style.display = 'none';
    document.body.appendChild(container);
    
    // Format the HTML content for the PDF
    container.innerHTML = `
      <div id="pdf-content" style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1a3a6c; margin-bottom: 5px;">Parroquia San Francisco de Asís</h1>
          <h2 style="color: #6c757d; font-size: 18px; margin-top: 0;">Comprobante de Pago</h2>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div>
            <p><strong>Período:</strong> ${payroll.period}</p>
            <p><strong>Fecha Emisión:</strong> ${formatDate(new Date().toISOString())}</p>
          </div>
          <div>
            <p><strong>Referencia:</strong> ${payrollItem.id}</p>
            <p><strong>Estado:</strong> Pagado</p>
          </div>
        </div>
        
        <div style="border: 1px solid #dee2e6; border-radius: 4px; padding: 15px; margin-bottom: 20px;">
          <h3 style="color: #1a3a6c; margin-top: 0;">Información del Empleado</h3>
          <div style="display: flex; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 200px;">
              <p><strong>Nombre:</strong> ${employee.firstName} ${employee.lastName}</p>
              <p><strong>Documento:</strong> ${employee.document}</p>
              <p><strong>Cargo:</strong> ${employee.position}</p>
            </div>
            <div style="flex: 1; min-width: 200px;">
              <p><strong>Departamento:</strong> ${employee.department}</p>
              <p><strong>Fecha Ingreso:</strong> ${formatDate(employee.joinDate)}</p>
              <p><strong>Salario Base:</strong> ${formatCurrency(employee.salary)}</p>
            </div>
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #1a3a6c;">Detalle de Pago</h3>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Concepto</th>
                <th style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #dee2e6; padding: 8px;">Salario Base</td>
                <td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${formatCurrency(employee.salary)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #dee2e6; padding: 8px;">Días Laborados</td>
                <td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${payrollItem.daysWorked}</td>
              </tr>
              ${payrollItem.overtime > 0 ? `
              <tr>
                <td style="border: 1px solid #dee2e6; padding: 8px;">Horas Extra</td>
                <td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${formatCurrency(payrollItem.overtime)}</td>
              </tr>
              ` : ''}
              ${payrollItem.bonuses > 0 ? `
              <tr>
                <td style="border: 1px solid #dee2e6; padding: 8px;">Bonificaciones</td>
                <td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${formatCurrency(payrollItem.bonuses)}</td>
              </tr>
              ` : ''}
              <tr style="background-color: #f8f9fa; font-weight: bold;">
                <td style="border: 1px solid #dee2e6; padding: 8px;">Total Devengado</td>
                <td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${formatCurrency(payrollItem.grossSalary)}</td>
              </tr>
            </tbody>
          </table>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Deducciones</th>
                <th style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #dee2e6; padding: 8px;">Aporte Salud</td>
                <td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${formatCurrency(payrollItem.healthDeduction)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #dee2e6; padding: 8px;">Aporte Pensión</td>
                <td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${formatCurrency(payrollItem.pensionDeduction)}</td>
              </tr>
              ${payrollItem.otherDeductions > 0 ? `
              <tr>
                <td style="border: 1px solid #dee2e6; padding: 8px;">Otras Deducciones</td>
                <td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${formatCurrency(payrollItem.otherDeductions)}</td>
              </tr>
              ` : ''}
              <tr style="background-color: #f8f9fa; font-weight: bold;">
                <td style="border: 1px solid #dee2e6; padding: 8px;">Total Deducciones</td>
                <td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${formatCurrency(payrollItem.healthDeduction + payrollItem.pensionDeduction + (payrollItem.otherDeductions || 0))}</td>
              </tr>
            </tbody>
          </table>
          
          <div style="border: 2px solid #1a3a6c; border-radius: 4px; padding: 15px; background-color: #f8f9fa;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h3 style="color: #1a3a6c; margin: 0;">Total a Pagar:</h3>
              <div style="font-size: 24px; font-weight: bold; color: #1a3a6c;">${formatCurrency(payrollItem.netSalary)}</div>
            </div>
          </div>
        </div>
        
        ${payrollItem.notes ? `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #1a3a6c;">Observaciones</h3>
          <p>${payrollItem.notes}</p>
        </div>
        ` : ''}
        
        <div style="margin-top: 40px; text-align: center; color: #6c757d; font-size: 12px;">
          <p>Este comprobante de pago ha sido generado automáticamente por el Sistema de Nómina.</p>
          <p>Parroquia San Francisco de Asís - NIT: 123456789-0</p>
          <p>Fecha de emisión: ${formatDate(new Date().toISOString())}</p>
        </div>
      </div>
    `;
    
    // Use html2pdf library to convert the HTML content to PDF
    const pdfOptions = {
      margin: 10,
      filename: `comprobante_${payroll.period.replace(/\s/g, '_')}_${employee.lastName}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Return a promise that resolves with the PDF Blob
    return html2pdf().from(container).set(pdfOptions).outputPdf('blob').then(pdf => {
      // Clean up the container
      document.body.removeChild(container);
      return pdf;
    });
  }
  
  /**
   * Generate a payroll summary report PDF
   * @param {Object} payroll - The payroll data
   * @param {Array} payrollItems - The payroll items
   * @param {Array} employees - The employees data
   * @returns {Blob} - PDF file as a Blob
   */
  function generatePayrollSummaryReport(payroll, payrollItems, employees) {
    // Create a container for the PDF content
    const container = document.createElement('div');
    container.style.display = 'none';
    document.body.appendChild(container);
    
    // Calculate totals
    const totalGrossSalary = payrollItems.reduce((sum, item) => sum + item.grossSalary, 0);
    const totalHealthDeduction = payrollItems.reduce((sum, item) => sum + item.healthDeduction, 0);
    const totalPensionDeduction = payrollItems.reduce((sum, item) => sum + item.pensionDeduction, 0);
    const totalOtherDeductions = payrollItems.reduce((sum, item) => sum + (item.otherDeductions || 0), 0);
    const totalNetSalary = payrollItems.reduce((sum, item) => sum + item.netSalary, 0);
    
    // Build the table rows for payroll items
    let payrollItemsRows = '';
    payrollItems.forEach(item => {
      const employee = employees.find(emp => emp.id === item.employeeId);
      if (employee) {
        payrollItemsRows += `
          <tr>
            <td style="border: 1px solid #dee2e6; padding: 8px;">${employee.firstName} ${employee.lastName}</td>
            <td style="border: 1px solid #dee2e6; padding: 8px;">${employee.position}</td>
            <td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${formatCurrency(item.grossSalary)}</td>
            <td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${formatCurrency(item.healthDeduction + item.pensionDeduction + (item.otherDeductions || 0))}</td>
            <td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${formatCurrency(item.netSalary)}</td>
          </tr>
        `;
      }
    });
    
    // Format the HTML content for the PDF
    container.innerHTML = `
      <div id="pdf-content" style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1a3a6c; margin-bottom: 5px;">Parroquia San Francisco de Asís</h1>
          <h2 style="color: #6c757d; font-size: 18px; margin-top: 0;">Reporte de Nómina</h2>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div>
            <p><strong>Período:</strong> ${payroll.period}</p>
            <p><strong>Fecha Inicial:</strong> ${formatDate(payroll.startDate)}</p>
            <p><strong>Fecha Final:</strong> ${formatDate(payroll.endDate)}</p>
          </div>
          <div>
            <p><strong>Referencia:</strong> ${payroll.id}</p>
            <p><strong>Estado:</strong> ${payroll.status}</p>
            <p><strong>Fecha Generación:</strong> ${formatDate(new Date().toISOString())}</p>
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #1a3a6c;">Resumen General</h3>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Concepto</th>
                <th style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #dee2e6; padding: 8px;">Total Salarios Brutos</td>
                <td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${formatCurrency(totalGrossSalary)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #dee2e6; padding: 8px;">Total Aportes Salud</td>
                <td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${formatCurrency(totalHealthDeduction)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #dee2e6; padding: 8px;">Total Aportes Pensión</td>
                <td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${formatCurrency(totalPensionDeduction)}</td>
              </tr>
              ${totalOtherDeductions > 0 ? `
              <tr>
                <td style="border: 1px solid #dee2e6; padding: 8px;">Otras Deducciones</td>
                <td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${formatCurrency(totalOtherDeductions)}</td>
              </tr>
              ` : ''}
              <tr style="background-color: #f8f9fa; font-weight: bold;">
                <td style="border: 1px solid #dee2e6; padding: 8px;">Total Pagado</td>
                <td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${formatCurrency(totalNetSalary)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #1a3a6c;">Detalle por Empleado</h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Empleado</th>
                <th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Cargo</th>
                <th style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">Bruto</th>
                <th style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">Deducciones</th>
                <th style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">Neto</th>
              </tr>
            </thead>
            <tbody>
              ${payrollItemsRows}
            </tbody>
          </table>
        </div>
        
        <div style="margin-top: 40px; text-align: center; color: #6c757d; font-size: 12px;">
          <p>Este reporte ha sido generado automáticamente por el Sistema de Nómina.</p>
          <p>Parroquia San Francisco de Asís - NIT: 123456789-0</p>
          <p>Fecha de emisión: ${formatDate(new Date().toISOString())}</p>
        </div>
      </div>
    `;
    
    // Use html2pdf library to convert the HTML content to PDF
    const pdfOptions = {
      margin: 10,
      filename: `nomina_${payroll.period.replace(/\s/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Return a promise that resolves with the PDF Blob
    return html2pdf().from(container).set(pdfOptions).outputPdf('blob').then(pdf => {
      // Clean up the container
      document.body.removeChild(container);
      return pdf;
    });
  }
  
  /**
   * Format currency function
   * @param {number} amount - The amount to format
   * @returns {string} - Formatted currency string
   */
  function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  }
  
  /**
   * Format date function
   * @param {string} dateString - The date string to format
   * @returns {string} - Formatted date string
   */
  function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-CO', options);
  }
  
  // Public API
  return {
    generatePayrollReceipt,
    generatePayrollSummaryReport
  };
})();

// Add html2pdf library (this would normally be included via a CDN or npm package)
// For the prototype, we'll simulate its functionality
if (typeof html2pdf === 'undefined') {
  window.html2pdf = function() {
    return {
      from: function(element) {
        return this;
      },
      set: function(options) {
        this.options = options;
        return this;
      },
      outputPdf: function(type) {
        // In a real implementation, this would convert the HTML to a PDF
        // For the prototype, we'll simulate it by returning a promise that resolves with a Blob
        return new Promise(resolve => {
          // Create a sample PDF Blob (in reality, this would be the actual PDF)
          const blob = new Blob(['PDF content would go here'], { type: 'application/pdf' });
          resolve(blob);
        });
      }
    };
  };
}

/*function downloadReceipt() {
  const element = document.getElementById('receipt-preview');
  const employeeName = document.getElementById('employee-name').innerText || 'comprobante';
  const period = document.getElementById('receipt-period').innerText.replace("Período: ", "").replaceAll(" ", "_");

  const opt = {
    margin:       0.5,
    filename:     `comprobante_${employeeName}_${period}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save();
}*/

function downloadReceipt() {
  document.getElementById('preview-modal').style.display = 'flex';
  // Ajustar tamaño Legal (esto también lo puedes poner en CSS)

  const printContents = document.getElementById('receipt-preview').innerHTML;
  const originalContents = document.body.innerHTML;

  document.body.innerHTML = printContents;
  window.print();
  document.body.innerHTML = originalContents;
  // Recargar la Página
  window.location.reload();
}

