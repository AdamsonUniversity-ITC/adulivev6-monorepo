import type { Cell, Row, Worksheet } from 'exceljs';

const BLUE = 'FF173B70';
const LIGHT_BLUE = 'FFEEF5FB';
const PALE_BLUE = 'FFF7FAFD';
const WHITE = 'FFFFFFFF';
const TEXT = 'FF172033';
const BORDER = 'FF8293A8';
const MONEY_HEADERS = [
  'amount',
  'approved',
  'balance',
  'budget',
  'cost',
  'deduction',
  'additional',
  'released',
  'returned',
  'liquidated',
  'unused',
  'proposed',
];
const QUANTITY_HEADERS = ['qty', 'quantity'];
const PERCENT_HEADERS = ['percent', 'percentage', '%'];

type ExportRowKind = 'title' | 'subtitle' | 'metadata' | 'heading' | 'table-header' | 'body' | 'subtotal' | 'total' | 'empty' | 'footer';

type ExportContext = {
  worksheet: Worksheet;
  columnCount: number;
  firstTableHeaderRow: number | null;
};

const cleanText = (value: string | null | undefined): string =>
  (value ?? '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();

const classText = (element: Element): string =>
  typeof element.className === 'string' ? element.className.toLowerCase() : '';

function rowKind(element: Element, header = false): ExportRowKind {
  const classes = classText(element);
  if (header) return 'table-header';
  if (/grand-total|overall-total|report-total|unit-report-total/.test(classes)) return 'total';
  if (/subtotal|unit-total|location-total|main-total/.test(classes)) return 'subtotal';
  if (/empty|report-empty/.test(classes)) return 'empty';
  if (/heading|title|main-group|sub-group|classification|account-parent/.test(classes)) return 'heading';
  return 'body';
}

function applyBorder(cell: Cell, top: 'thin' | 'medium' | undefined, bottom: 'thin' | 'medium' | 'double' | undefined): void {
  cell.border = {
    top: top ? { style: top, color: { argb: BORDER } } : undefined,
    bottom: bottom ? { style: bottom, color: { argb: BORDER } } : undefined,
  };
}

function styleRow(row: Row, kind: ExportRowKind): void {
  row.alignment = { vertical: 'top', wrapText: true };
  row.font = { name: 'Arial', size: 11, color: { argb: TEXT } };

  if (kind === 'title') {
    row.height = 27;
    row.font = { name: 'Arial', size: 18, bold: true, color: { argb: BLUE } };
  } else if (kind === 'subtitle') {
    row.height = 23;
    row.font = { name: 'Arial', size: 13, bold: true, color: { argb: TEXT } };
  } else if (kind === 'metadata') {
    row.height = 19;
    row.getCell(1).font = { name: 'Arial', size: 11, bold: true, color: { argb: BLUE } };
  } else if (kind === 'heading') {
    row.height = 21;
    row.font = { name: 'Arial', size: 11, bold: true, color: { argb: BLUE } };
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_BLUE } };
    row.eachCell(cell => applyBorder(cell, 'thin', 'thin'));
  } else if (kind === 'table-header') {
    row.height = 26;
    row.font = { name: 'Arial', size: 11, bold: true, color: { argb: WHITE } };
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE } };
    row.alignment = { vertical: 'middle', wrapText: true };
    row.eachCell(cell => applyBorder(cell, 'thin', 'thin'));
  } else if (kind === 'subtotal') {
    row.height = 21;
    row.font = { name: 'Arial', size: 11, bold: true, color: { argb: TEXT } };
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALE_BLUE } };
    row.eachCell(cell => applyBorder(cell, 'thin', 'medium'));
  } else if (kind === 'total') {
    row.height = 23;
    row.font = { name: 'Arial', size: 11, bold: true, color: { argb: WHITE } };
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE } };
    row.eachCell(cell => applyBorder(cell, 'medium', 'double'));
  } else if (kind === 'empty') {
    row.height = 28;
    row.font = { name: 'Arial', size: 11, italic: true, color: { argb: 'FF64748B' } };
  } else if (kind === 'footer') {
    row.height = 20;
    row.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF475569' } };
    row.eachCell(cell => applyBorder(cell, 'thin', undefined));
  } else {
    row.height = 20;
  }
}

