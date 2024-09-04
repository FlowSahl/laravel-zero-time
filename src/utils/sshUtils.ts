import { NodeSSH } from 'node-ssh';
import { log } from './log';
import { ConnectionOptions, Paths } from '../types';

const ssh = new NodeSSH();

export const sshOperations = {
  async connect(
    { host, username, port, password, privateKey, passphrase }: ConnectionOptions,
    retries = 3
  ): Promise<void> {
    log('Connecting to the server...');

    const connectionOptions: ConnectionOptions = {
      host,
      username,
      port: port,
      privateKey: privateKey ? privateKey : undefined,
      passphrase: passphrase ? passphrase : undefined,
      password: password ? password : undefined,
    };

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
          if (password) {
            log('SSH key authentication password set Successfully');
        }
        
        log(`Attempting to connect to server (Attempt ${attempt})...`);
        await ssh.connect(connectionOptions);
        log('Connected successfully.');
        return; // Exit if successful
      } catch (error: any) {
        log(`Attempt ${attempt} failed: ${error.message}`);
        if (attempt === retries) {
          throw new Error(`Failed to connect to server after ${retries} attempts`);
        }
        await new Promise((res) => setTimeout(res, 1000 * attempt)); // Exponential backoff
      }
    }
  },

  async execute(command: string, paths: Paths, showCommandLog: boolean = false): Promise<void> {
    try {
      command = prepareCommand(command, paths);
      if (showCommandLog) log(`Executing command: ${command}`);
      const result = await ssh.execCommand(command);

      if (result.stdout) log(result.stdout);
      if (result.stderr) console.error(result.stderr);
      if (result.code !== 0) throw new Error(`Command "${command}" failed with code ${result.code}: ${result.stderr}`);

    } catch (error: any) {
      log(`Failed to execute command "${command}": ${error.message}`);
      throw error;
    }
  },

  dispose() {
    ssh.dispose();
  },
};

function prepareCommand(command: string, paths: Paths): string {
  const placeholders = {
    $THIS_RELEASE_PATH: paths.releasePath,
    $ACTIVE_RELEASE_PATH: `${paths.target}/current`,
  };

  for (const [placeholder, value] of Object.entries(placeholders)) {
    command = command.replace(new RegExp(placeholder, 'g'), value);
  }

  return command;
}
