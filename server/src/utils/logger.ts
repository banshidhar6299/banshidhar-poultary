const SENSITIVE_KEYS = /password|token|secret|authorization|api[_-]?key|credit.?card/i;

/**
 * Recursively redact sensitive fields from objects for safe logging.
 */
const redactSensitive = (obj: any, depth = 0): any => {
  if (depth > 10 || obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return obj;
  if (Array.isArray(obj)) return obj.map((item) => redactSensitive(item, depth + 1));
  if (typeof obj === 'object') {
    const redacted: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (SENSITIVE_KEYS.test(key)) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redactSensitive(value, depth + 1);
      }
    }
    return redacted;
  }
  return obj;
};

const isProduction = () => process.env.NODE_ENV === 'production';

const formatMessage = (level: string, context: string, message: string, meta?: any): string => {
  const timestamp = new Date().toISOString();
  const safeMeta = meta ? ` ${JSON.stringify(redactSensitive(meta))}` : '';
  return `${timestamp} [${level}] [${context}]${message ? ` ${message}` : ''}${safeMeta}`;
};

export const logger = {
  info: (context: string, message: string, meta?: any) => {
    console.log(formatMessage('INFO', context, message, meta));
  },
  warn: (context: string, message: string, meta?: any) => {
    console.warn(formatMessage('WARN', context, message, meta));
  },
  error: (context: string, message: string, error?: any) => {
    const meta = error instanceof Error
      ? { message: error.message, ...(isProduction() ? {} : { stack: error.stack }) }
      : error;
    console.error(formatMessage('ERROR', context, message, meta));
  },
  /**
   * Debug level: only outputs in non-production.
   */
  debug: (context: string, message: string, meta?: any) => {
    if (!isProduction()) {
      console.log(formatMessage('DEBUG', context, message, meta));
    }
  },
  /** Redact utility exposed for tests */
  redactSensitive
};
