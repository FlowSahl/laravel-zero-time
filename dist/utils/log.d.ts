import { ConnectionOptions, Inputs } from '../types';
/** Logs a message with a timestamp */
export declare function log(message: string): void;
/** Logs input configurations */
export declare function logInputs(inputs: Inputs, connectionOptions: ConnectionOptions): void;
/** Logs an error message with a timestamp */
export declare function logError(message: string): void;
