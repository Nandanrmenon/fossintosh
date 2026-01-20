import type { CSSProperties } from "react";

interface ProgressBarProps {
  progress: number;
  status?: string;
  variant?: "primary" | "success" | "danger" | "warning";
  showPercentage?: boolean;
}

export function ProgressBar({
  progress,
  status,
  variant = "primary",
  showPercentage = false,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, progress));
  const variantStrokes: Record<
    NonNullable<ProgressBarProps["variant"]>,
    string
  > = {
    primary: "text-blue-500",
    success: "text-green-500",
    danger: "text-red-500",
    warning: "text-yellow-500",
  };

  const ringStyle: CSSProperties = {
    "--value": clamped,
  } as CSSProperties;

  return (
    <div
      className={`radial-progress`}
      style={ringStyle}
      aria-valuenow={clamped}
      role="progressbar"
    ></div>
  );
}
