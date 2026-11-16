try {
  const theme = localStorage.getItem('csb-theme');
  if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
} catch {
  // Storage can be blocked; the system theme applies.
}
