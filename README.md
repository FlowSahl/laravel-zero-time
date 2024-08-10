# Laravel Zero Downtime Deployment

## Overview
This GitHub Action helps you deploy your project to a remote server with zero downtime, ensuring that your application remains available during deployments.

## Features
- **Zero Downtime Deployment**: Ensure uninterrupted service during deployments.
- **Easy Integration**: Simple setup and integration into your existing workflow.
- **Flexible Deployment**: Suitable for projects of all sizes, from personal projects to enterprise applications.
- **Custom Scripts**: Run custom scripts before and after key deployment steps.
- **Secure**: Uses GitHub Secrets for sensitive data like server credentials and GitHub tokens.
- **Environment File Sync**: Sync environment variables with the remote server.

## Example Usage
You can use our [Setuper](https://deployer.flowsahl.com/setuper) by filling out the form, and we will handle the setup, workflow creation, and secrets configuration. Alternatively, you can manually set up your workflow using the `FlowSahl/laravel-zero-time@v1.0.0` action:

> **Important:**  
> You need to add the following secrets to your repository:

- **GH_TOKEN**: You'll need to provide the action with a **Personal Access Token (PAT)** with the `repo` permission.
  [How to create a PAT](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic)
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
        uses: FlowSahl/laravel-zero-time@v1.0.0
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

## Support
If you need help or have any questions, feel free to reach out at [Discussion](https://github.com/FlowSahl/laravel-zero-time/discussions).

## This GitHub Action Is Sponsorware 💰💰💰
Originally, this GitHub action was only available to my sponsors on GitHub Sponsors until I reached 100 sponsors.

<!-- Now that we've reached the goal, the GitHub action is fully open source. -->

Enjoy, and thanks for the support! ❤️ [Become a sponsor](https://github.com/sponsors/FlowSahl) 

Learn more about Sponsorware at [Sponsorware documentation](https://github.com/sponsorware/docs) 💰.

## Custom Scripts
You can provide custom scripts to run at various stages of the deployment. Below are the supported stages where you can run your scripts:

- **Before Checking Folders**: `command_script_before_check_folders`
- **After Checking Folders**: `command_script_after_check_folders`
- **Before Downloading Release**: `command_script_before_download`
- **After Downloading Release**: `command_script_after_download`
- **Before Activating Release**: `command_script_before_activate`
- **After Activating Release**: `command_script_after_activate`

## Troubleshooting
If you encounter issues, check the GitHub Actions logs for detailed error messages. Ensure that:
- SSH credentials are correct.
- The target directory on the remote server has the necessary permissions.
- The specified Git commit SHA exists in your repository.

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

## Security
Ensure that sensitive data such as server credentials and GitHub tokens are stored securely using GitHub Secrets.

## License

This repository and the code within are proprietary. Access is granted to sponsors only. Please see the [LICENSE](LICENSE.md) file for more information.

## Contribution and Issues
If you encounter any issues or have suggestions for improvements, please open an issue or submit a pull request on the [GitHub repository](https://github.com/FlowSahl/laravel-zero-time).

---

This `README.md` reflects the changes made to your script, ensuring that the instructions are accurate and align with the updated code.