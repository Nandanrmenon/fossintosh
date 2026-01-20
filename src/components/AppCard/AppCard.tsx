import { App } from "../../types/app.types";
import { AppHeader } from "./AppCardHeader";
import { AppMeta } from "./AppCardMeta";
import { ProgressBar } from "../ProgressBar";
import { ErrorMessage } from "../ErrorMessage";
import { SuccessMessage } from "../SuccessMessage";
import { ActionButtons } from "./AppCardActionButtons";

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
}

export function AppCard({
  app,
  downloadState: state,
  onDownload,
  onCancelDownload,
  onInstall,
}: AppCardProps) {
  return (
    <div className="p-8 border border-zinc-200 rounded-lg inset-shadow-sm bg-white">
      <AppHeader app={app} />

      <div className="app-content">
        <p className="text-md text-zinc-500">{app.description}</p>

        <AppMeta category={app.category} version={app.version} />

        {/* Download Progress Section */}
        {state.isDownloading && (
          <ProgressBar
            progress={state.progress}
            status={state.status}
            variant="primary"
            showPercentage
          />
        )}

        {/* Install Progress Section */}
        {state.isInstalling && (
          <ProgressBar
            progress={state.installProgress}
            status={state.installStatus}
            variant="success"
            showPercentage
          />
        )}

        {/* Error Message */}
        {state.error && <ErrorMessage message={state.error} />}

        {/* Success Messages */}
        {!state.isDownloading &&
          !state.error &&
          state.progress === 100 &&
          !state.isInstalling && <SuccessMessage message={state.status} />}

        {!state.isInstalling &&
          state.installProgress === 100 &&
          !state.error && <SuccessMessage message={state.installStatus} />}

        {/* Action Buttons */}
        <ActionButtons
          appId={app.id}
          downloadUrl={app.downloadUrl}
          state={state}
          onDownload={onDownload}
          onCancelDownload={onCancelDownload}
          onInstall={onInstall}
        />
      </div>
    </div>
  );
}
