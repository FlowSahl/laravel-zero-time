export interface Inputs {
  target: string; // The target directory on the server where the deployment will occur
  sha: string; // The specific commit SHA to be deployed
  deploy_branch: string; // The branch of the repository to deploy
  envFile?: string; // Optional content of the environment file to be used in the deployment
  commandScriptBeforeCheckFolders?: string; // Custom script to run before checking folders
  commandScriptAfterCheckFolders?: string; // Custom script to run after checking folders
  commandScriptBeforeDownload?: string; // Custom script to run before downloading the release
  commandScriptAfterDownload?: string; // Custom script to run after downloading the release
  commandScriptBeforeActivate?: string; // Custom script to run before activating the release
  commandScriptAfterActivate?: string; // Custom script to run after activating the release
  githubRepoOwner: string; // The owner of the GitHub repository
  githubRepo: string; // The name of the GitHub repository
}

/** Represents the paths used during the deployment process */
export interface Paths {
  target: string; // The base target directory
  sha: string; // The SHA of the commit being deployed
  releasePath: string; // The path to the specific release
  activeReleasePath: string; // The path to the active release
}

/** Represents the SSH connection options */
export interface ConnectionOptions {
  host: string; // The host of the server to connect to
  username: string; // The username to use for the SSH connection
  port?: number | 22; // The port to use for the SSH connection (defaults to 22)
  password?: string; // The password for the SSH connection
  privateKey?: string; // The private key for the SSH connection
  passphrase?: string; // The passphrase for the private key, if applicable
}
