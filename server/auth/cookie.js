export function cookieName(config) {
  return new URL(config.publicOrigin).protocol === 'https:' ? '__Host-mymyshop-session' : 'mymyshop-dev-session';
}

export function readSessionCookie(header, config) {
  if (typeof header !== 'string' || header.length > 8192) return null;
  const name = cookieName(config);
  const matches = header.split(';').map(part => part.trim()).filter(part => part.startsWith(`${name}=`));
  if (matches.length !== 1) return null;
  const token = matches[0].slice(name.length + 1);
  return /^[A-Za-z0-9_-]{43}$/.test(token) ? token : null;
}

export function sessionCookie(config, token = null) {
  const secure = new URL(config.publicOrigin).protocol === 'https:' ? '; Secure' : '';
  return `${cookieName(config)}=${token ?? ''}; Path=/; HttpOnly; SameSite=Lax${secure}${token ? '; Max-Age=604800' : '; Max-Age=0'}`;
}
