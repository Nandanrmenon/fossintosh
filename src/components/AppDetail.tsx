import { App } from "../types/app.types";
import { ProgressBar } from "./ProgressBar";
import { ErrorMessage } from "./ErrorMessage";
import { SuccessMessage } from "./SuccessMessage";
import { ActionButtons } from "./AppCard/AppCardActionButtons";

interface AppDetailProps {
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
  onBack: () => void;
}

export function AppDetail({
  app,
  downloadState: state,
  onDownload,
  onCancelDownload,
  onInstall,
  onBack,
}: AppDetailProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 text-black dark:text-white">
      {/* Header with Back Button */}
      <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-all active:scale-95 active:opacity-70"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Apps
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* App Header */}
        <div className="flex items-start gap-6 mb-8">
          <img
            src={app.icon}
            alt={app.name}
            className="w-32 h-32 rounded-2xl shadow-lg object-contain"
          />
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">{app.name}</h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-4">
              {app.description}
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 dark:text-zinc-400">
                  Version:
                </span>
                <span className="font-semibold">{app.version}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 dark:text-zinc-400">
                  Category:
                </span>
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full font-medium">
                  {app.category}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 dark:text-zinc-400">
                  License:
                </span>
                <span className="font-semibold">{app.license}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Download/Install Progress */}
        <div className="mb-8">
          {state.isDownloading && (
            <ProgressBar
              progress={state.progress}
              status={state.status}
              variant="primary"
              showPercentage
            />
          )}

          {state.isInstalling && (
            <ProgressBar
              progress={state.installProgress}
              status={state.installStatus}
              variant="success"
              showPercentage
            />
          )}

          {state.error && <ErrorMessage message={state.error} />}

          {!state.isDownloading &&
            !state.error &&
            state.progress === 100 &&
            !state.isInstalling && <SuccessMessage message={state.status} />}

          {!state.isInstalling &&
            state.installProgress === 100 &&
            !state.error && <SuccessMessage message={state.installStatus} />}
        </div>

        {/* Action Buttons */}
        <div className="mb-8">
          <ActionButtons
            appId={app.id}
            downloadUrl={app.downloadUrl}
            state={state}
            onDownload={onDownload}
            onCancelDownload={onCancelDownload}
            onInstall={onInstall}
          />
        </div>

        {/* Screenshots */}
        {app.screenshots && app.screenshots.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Screenshots</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {app.screenshots.map((screenshot, index) => (
                <img
                  key={index}
                  src={screenshot}
                  alt={`${app.name} screenshot ${index + 1}`}
                  className="rounded-lg shadow-lg w-full cursor-pointer transition-all active:scale-95 active:opacity-70 hover:shadow-xl"
                />
              ))}
            </div>
          </div>
        )}

        {/* Additional Information */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-6 transition-all active:scale-[0.98] active:opacity-70 cursor-pointer hover:shadow-lg">
            <h3 className="text-xl font-bold mb-4">About</h3>
            <div className="space-y-3">
              <div>
                <span className="text-zinc-500 dark:text-zinc-400">
                  Author:
                </span>{" "}
                <span className="font-medium">{app.author}</span>
              </div>
              <div>
                <span className="text-zinc-500 dark:text-zinc-400">
                  Homepage:
                </span>{" "}
                <a
                  href={app.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {app.homepage}
                </a>
              </div>
              {app.installedVersion && (
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Installed Version:
                  </span>{" "}
                  <span className="font-medium">{app.installedVersion}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-6 transition-all active:scale-[0.98] active:opacity-70 cursor-pointer hover:shadow-lg">
            <h3 className="text-xl font-bold mb-4">Details</h3>
            <div className="space-y-3">
              <div>
                <span className="text-zinc-500 dark:text-zinc-400">
                  Download URL:
                </span>{" "}
                <a
                  href={app.downloadUrl}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm break-all"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  {app.downloadUrl}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
