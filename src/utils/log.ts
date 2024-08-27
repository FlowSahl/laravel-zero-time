import { ConnectionOptions, Inputs } from '../types';

export function log(message: string): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

export function logInputs(inputs: Inputs, connectionOptions: ConnectionOptions) {
  log(`Host: ${connectionOptions.host}`);
  log(`Target: ${inputs.target}`);
  log(`SHA: ${inputs.sha}`);
  log(`GitHub Repo Owner: ${inputs.githubRepoOwner}`);
}
