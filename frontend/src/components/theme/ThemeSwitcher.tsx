import { useEffect } from 'react';
import { motion } from 'motion/react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';

const ThemeSwitcher: React.FC = () => {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  // 确保组件挂载时主题被正确应用
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div
      className={`relative w-16 h-8 rounded-full p-1 cursor-pointer transition-colors duration-300 ${
        isDark ? 'bg-slate-700' : 'bg-slate-600'
      }`}
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle theme"
    >
      <motion.div
        className="w-6 h-6 bg-white rounded-full shadow-sm flex items-center justify-center"
        layout
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30
        }}
        style={{
          x: isDark ? 32 : 0
        }}
      >
        <motion.div
          key={theme}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {isDark ? (
            <Moon className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500/20" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ThemeSwitcher;
