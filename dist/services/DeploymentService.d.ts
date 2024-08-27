import { ConfigManager } from './ConfigManager';
export declare class DeploymentService {
    private config;
    private paths;
    private deployDate;
    constructor(config: ConfigManager);
    deploy(): Promise<void>;
    private checkSponsorship;
    private handleSponsorshipError;
    private prepareDeployment;
    private checkAndPrepareFolders;
    private cloneAndPrepareRepository;
    private syncEnvironmentFile;
    private linkStorage;
    private runOptionalScript;
    private activateRelease;
    private getPaths;
}
