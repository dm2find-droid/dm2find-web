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
    'pages_read_engagement',
    'business_management',
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

/** Status box helper: kind = 'busy' | 'ok' | 'error'. Uses textContent only. */
export function setStatus(el: HTMLElement, kind: 'busy' | 'ok' | 'error', title: string, detail = ''): void {
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
}
