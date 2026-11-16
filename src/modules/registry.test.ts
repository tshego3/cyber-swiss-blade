import { describe, expect, it } from 'vitest';
import { MODULE_ACCESS, isRestrictedModule } from '../../shared/access';
import { MODULES } from './registry';

describe('module registry', () => {
  it('declares restricted modules with the same collections the Worker allows', () => {
    for (const module of MODULES) {
      if (module.access === 'public') {
        expect(module.collections).toEqual([]);
        continue;
      }
      expect(isRestrictedModule(module.id)).toBe(true);
      if (isRestrictedModule(module.id)) expect([...module.collections].sort()).toEqual([...MODULE_ACCESS[module.id].collections].sort());
    }
  });
});
