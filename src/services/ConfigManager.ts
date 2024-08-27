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

    validateConfig(this.getInputs());
    validateConnectionOptions(this.getConnectionOptions());
  }

  getInputs(): Inputs {
    return {
      target: process.env.TARGET || core.getInput('target'),
      sha: process.env.SHA || core.getInput('sha'),
      deploy_branch: process.env.GITHUB_DEPLOY_BRANCH || core.getInput('deploy_branch'),
      envFile: process.env.ENV_FILE || core.getInput('env_file'),
      commandScriptBeforeCheckFolders:
        process.env.COMMAND_SCRIPT_BEFORE_CHECK_FOLDERS || core.getInput('command_script_before_check_folders'),
      commandScriptAfterCheckFolders:
        process.env.COMMAND_SCRIPT_AFTER_CHECK_FOLDERS || core.getInput('command_script_after_check_folders'),
      commandScriptBeforeDownload:
        process.env.COMMAND_SCRIPT_BEFORE_DOWNLOAD || core.getInput('command_script_before_download'),
      commandScriptAfterDownload:
        process.env.COMMAND_SCRIPT_AFTER_DOWNLOAD || core.getInput('command_script_after_download'),
      commandScriptBeforeActivate:
        process.env.COMMAND_SCRIPT_BEFORE_ACTIVATE || core.getInput('command_script_before_activate'),
      commandScriptAfterActivate:
        process.env.COMMAND_SCRIPT_AFTER_ACTIVATE || core.getInput('command_script_after_activate'),
      githubRepoOwner: process.env.GITHUB_REPO_OWNER || github.context.payload.repository?.owner?.login || '',
      githubRepo: process.env.GITHUB_REPO || github.context.payload.repository?.name || '',
    };
  }

  getConnectionOptions(): ConnectionOptions {
    return {
      host: process.env.HOST || core.getInput('host'),
      username: process.env.REMOTE_USERNAME || core.getInput('username'),
      port: parseInt(process.env.PORT || core.getInput('port') || '22'),
      password: process.env.PASSWORD || core.getInput('password'),
      privateKey: (process.env.SSH_KEY || core.getInput('ssh_key')).replace(/\\n/g, '\n'),
      passphrase: process.env.SSH_PASSPHRASE || core.getInput('ssh_passphrase'),
    };
  }

  getTarget(): string {
    return process.env.TARGET || core.getInput('target');
  }

  getSha(): string {
    return process.env.SHA || core.getInput('sha');
  }
}