function numericValue(text: string, header: string, kind: ExportRowKind): { value: string | number; format?: string } {
  const normalizedHeader = header.toLowerCase();
  const cleaned = text.replace(/[₱,\s]/g, '');
  const percentage = text.endsWith('%') || PERCENT_HEADERS.some(term => normalizedHeader.includes(term));
  const money = MONEY_HEADERS.some(term => normalizedHeader.includes(term))
    || (/[₱,]/.test(text) && /^-?[\d,.]+$/.test(text.replace('₱', '').trim()))
    || ((kind === 'subtotal' || kind === 'total') && /^-?\d+\.\d{2}$/.test(cleaned));
  const quantity = QUANTITY_HEADERS.some(term => normalizedHeader === term || normalizedHeader.includes(term));

  if (percentage && /^-?\d+(?:\.\d+)?%?$/.test(cleaned.replace('%', ''))) {
    return { value: Number(cleaned.replace('%', '')) / 100, format: '0.00%' };
  }
  if (money && /^-?\d+(?:\.\d+)?$/.test(cleaned)) {
    return { value: Number(cleaned), format: '#,##0.00;[Red]-#,##0.00' };
  }
  if (quantity && /^\d+$/.test(cleaned)) {
    return { value: Number(cleaned), format: '#,##0' };
  }

  return { value: text };
}

function tableColumnCount(table: HTMLTableElement): number {
  return Math.max(
    1,
    ...Array.from(table.rows, row =>
      Array.from(row.cells).reduce((total, cell) => total + Math.max(cell.colSpan, 1), 0)
    ),
  );
}

function reportColumnCount(report: HTMLElement): number {
  const tableColumns = Array.from(report.querySelectorAll('table')).map(tableColumnCount);
  const totalColumns = Array.from(report.querySelectorAll('[class*="total"]')).map(element =>
    Array.from(element.children).filter(child => cleanText(child.textContent) !== '').length
  );

  return Math.max(4, ...tableColumns, ...totalColumns);
}

function addMergedRow(
  context: ExportContext,
  text: string,
  kind: ExportRowKind,
  startColumn = 1,
  endColumn = context.columnCount,
): Row | null {
  if (!text) return null;
  const row = context.worksheet.addRow([]);
  row.getCell(startColumn).value = text;
  if (endColumn > startColumn) {
    context.worksheet.mergeCells(row.number, startColumn, row.number, endColumn);
  }
  styleRow(row, kind);
  return row;
}

function addMetadata(context: ExportContext, element: Element): void {
  const labelElement = element.querySelector(':scope > b, :scope > strong:first-child');
  const valueElement = element.querySelector(':scope > strong:last-child');
  const label = cleanText(labelElement?.textContent).replace(/:$/, '');
  const fullText = cleanText(element.textContent);
  const value = cleanText(valueElement?.textContent)
    || cleanText(label ? fullText.slice(fullText.indexOf(label) + label.length).replace(/^:\s*/, '') : fullText);
  if (!label && !value) return;

  const row = context.worksheet.addRow([]);
  row.getCell(1).value = label ? `${label}:` : '';
  row.getCell(2).value = value;
  if (context.columnCount > 2) {
    context.worksheet.mergeCells(row.number, 2, row.number, context.columnCount);
  }
  styleRow(row, 'metadata');
}

