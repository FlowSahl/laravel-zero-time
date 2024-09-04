import { ConnectionOptions, Inputs } from '../types';
import { logError } from './log';

/** Custom error class for validation errors */
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/** Validates the deployment configuration inputs */
export function validateConfig(inputs: Inputs) {
  try {
    if (!inputs.target) throw new ValidationError('Target directory is required.');
    if (!inputs.sha) throw new ValidationError('SHA is required.');
    if (!inputs.deploy_branch) throw new ValidationError('Deploy branch is required.');
    if (!inputs.githubRepoOwner) throw new ValidationError('GitHub repository owner is required.');
    if (!inputs.githubRepo) throw new ValidationError('GitHub repository is required.');
  } catch (error: any) {
    logError(error.message);
    throw error;
  }
}

/** Validates the SSH connection options */
export function validateConnectionOptions(connectionOptions: ConnectionOptions) {
  try {
    if (!connectionOptions.host) throw new ValidationError('Host is required.');
    if (!connectionOptions.username) throw new ValidationError('Username is required.');
    if (!connectionOptions.port) throw new ValidationError('Port is required.');
  } catch (error: any) {
    logError(error.message);
    throw error;
  }

  if (isNaN(Number(connectionOptions.port)) || connectionOptions.port < 1 || connectionOptions.port > 65535) {
    throw new ValidationError(
      `Port must be a valid number between 1 and 65535, Invalid port number: ${connectionOptions.port}`
    );
  }
}
