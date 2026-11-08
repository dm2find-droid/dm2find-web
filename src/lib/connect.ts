// DM2find self-onboarding — shared config + helpers (browser-side).
// Nothing secret lives here: app IDs and redirect URIs are public by design.
// App secrets stay in n8n (env vars FB_APP_SECRET / IG_APP_SECRET).

export const N8N_WEBHOOK_BASE = 'https://n8n.dm2find.ai/webhook';

export const FACEBOOK = {
  appId: '1954874038622565',
  graphVersion: 'v25.0',
  // Must be byte-identical to the "Valid OAuth Redirect URIs" entry in Meta
  // AND to redirect_uri in the n8n "Short-lived token" node.
  redirectUri: 'https://dm2find.ai/connect/facebook/callback',
  // Use only permissions approved in App Review.
  scopes: [
    'pages_show_list',
    'pages_messaging',
    'pages_manage_metadata',
  ],
  // If the app uses "Facebook Login for Business", put its configuration ID
  // here; the dialog then uses config_id instead of scope.
  configId: '',
  endpoint: `${N8N_WEBHOOK_BASE}/connect-facebook`,
};

export const INSTAGRAM = {
  appId: '1257031125774558', // Instagram app ID (not the Facebook app ID)
  redirectUri: 'https://dm2find.ai/connect/instagram/callback',
  scopes: ['instagram_business_basic', 'instagram_business_manage_messages'],
  endpoint: `${N8N_WEBHOOK_BASE}/connect-instagram`,
};

export const TELEGRAM = {
  endpoint: `${N8N_WEBHOOK_BASE}/connect-telegram`,
};

export const WHATSAPP = {
  appId: '1599985487884076', // "DM2find WA direct"
  graphVersion: 'v25.0',
  // Facebook Login for Business → Configurations → WhatsApp Embedded Signup → Configuration ID
  configId: '1449955883592798',
  endpoint: `${N8N_WEBHOOK_BASE}/connect-whatsapp`,
};

const STORE_KEY = 'dm2find_connect_code';
const CODE_RE = /^[a-f0-9]{32}$/i;

/** Connect code from ?c=… (saved for the session), else from session storage. */
export function getConnectCode(): string {
  const fromUrl = new URLSearchParams(location.search).get('c')?.trim() ?? '';
  if (CODE_RE.test(fromUrl)) {
    try { sessionStorage.setItem(STORE_KEY, fromUrl); } catch { /* storage blocked */ }
    return fromUrl;
  }
  try { return sessionStorage.getItem(STORE_KEY) ?? ''; } catch { return ''; }
}

export function rememberConnectCode(code: string): void {
  try { sessionStorage.setItem(STORE_KEY, code); } catch { /* storage blocked */ }
}

export function isValidConnectCode(code: string): boolean {
  return CODE_RE.test(code.trim());
}

export function facebookAuthorizeUrl(state: string): string {
  const p = new URLSearchParams({
    client_id: FACEBOOK.appId,
    redirect_uri: FACEBOOK.redirectUri,
    state,
    response_type: 'code',
  });
  p.set('auth_type', 'rerequest');
  if (FACEBOOK.configId) p.set('config_id', FACEBOOK.configId);
  else p.set('scope', FACEBOOK.scopes.join(','));
  return `https://www.facebook.com/${FACEBOOK.graphVersion}/dialog/oauth?${p}`;
}

export function instagramAuthorizeUrl(state: string): string {
  const p = new URLSearchParams({
    client_id: INSTAGRAM.appId,
    redirect_uri: INSTAGRAM.redirectUri,
    response_type: 'code',
    scope: INSTAGRAM.scopes.join(','),
    state,
  });
  return `https://www.instagram.com/oauth/authorize?${p}`;
}

export interface ConnectResult {
  success: boolean;
  channel?: string;
  name?: string;
  slug?: string;
  message?: string;
  needs_page_choice?: boolean;
  pages?: { id: string; name: string }[];
  /** Optional: an https link that opens a chat with the connected account (shown under the confirmation). */
  link?: string;
  /** Optional, per channel: what the "open chat" link is made from when the endpoint gives no link. */
  username?: string;            // Telegram bot, Instagram account, Facebook Page username
  page_id?: string;             // Facebook Page id
  wa_number?: string;           // WhatsApp number, e.g. "+31 6 1234 5678"
  display_phone_number?: string;
  add_friend?: string;          // LINE: basic id "@abc1234d" or a https://lin.ee/… / https://line.me/… link
}

