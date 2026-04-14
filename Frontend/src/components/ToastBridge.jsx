import { ToastContainer } from 'react-toastify';
import { useTheme } from '../context/ThemeContext';

export default function ToastBridge() {
  const { isDark } = useTheme();
  return (
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      theme={isDark ? 'dark' : 'light'}
      limit={5}
      containerStyle={{ zIndex: 100050 }}
    />
  );
}
