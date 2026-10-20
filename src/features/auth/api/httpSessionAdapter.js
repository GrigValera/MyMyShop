async function request(method, credentials) {
  const response = await fetch('/api/v1/session', {
    method, credentials: 'same-origin', cache: 'no-store',
    ...(credentials ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(credentials) } : {}),
  });
  if (response.status === 401 && method === 'POST') return { status: 'invalid_credentials' };
  if (!response.ok) throw new Error('session unavailable');
  if (response.status === 204) return null;
  const dto = await response.json();
  return dto.status === 'authenticated'
    ? { status: 'authenticated', user: { id: dto.user.id, name: dto.user.name }, mode: dto.mode, error: null, canDemoSignIn: dto.capabilities?.demoSignIn === true }
    : { status: 'anonymous', user: null, mode: null, error: null, canDemoSignIn: dto.capabilities?.demoSignIn === true };
}

export const httpSessionAdapter = {
  restore: () => request('GET'),
  start: credentials => request('POST', credentials),
  end: () => request('DELETE'),
};
