import { ConnectionOptions, Inputs } from '../types';

/** Logs a message with a timestamp */
export function log(message: string): void {
  const timestamp = new Date().toISOString();
  console.log(`[DEPLOYMENT][${timestamp}] ${message}`);
}

/** Logs input configurations */
export function logInputs(inputs: Inputs, connectionOptions: ConnectionOptions): void {
  log(`Host: ${connectionOptions.host}`);
  log(`Target Directory: ${inputs.target}`);
  log(`Commit SHA: ${inputs.sha}`);
  log(`GitHub Repository: ${inputs.githubRepoOwner}/${inputs.githubRepo}`);
  log(`Branch: ${inputs.deploy_branch}`);
}

/** Logs an error message with a timestamp */
export function logError(message: string): void {
  const timestamp = new Date().toISOString();
  console.error(`[DEPLOYMENT ERROR][${timestamp}] ${message}`);
}
