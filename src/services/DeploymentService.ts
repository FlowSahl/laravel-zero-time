import { sshOperations } from '../utils/sshUtils';
import { log, logInputs } from '../utils/log';
import { ConfigManager } from './ConfigManager';
import { Inputs, Paths } from '../types';
import * as core from '@actions/core';
import * as github from '@actions/github';
import axios from 'axios';

export class DeploymentService {
  private paths: Paths;

  private deployDate = new Date().toISOString();

  constructor(private config: ConfigManager) {
    this.paths = this.getPaths(config.getTarget(), config.getSha());
  }

  async deploy(): Promise<void> {
    try {
      await this.checkSponsorship(this.config.getInputs().githubRepoOwner ?? '');

      logInputs(this.config.getInputs(), this.config.getConnectionOptions());

      log('Starting deployment...');

      await sshOperations.connect(this.config.getConnectionOptions());

      await this.prepareDeployment();

      await this.activateRelease();

      log('Deployment completed successfully!');
    } catch (error: any) {
      if (error instanceof Error) {
        // Type guard for Error
        log(`Deployment failed: ${error.message}`);
        log(error.stack?.toString() ?? 'No Error Stack trace'); // Stack trace for detailed error information
      } else {
        log('An unknown error occurred during deployment.');
      }
      core.setFailed(error.message || 'An unknown error occurred');
      throw error; // Re-throw the error after handling
    } finally {
      sshOperations.dispose();
    }
  }

  private async checkSponsorship(githubRepoOwner: string) {
    try {
      const response = await axios.post('https://deployer.flowsahl.com/api/check-github-sponsorship', {
        github_username: githubRepoOwner,
      });
      log('Thanks for sponsoring us :)');
    } catch (error: any) {
      this.handleSponsorshipError(error);
    }
  }

  private handleSponsorshipError(error: any) {
    if (error.response) {
      if (error.response.status === 403) {
        throw new Error(
          'You are not a sponsor. Please consider sponsoring us to use this action: https://github.com/sponsors/FlowSahl. Start sponsoring us and try again [1$ or more].'
        );
      } else if (error.response.status === 500) {
        log('An internal server error occurred while checking sponsorship, but the deployment will continue.');
      } else {
        log(`Sponsorship check failed with status ${error.response.status}: ${error.response.data}`);
        throw new Error('Sponsorship check failed. Please try again later.');
      }
    } else if (axios.isAxiosError(error)) {
      log(`Axios error: ${error.message}`);
    } else {
      log('Non-Axios error occurred during sponsorship check');
      log('An unknown error occurred during the sponsorship check.');
      // throw error;
    }
  }
  
  private async prepareDeployment(): Promise<void> {
    // 1. Run any user-specified script before checking folders
    await this.runOptionalScript(this.config.getInputs().commandScriptBeforeCheckFolders, 'before check folders');

    // 2. Ensure the necessary folders exist and are clean
    log('Preparing deployment directories...');
    await this.checkAndPrepareFolders(this.paths);

    await this.runOptionalScript(this.config.getInputs().commandScriptAfterCheckFolders, 'after check folders');

    // 3. Clone the repository into the new release directory
    log('Cloning repository...');
    await this.cloneAndPrepareRepository(this.config.getInputs(), this.paths);

    // 4. Sync the environment file if provided
    if (this.config.getInputs().envFile) {
      log('Syncing environment file...');
      await this.syncEnvironmentFile(this.config.getInputs().envFile ?? '', this.paths);
    }

    // 5. Link the storage directory to the new release
    log('Linking storage...');
    await this.linkStorage(this.paths);

    // 6. Run any user-specified script after download
    await this.runOptionalScript(this.config.getInputs().commandScriptAfterDownload, 'after download');
  }

  private async checkAndPrepareFolders(paths: Paths): Promise<void> {
    const folders = [
      `${paths.target}/releases`,
      `${paths.target}/storage`,
      `${paths.target}/storage/app`,
      `${paths.target}/storage/app/public`,
      `${paths.target}/storage/logs`,
      `${paths.target}/storage/framework`,
      `${paths.target}/storage/framework/cache`,
      `${paths.target}/storage/framework/sessions`,
      `${paths.target}/storage/framework/views`,
    ];

    await Promise.all([
      sshOperations.execute(`mkdir -p ${folders.join(' ')}`, paths),
      sshOperations.execute(`rm -rf ${paths.target}/releases/${paths.sha}`, paths),
    ]);
  }

  private async cloneAndPrepareRepository(inputs: Inputs, paths: Paths): Promise<void> {
    await this.runOptionalScript(inputs.commandScriptBeforeDownload, 'before clone');

    const repoUrl = `git@github.com:${inputs.githubRepoOwner}/${inputs.githubRepo}.git`;

    await sshOperations.execute(`cd ${paths.target}`, paths);
    await sshOperations.execute(`rm -rf ${paths.releasePath}`, paths);
    await sshOperations.execute(`git clone -b ${inputs.deploy_branch} ${repoUrl} ${paths.releasePath}`, paths);
    await sshOperations.execute(`cd ${paths.releasePath}`, paths);
  }

  private async syncEnvironmentFile(envFile: string, paths: Paths): Promise<void> {
    log('Syncing .env file');

    await sshOperations.execute(`echo '${envFile}' > ${paths.target}/.env`, paths);
    await sshOperations.execute(`ln -sfn ${paths.target}/.env ${paths.releasePath}/.env`, paths);
  }

  private async linkStorage(paths: Paths): Promise<void> {
    await sshOperations.execute(`ln -sfn ${paths.target}/storage ${paths.releasePath}/storage`, paths);
  }

  private async runOptionalScript(script: string | undefined, description: string): Promise<void> {
    if (script && script !== 'false') {
      log(`Running script ${description}: ${script}`);
      await sshOperations.execute(script, this.paths);
    } else {
      log(`No script to run for ${description}`);
    }
  }

  private async activateRelease(): Promise<void> {
    log('Activating the new release...');

    // 1. Run any user-specified script before activation
    await this.runOptionalScript(this.config.getInputs().commandScriptBeforeActivate, 'before activate');

    // 2. Switch the symbolic link to point to the new release
    await sshOperations.execute(`ln -sfn ${this.paths.releasePath} ${this.paths.activeReleasePath}`, this.paths);

    // 3. Clean up old releases, keeping the last three
    await sshOperations.execute(`ls -1dt ${this.paths.target}/releases/*/ | tail -n +4 | xargs rm -rf`, this.paths);

    // 4. Run any user-specified script after activation
    await this.runOptionalScript(this.config.getInputs().commandScriptAfterActivate, 'after activate');
  }

  private getPaths(target: string, sha: string): Paths {
    return {
      target: target,
      sha: sha,
      releasePath: `${target}/releases/${sha}-${this.deployDate}`,
      activeReleasePath: `${target}/current`,
    };
  }
}
