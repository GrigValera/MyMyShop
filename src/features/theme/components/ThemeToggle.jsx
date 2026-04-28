import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../store/themeSlice';
import { ToggleSwitch } from '../../../shared/ui/ToggleSwitch/ToggleSwitch';

export const ThemeToggle = () => {
  const dispatch = useDispatch();
  const { mode } = useSelector((state) => state.theme);

  return (
    <ToggleSwitch
      checked={mode === 'dark'}
      onChange={() => dispatch(toggleTheme())}
      labelLeft="Light"
      labelRight="Dark"
    />
  );
};