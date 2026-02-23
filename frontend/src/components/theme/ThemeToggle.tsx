import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <motion.button
      onClick={toggleTheme}
      whileTap={{ scale: 0.85 }}
      className="relative w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-indigo-500/20 transition-shadow duration-300 outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme}
          initial={{ scale: 0.5, rotate: -90, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          exit={{ scale: 0.5, rotate: 90, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {isDark ? (
            <Moon className="w-5 h-5 text-indigo-400 fill-indigo-400/20" />
          ) : (
            <Sun className="w-5 h-5 text-amber-500 fill-amber-500/20" />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
};

export default ThemeToggle;