function addTable(context: ExportContext, table: HTMLTableElement): void {
  const caption = cleanText(table.caption?.textContent);
  if (caption) addMergedRow(context, caption, 'heading');

  const occupied = new Map<number, Set<number>>();
  const headerLabels: string[] = [];

  Array.from(table.rows).forEach((htmlRow, localRowIndex) => {
    const row = context.worksheet.addRow([]);
    const isHeader = htmlRow.closest('thead') !== null || Array.from(htmlRow.cells).some(cell => cell.tagName === 'TH');
    const kind = rowKind(htmlRow, isHeader);
    const unavailable = occupied.get(localRowIndex) ?? new Set<number>();
    let column = 1;

    Array.from(htmlRow.cells).forEach(htmlCell => {
      while (unavailable.has(column)) column++;

      const text = cleanText(htmlCell.textContent);
      const colSpan = Math.max(htmlCell.colSpan, 1);
      const rowSpan = Math.max(htmlCell.rowSpan, 1);
      const endColumn = Math.min(context.columnCount, column + colSpan - 1);
      const header = headerLabels[column - 1] ?? '';
      const converted = isHeader ? { value: text } : numericValue(text, header, kind);
      const cell = row.getCell(column);
      cell.value = converted.value;
      if (converted.format) cell.numFmt = converted.format;
      cell.alignment = {
        vertical: 'top',
        wrapText: true,
        horizontal: converted.format ? 'right' : undefined,
      };

      if (isHeader) {
        for (let index = column; index <= endColumn; index++) headerLabels[index - 1] = text;
      }
      if (colSpan > 1) {
        context.worksheet.mergeCells(row.number, column, row.number, endColumn);
      }
      if (rowSpan > 1) {
        for (let offset = 1; offset < rowSpan; offset++) {
          const reserved = occupied.get(localRowIndex + offset) ?? new Set<number>();
          for (let index = column; index <= endColumn; index++) reserved.add(index);
          occupied.set(localRowIndex + offset, reserved);
        }
        context.worksheet.mergeCells(row.number, column, row.number + rowSpan - 1, endColumn);
      }
      column = endColumn + 1;
    });

    styleRow(row, kind);
    if (isHeader && context.firstTableHeaderRow === null) {
      context.firstTableHeaderRow = row.number;
    }
  });

  context.worksheet.addRow([]);
}

function addSummaryGrid(context: ExportContext, element: Element, kind: ExportRowKind): void {
  const directText = Array.from(element.childNodes)
    .filter(node => node.nodeType === Node.TEXT_NODE)
    .map(node => cleanText(node.textContent))
    .filter(Boolean)
    .join(' ');
  const values = Array.from(element.children)
    .map(child => cleanText(child.textContent))
    .filter(Boolean);
  if (directText) values.unshift(directText);
  if (!values.length) return;
  if (values.length === 1) {
    addMergedRow(context, values[0], kind);
    return;
  }

  const row = context.worksheet.addRow([]);
  const isTotal = kind === 'subtotal' || kind === 'total';
  const startColumn = isTotal ? Math.max(1, context.columnCount - values.length + 1) : 1;
  values.forEach((text, index) => {
    const column = startColumn + index;
    const converted = numericValue(text, '', kind);
    const cell = row.getCell(column);
    cell.value = converted.value;
    if (converted.format) cell.numFmt = converted.format;
    cell.alignment = { vertical: 'top', wrapText: true, horizontal: converted.format ? 'right' : undefined };
  });
  styleRow(row, kind);
}

function visitElement(context: ExportContext, element: Element): void {
  if (element.matches('style, script, .report-actions, .report-preview-actions')) return;
  if (element instanceof HTMLTableElement) {
    addTable(context, element);
    return;
  }

  const tag = element.tagName.toLowerCase();
  const text = cleanText(element.textContent);
  if (tag === 'h1') {
    addMergedRow(context, text, 'title');
    return;
  }
  if (tag === 'h2') {
    addMergedRow(context, text, 'subtitle');
    return;
  }
  if (tag === 'h3' || tag === 'h4') {
    addMergedRow(context, text, 'heading');
    return;
  }
  if (tag === 'footer') {
    context.worksheet.addRow([]);
    addMergedRow(context, text, 'footer');
    return;
  }
  if (tag === 'p' && element.closest('header')) {
    addMetadata(context, element);
    return;
  }
  if (tag === 'p' && /empty|report-empty/.test(classText(element))) {
    addMergedRow(context, text, 'empty');
    return;
  }

  const classes = classText(element);
  const summaryKind = rowKind(element);
  if (
    element.children.length > 0
    && /(?:^|\s)(?:[\w-]*total|[\w-]*title|[\w-]*heading)(?:\s|$)/.test(classes)
    && !element.querySelector('table, h1, h2, h3, h4')
  ) {
    addSummaryGrid(context, element, summaryKind);
    return;
  }

  Array.from(element.children).forEach(child => visitElement(context, child));
}

