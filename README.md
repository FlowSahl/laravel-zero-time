# Laravel Zero Downtime Deployment

## Overview
This GitHub Action helps you deploy your Laravel project to a remote server with zero downtime, ensuring that your application remains available during deployments. It offers flexibility, security, and ease of use, making it ideal for projects of all sizes.

## Features
- **Zero Downtime Deployment**: Ensure uninterrupted service during deployments.
- **Modular and Maintainable Code**: Well-organized code structure with TypeScript, making it easy to extend and maintain.
- **Customizable Workflow**: Easily integrate custom scripts at various stages of the deployment process.
- **Environment Validation**: Robust environment configuration validation using `joi`.
- **Secure Deployment**: Uses GitHub Secrets to securely manage sensitive data like server credentials and GitHub tokens.
- **Environment File Sync**: Automatically sync environment variables with the remote server.

## How It Works

The Laravel Zero Downtime Deployment action follows a series of carefully structured steps to ensure that your application remains online throughout the deployment process:

### Steps in the Deployment Process:

1. **Preparation of Directories:**
   - The action starts by preparing the necessary directories on the remote server. This includes creating a new directory for the release and ensuring that required subdirectories (e.g., storage, logs) are available.

2. **Optional Pre-Folder Script Execution:**
   - If specified, a custom script is executed before the folders are checked and prepared. This can be useful for tasks like cleaning up old files or performing pre-checks.

3. **Cloning the Repository:**
   - The specified branch of your GitHub repository is cloned into the newly prepared release directory on the remote server. This ensures that the latest code is deployed.

4. **Environment File Synchronization:**
   - The `.env` file is synchronized between your local setup and the remote server. This ensures that your application’s environment variables are consistent across deployments.

5. **Linking the Storage Directory:**
   - The storage directory is linked from the new release directory to ensure that persistent data (like uploaded files) is shared across all releases.

6. **Optional Post-Download Script Execution:**
   - If specified, a custom script is executed after the repository is cloned and the environment is set up. This can be used for tasks like installing dependencies, running database migrations, or optimizing the application.

7. **Activating the New Release:**
   - The symbolic link to the current release is updated to point to the new release directory. This is the step where the new version of your application goes live without any downtime.

8. **Cleaning Up Old Releases:**
   - Old release directories are cleaned up, typically keeping only the last few releases to save space on the server.

9. **Optional Post-Activation Script Execution:**
   - If specified, a custom script is executed after the new release is activated. This is often used to perform final optimizations or notify external services of the new deployment.

By following these steps, the action ensures that your application is deployed smoothly, with zero downtime and minimal risk.

## Inputs

| Name                               | Description                                    | Required | Default |
|------------------------------------|------------------------------------------------|----------|---------|
| `host`                             | Remote server host                             | Yes      |         |
| `username`                         | Remote server username                         | Yes      |         |
| `password`                         | Remote server password                         | Yes      |         |
| `port`                             | Remote server port                             | Yes      | `22`    |
| `target`                           | Remote server target path                      | Yes      |         |
| `sha`                              | Git commit SHA to deploy (use `${{ github.sha }}`) | Yes      |         |
| `github_token`                     | GitHub token                                   | Yes      |         |
| `env_file`                         | Content of the environment file to sync with `.env` | No   |         |
| `command_script_before_check_folders` | Script to run before checking folders       | No       | `false` |
| `command_script_after_check_folders`  | Script to run after checking folders        | No       | `false` |
| `command_script_before_download`      | Script to run before downloading release    | No       | `false` |
| `command_script_after_download`       | Script to run after downloading release     | No       | `false` |
| `command_script_before_activate`      | Script to run before activating release     | No       | `false` |
| `command_script_after_activate`       | Script to run after activating release      | No       | `false` |

