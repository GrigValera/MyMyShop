// MOCK API - имитация работы сервера
// Используется для разработки и тестирования
// При переходе на реальный бэкенд использовать НЕ нужно

const MOCK_DELAY = 500;

const STORAGE_KEYS = {
  USERS: 'mock_users',
  CURRENT_USER: 'mock_current_user',
  TOKEN: 'mock_token'
};

const initMockUsers = () => {
  const users = localStorage.getItem(STORAGE_KEYS.USERS);
  if (!users) {
    const defaultUsers = [
      {
        id: '1',
        email: 'user@example.com',
        password: 'user123',
        name: 'Demo User',
        role: 'user',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        email: 'admin@example.com',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin',
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
  }
};

initMockUsers();

const delay = (ms = MOCK_DELAY) => new Promise(resolve => setTimeout(resolve, ms));

const generateToken = (user) => {
  return btoa(JSON.stringify({ id: user.id, email: user.email, role: user.role, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }));
};

const verifyToken = (token) => {
  try {
    const payload = JSON.parse(atob(token));
    return payload.exp > Date.now();
  } catch {
    return false;
  }
};

export const mockApi = {
  register: async (email, password, name) => {
    await delay();
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    if (users.find(u => u.email === email)) {
      return { success: false, error: 'User already exists' };
    }
    const newUser = {
      id: Date.now().toString(),
      email,
      password,
      name,
      role: 'user',
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    const token = generateToken(newUser);
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role
    }));
    return {
      success: true,
      data: { user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role }, token }
    };
  },

  login: async (email, password) => {
    await delay();
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return { success: false, error: 'Invalid email or password' };
    const token = generateToken(user);
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }));
    return { success: true, data: { user: { id: user.id, email: user.email, name: user.name, role: user.role }, token } };
  },

  logout: async () => {
    await delay();
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    return { success: true };
  },

  getCurrentUser: async () => {
    await delay();
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token || !verifyToken(token)) return { success: false, error: 'No valid token' };
    const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'null');
    return { success: true, data: user };
  },

  updateProfile: async (updates) => {
    await delay();
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token || !verifyToken(token)) return { success: false, error: 'Unauthorized' };
    const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'null');
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updates };
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify({ ...currentUser, ...updates }));
    }
    return { success: true, data: { ...currentUser, ...updates } };
  }
};