import { Injectable } from '@angular/core';
import { RuntimeConfiguration } from '../../core/configuration/RuntimeConfiguration';

const noop = (): any => undefined;

enum LogLevel {
  none = 0,
  debug = 1,
  info = 2,
  warn = 3,
  error = 4,
}

@Injectable()
export class Logger {

  private _logLevel: LogLevel;

  constructor(private _runtime: RuntimeConfiguration) {
    let lvl = _runtime.logLevel;
    if (!_runtime.logLevel) {
      lvl = 'none';
    }
    this._logLevel = LogLevel[lvl];
  }

  get debug(): (msg: string, event?: any) => void {
    if (this.isEnabledFor(LogLevel.debug)) {
      return console.info.bind(console);
    } else {
      return noop;
    }
  }

  get info(): (msg: string, event?: any) => void {
    if (this.isEnabledFor(LogLevel.info)) {
      return console.info.bind(console);
    } else {
      return noop;
    }
  }

  get warn(): (msg: string, event?: any) => void {
    if (this.isEnabledFor(LogLevel.warn)) {
      return console.warn.bind(console);
    } else {
      return noop;
    }
  }

  get error(): (msg: string, event?: any) => void {
    if (this.isEnabledFor(LogLevel.error)) {
      return console.error.bind(console);
    } else {
      return noop;
    }
  }

  private isEnabledFor(level: LogLevel): boolean {
    if (this._logLevel == LogLevel.none) {
      return false;
    }

    return level >= this._logLevel;
  }
}