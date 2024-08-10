const core = require('@actions/core');
const github = require('@actions/github');
const { NodeSSH } = require('node-ssh');
const axios = require('axios');
const dotenv = require('dotenv');

const ssh = new NodeSSH();

// Load environment variables from .env file in development mode
if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

async function deploy() {
    try {
        const inputs = getInputs();
        validateInputs(inputs);
        logInputs(inputs);

        await checkSponsorship(inputs.githubRepoOwner);

        await sshOperations.connect(inputs);

        await prepareDeployment(inputs);

        await activateRelease(inputs);

        log("Deployment completed successfully!");
    } catch (error) {
        console.error(`Error: ${error.message}`);
        core.setFailed(error.message);
    } finally {
        ssh.dispose();
    }
}

function getInputs() {
    return {
        host: process.env.HOST || core.getInput('host'),
        username: process.env.REMOTE_USERNAME || core.getInput('username'),
        port: process.env.PORT || core.getInput('port'),
        password: process.env.PASSWORD || core.getInput('password'),
        sshKey: (process.env.SSH_KEY || core.getInput('ssh_key')).replace(/\\n/g, '\n'), // Replace escaped newlines with actual newlines
        passphrase: process.env.SSH_PASSPHRASE || core.getInput('ssh_passphrase'), // Add passphrase
        target: process.env.TARGET || core.getInput('target'),
        sha: process.env.SHA || core.getInput('sha'),
        deploy_branch: process.env.GITHUB_DEPLOY_BRANCH || core.getInput('deploy_branch'),
        githubToken: process.env.GITHUB_TOKEN || core.getInput('github_token'),
        envFile: process.env.ENV_FILE || core.getInput('env_file'),
        commandScriptBeforeCheckFolders: process.env.COMMAND_SCRIPT_BEFORE_CHECK_FOLDERS || core.getInput('command_script_before_check_folders'),
        commandScriptAfterCheckFolders: process.env.COMMAND_SCRIPT_AFTER_CHECK_FOLDERS || core.getInput('command_script_after_check_folders'),
        commandScriptBeforeDownload: process.env.COMMAND_SCRIPT_BEFORE_DOWNLOAD || core.getInput('command_script_before_download'),
        commandScriptAfterDownload: process.env.COMMAND_SCRIPT_AFTER_DOWNLOAD || core.getInput('command_script_after_download'),
        commandScriptBeforeActivate: process.env.COMMAND_SCRIPT_BEFORE_ACTIVATE || core.getInput('command_script_before_activate'),
        commandScriptAfterActivate: process.env.COMMAND_SCRIPT_AFTER_ACTIVATE || core.getInput('command_script_after_activate'),
        githubRepoOwner: process.env.GITHUB_REPO_OWNER || github.context.payload.repository.owner.login,
        githubRepo: process.env.GITHUB_REPO || github.context.payload.repository.name
    };
}

function validateInputs(inputs) {
    if (!inputs.host) throw new Error("Host is required.");
    if (!inputs.username) throw new Error("Username is required.");
    if (inputs.port && (isNaN(inputs.port) || inputs.port < 1 || inputs.port > 65535)) {
        throw new Error("Port must be a valid number between 1 and 65535.");
    }
    if (!inputs.target) throw new Error("Target directory is required.");
    if (!inputs.sha) throw new Error("SHA is required.");
    if (!inputs.githubToken) throw new Error("GitHub token is required.");
}

function log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
}

function logInputs(inputs) {
    log(`Host: ${inputs.host}`);
    log(`Target: ${inputs.target}`);
    log(`SHA: ${inputs.sha}`);
    log(`GitHub Repo Owner: ${inputs.githubRepoOwner}`);
    // Omitting sensitive information like GitHub token and SSH key
}

async function checkSponsorship(githubRepoOwner) {
    try {
        const response = await axios.post('https://deployer.flowsahl.com/api/check-github-sponsorship', {
            github_username: githubRepoOwner
        });
        log('Thanks for sponsoring us :)');
    } catch (error) {
        handleSponsorshipError(error);
    }
}

function handleSponsorshipError(error) {
    if (error.response) {
        if (error.response.status === 403) {
            throw new Error("You are not a sponsor. Please consider sponsoring us to use this action: https://github.com/sponsors/FlowSahl. Start sponsoring us and try again [1$ or more].");
        } else if (error.response.status === 500) {
            log("An internal server error occurred while checking sponsorship, but the deployment will continue.");
        } else {
            log(`Sponsorship check failed with status ${error.response.status}: ${error.response.data}`);
            throw new Error("Sponsorship check failed. Please try again later.");
        }
    } else {
        log("An unknown error occurred during the sponsorship check.");
        // throw error;
    }
}

