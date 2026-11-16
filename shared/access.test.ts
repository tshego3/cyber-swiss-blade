import { describe, expect, it } from 'vitest';
import { ADMINISTRATORS, defaultRoleMap, grantsFor, isOwnerScoped, moduleForCollection } from './access';

describe('module access', () => {
  it('maps collections to their module and owner scope', () => {
    expect(moduleForCollection('quotation_quotes')).toBe('quotations');
    expect(moduleForCollection('timesheet_logs')).toBe('timesheet');
    expect(moduleForCollection('unknown')).toBeNull();
    expect(isOwnerScoped('timesheet_logs')).toBe(true);
    expect(isOwnerScoped('quotation_quotes')).toBe(false);
  });

  it('gives registered users the timesheet but not quotations by default', () => {
    expect(grantsFor([], defaultRoleMap())).toEqual({ timesheet: { view: true, edit: true }, quotations: { view: false, edit: false } });
  });

  it('gives administrators everything and treats edit as view', () => {
    expect(grantsFor([ADMINISTRATORS], {})).toEqual({ timesheet: { view: true, edit: true }, quotations: { view: true, edit: true } });
    expect(grantsFor(['sales'], { quotations: { view: [], edit: ['sales'] } }).quotations).toEqual({ view: true, edit: true });
    expect(grantsFor(['viewers'], { quotations: { view: ['viewers'], edit: [] } }).quotations).toEqual({ view: true, edit: false });
  });
});