function applyColumnWidths(worksheet: Worksheet, columnCount: number): void {
  for (let columnIndex = 1; columnIndex <= columnCount; columnIndex++) {
    let width = 12;
    worksheet.eachRow(row => {
      const cell = row.getCell(columnIndex);
      if (cell.isMerged || cell.value === null || cell.value === undefined) return;
      if (typeof cell.value === 'number') {
        const format = cell.numFmt ?? '';
        let displayedValue = String(cell.value);
        if (format.includes('%')) {
          displayedValue = `${(cell.value * 100).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}%`;
        } else if (format.includes('0.00')) {
          displayedValue = cell.value.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        } else if (format.includes('#,##0')) {
          displayedValue = cell.value.toLocaleString('en-US', {
            maximumFractionDigits: 0,
          });
        }

        const numericPadding = format.includes('0.00') || format.includes('%') ? 4 : 3;
        width = Math.max(width, Math.min(28, displayedValue.length + numericPadding));
        return;
      }

      const value = typeof cell.value === 'object' ? String(cell.text) : String(cell.value);
      const longestLine = Math.max(...value.split(/\r?\n/).map(line => line.length), 0);
      width = Math.max(width, Math.min(48, longestLine + 2));
    });
    worksheet.getColumn(columnIndex).width = width;
  }
}

function safeFilePart(value: string, fallback: string): string {
  const normalized = value
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 90);
  return normalized || fallback;
}

export async function exportReportElementToExcel(report: HTMLElement): Promise<string> {
  const { Workbook } = await import('exceljs');
  const heading = cleanText(report.querySelector('h2')?.textContent)
    || cleanText(report.querySelector('h1')?.textContent)
    || 'ABMS Report';
  const workbook = new Workbook();
  workbook.creator = 'Adamson Budget Monitoring System';
  workbook.subject = heading;
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheetName = safeFilePart(heading, 'ABMS Report')
    .replace(/[\\/*?:[\]]/g, ' ')
    .slice(0, 31);
  const worksheet = workbook.addWorksheet(worksheetName, {
    pageSetup: {
      paperSize: 1,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.3, right: 0.3, top: 0.3, bottom: 0.3, header: 0.15, footer: 0.15 },
      horizontalCentered: true,
    },
    properties: { defaultRowHeight: 20 },
    views: [{ showGridLines: false }],
  });
  const context: ExportContext = {
    worksheet,
    columnCount: reportColumnCount(report),
    firstTableHeaderRow: null,
  };

  Array.from(report.children).forEach(child => visitElement(context, child));
  applyColumnWidths(worksheet, context.columnCount);
  worksheet.pageSetup.printArea = `A1:${worksheet.getColumn(context.columnCount).letter}${worksheet.rowCount}`;
  worksheet.headerFooter.oddFooter = '&LABMS&RPage &P of &N';
  if (context.firstTableHeaderRow !== null && context.firstTableHeaderRow > 1) {
    worksheet.views = [{
      state: 'frozen',
      ySplit: context.firstTableHeaderRow,
      activeCell: `A${context.firstTableHeaderRow + 1}`,
      showGridLines: false,
    }];
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const filename = `${safeFilePart(heading, 'ABMS-Report')}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);

  return filename;
}
