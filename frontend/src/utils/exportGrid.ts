import * as XLSX from 'xlsx';
import { useGridStore } from '../stores/gridStore';
import { evaluateFormula } from './formulaEvaluator';

function buildDataArray(): (string | number | null)[][] {
  const { cells, rowCount, colCount, headers } = useGridStore.getState();

  const rows: (string | number | null)[][] = [];

  // Header row
  rows.push(headers.slice(0, colCount));

  // Data rows
  for (let r = 1; r <= rowCount; r++) {
    const row: (string | number | null)[] = [];
    for (let c = 0; c < colCount; c++) {
      const colLetter = String.fromCharCode(65 + c);
      const cellId = `${colLetter}${r}`;
      const cell = cells[cellId];
      if (!cell) {
        row.push(null);
        continue;
      }
      // Use evaluated value for formulas
      if (cell.formula) {
        const result = evaluateFormula(cell.formula, cells, headers);
        row.push(result);
      } else {
        row.push(cell.value);
      }
    }
    rows.push(row);
  }

  return rows;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportXlsx(filename = 'cellium') {
  const data = buildDataArray();
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Apply column widths
  const { colWidths, colCount } = useGridStore.getState();
  ws['!cols'] = Array.from({ length: colCount }, (_, i) => ({
    wpx: colWidths[i] ?? 100,
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Cellium');
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, `${filename}.xlsx`);
}

export function exportCsv(filename = 'cellium') {
  const data = buildDataArray();
  const csvContent = data
    .map((row) =>
      row
        .map((cell) => {
          if (cell === null || cell === undefined) return '';
          const str = String(cell);
          // Escape fields containing comma, quote, or newline
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    )
    .join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, `${filename}.csv`);
}
