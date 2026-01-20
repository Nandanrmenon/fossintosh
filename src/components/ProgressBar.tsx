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
  const variantClasses = {
    primary: "bg-blue-500",
    success: "bg-green-500",
    danger: "bg-red-500",
    warning: "bg-yellow-500",
  };

  return (
    <div className="w-full space-y-2">
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ease-out ${variantClasses[variant]}`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      {(status || showPercentage) && (
        <div className="flex justify-between items-center text-sm text-gray-600">
          {status && <span>{status}</span>}
          {showPercentage && (
            <span className="font-medium">{Math.round(progress)}%</span>
          )}
        </div>
      )}
    </div>
  );
}
