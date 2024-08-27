import { ConnectionOptions, Paths } from '../types';
export declare const sshOperations: {
    connect({ host, username, port, password, privateKey, passphrase }: ConnectionOptions): Promise<void>;
    execute(command: string, paths: Paths, showCommandLog?: boolean): Promise<void>;
    dispose(): void;
};
