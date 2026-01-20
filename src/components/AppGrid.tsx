import { App } from "../types/app.types";
import { AppCard } from "./AppCard/AppCard";

interface DownloadState {
  [appId: string]: {
    isDownloading: boolean;
    isInstalling: boolean;
    progress: number;
    installProgress: number;
    status: string;
    installStatus: string;
    error?: string;
    filePath?: string;
    isDownloaded: boolean;
  };
}

interface AppGridProps {
  apps: App[];
  downloadStates: DownloadState;
  onDownload: (appId: string, downloadUrl: string) => void;
  onCancelDownload: (appId: string) => void;
  onInstall: (appId: string, filePath: string) => void;
  onCardClick: (app: App) => void;
}

export function AppGrid({
  apps,
  downloadStates,
  onDownload,
  onCancelDownload,
  onInstall,
  onCardClick,
}: AppGridProps) {
  return (
    <div className="grid grid-flow-col grid-rows-2 gap-4 p-6">
      {apps.map((app) => {
        const state = downloadStates[app.id] || {
          isDownloading: false,
          isInstalling: false,
          progress: 0,
          installProgress: 0,
          status: "",
          installStatus: "",
          isDownloaded: false,
        };

        return (
          <AppCard
            key={app.id}
            app={app}
            downloadState={state}
            onDownload={onDownload}
            onCancelDownload={onCancelDownload}
            onInstall={onInstall}
            onClick={() => onCardClick(app)}
          />
        );
      })}
    </div>
  );
}