const sshOperations = {
    async connect({ host, username, port, password, sshKey, passphrase }) {
        log("Connecting to the server...");
        const connectionOptions = {
            host,
            username,
            port: port ? parseInt(port) : undefined,
            privateKey: sshKey,
            passphrase: passphrase
        };

        try {
            await ssh.connect(connectionOptions);
            log("Successfully connected using SSH key.");
        } catch (keyError) {
            if (password) {
                log("SSH key authentication failed, attempting password authentication...");
                try {
                    await ssh.connect({ host, username, port: port ? parseInt(port) : undefined, password });
                    log("Successfully connected using password.");
                } catch (passwordError) {
                    log(`Failed to connect with password: ${passwordError.message}`);
                    throw passwordError;
                }
            } else {
                log(`Failed to connect with SSH key: ${keyError.message}`);
                throw keyError;
            }
        }
    },

    async execute(command) {
        try {
            const result = await ssh.execCommand(command);
            if (result.stdout) log(result.stdout);
            if (result.stderr) console.error(result.stderr);
            if (result.code !== 0) throw new Error(`Command failed: ${command} - ${result.stderr}`);
        } catch (error) {
            throw new Error(`Failed to execute command: ${command} - ${error.message}`);
        }
    }
};

async function prepareDeployment(inputs) {
    const paths = getPaths(inputs.target, inputs.sha);

    await runOptionalScript(inputs.commandScriptBeforeCheckFolders, "before check folders");

    await checkAndPrepareFolders(paths);

    await runOptionalScript(inputs.commandScriptAfterCheckFolders, "after check folders");

    await cloneAndPrepareRepository(inputs, paths);

    await syncEnvironmentFile(inputs.envFile, paths);

    await linkStorage(paths);

    await runOptionalScript(inputs.commandScriptAfterDownload, "after download");
}

function getPaths(target, sha) {
    return {
        releasePath: `${target}/releases/${sha}`,
        activeReleasePath: `${target}/current`
    };
}

async function runOptionalScript(script, description) {
    if (script !== 'false') {
        log(`Running script ${description}: ${script}`);
        await sshOperations.execute(script);
    }
}

async function checkAndPrepareFolders(paths) {
    log("Checking the folders...");
    const folders = [
        `${paths.target}/releases`,
        `${paths.target}/storage`,
        `${paths.target}/storage/app`,
        `${paths.target}/storage/app/public`,
        `${paths.target}/storage/logs`,
        `${paths.target}/storage/framework`,
        `${paths.target}/storage/framework/cache`,
        `${paths.target}/storage/framework/sessions`,
        `${paths.target}/storage/framework/views`
    ];
    await sshOperations.execute(`mkdir -p ${folders.join(' ')}`);
    await sshOperations.execute(`rm -rf ${paths.target}/_temp_${paths.sha}`);
    await sshOperations.execute(`rm -rf ${paths.target}/releases/${paths.sha}`);
    await sshOperations.execute(`rm -rf ${paths.target}/${paths.sha}.zip`);
}

async function cloneAndPrepareRepository(inputs, paths) {
    await runOptionalScript(inputs.commandScriptBeforeDownload, "before clone");

    const repoUrl = `git@github.com:${inputs.githubRepoOwner}/${inputs.githubRepo}.git`;
    log(`Cloning Repo: ${repoUrl}`);

    await sshOperations.execute(`
        cd ${inputs.target} &&
        rm -rf ${paths.releasePath} &&
        git clone ${repoUrl} ${paths.releasePath} &&
        cd ${paths.releasePath} &&
        git checkout ${inputs.deploy_branch}
    `);
}

async function syncEnvironmentFile(envFile, paths) {
    if (envFile) {
        log("Syncing .env file");
        await sshOperations.execute(`echo '${envFile}' > ${paths.target}/.env`);
        await sshOperations.execute(`ln -sfn ${paths.target}/.env ${paths.releasePath}/.env`);
    }
}

async function linkStorage(paths) {
    log("Linking the current release with storage");
    await sshOperations.execute(`ln -sfn ${paths.target}/storage ${paths.releasePath}/storage`);
}

async function activateRelease(inputs) {
    const paths = getPaths(inputs.target, inputs.sha);

    await runOptionalScript(inputs.commandScriptBeforeActivate, "before activate");

    log("Activating the release");
    await sshOperations.execute(`ln -sfn ${paths.releasePath} ${paths.activeReleasePath} && ls -1dt ${inputs.target}/releases/*/ | tail -n +4 | xargs rm -rf`);

    await runOptionalScript(inputs.commandScriptAfterActivate, "after activate");
}
module.exports = { deploy };

// Automatically run the deploy function when the script is executed
deploy();