## Example Usage
You can use our [Setuper](https://deployer.flowsahl.com/setuper) by filling out the form, and we will handle the setup, workflow creation, and secrets configuration. Alternatively, you can manually set up your workflow using the `FlowSahl/laravel-zero-time@v1.0.3` action:

> **Important:**  
> You need to add the following secrets to your repository:

- **REMOTE_HOST**: The host of the server.
- **REMOTE_USER**: The username for the server.
- **REMOTE_PASSWORD**: The password for the server.
- **REMOTE_PORT**: The port for the server.
- **ENV_FILE**: The content of the environment file to sync with `.env`.

### Notes
- The `target` input should be the path to the directory where the project will be deployed on the server (e.g., `/home/www/test.com`).
- The `target/current/public` directory should be the root of the domain.
- Use the `${{ github.sha }}` variable to pass the commit SHA to the `sha` input.

### Start Use with Laravel
To use this action in your workflow, add the following step in your GitHub Actions workflow file (`.github/workflows/your-workflow.yml`):

```yaml
name: deploy to server

concurrency:
  group: production
  cancel-in-progress: true

on:
  release:
    types: [released]

jobs:
  deployment:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Deploy Laravel project
        uses: FlowSahl/laravel-zero-time@v1.0.3
        with:
          host: ${{ secrets.REMOTE_HOST }}
          username: ${{ secrets.REMOTE_USER }}
          password: ${{ secrets.REMOTE_PASSWORD }}
          port: ${{ secrets.REMOTE_PORT }}
          target: '/home/www/test.com'             # Path to the directory where the project will be deployed
          sha: ${{ github.sha }}
          github_token: ${{ secrets.GH_TOKEN }}
          env_file: ${{ secrets.ENV_FILE }}
          # command_script_before_check_folders: ls -la
          # command_script_after_check_folders: ls -la
          # command_script_before_download: ls -la
          command_script_after_download: |
            cd $THIS_RELEASE_PATH
            composer install --prefer-dist
            php artisan migrate --force
            php artisan storage:link
          # command_script_before_activate:  ls -la
          command_script_after_activate: |
            cd $ACTIVE_RELEASE_PATH
            php artisan optimize
```
After setting up the workflow, create your first release, and you can monitor the deployment process in the Actions tab of your repository.

## Custom Scripts
You can provide custom scripts to run at various stages of the deployment. Below are the supported stages where you can run your scripts:

- **Before Checking Folders**: `command_script_before_check_folders`
- **After Checking Folders**: `command_script_after_check_folders`
- **Before Downloading Release**: `command_script_before_download`
- **After Downloading Release**: `command_script_after_download`
- **Before Activating Release**: `command_script_before_activate`
- **After Activating Release**: `command_script_after_activate`

## Testing
To ensure the reliability of your deployment process, unit and feature tests have been included in the codebase using Jest. Tests cover various components such as the `DeploymentService`, `ConfigManager`, and `sshUtils`. Running these tests can help identify issues early in the development process.

To run the tests:

```bash
npm run test
```

This will execute the suite of unit and feature tests, ensuring that all parts of the deployment process function correctly.

## Troubleshooting
If you encounter issues, check the GitHub Actions logs for detailed error messages. Ensure that:
- SSH credentials are correct.
- The target directory on the remote server has the necessary permissions.
- The specified Git commit SHA exists in your repository.

## Support
If you need help or have any questions, feel free to reach out at [Discussion](https://github.com/FlowSahl/laravel-zero-time/discussions).

## This GitHub Action Is Sponsorware 💰💰💰
Originally, this GitHub action was only available to my sponsors on GitHub Sponsors until I reached 100 sponsors.

<!-- Now that we've reached the goal, the GitHub action is fully open source. -->

Enjoy, and thanks for the support! ❤️ [Become a sponsor](https://github.com/sponsors/FlowSahl) 

Learn more about Sponsorware at [Sponsorware documentation](https://github.com/sponsorware/docs) 💰.

## Security
Ensure that sensitive data such as server credentials and GitHub tokens are stored securely using GitHub Secrets.

## License

This repository and the code within are proprietary. Access is granted to sponsors only. Please see the [LICENSE](LICENSE.md) file for more information.

## Contribution and Issues
If you encounter any issues or have suggestions for improvements, please open an issue or submit a pull request on the [GitHub repository](https://github.com/FlowSahl/laravel-zero-time).