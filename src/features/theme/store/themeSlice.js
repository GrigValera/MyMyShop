import { createSlice } from '@reduxjs/toolkit';

const getInitialTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }
  // Проверяем системные настройки
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const initialState = {
  mode: getInitialTheme(),
};

const applyTheme = (mode) => {
  const body = document.body;
  body.classList.remove('light', 'dark');
  body.classList.add(mode);
  localStorage.setItem('theme', mode);
};

// Применяем начальную тему СРАЗУ
applyTheme(initialState.mode);

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      const newMode = state.mode === 'light' ? 'dark' : 'light';
      state.mode = newMode;
      applyTheme(newMode);
    },
    setTheme: (state, action) => {
      state.mode = action.payload;
      applyTheme(action.payload);
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;