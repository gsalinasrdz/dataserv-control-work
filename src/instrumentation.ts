export async function register() {
  // Solo en el runtime de Node.js (no en edge), y solo en producción o si EMAIL_PASS está definido
  if (process.env['NEXT_RUNTIME'] === 'nodejs') {
    const { startEmailWatcher } = await import('@/lib/email/watcher');
    startEmailWatcher();
  }
}
