interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="download-error">
      <span className="error-icon">⚠️</span>
      <p>{message}</p>
    </div>
  );
}
