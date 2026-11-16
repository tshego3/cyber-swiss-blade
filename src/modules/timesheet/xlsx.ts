import { utf8Encode } from '../../../shared/bytes';
import { createZip, type ZipEntry } from '../../core/zip';
import { formatHourValue, monthDates } from './data';
import type { MergedDay } from './types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const HEADERS = ['Date', 'IR/ Billing CodeNumber', 'Hours Worked', 'Comments'] as const;
const WIDTHS = [28.14, 41.57, 18.43, 116.43] as const;
const EXCEL_EPOCH = Date.UTC(1899, 11, 30);
const MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const PKG_REL = 'http://schemas.openxmlformats.org/package/2006/relationships';
const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

const STYLE = { date: 1, text: 2, hours: 3, title: 4, subtitle: 5 } as const;

export interface ReportOptions {
  readonly year: number;
  readonly title: string;
  readonly subtitle: string;
  readonly days: ReadonlyMap<string, MergedDay>;
}

export function excelSerial(date: string): number {
  const [year = 1970, month = 1, day = 1] = date.split('-').map(Number);
  return (Date.UTC(year, month - 1, day) - EXCEL_EPOCH) / 86_400_000;
}

function isXmlChar(code: number): boolean {
  return code === 0x09 || code === 0x0a || code === 0x0d || (code >= 0x20 && code <= 0xd7ff) || (code >= 0xe000 && code <= 0xfffd) || code >= 0x10000;
}

export function escapeXml(value: string): string {
  return [...value]
    .filter((char) => isXmlChar(char.codePointAt(0) ?? 0))
    .join('')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function reportEntries(options: ReportOptions): ZipEntry[] {
  const files: [string, string][] = [
    ['[Content_Types].xml', contentTypes()],
    ['_rels/.rels', `${XML}<Relationships xmlns="${PKG_REL}"><Relationship Id="rId1" Type="${REL}/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
    ['xl/workbook.xml', workbook()],
    ['xl/_rels/workbook.xml.rels', workbookRels()],
    ['xl/styles.xml', styles()],
  ];
  MONTHS.forEach((month, index) => {
    const number = index + 1;
    const dates = monthDates(options.year, number);
    const lastRow = 3 + dates.length;
    files.push([`xl/worksheets/sheet${number}.xml`, sheet(options, dates)]);
    files.push([`xl/worksheets/_rels/sheet${number}.xml.rels`, `${XML}<Relationships xmlns="${PKG_REL}"><Relationship Id="rId1" Type="${REL}/table" Target="../tables/table${number}.xml"/></Relationships>`]);
    files.push([`xl/tables/table${number}.xml`, table(number, `Report${month}`, lastRow)]);
  });
  return files.map(([name, xml]) => ({ name, data: utf8Encode(xml) }));
}

export function agileReport(options: ReportOptions): Promise<Blob> {
  return createZip(reportEntries(options)).then((zip) => new Blob([zip], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
}

function contentTypes(): string {
  const sheets = MONTHS.map((_, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('');
  const tables = MONTHS.map((_, index) => `<Override PartName="/xl/tables/table${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml"/>`).join('');
  return `${XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets}${tables}</Types>`;
}

function workbook(): string {
  const sheets = MONTHS.map((month, index) => `<sheet name="${month}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join('');
  return `${XML}<workbook xmlns="${MAIN}" xmlns:r="${REL}"><sheets>${sheets}</sheets></workbook>`;
}

function workbookRels(): string {
  const sheets = MONTHS.map((_, index) => `<Relationship Id="rId${index + 1}" Type="${REL}/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join('');
  return `${XML}<Relationships xmlns="${PKG_REL}">${sheets}<Relationship Id="rId13" Type="${REL}/styles" Target="styles.xml"/></Relationships>`;
}

function styles(): string {
  const fonts = '<fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="16"/><name val="Calibri"/></font><font><i/><sz val="11"/><name val="Calibri"/></font></fonts>';
  const fills = '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>';
  const top = '<alignment vertical="top"/>';
  const xfs = [
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>',
    `<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="left" vertical="top"/></xf>`,
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>',
    `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1">${top}</xf>`,
    '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>',
    '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>',
  ];
  return `${XML}<styleSheet xmlns="${MAIN}"><numFmts count="1"><numFmt numFmtId="164" formatCode="d\\-mmm\\-yyyy"/></numFmts>${fonts}${fills}<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${xfs.length}">${xfs.join('')}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
}

function text(ref: string, value: string, style: number): string {
  return value ? `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>` : `<c r="${ref}" s="${style}"/>`;
}

function sheet(options: ReportOptions, dates: readonly string[]): string {
  const cols = WIDTHS.map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`).join('');
  const rows = [
    `<row r="1">${text('A1', options.title, STYLE.title)}</row>`,
    `<row r="2">${text('A2', options.subtitle, STYLE.subtitle)}</row>`,
    `<row r="3">${HEADERS.map((heading, index) => text(`${'ABCD'[index] ?? 'A'}3`, heading, 0)).join('')}</row>`,
    ...dates.map((date, index) => {
      const row = index + 4;
      const day = options.days.get(date);
      const hasHours = day !== undefined && (day.codes !== '' || day.hours > 0);
      const hours = hasHours ? `<c r="C${row}" s="${STYLE.hours}"><v>${formatHourValue(day.hours)}</v></c>` : `<c r="C${row}" s="${STYLE.hours}"/>`;
      return `<row r="${row}"><c r="A${row}" s="${STYLE.date}"><v>${excelSerial(date)}</v></c>${text(`B${row}`, day?.codes ?? '', STYLE.text)}${hours}${text(`D${row}`, day?.comment ?? '', STYLE.text)}</row>`;
    }),
  ];
  const lastRow = 3 + dates.length;
  return `${XML}<worksheet xmlns="${MAIN}" xmlns:r="${REL}"><dimension ref="A1:D${lastRow}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="3" topLeftCell="A4" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/><cols>${cols}</cols><sheetData>${rows.join('')}</sheetData><mergeCells count="2"><mergeCell ref="A1:D1"/><mergeCell ref="A2:D2"/></mergeCells><tableParts count="1"><tablePart r:id="rId1"/></tableParts></worksheet>`;
}

function table(id: number, name: string, lastRow: number): string {
  const columns = HEADERS.map((heading, index) => `<tableColumn id="${index + 1}" name="${escapeXml(heading)}"/>`).join('');
  return `${XML}<table xmlns="${MAIN}" id="${id}" name="${name}" displayName="${name}" ref="A3:D${lastRow}" totalsRowShown="0"><autoFilter ref="A3:D${lastRow}"/><tableColumns count="4">${columns}</tableColumns><tableStyleInfo name="TableStyleMedium9" showFirstColumn="0" showLastColumn="0" showRowStripes="1" showColumnStripes="0"/></table>`;
}
