import { toast } from "@/hooks/use-toast";

export interface ProcessingError {
  success: false;
  error: string;
  stage: string;
  technicalError?: string;
  canRetry: boolean;
  suggestions: string[];
  errorCode?: string;
}

export interface ProcessingSuccess<T = any> {
  success: true;
  data: T;
}

export type ProcessingResult<T = any> = ProcessingSuccess<T> | ProcessingError;

export class ErrorHandler {
  static handle(error: any, stage: string, context?: any): ProcessingError {
    console.error(`Error in ${stage}:`, error, context);
    
    let userMessage = 'An unexpected error occurred';
    let canRetry = false;
    let suggestions: string[] = [];
    let errorCode = 'UNKNOWN_ERROR';

    // Parse different error types
    if (typeof error === 'string') {
      userMessage = error;
    } else if (error?.message) {
      userMessage = error.message;
    } else if (error?.error) {
      userMessage = error.error;
    }

    // Categorize errors by stage
    switch (stage) {
      case 'upload_validation':
        return this.handleUploadError(error, userMessage);
      case 'audio_extraction':
        return this.handleAudioExtractionError(error, userMessage);
      case 'transcription':
        return this.handleTranscriptionError(error, userMessage);
      case 'caption_processing':
        return this.handleCaptionProcessingError(error, userMessage);
      case 'video_generation':
        return this.handleVideoGenerationError(error, userMessage);
      default:
        return this.handleGenericError(error, userMessage, stage);
    }
  }

  private static handleUploadError(error: any, message: string): ProcessingError {
    let suggestions = [
      'Ensure your video is under 60 seconds',
      'Use vertical format (9:16 aspect ratio)',
      'Try converting to MP4 format',
      'Reduce file size to under 100MB'
    ];

    if (message.includes('aspect ratio')) {
      suggestions = ['Use a vertical video with 9:16 aspect ratio', 'Record or edit your video to be taller than it is wide'];
    } else if (message.includes('duration')) {
      suggestions = ['Trim your video to be under 60 seconds', 'Split longer videos into shorter segments'];
    } else if (message.includes('file size')) {
      suggestions = ['Compress your video file', 'Try a lower resolution or bitrate'];
    }

    return {
      success: false,
      error: message,
      stage: 'upload_validation',
      canRetry: true,
      suggestions,
      errorCode: 'UPLOAD_VALIDATION_ERROR'
    };
  }

  private static handleAudioExtractionError(error: any, message: string): ProcessingError {
    let suggestions = [
      'Ensure your video contains audio',
      'Try a different video file',
      'Check that the audio is not corrupted'
    ];

    if (message.includes('No audio') || message.includes('no audio')) {
      suggestions = [
        'Record a new video with speech or narration',
        'Check your microphone was working during recording',
        'Ensure the video file has an audio track'
      ];
    }

    return {
      success: false,
      error: message.includes('Failed to extract') 
        ? 'Could not extract audio from your video. Please ensure it contains clear speech.'
        : message,
      stage: 'audio_extraction',
      canRetry: true,
      suggestions,
      errorCode: 'AUDIO_EXTRACTION_ERROR'
    };
  }

  private static handleTranscriptionError(error: any, message: string): ProcessingError {
    let canRetry = true;
    let suggestions = [
      'Ensure clear speech in your video',
      'Reduce background noise',
      'Try again in a few minutes'
    ];

    if (message.includes('API key') || message.includes('401')) {
      canRetry = false;
      suggestions = ['This is a configuration issue. Please contact support.'];
      return {
        success: false,
        error: 'Service configuration error. Please contact support.',
        stage: 'transcription',
        canRetry,
        suggestions,
        errorCode: 'API_KEY_ERROR'
      };
    } else if (message.includes('rate limit') || message.includes('429')) {
      suggestions = [
        'Wait a few minutes before trying again',
        'Try during off-peak hours',
        'The service is temporarily busy'
      ];
    } else if (message.includes('No speech detected')) {
      suggestions = [
        'Speak more clearly and loudly',
        'Reduce background noise',
        'Ensure your microphone is working properly',
        'Try recording in a quieter environment'
      ];
    } else if (message.includes('timeout')) {
      suggestions = [
        'Try with a shorter video',
        'Check your internet connection',
        'Try again in a few minutes'
      ];
    }

    return {
      success: false,
      error: message,
      stage: 'transcription',
      canRetry,
      suggestions,
      errorCode: message.includes('rate limit') ? 'RATE_LIMIT_ERROR' : 'TRANSCRIPTION_ERROR'
    };
  }

  private static handleCaptionProcessingError(error: any, message: string): ProcessingError {
    return {
      success: false,
      error: 'Failed to process captions from transcription',
      stage: 'caption_processing',
      canRetry: true,
      suggestions: [
        'Try uploading the video again',
        'Ensure your video has clear speech',
        'Contact support if the issue persists'
      ],
      errorCode: 'CAPTION_PROCESSING_ERROR',
      technicalError: message
    };
  }

  private static handleVideoGenerationError(error: any, message: string): ProcessingError {
    let suggestions = [
      'Try again with the same video',
      'Ensure stable internet connection'
    ];

    if (message.includes('timeout')) {
      suggestions = [
        'Try with a shorter video',
        'Check your internet connection',
        'Try again during off-peak hours'
      ];
    } else if (message.includes('file size') || message.includes('storage')) {
      suggestions = [
        'Try with a smaller video file',
        'Reduce video resolution or bitrate',
        'Try again later'
      ];
    }

    return {
      success: false,
      error: message.includes('Failed to generate') 
        ? 'Could not generate the final video. Please try again.'
        : message,
      stage: 'video_generation',
      canRetry: true,
      suggestions,
      errorCode: 'VIDEO_GENERATION_ERROR'
    };
  }

  private static handleGenericError(error: any, message: string, stage: string): ProcessingError {
    return {
      success: false,
      error: message || 'An unexpected error occurred',
      stage,
      canRetry: true,
      suggestions: [
        'Try the operation again',
        'Check your internet connection',
        'Contact support if the issue persists'
      ],
      errorCode: 'GENERIC_ERROR',
      technicalError: error?.stack || error?.toString()
    };
  }

  static showError(error: ProcessingError): void {
    toast({
      title: `Error in ${error.stage.replace('_', ' ')}`,
      description: error.error,
      variant: "destructive",
    });
  }

  static isRetryableError(error: any): boolean {
    if (typeof error === 'object' && error?.canRetry !== undefined) {
      return error.canRetry;
    }
    
    // Check for common retryable error patterns
    const errorMessage = error?.message || error?.error || error?.toString() || '';
    const retryablePatterns = [
      'timeout',
      'rate limit',
      'network',
      'temporary',
      'busy',
      'unavailable'
    ];
    
    return retryablePatterns.some(pattern => 
      errorMessage.toLowerCase().includes(pattern)
    );
  }

  static getRetryDelay(attemptCount: number): number {
    // Exponential backoff: 2^attempt * 1000ms, max 30 seconds
    return Math.min(Math.pow(2, attemptCount) * 1000, 30000);
  }
}