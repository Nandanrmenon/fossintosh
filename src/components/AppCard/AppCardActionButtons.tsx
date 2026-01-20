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
  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDownload(appId, downloadUrl);
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCancelDownload(appId);
  };

  const handleInstallClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInstall(appId, state.filePath || `~/Downloads/${appId}.dmg`);
  };

  if (state.isDownloading) {
    return (
      <div className="gap-2 mt-4 flex flex-wrap">
        <div className="flex gap-2 w-full">
          {/* <Button
            variant="secondary"
            className="w-full"
            onClick={handleInstallClick}
            disabled
          >
            {`Downloading... ${Math.round(state.progress)}%`}
          </Button> */}
          <Button variant="danger" className="" onClick={handleCancelClick}>
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
            onClick={handleInstallClick}
            disabled={state.isInstalling}
          >
            Install
          </Button>
          <Button
            variant="secondary"
            onClick={handleDownloadClick}
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
        variant="secondary"
        className=""
        onClick={handleDownloadClick}
        disabled={state.isInstalling}
      >
        {state.isInstalling ? "Installing..." : "Download"}
      </Button>
    </div>
  );
}
