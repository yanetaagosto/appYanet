async function downloadReceipt(payrollItem, employee, payroll) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Título y encabezado
  doc.setFontSize(16);
  doc.text('Comprobante de Pago - Parroquia San Francisco de Asís', 10, 20);

  // Información del empleado y periodo
  let y = 30;
  doc.setFontSize(12);
  doc.text(`Empleado: ${employee.firstName} ${employee.lastName}`, 10, y); y += 8;
  doc.text(`Documento: ${employee.document}`, 10, y); y += 8;
  doc.text(`Cargo: ${employee.position}`, 10, y); y += 8;
  doc.text(`Departamento: ${employee.department}`, 10, y); y += 8;
  doc.text(`Periodo: ${payroll.period}`, 10, y); y += 8;
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 10, y); y += 12;

  // Detalles de pago
  doc.text(`Salario base: $${employee.salary}`, 10, y); y += 8;
  doc.text(`Días trabajados: ${payrollItem.daysWorked}`, 10, y); y += 8;
  doc.text(`Horas extra: $${payrollItem.overtime || 0}`, 10, y); y += 8;
  doc.text(`Total devengado: $${payrollItem.grossSalary}`, 10, y); y += 8;
  doc.text(`Salud: $${payrollItem.healthDeduction}`, 10, y); y += 8;
  doc.text(`Pensión: $${payrollItem.pensionDeduction}`, 10, y); y += 8;
  doc.text(`Otros descuentos: $${payrollItem.otherDeductions || 0}`, 10, y); y += 8;

  const totalDescuentos = payrollItem.healthDeduction + payrollItem.pensionDeduction + (payrollItem.otherDeductions || 0);
  doc.text(`Total descuentos: $${totalDescuentos}`, 10, y); y += 10;

  doc.setFontSize(14);
  doc.text(`Pago neto: $${payrollItem.netSalary}`, 10, y);

  // Guardar PDF
  const nombreArchivo = `comprobante_${payroll.period.replace(/\s/g, '_')}_${employee.lastName}.pdf`;
  doc.save(nombreArchivo);
}
