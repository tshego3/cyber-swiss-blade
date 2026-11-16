import { describe, expect, it } from 'vitest';
import { readZip } from '../../test-support/read-zip';
import { agileReport, escapeXml, excelSerial } from './xlsx';

describe('Agile Report workbook', () => {
  it('converts dates to Excel serial numbers', () => {
    expect(excelSerial('1900-03-01')).toBe(61);
    expect(excelSerial('2026-01-01')).toBe(46023);
  });

  it('escapes XML and drops control characters', () => {
    expect(escapeXml('A & B <c> "d"\u0001')).toBe('A &amp; B &lt;c&gt; &quot;d&quot;');
  });

  it('builds one sheet per month with every day, merged rows, and a styled table', async () => {
    const day = { date: '2026-11-16', codes: 'Client Support & Productive', hours: 8.5, comment: 'Notes || CR-1 - Fixed & shipped.' };
    const blob = await agileReport({ year: 2026, title: 'Agile Report', subtitle: 'Reminder line', days: new Map([[day.date, day]]) });
    const files = await readZip(blob);
    expect(files.get('xl/workbook.xml')).toContain('<sheet name="Nov" sheetId="11" r:id="rId11"/>');
    const november = files.get('xl/worksheets/sheet11.xml') ?? '';
    expect(november).toContain('<dimension ref="A1:D33"/>');
    expect(november).toContain(`<v>${excelSerial('2026-11-16')}</v>`);
    expect(november).toContain('Client Support &amp; Productive');
    expect(november).toContain('<c r="C19" s="3"><v>8.5</v></c>');
    expect(files.get('xl/tables/table2.xml')).toContain('ref="A3:D31"');
    expect(files.get('xl/tables/table11.xml')).toContain('TableStyleMedium9');
  });
});
