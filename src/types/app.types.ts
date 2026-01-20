export interface App {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  icon: string;
  downloadUrl: string;
  homepage: string;
  license: string;
  author: string;
  screenshots: string[];
  installedVersion?: string;
  hasUpdate?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  appCount: number;
}

export enum InstallStatus {
  NotInstalled = "not_installed",
  Installing = "installing",
  Installed = "installed",
  Updating = "updating",
}
