import { NodeSSH } from 'node-ssh';
import { log } from './log';
import { ConnectionOptions, Paths } from '../types';

const ssh = new NodeSSH();

export const sshOperations = {
  async connect({ host, username, port, password, privateKey, passphrase }: ConnectionOptions): Promise<void> {
    log('Connecting to the server...');

    const connectionOptions: ConnectionOptions = {
      host,
      username,
      port: port,
      privateKey: privateKey ? privateKey : undefined,
      passphrase: passphrase ? passphrase : undefined,
      password: password ? password : undefined,
    };

    try {
      if (password) {
        log('SSH key authentication password set Successfully');
      }

      await ssh.connect(connectionOptions);
    } catch (keyError: any) {
      log(`Failed to connect with SSH key: ${keyError.message}`);
      throw keyError;
    }
  },

  async execute(command: string, paths: Paths, showCommandLog: boolean = false): Promise<void> {
    try {
      command = prepareCommand(command, paths);

      if (showCommandLog) log(`Executing command: ${command}`);

      const result = await ssh.execCommand(command);

      if (result.stdout) log(result.stdout);
      if (result.stderr) console.error(result.stderr);
      if (result.code !== 0) throw new Error(`Command failed: ${command} - ${result.stderr}`);
    } catch (error: any) {
      throw new Error(`Failed to execute command: ${command} - ${error.message}`);
    }
  },

  dispose() {
    ssh.dispose();
  },
};

function prepareCommand(command: string, paths: Paths): string {
  return command
    .replace(/\$THIS_RELEASE_PATH/g, paths.releasePath)
    .replace(/\$ACTIVE_RELEASE_PATH/g, `${paths.target}/current`);
}
