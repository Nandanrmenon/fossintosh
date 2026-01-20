import { useEffect, useState } from "react";

interface SuccessMessageProps {
  message: string;
}

export function SuccessMessage({ message }: SuccessMessageProps) {
  const [visible, setVisible] = useState(true);
  
    useEffect(() => {
      setVisible(true);
      const timer = window.setTimeout(() => setVisible(false), 3000);
      return () => window.clearTimeout(timer);
    }, [message]);
  
    if (!visible) return null;
  return (
    <div className="toast toast-end toast-bottom fixed bottom-4 right-4 z-50">
      <div className="alert alert-success">
        <span>{message}</span>
      </div>
    </div>
  );
}
