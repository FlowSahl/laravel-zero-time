export interface Inputs {
    target: string;
    sha: string;
    deploy_branch: string;
    envFile?: string;
    commandScriptBeforeCheckFolders?: string;
    commandScriptAfterCheckFolders?: string;
    commandScriptBeforeDownload?: string;
    commandScriptAfterDownload?: string;
    commandScriptBeforeActivate?: string;
    commandScriptAfterActivate?: string;
    githubRepoOwner: string;
    githubRepo: string;
}
/** Represents the paths used during the deployment process */
export interface Paths {
    target: string;
    sha: string;
    releasePath: string;
    activeReleasePath: string;
}
/** Represents the SSH connection options */
export interface ConnectionOptions {
    host: string;
    username: string;
    port?: number | 22;
    password?: string;
    privateKey?: string;
    passphrase?: string;
}
