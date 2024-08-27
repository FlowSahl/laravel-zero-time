import { ConfigManager } from './services/ConfigManager';
import { DeploymentService } from './services/DeploymentService';
import { log } from './utils/log';

async function run(): Promise<void> {
  try {
    const config = new ConfigManager();
    const deploymentService = new DeploymentService(config);

    await deploymentService.deploy();
  } catch (error: any) {
    log(`Deployment failed: ${error.message}`);
  }
}

// Automatically run the deploy function when the script is executed
run();
