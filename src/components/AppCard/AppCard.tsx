import { App } from "../../types/app.types";
import { AppHeader } from "./AppCardHeader";

interface AppCardProps {
  app: App;
  downloadState: {
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
  onDownload: (appId: string, downloadUrl: string) => void;
  onCancelDownload: (appId: string) => void;
  onInstall: (appId: string, filePath: string) => void;
  onClick: () => void;
}

export function AppCard({
  app,
  downloadState: _state,
  onDownload: _onDownload,
  onCancelDownload: _onCancelDownload,
  onInstall: _onInstall,
  onClick,
}: AppCardProps) {
  return (
    <div
      onClick={onClick}
      className="flex items-center rounded-2xl bg-white px-2 py-4 shadow-2xs transition hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.99] dark:bg-zinc-900 dark:hover:bg-zinc-800 cursor-pointer"
    >
      <AppHeader app={app} />
    </div>
  );
}
