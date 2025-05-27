async function downloadReceipt(payrollItem, employee, payroll) {
  const receiptElement = document.getElementById('receipt-preview');

  // Cambiar dinámicamente los valores del recibo si es necesario antes de exportar
  document.getElementById("employee-name").textContent = `${employee.firstName} ${employee.lastName}`;
  document.getElementById("employee-document").textContent = employee.document;
  document.getElementById("employee-position").textContent = employee.position;
  document.getElementById("employee-department").textContent = employee.department;
  document.getElementById("receipt-period").textContent = `Período: ${payroll.period}`;

  document.getElementById("base-salary").textContent = `$${employee.salary}`;
  document.getElementById("worked-days").textContent = payrollItem.daysWorked;
  document.getElementById("overtime").textContent = `$${payrollItem.overtime || 0}`;
  document.getElementById("gross-salary").textContent = `$${payrollItem.grossSalary}`;
  document.getElementById("health-deduction").textContent = `$${payrollItem.healthDeduction}`;
  document.getElementById("pension-deduction").textContent = `$${payrollItem.pensionDeduction}`;
  document.getElementById("other-deductions").textContent = `$${payrollItem.otherDeductions || 0}`;
  document.getElementById("net-salary").textContent = `$${payrollItem.netSalary}`;

  const totalDescuentos = payrollItem.healthDeduction + payrollItem.pensionDeduction + (payrollItem.otherDeductions || 0);
  document.getElementById("total-deductions").textContent = `$${totalDescuentos}`;

  const opt = {
    margin: 0.5,
    filename: `comprobante_${payroll.period.replace(/\s/g, '_')}_${employee.lastName}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  html2pdf().from(receiptElement).set(opt).save();
}
