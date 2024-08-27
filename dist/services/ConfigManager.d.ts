import { Inputs, ConnectionOptions } from '../types';
export declare class ConfigManager {
    constructor();
    getInputs(): Inputs;
    getConnectionOptions(): ConnectionOptions;
    getTarget(): string;
    getSha(): string;
}
