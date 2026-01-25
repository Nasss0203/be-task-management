import { LoggerService, LogLevel } from '@nestjs/common';
import chalk from 'chalk';
import dayjs from 'dayjs';
import { createLogger, format, Logger, transports } from 'winston';

const today = new Date();
const dateStr = today.toISOString().split('T')[0];

interface MyLoggerOptions {
  appName?: string;
  appColor?: keyof typeof chalk;
  level?: string;
  logDir?: string;
}

export class MyLogger implements LoggerService {
  private logger: Logger;
  private appName: string;
  private appColor: keyof typeof chalk;

  constructor(options: MyLoggerOptions = {}) {
    const {
      appName = 'NEST-APP',
      appColor = 'green',
      level = 'debug',
      logDir = 'logs',
    } = options;

    this.appName = appName;
    this.appColor = appColor;

    this.logger = createLogger({
      level,
      transports: [
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.printf(({ context, message, level, time }) => {
              const strApp = (chalk as any)[this.appColor](`[${this.appName}]`);
              const strContext = chalk.yellow(`[${context || 'App'}]`);
              return `${strApp} - ${time} - ${level} - ${strContext} - ${message}`;
            }),
          ),
        }),

        new transports.File({
          format: format.combine(format.timestamp(), format.json()),
          dirname: logDir,
          filename: `log-${dateStr}.dev.log`,
        }),
      ],
    });
  }

  private now() {
    return dayjs(Date.now()).format('DD/MM/YYYY HH:mm:ss');
  }

  log(message: string, context = 'App') {
    this.logger.log('info', message, { context, time: this.now() });
  }

  error(message: string, context = 'App') {
    this.logger.log('error', message, { context, time: this.now() });
  }

  warn(message: string, context = 'App') {
    this.logger.log('warn', message, { context, time: this.now() });
  }

  debug(message: string, context = 'App') {
    this.logger.log('debug', message, { context, time: this.now() });
  }

  verbose(message: string, context = 'App') {
    this.logger.log('verbose', message, { context, time: this.now() });
  }

  fatal(message: string, context = 'App') {
    this.logger.log('fatal', message, { context, time: this.now() });
  }

  setLogLevels?(levels: LogLevel[]) {}
}
