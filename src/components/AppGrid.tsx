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
  if (apps.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-zinc-500 dark:text-zinc-400">No apps available</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
