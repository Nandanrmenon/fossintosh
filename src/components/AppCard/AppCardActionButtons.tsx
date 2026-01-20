import { Button } from "../Buttons";

interface ActionButtonsProps {
  appId: string;
  downloadUrl: string;
  state: {
    isDownloading: boolean;
    isInstalling: boolean;
    progress: number;
    filePath?: string;
    isDownloaded: boolean;
  };
  onDownload: (appId: string, downloadUrl: string) => void;
  onCancelDownload: (appId: string) => void;
  onInstall: (appId: string, filePath: string) => void;
}

export function ActionButtons({
  appId,
  downloadUrl,
  state,
  onDownload,
  onCancelDownload,
  onInstall,
}: ActionButtonsProps) {
  if (state.isDownloading) {
    return (
      <div className="gap-2 mt-4 flex flex-wrap">
        <div className="flex gap-2 w-full">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() =>
              onInstall(appId, state.filePath || `~/Downloads/${appId}.dmg`)
            }
            disabled
          >
            {`Downloading... ${Math.round(state.progress)}%`}
          </Button>
          <Button
            variant="danger"
            className="w-full"
            onClick={() => onCancelDownload(appId)}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (state.isDownloaded && !state.isInstalling) {
    return (
      <div className="gap-2 mt-4 flex flex-wrap">
        <div className="flex gap-2 w-full">
          <Button
            variant="success"
            onClick={() =>
              onInstall(appId, state.filePath || `~/Downloads/${appId}.dmg`)
            }
            disabled={state.isInstalling}
          >
            Install
          </Button>
          <Button
            variant="secondary"
            onClick={() => onDownload(appId, downloadUrl)}
            disabled={state.isInstalling}
          >
            Re-download
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="gap-2 mt-4 flex flex-wrap">
      <Button
        variant="primary"
        className="w-full"
        onClick={() => onDownload(appId, downloadUrl)}
        disabled={state.isInstalling}
      >
        {state.isInstalling ? "Installing..." : "Download"}
      </Button>
    </div>
  );
}
