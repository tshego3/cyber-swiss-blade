import { pendingChanges, signOut } from './session';
import { confirmAction, toast } from './ui';

export async function confirmSignOut(): Promise<void> {
  const pending = await pendingChanges();
  const message = pending > 0
    ? `${pending} change${pending === 1 ? ' has' : 's have'} not synced yet. If you sign out now, they are lost. This device keeps no data after you sign out.`
    : 'This device keeps no Timesheet or Quotations data after you sign out. Your data stays on the server.';
  if (!(await confirmAction('Sign out', message, 'Sign out'))) return;
  await signOut();
  toast('Signed out');
}