export async function postJson(url: string, data: unknown): Promise<ConnectResult> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const text = await res.text();
    try {
      return JSON.parse(text) as ConnectResult;
    } catch {
      return { success: false, message: `Unexpected server response (HTTP ${res.status}).` };
    }
  } catch {
    return { success: false, message: 'Could not reach the DM2find server. Check your connection and try again.' };
  }
}

/** A link shown under the status text, e.g. "Open @yourbot in Telegram". Only https links are shown. */
export interface StatusLink {
  href: string;
  label: string;
}

/** Status box helper: kind = 'busy' | 'ok' | 'error'. Uses textContent only. */
export function setStatus(el: HTMLElement, kind: 'busy' | 'ok' | 'error', title: string, detail = '', link?: StatusLink): void {
  el.dataset.kind = kind;
  el.hidden = false;
  el.replaceChildren();
  const h = document.createElement('strong');
  h.textContent = title;
  el.append(h);
  if (detail) {
    const p = document.createElement('p');
    p.textContent = detail;
    el.append(p);
  }
  if (link && /^https:\/\/[^\s]+$/i.test(link.href)) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = link.href;
    a.textContent = link.label;
    a.target = '_blank';
    a.rel = 'noopener';
    a.className = 'status-link';
    p.append(a);
    el.append(p);
  }
}

/** The endpoint's own "open chat" link, when it is a https link. */
export function endpointLink(r: ConnectResult, label: string): StatusLink | undefined {
  const href = String(r.link ?? '').trim();
  return /^https:\/\/[^\s]+$/i.test(href) ? { href, label } : undefined;
}

/** wa.me link from the first value that is a phone number in international format (7–15 digits). */
export function whatsappLink(...candidates: (string | undefined)[]): StatusLink | undefined {
  for (const c of candidates) {
    const m = String(c ?? '').replace(/[\s().-]/g, '').match(/^\+?([1-9][0-9]{6,14})$/);
    if (m) return { href: `https://wa.me/${m[1]}`, label: `Open +${m[1]} in WhatsApp ↗` };
  }
  return undefined;
}

/** LINE add-friend link from a basic or premium id ("@abc1234d") or a lin.ee / line.me link. */
export function lineAddFriendLink(addFriend?: string): StatusLink | undefined {
  const s = String(addFriend ?? '').trim();
  const label = 'Add the account as a friend in LINE ↗';
  if (/^https:\/\/(lin\.ee|line\.me|page\.line\.me)\/[^\s]+$/i.test(s)) return { href: s, label };
  const m = s.match(/^@([a-z0-9._-]{3,20})$/i);
  return m ? { href: `https://line.me/R/ti/p/${encodeURIComponent('@' + m[1])}`, label } : undefined;
}

/** m.me link from a Facebook Page id (digits) or Page username (letters, digits, dots). */
export function messengerLink(...candidates: (string | undefined)[]): StatusLink | undefined {
  for (const c of candidates) {
    const s = String(c ?? '').trim().replace(/^@/, '');
    if (/^[0-9]{5,20}$/.test(s) || /^[A-Za-z0-9.]{5,50}$/.test(s) && /[A-Za-z]/.test(s)) {
      return { href: `https://m.me/${s}`, label: 'Open the chat in Messenger ↗' };
    }
  }
  return undefined;
}

/** ig.me link from an Instagram username ("@name" or "name"; letters, digits, _ and .). */
export function instagramLink(username?: string): StatusLink | undefined {
  const m = String(username ?? '').trim().match(/^@?([A-Za-z0-9._]{1,30})$/);
  return m ? { href: `https://ig.me/m/${m[1]}`, label: `Open @${m[1]} in Instagram ↗` } : undefined;
}

/** t.me link for a bot username as the connect endpoint returns it ("@yourbot" or "yourbot").
 *  Telegram bot usernames: 5–32 characters, letters, digits and _, starting with a letter, ending in "bot". */
export function telegramBotLink(name?: string): StatusLink | undefined {
  const m = String(name ?? '').trim().match(/^@?([A-Za-z][A-Za-z0-9_]{3,31})$/);
  if (!m || !/bot$/i.test(m[1])) return undefined;
  return { href: `https://t.me/${m[1]}`, label: `Open @${m[1]} in Telegram ↗` };
}
