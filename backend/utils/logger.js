import chalk from 'chalk';

class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  // Get timestamp for logs
  getTimestamp() {
    return new Date().toISOString();
  }

  // Format log message with timestamp and context
  formatMessage(level, message, context = {}) {
    const timestamp = this.getTimestamp();
    const contextStr = Object.keys(context).length > 0 ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  // Info level logging
  info(message, context = {}) {
    if (this.isDevelopment) {
      console.log(chalk.blue(this.formatMessage('INFO', message, context)));
    } else {
      console.log(this.formatMessage('INFO', message, context));
    }
  }

  // Success level logging
  success(message, context = {}) {
    if (this.isDevelopment) {
      console.log(chalk.green('✅ ' + this.formatMessage('SUCCESS', message, context)));
    } else {
      console.log('✅ ' + this.formatMessage('SUCCESS', message, context));
    }
  }

  // Warning level logging
  warn(message, context = {}) {
    if (this.isDevelopment) {
      console.warn(chalk.yellow('⚠️ ' + this.formatMessage('WARN', message, context)));
    } else {
      console.warn('⚠️ ' + this.formatMessage('WARN', message, context));
    }
  }

  // Error level logging
  error(message, error = null, context = {}) {
    const errorContext = {
      ...context,
      ...(error && {
        error: {
          message: error.message,
          stack: this.isDevelopment ? error.stack : undefined,
          name: error.name,
          code: error.code
        }
      })
    };

    if (this.isDevelopment) {
      console.error(chalk.red('❌ ' + this.formatMessage('ERROR', message, errorContext)));
      if (error && error.stack) {
        console.error(chalk.red(error.stack));
      }
    } else {
      console.error('❌ ' + this.formatMessage('ERROR', message, errorContext));
    }
  }

  // Debug level logging (only in development)
  debug(message, context = {}) {
    if (this.isDevelopment) {
      console.log(chalk.gray('🔍 ' + this.formatMessage('DEBUG', message, context)));
    }
  }

  // Request logging
  logRequest(req, res, next) {
    const startTime = Date.now();
    const originalSend = res.send;
    
    res.send = function(data) {
      const duration = Date.now() - startTime;
      const logContext = {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        ...(req.user && { userId: req.user._id, userRole: req.user.role })
      };

      if (res.statusCode >= 400) {
        logger.warn(`HTTP ${res.statusCode}`, logContext);
      } else {
        logger.info(`HTTP ${res.statusCode}`, logContext);
      }

      originalSend.call(this, data);
    };

    next();
  }

  // Database operation logging
  logDB(operation, collection, details = {}) {
    this.info(`Database ${operation}`, {
      collection,
      ...details
    });
  }

  // Authentication logging
  logAuth(action, details = {}) {
    this.info(`Auth ${action}`, details);
  }

  // Security logging
  logSecurity(event, details = {}) {
    this.warn(`Security: ${event}`, details);
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;
