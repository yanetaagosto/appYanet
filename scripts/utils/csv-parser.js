/**
 * CSV Parser Module for Sistema de Nómina - Parroquia San Francisco de Asís
 * Handles parsing CSV and Excel files for data import
 */

// Define CSV Parser namespace
window.CSVParser = (function() {
  /**
   * Parse a CSV file and return the data as an array of objects
   * @param {File} file - The CSV file to parse
   * @param {Object} options - Parsing options
   * @param {string} options.delimiter - The CSV delimiter (default: ',')
   * @param {boolean} options.hasHeader - Whether the CSV has a header row (default: true)
   * @param {Array} options.columns - Column definitions for mapping (default: null)
   * @returns {Promise<Array>} - Promise resolving to array of parsed objects
   */
  function parseCSV(file, options = {}) {
    const defaults = {
      delimiter: ',',
      hasHeader: true,
      columns: null
    };
    
    const settings = { ...defaults, ...options };
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = function(event) {
        try {
          const csv = event.target.result;
          const lines = csv.split(/\r\n|\n/);
          const result = [];
          
          // Get headers if available
          let headers = [];
          if (settings.hasHeader) {
            const headerLine = lines[0];
            headers = headerLine.split(settings.delimiter).map(header => header.trim());
          } else if (settings.columns) {
            headers = settings.columns.map(col => col.key);
          }
          
          // Process each line
          const startIndex = settings.hasHeader ? 1 : 0;
          for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = parseCSVLine(line, settings.delimiter);
            const obj = {};
            
            // Map values to object properties
            for (let j = 0; j < values.length; j++) {
              if (j < headers.length) {
                obj[headers[j]] = values[j];
              }
            }
            
            result.push(obj);
          }
          
          resolve(result);
        } catch (error) {
          reject(new Error('Error parsing CSV: ' + error.message));
        }
      };
      
      reader.onerror = function() {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsText(file);
    });
  }
  
  /**
   * Parse a single CSV line, handling quoted values
   * @param {string} line - The CSV line to parse
   * @param {string} delimiter - The CSV delimiter
   * @returns {Array} - Array of values from the line
   */
  function parseCSVLine(line, delimiter) {
    const values = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          // Double quotes inside quotes - add a single quote
          currentValue += '"';
          i++;
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        // End of value
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        // Add character to current value
        currentValue += char;
      }
    }
    
    // Add the last value
    values.push(currentValue.trim());
    
    return values;
  }
  
  /**
   * Parse an Excel file and return the data as an array of objects
   * @param {File} file - The Excel file to parse
   * @param {Object} options - Parsing options
   * @param {string} options.sheetName - The sheet to parse (default: first sheet)
   * @param {boolean} options.hasHeader - Whether the sheet has a header row (default: true)
   * @param {Array} options.columns - Column definitions for mapping (default: null)
   * @returns {Promise<Array>} - Promise resolving to array of parsed objects
   */
  function parseExcel(file, options = {}) {
    // For the prototype, we'll simulate Excel parsing
    // In a real app, you would use a library like SheetJS (xlsx)
    return new Promise((resolve, reject) => {
      // Simulate parsing delay
      setTimeout(() => {
        // Check if file is Excel
        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
          reject(new Error('El archivo no es un archivo Excel válido'));
          return;
        }
        
        // For the prototype, return sample data
        if (file.name.toLowerCase().includes('empleados')) {
          resolve([
            {
              id: "1003",
              firstName: "Carlos",
              lastName: "López",
              document: "5678901234",
              position: "Asistente de Pastoral",
              department: "Pastoral",
              joinDate: "2021-05-10",
              salary: 1100000,
              bankAccount: "345678912",
              bankName: "Davivienda",
              accountType: "Ahorros",
              email: "carlos.lopez@ejemplo.com",
              phone: "3157894561"
            },
            {
              id: "1004",
              firstName: "Ana",
              lastName: "Martínez",
              document: "9012345678",
              position: "Secretaria",
              department: "Administración",
              joinDate: "2022-02-15",
              salary: 1050000,
              bankAccount: "567890123",
              bankName: "Bancolombia",
              accountType: "Ahorros",
              email: "ana.martinez@ejemplo.com",
              phone: "3209876543"
            }
          ]);
        } else if (file.name.toLowerCase().includes('eventos')) {
          resolve([
            {
              id: "E003",
              employeeId: "1001",
              type: "Permiso",
              startDate: "2023-08-05",
              endDate: "2023-08-05",
              days: 1,
              description: "Cita médica",
              status: "Pendiente"
            },
            {
              id: "E004",
              employeeId: "1002",
              type: "Horas Extra",
              date: "2023-08-10",
              hours: 2,
              description: "Preparación de informes mensuales",
              status: "Pendiente"
            }
          ]);
        } else {
          // Default sample data
          resolve([
            { id: "1", name: "Sample 1", value: 100 },
            { id: "2", name: "Sample 2", value: 200 },
            { id: "3", name: "Sample 3", value: 300 }
          ]);
        }
      }, 1000);
    });
  }
  
  /**
   * Validate and transform imported data according to a schema
   * @param {Array} data - The imported data
   * @param {Object} schema - The validation schema
   * @returns {Object} - Validation result with transformed data and errors
   */
  function validateImportData(data, schema) {
    const result = {
      valid: true,
      data: [],
      errors: []
    };
    
    data.forEach((item, index) => {
      const transformedItem = {};
      let rowValid = true;
      const rowErrors = [];
      
      // Validate each field according to schema
      Object.keys(schema).forEach(field => {
        const fieldSchema = schema[field];
        const value = item[field];
        
        // Check required fields
        if (fieldSchema.required && (value === undefined || value === null || value === '')) {
          rowValid = false;
          rowErrors.push(`Campo '${fieldSchema.label || field}' es requerido`);
          return;
        }
        
        // Skip further validation if field is empty and not required
        if (value === undefined || value === null || value === '') {
          transformedItem[field] = fieldSchema.default !== undefined ? fieldSchema.default : null;
          return;
        }
        
        // Validate and transform according to type
        try {
          switch (fieldSchema.type) {
            case 'string':
              transformedItem[field] = String(value);
              break;
              
            case 'number':
              const num = Number(value);
              if (isNaN(num)) {
                throw new Error(`'${value}' no es un número válido`);
              }
              transformedItem[field] = num;
              break;
              
            case 'integer':
              const int = parseInt(value, 10);
              if (isNaN(int)) {
                throw new Error(`'${value}' no es un entero válido`);
              }
              transformedItem[field] = int;
              break;
              
            case 'boolean':
              if (typeof value === 'boolean') {
                transformedItem[field] = value;
              } else if (typeof value === 'string') {
                const lowercaseValue = value.toLowerCase().trim();
                if (['true', 'yes', 'si', 's', 'y', '1'].includes(lowercaseValue)) {
                  transformedItem[field] = true;
                } else if (['false', 'no', 'n', '0'].includes(lowercaseValue)) {
                  transformedItem[field] = false;
                } else {
                  throw new Error(`'${value}' no es un valor booleano válido`);
                }
              } else {
                transformedItem[field] = Boolean(value);
              }
              break;
              
            case 'date':
              const date = new Date(value);
              if (isNaN(date.getTime())) {
                throw new Error(`'${value}' no es una fecha válida`);
              }
              transformedItem[field] = date.toISOString().split('T')[0];
              break;
              
            case 'enum':
              if (!fieldSchema.values.includes(value)) {
                throw new Error(`'${value}' no es un valor válido. Valores permitidos: ${fieldSchema.values.join(', ')}`);
              }
              transformedItem[field] = value;
              break;
              
            default:
              transformedItem[field] = value;
          }
        } catch (error) {
          rowValid = false;
          rowErrors.push(`Campo '${fieldSchema.label || field}': ${error.message}`);
        }
      });
      
      if (rowValid) {
        result.data.push(transformedItem);
      } else {
        result.valid = false;
        result.errors.push({
          row: index + 1,
          errors: rowErrors
        });
      }
    });
    
    return result;
  }
  
  /**
   * Generate a template file for data import
   * @param {Object} schema - The schema to use for the template
   * @param {string} type - The file type ('csv' or 'excel')
   * @returns {Blob} - The template file as a Blob
   */
  function generateTemplate(schema, type = 'csv') {
    if (type === 'csv') {
      // Generate CSV template
      const headers = Object.keys(schema).map(field => {
        const fieldSchema = schema[field];
        return fieldSchema.label || field;
      });
      
      const headerRow = headers.join(',');
      const content = headerRow + '\n';
      
      return new Blob([content], { type: 'text/csv' });
    } else {
      // For the prototype, we'll simulate an Excel template
      // In a real app, you would use a library like SheetJS (xlsx)
      return new Blob(['Excel template content would go here'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    }
  }
  
  // Public API
  return {
    parseCSV,
    parseExcel,
    validateImportData,
    generateTemplate
  };
})();