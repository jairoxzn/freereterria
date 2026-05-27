const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logFile = path.join(logDir, 'system.log');

function formatMessage(level, message) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}]: ${message}\n`;
}

const logger = {
  info: (message) => {
    const formatted = formatMessage('INFO', message);
    console.log(`\x1b[32m%s\x1b[0m`, formatted.trim()); // Verde
    fs.appendFileSync(logFile, formatted);
  },
  warn: (message) => {
    const formatted = formatMessage('WARN', message);
    console.log(`\x1b[33m%s\x1b[0m`, formatted.trim()); // Amarillo
    fs.appendFileSync(logFile, formatted);
  },
  error: (message, error) => {
    const errorDetails = error ? ` - Details: ${error.message}\n${error.stack}` : '';
    const formatted = formatMessage('ERROR', `${message}${errorDetails}`);
    console.error(`\x1b[31m%s\x1b[0m`, formatted.trim()); // Rojo
    fs.appendFileSync(logFile, formatted);
  },
  getLogs: () => {
    if (!fs.existsSync(logFile)) return [];
    const content = fs.readFileSync(logFile, 'utf8');
    return content.trim().split('\n').filter(Boolean);
  }
};

module.exports = logger;
