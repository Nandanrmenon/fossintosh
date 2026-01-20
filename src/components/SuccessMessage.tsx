interface SuccessMessageProps {
  message: string;
}

export function SuccessMessage({ message }: SuccessMessageProps) {
  return (
    <div className="download-success">
      <span className="success-icon">✓</span>
      <p>{message}</p>
    </div>
  );
}
