import type { AppError, AppErrorKind, UserMessage } from '../types';

export function createAppError(
  kind: AppErrorKind,
  message: string,
  cause?: unknown,
): AppError {
  const retryable = kind === 'network' || kind === 'rate_limited' || kind === 'unknown';
  return { kind, message, retryable, cause };
}

export function classifyHttpError(status: number, url: string): AppError {
  if (status === 429) {
    return createAppError(
      'rate_limited',
      `Rate limit exceeded for ${new URL(url).hostname}`,
    );
  }
  if (status === 401 || status === 403) {
    return createAppError(
      'invalid_key',
      'API key is missing or invalid. Check your .env.local configuration.',
    );
  }
  if (status === 404) {
    return createAppError('not_found', 'The requested resource was not found.');
  }
  if (status >= 500) {
    return createAppError(
      'network',
      `The server returned an error (${status}). This is usually temporary.`,
    );
  }
  return createAppError('unknown', `Unexpected response status: ${status}`);
}

export function classifyError(error: unknown): AppError {
  if (isAppError(error)) return error;

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return createAppError(
      'network',
      'Could not connect to the server. Check your internet connection.',
      error,
    );
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return createAppError('network', 'The request was cancelled.', error);
  }

  if (error instanceof Error) {
    return createAppError('unknown', error.message, error);
  }

  return createAppError('unknown', 'An unexpected error occurred.', error);
}

export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'kind' in error &&
    'message' in error &&
    'retryable' in error
  );
}

export function getUserMessage(error: AppError): UserMessage {
  switch (error.kind) {
    case 'network':
      return {
        title: 'Connection problem',
        description:
          "Couldn't reach the weather service. Check your internet connection and try again.",
        action: 'Retry',
      };
    case 'rate_limited':
      return {
        title: 'Too many requests',
        description:
          'The weather service is temporarily limiting requests. Wait a moment and try again.',
        action: 'Retry',
      };
    case 'invalid_key':
      return {
        title: 'API key issue',
        description:
          'The API key is missing or invalid. Check the .env.local file and restart the dev server.',
      };
    case 'not_found':
      return {
        title: 'Not found',
        description: "We couldn't find what you were looking for. Try a different search.",
      };
    case 'validation':
      return {
        title: 'Invalid data',
        description:
          'The weather service returned unexpected data. This is usually temporary.',
        action: 'Retry',
      };
    case 'storage':
      return {
        title: 'Storage unavailable',
        description:
          "Your browser's storage isn't available. Your data won't persist between sessions.",
      };
    case 'unsupported':
      return {
        title: 'Not supported',
        description: error.message,
      };
    case 'unknown':
    default:
      return {
        title: 'Something unexpected happened',
        description: error.message || 'Please try again or reload the page.',
        action: 'Retry',
      };
  }
}
