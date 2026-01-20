import { App } from "../types/app.types";
import { DownloadState } from "../types/download.types";
import { AppCard } from "./AppCard/AppCard";

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
    <div className="grid gap-5 px-1 pb-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
