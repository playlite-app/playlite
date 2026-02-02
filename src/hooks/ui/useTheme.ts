import { useEffect, useState } from 'react';

/**
 * Gerencia tema claro/escuro com persistência em localStorage.
 * Detecta preferência inicial do sistema ou valor salvo.
 *
 * @returns Objeto com:
 *   - isDark: true se modo escuro ativo
 *   - toggleTheme: Alterna tema e salva preferência
 */
export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    // Verifica localStorage ou preferência do sistema ao iniciar
    if (typeof window !== 'undefined') {
      return (
        document.documentElement.classList.contains('dark') ||
        localStorage.getItem('theme') === 'dark'
      );
    }

    return true;
  });

  useEffect(() => {
    const root = document.documentElement;

    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);
  const toggleTheme = () => setIsDark(!isDark);

  return { isDark, toggleTheme };
}
