import * as core from '@actions/core';
import * as github from '@actions/github';
import { validateConfig, validateConnectionOptions } from '../utils/validation';
import { Inputs, ConnectionOptions } from '../types';
import dotenv from 'dotenv';

export class ConfigManager {
  constructor() {
    // Load environment variables from .env file in development mode
    if (process.env.NODE_ENV !== 'production') {
      dotenv.config();
    }

    try {
      validateConfig(this.getInputs());
      validateConnectionOptions(this.getConnectionOptions());
    } catch (error: any) {
      core.setFailed(`Configuration validation failed: ${error.message}`);
      throw error; // Re-throw if necessary for upstream handling
    }
  }

  private getInputOrEnv(key: string, envKey: string): string {
    return process.env[envKey] || core.getInput(key);
  }

  getInputs(): Inputs {
    return {
      target: this.getInputOrEnv('target', 'TARGET'),
      sha: this.getInputOrEnv('sha', 'SHA'),
      deploy_branch: this.getInputOrEnv('deploy_branch', 'GITHUB_DEPLOY_BRANCH'),
      envFile: this.getInputOrEnv('env_file', 'ENV_FILE'),
      commandScriptBeforeCheckFolders: this.getInputOrEnv(
        'command_script_before_check_folders',
        'COMMAND_SCRIPT_BEFORE_CHECK_FOLDERS'
      ),
      commandScriptAfterCheckFolders: this.getInputOrEnv(
        'command_script_after_check_folders',
        'COMMAND_SCRIPT_AFTER_CHECK_FOLDERS'
      ),
      commandScriptBeforeDownload: this.getInputOrEnv(
        'command_script_before_download',
        'COMMAND_SCRIPT_BEFORE_DOWNLOAD'
      ),
      commandScriptAfterDownload: this.getInputOrEnv('command_script_after_download', 'COMMAND_SCRIPT_AFTER_DOWNLOAD'),
      commandScriptBeforeActivate: this.getInputOrEnv(
        'command_script_before_activate',
        'COMMAND_SCRIPT_BEFORE_ACTIVATE'
      ),
      commandScriptAfterActivate: this.getInputOrEnv('command_script_after_activate', 'COMMAND_SCRIPT_AFTER_ACTIVATE'),
      githubRepoOwner:
        this.getInputOrEnv('github_repo_owner', 'GITHUB_REPO_OWNER') ||
        github.context.payload.repository?.owner?.login ||
        '',
      githubRepo: this.getInputOrEnv('github_repo', 'GITHUB_REPO') || github.context.payload.repository?.name || '',
    };
  }

  getConnectionOptions(): ConnectionOptions {
    return {
      host: this.getInputOrEnv('host', 'HOST'),
      username: this.getInputOrEnv('username', 'REMOTE_USERNAME'),
      port: parseInt(this.getInputOrEnv('port', 'PORT')),
      password: this.getInputOrEnv('password', 'PASSWORD'),
      privateKey: this.getInputOrEnv('ssh_key', 'SSH_KEY').replace(/\\n/g, '\n'),
      passphrase: this.getInputOrEnv('ssh_passphrase', 'SSH_PASSPHRASE'),
    };
  }

  getTarget(): string {
    return this.getInputOrEnv('target', 'TARGET');
  }

  getSha(): string {
    return this.getInputOrEnv('sha', 'SHA');
  }
}
