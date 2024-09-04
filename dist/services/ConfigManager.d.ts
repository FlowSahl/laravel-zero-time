import { Inputs, ConnectionOptions } from '../types';
export declare class ConfigManager {
    constructor();
    private getInputOrEnv;
    getInputs(): Inputs;
    getConnectionOptions(): ConnectionOptions;
    getTarget(): string;
    getSha(): string;
}
