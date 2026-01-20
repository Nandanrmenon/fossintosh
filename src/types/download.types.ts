export interface DownloadStateEntry {
  isDownloading: boolean;
  isInstalling: boolean;
  progress: number;
  installProgress: number;
  status: string;
  installStatus: string;
  error?: string;
  filePath?: string;
  isDownloaded: boolean;
}

export type DownloadState = Record<string, DownloadStateEntry>;
