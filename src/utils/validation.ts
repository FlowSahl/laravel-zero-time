import { ConnectionOptions, Inputs } from '../types';

export function validateConfig(inputs: Inputs) {
  if (!inputs.target) throw new Error('Target directory is required.');
  if (!inputs.sha) throw new Error('SHA is required.');
}

export function validateConnectionOptions(connectionOptions: ConnectionOptions) {
  if (!connectionOptions.host) throw new Error('Host is required.');
  if (!connectionOptions.username) throw new Error('Username is required.');
  if (
    connectionOptions.port &&
    (isNaN(connectionOptions.port) || connectionOptions.port < 1 || connectionOptions.port > 65535)
  ) {
    throw new Error('Port must be a valid number between 1 and 65535.');
  }
}
