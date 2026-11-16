import { describe, expect, it } from 'vitest';
import { describeSyncState } from './sync-status';

describe('describeSyncState', () => {
  it('describes each state with a user-safe label', () => {
    const now = Date.parse('2026-11-16T12:00:00.000Z');
    expect(describeSyncState({ kind: 'local-only', pending: 0 }).label).toBe('Local only');
    expect(describeSyncState({ kind: 'offline', pending: 2 }).detail).toBe('2 changes pending');
    expect(describeSyncState({ kind: 'idle', pending: 0, lastSyncedAt: '2026-11-16T11:58:00.000Z' }, now).label).toBe('Synced 2m ago');
    expect(describeSyncState({ kind: 'error', pending: 1, message: 'The API token was rejected.' }).detail).toBe('The API token was rejected.');
  });
});
