import { expect, request } from '@playwright/test';

export async function establishDefaultDemoProfile(testInfo) {
  const baseURL = testInfo.project.use.baseURL;
  const api = await request.newContext({ baseURL, extraHTTPHeaders: { Origin: baseURL } });
  try {
    const login = await api.post('/api/v1/session', {
      data: { email: 'demo@mymyshop.dev', password: 'DemoShop-2026!' },
    });
    expect(login.status()).toBe(201);
    const update = await api.patch('/api/v1/me', { data: { displayName: 'Demo User' } });
    expect(update.ok()).toBe(true);
    expect((await update.json()).displayName).toBe('Demo User');
    const profile = await api.get('/api/v1/me');
    expect(profile.ok()).toBe(true);
    expect((await profile.json()).displayName).toBe('Demo User');
    const logout = await api.delete('/api/v1/session');
    expect(logout.status()).toBe(204);
  } finally {
    await api.dispose();
  }
}
