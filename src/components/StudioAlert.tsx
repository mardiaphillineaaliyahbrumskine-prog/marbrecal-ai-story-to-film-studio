import {AlertCircle, CheckCircle2, X} from 'lucide-react';

interface StudioAlertProps {
  type: 'error' | 'success';
  message: string;
  onDismiss: () => void;
}

export function StudioAlert({type, message, onDismiss}: StudioAlertProps) {
  const isError = type === 'error';

  return (
    <div
      role="alert"
      className={`flex items-start justify-between gap-4 rounded-lg border px-4 py-3 text-sm ${
        isError
          ? 'border-red-500/40 bg-red-950/35 text-red-200'
          : 'border-[#C8A24B]/45 bg-[#C8A24B]/10 text-[#F7F5F0]'
      }`}
    >
      <div className="flex items-start gap-3">
        {isError ? (
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
        ) : (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#C8A24B]" />
        )}
        <div>
          <span className="font-semibold text-white">
            {isError ? 'Generation Error: ' : 'Studio Update: '}
          </span>
          <span>{message}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss message"
        className="rounded p-1 text-[#A8A49B] transition-colors hover:bg-white/10 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
