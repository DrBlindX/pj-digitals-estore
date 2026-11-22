export type SupportKind = 'feedback' | 'problem';
export type SupportTicket = { _id: string; subject: string; status: string; createdAt?: string };
export type SupportDraft = { kind: SupportKind; subject: string; message: string; steps: string };
type Request = (path: string, options?: RequestInit) => Promise<Response>;

export function buildSupportPayload(draft: SupportDraft, app: string, platform: string) {
  const subject = draft.subject.trim();
  const message = draft.message.trim();
  const steps = draft.steps.trim();
  if (!subject || !message) throw new Error('Enter a subject and a message.');
  if (subject.length > 140 || message.length > 3000 || steps.length > 500) throw new Error('Please shorten your report to fit the field limits.');
  return {
    subject: `[${app} ${draft.kind === 'problem' ? 'problem' : 'feedback'}] ${subject}`,
    category: 'other',
    message: `${message}${draft.kind === 'problem' && steps ? `\n\nSteps to reproduce:\n${steps}` : ''}\n\nSent from NearBy ${app} (${platform}).`,
  };
}

export async function submitSupport(request: Request, token: string, draft: SupportDraft, app: string, platform: string): Promise<SupportTicket> {
  if (!token) throw new Error('Sign in before sending your report.');
  const response = await request('/api/support', { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(buildSupportPayload(draft, app, platform)) });
  let result;
  try { result = await response.json(); } catch { throw new Error('The server did not confirm this report. Refresh My reports before trying again.'); }
  if (result?.success !== true || typeof result.data?._id !== 'string') throw new Error('The server did not confirm this report. Refresh My reports before trying again.');
  return result.data;
}

export async function loadSupport(request: Request, token: string, signal?: AbortSignal): Promise<SupportTicket[]> {
  if (!token) throw new Error('Sign in to see your reports.');
  const response = await request('/api/support', { signal, headers: { Accept: 'application/json', Authorization: `Bearer ${token}` }, cache: 'no-store' });
  let result;
  try { result = await response.json(); } catch { throw new Error('Support returned an unreadable response. Try refreshing later.'); }
  if (result?.success !== true || !Array.isArray(result.data)) throw new Error('Unable to load your reports.');
  return [...new Map<string, SupportTicket>(result.data.filter((item: SupportTicket) => typeof item?._id === 'string' && typeof item.subject === 'string').map((item: SupportTicket) => [item._id, { ...item, status: typeof item.status === 'string' ? item.status : 'open' }] as const)).values()];
}
