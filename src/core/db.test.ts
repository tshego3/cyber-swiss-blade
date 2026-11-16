import { describe, expect, it } from 'vitest';
import { isUnchanged, shouldApplyRemote, type OutboxEntry, type StoredRecord } from './db';

const local: StoredRecord = { collection: 'c', id: '1', updatedAt: '2026-11-16T10:00:00.000Z', deleted: false, data: { v: 1 } };
const pending: OutboxEntry = { collection: 'c', id: '1', updatedAt: local.updatedAt };

describe('shouldApplyRemote', () => {
  it('applies remote records when there is no pending local change', () => {
    expect(shouldApplyRemote(local, undefined, { ...local, updatedAt: '2026-11-16T09:00:00.000Z' })).toBe(true);
    expect(shouldApplyRemote(undefined, undefined, local)).toBe(true);
  });

  it('keeps a pending local change that is newer than the remote record', () => {
    expect(shouldApplyRemote(local, pending, { ...local, updatedAt: '2026-11-16T09:00:00.000Z' })).toBe(false);
  });

  it('applies a newer remote record over a pending local change', () => {
    expect(shouldApplyRemote(local, pending, { ...local, updatedAt: '2026-11-16T11:00:00.000Z' })).toBe(true);
  });
});

describe('isUnchanged', () => {
  it('detects a record the device already has', () => {
    expect(isUnchanged(local, local)).toBe(true);
    expect(isUnchanged(local, { ...local, deleted: true })).toBe(false);
    expect(isUnchanged(undefined, local)).toBe(false);
    expect(isUnchanged(local, { ...local, ownerId: 'u1' })).toBe(false);
  });
});
