const core = require('@actions/core');
const github = require('@actions/github');
const { NodeSSH } = require('node-ssh');
const axios = require('axios');

const ssh = new NodeSSH();

async function deploy() {
    try {
        const inputs = getInputs();
        logInputs(inputs);

        await checkSponsorship(inputs.githubRepoOwner);

        await connectToServer(inputs);

        await prepareDeployment(inputs);

        await activateRelease(inputs);

        console.log("Deployment completed successfully!");
    } catch (error) {
        console.error(`Error: ${error.message}`);
        core.setFailed(error.message);
    } finally {
        ssh.dispose();
    }
}

function getInputs() {
    return {
        host: core.getInput('host'),
        username: core.getInput('username'),
        port: core.getInput('port'),
        password: core.getInput('password'),
        sshKey: core.getInput('ssh_key'), // SSH key input
        target: core.getInput('target'),
        sha: core.getInput('sha'),
        githubToken: core.getInput('github_token'),
        envFile: core.getInput('env_file'),
        commandScriptBeforeCheckFolders: core.getInput('command_script_before_check_folders'),
        commandScriptAfterCheckFolders: core.getInput('command_script_after_check_folders'),
        commandScriptBeforeDownload: core.getInput('command_script_before_download'),
        commandScriptAfterDownload: core.getInput('command_script_after_download'),
        commandScriptBeforeActivate: core.getInput('command_script_before_activate'),
        commandScriptAfterActivate: core.getInput('command_script_after_activate'),
        githubRepoOwner: github.context.payload.repository.owner.login,
        githubRepo: github.context.payload.repository.name
    };
}

function logInputs(inputs) {
    console.log(`Host: ${inputs.host}`);
    console.log(`Target: ${inputs.target}`);
    console.log(`SHA: ${inputs.sha}`);
    console.log(`GitHub Repo Owner: ${inputs.githubRepoOwner}`);
}

async function checkSponsorship(githubRepoOwner) {
    try {
        const response = await axios.post('https://deployer.flowsahl.com/api/check-github-sponsorship', {
            github_username: githubRepoOwner
        });
        console.log('Thanks for sponsoring us :)');
    } catch (error) {
        handleSponsorshipError(error);
    }
}

function handleSponsorshipError(error) {
    if (error.response && error.response.status === 403) {
        throw new Error("You are not a sponsor, Please consider sponsoring us to use this action, https://github.com/sponsors/FlowSahl , Start sponsoring us and try again [1$ or more]");
    } else if (error.response && error.response.status === 500) {
        console.error("An error occurred while checking sponsorship, but the deployment will continue.");
    } else {
        throw error;
    }
}

async function connectToServer({ host, username, port, password, sshKey }) {
    console.log("Connecting to the server...");
    const connectionOptions = {
        host,
        username,
        port: port ? parseInt(port) : undefined,
    };

    if (sshKey) {
        connectionOptions.privateKey = sshKey;
    } else if (password) {
        connectionOptions.password = password;
    } else {
        throw new Error("Either an SSH key or a password must be provided for the SSH connection.");
    }

    await ssh.connect(connectionOptions);
}

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
        console.log(`Running script ${description}: ${script}`);
        await executeCommand(script);
    }
}

async function checkAndPrepareFolders(paths) {
    console.log("Checking the folders...");
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
    await executeCommand(`mkdir -p ${folders.join(' ')}`);
    await executeCommand(`rm -rf ${paths.target}/_temp_${paths.sha}`);
    await executeCommand(`rm -rf ${paths.target}/releases/${paths.sha}`);
    await executeCommand(`rm -rf ${paths.target}/${paths.sha}.zip`);
}

async function cloneAndPrepareRepository(inputs, paths) {
    if (inputs.commandScriptBeforeDownload !== 'false') {
        await runOptionalScript(inputs.commandScriptBeforeDownload, "before clone");
    }

    const repoUrl = `https://${inputs.githubRepoOwner}:${inputs.githubToken}@github.com/${inputs.githubRepoOwner}/${inputs.githubRepo}.git`;
    console.log(`Cloning Repo: ${repoUrl}`);

    await executeCommand(`
        cd ${inputs.target} &&
        git clone ${repoUrl} ${paths.releasePath} &&
        cd ${paths.releasePath} &&
        git checkout ${inputs.sha}
    `);
}

async function syncEnvironmentFile(envFile, paths) {
    if (envFile) {
        console.log("Syncing .env file");
        await executeCommand(`echo '${envFile}' > ${paths.target}/.env`);
        await executeCommand(`ln -sfn ${paths.target}/.env ${paths.releasePath}/.env`);
    }
}

async function linkStorage(paths) {
    console.log("Linking the current release with storage");
    await executeCommand(`ln -sfn ${paths.target}/storage ${paths.releasePath}/storage`);
}

async function activateRelease(inputs) {
    const paths = getPaths(inputs.target, inputs.sha);

    if (inputs.commandScriptBeforeActivate !== 'false') {
        await runOptionalScript(inputs.commandScriptBeforeActivate, "before activate");
    }

    console.log("Activating the release");
    await executeCommand(`ln -sfn ${paths.releasePath} ${paths.activeReleasePath} && ls -1dt ${inputs.target}/releases/*/ | tail -n +4 | xargs rm -rf`);

    if (inputs.commandScriptAfterActivate !== 'false') {
        await runOptionalScript(inputs.commandScriptAfterActivate, "after activate");
    }
}

async function executeCommand(command) {
    const result = await ssh.execCommand(command);
    if (result.stdout) console.log(result.stdout);
    if (result.stderr) console.error(result.stderr);
    if (result.code !== 0) throw new Error(`Command failed: ${command} - ${result.stderr}`);
}

module.exports = { deploy };

// Automatically run the deploy function when the script is executed
deploy();