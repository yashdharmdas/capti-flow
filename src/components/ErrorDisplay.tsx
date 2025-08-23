import { AlertTriangle, RefreshCw, X, Lightbulb } from "lucide-react";
import { ProcessingError } from "@/lib/errorHandler";

interface ErrorDisplayProps {
  error: ProcessingError;
  onRetry?: () => void;
  onDismiss?: () => void;
  showTechnicalDetails?: boolean;
}

const ErrorDisplay = ({ 
  error, 
  onRetry, 
  onDismiss, 
  showTechnicalDetails = false 
}: ErrorDisplayProps) => {
  if (!error) return null;

  const getStageDisplayName = (stage: string) => {
    const stageNames: Record<string, string> = {
      'upload_validation': 'Upload Validation',
      'audio_extraction': 'Audio Extraction',
      'transcription': 'Speech Recognition',
      'caption_processing': 'Caption Processing',
      'video_generation': 'Video Generation'
    };
    return stageNames[stage] || stage.replace('_', ' ');
  };

  const getErrorSeverity = (errorCode: string) => {
    const criticalErrors = ['API_KEY_ERROR', 'UPLOAD_VALIDATION_ERROR'];
    return criticalErrors.includes(errorCode) ? 'critical' : 'warning';
  };

  const severity = getErrorSeverity(error.errorCode || '');
  const severityStyles = {
    critical: 'bg-destructive/10 border-destructive/20 text-destructive',
    warning: 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-950 dark:border-orange-800 dark:text-orange-200'
  };

  return (
    <div className={`rounded-lg border p-6 ${severityStyles[severity]}`}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-6 w-6" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg">
              Error in {getStageDisplayName(error.stage)}
            </h3>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="flex-shrink-0 p-1 hover:bg-white/20 rounded"
                aria-label="Dismiss error"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <p className="text-sm mb-4 opacity-90">
            {error.error}
          </p>
          
          {error.suggestions && error.suggestions.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Lightbulb className="h-4 w-4" />
                <h4 className="font-medium text-sm">Suggestions:</h4>
              </div>
              <ul className="space-y-1 text-sm opacity-80">
                {error.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-xs mt-1">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {showTechnicalDetails && error.technicalError && (
            <details className="mb-4">
              <summary className="cursor-pointer text-sm font-medium mb-2">
                Technical Details
              </summary>
              <div className="bg-black/10 rounded p-2 text-xs font-mono overflow-x-auto">
                {error.technicalError}
              </div>
            </details>
          )}
          
          <div className="flex flex-wrap gap-2">
            {error.canRetry && onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-md text-sm font-medium transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </button>
            )}
            
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md text-sm font-medium transition-colors"
            >
              <span>Start Over</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;