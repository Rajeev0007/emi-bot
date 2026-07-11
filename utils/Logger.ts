/**
 * @file Logger.ts
 * @description Colourised console logger with timestamps and log levels.
 */

import fs   from 'fs';
import path from 'path';

const LEVELS: Record<string, number> = { error: 0, warn: 1, info: 2, debug: 3 };

const COLOURS = {
  reset:  '\x1b[0m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  grey:   '\x1b[90m',
  green:  '\x1b[32m',
  white:  '\x1b[37m',
  bold:   '\x1b[1m',
};

const LEVEL_STYLES: Record<string, string> = {
  error: `${COLOURS.red}${COLOURS.bold}ERROR${COLOURS.reset}`,
  warn:  `${COLOURS.yellow}${COLOURS.bold} WARN${COLOURS.reset}`,
  info:  `${COLOURS.cyan}${COLOURS.bold} INFO${COLOURS.reset}`,
  debug: `${COLOURS.grey}${COLOURS.bold}DEBUG${COLOURS.reset}`,
};

class Logger {
  private _level:   number;
  private _logFile: string | null;

  constructor(options: { level?: string; logFile?: string } = {}) {
    this._level   = LEVELS[options.level ?? 'info'] ?? 2;
    this._logFile = options.logFile ?? null;

    if (this._logFile) {
      fs.mkdirSync(path.dirname(path.resolve(this._logFile)), { recursive: true });
    }
  }

  private _timestamp(): string {
    return new Date().toISOString().replace('T', ' ').slice(0, 19);
  }

  private _log(level: string, ...args: unknown[]): void {
    if (LEVELS[level] > this._level) return;
    const ts  = `${COLOURS.grey}[${this._timestamp()}]${COLOURS.reset}`;
    const lvl = LEVEL_STYLES[level];
    const msg = args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' ');
    console.log(`${ts} ${lvl} ${msg}`);

    if (this._logFile) {
      const plain = `[${this._timestamp()}] [${level.toUpperCase()}] ${msg}\n`;
      fs.appendFile(path.resolve(this._logFile), plain, () => {});
    }
  }

  error(...args: unknown[]): void { this._log('error', ...args); }
  warn(...args: unknown[]):  void { this._log('warn',  ...args); }
  info(...args: unknown[]):  void { this._log('info',  ...args); }
  debug(...args: unknown[]): void { this._log('debug', ...args); }

  ready(msg: string): void {
    console.log(`${COLOURS.green}${COLOURS.bold}[READY]${COLOURS.reset} ${msg}`);
  }

  command(name: string, user: string, guild: string): void {
    this.info(`CMD ${COLOURS.bold}/${name}${COLOURS.reset} » ${user} @ ${guild}`);
  }
}

export default new Logger({
  level:   process.env.LOG_LEVEL ?? 'info',
  logFile: 'logs/bot.log',
});
