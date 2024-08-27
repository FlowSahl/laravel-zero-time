// src/types.ts
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

export interface Paths {
  target: string;
  sha: string;
  releasePath: string;
  activeReleasePath: string;
}

export interface ConnectionOptions {
  host: string;
  username: string;
  port?: number | 22;
  password?: string;
  privateKey?: string;
  passphrase?: string;
}
