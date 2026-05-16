const timestamp = () => new Date().toISOString().replace('T', ' ').substring(0, 19);

export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[${timestamp()}] ℹ️  ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[${timestamp()}] ❌ ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[${timestamp()}] ⚠️  ${message}`, ...args);
  },
  success: (message: string, ...args: any[]) => {
    console.log(`[${timestamp()}] ✅ ${message}`, ...args);
  },
};