import React from 'react';

function PreparingCreationModal({ isOpen, progress, onStartCreation, onCancel, error }) {
  if (!isOpen) return null;

  const isComplete = progress?.type === 'complete';
  const hasError = !!error;

  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (!progress) return 0;
    if (isComplete) return 100;
    if (progress.needed && progress.found !== undefined) {
      return Math.min((progress.found / progress.needed) * 100, 100);
    }
    return 0;
  };

  const progressPercentage = getProgressPercentage();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-bg-secondary rounded-xl p-8 max-w-2xl w-full shadow-2xl">
        <h2 className="text-3xl font-bold text-text-primary mb-2">
          {hasError ? '❌ Error' : isComplete ? '✅ Ready!' : '⚙️ Preparing Account Creation'}
        </h2>
        <p className="text-text-secondary text-sm mb-6">
          {hasError
            ? 'There was an issue preparing usernames'
            : isComplete
            ? 'All usernames are ready for account creation'
            : 'Finding available usernames...'}
        </p>

        {/* Error Display */}
        {hasError && (
          <div className="bg-error-red bg-opacity-20 border border-error-red rounded-lg p-4 mb-6">
            <p className="text-error-red font-semibold mb-2">{error.message || 'An error occurred'}</p>
            {error.found !== undefined && error.needed !== undefined && (
              <p className="text-text-secondary text-sm">
                Found {error.found} out of {error.needed} needed usernames
              </p>
            )}
          </div>
        )}

        {/* Progress Section */}
        {!hasError && (
          <>
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-text-secondary mb-2">
                <span>
                  {progress?.found !== undefined && progress?.needed !== undefined
                    ? `${progress.found}/${progress.needed} usernames ready`
                    : 'Starting...'}
                </span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full bg-bg-primary rounded-full h-4 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accent-pink to-accent-purple transition-all duration-300 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Current Status */}
            {progress?.current && (
              <div className="bg-bg-primary rounded-lg p-4 mb-6">
                <p className="text-text-secondary text-sm mb-1">Currently checking:</p>
                <p className="text-accent-purple font-mono text-sm">{progress.current}.bsky.social</p>
              </div>
            )}

            {/* Status Message */}
            {progress?.message && (
              <div className="mb-6">
                <p className="text-text-primary text-sm">
                  {progress.message}
                </p>
              </div>
            )}

            {/* Found Usernames List (Last 10) */}
            {progress?.type === 'complete' && progress?.usernames && (
              <div className="bg-bg-primary rounded-lg p-4 mb-6 max-h-64 overflow-y-auto">
                <p className="text-text-secondary text-sm mb-3">
                  Found {progress.usernames.length} available usernames:
                </p>
                <div className="space-y-1">
                  {progress.usernames.slice(0, 10).map((username, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-success-green text-xs">✓</span>
                      <span className="text-text-primary font-mono text-sm">{username}.bsky.social</span>
                    </div>
                  ))}
                  {progress.usernames.length > 10 && (
                    <p className="text-text-secondary text-xs mt-2">
                      ...and {progress.usernames.length - 10} more
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Warning Messages */}
            {progress?.type === 'warning' && (
              <div className="bg-yellow-500 bg-opacity-20 border border-yellow-500 rounded-lg p-4 mb-6">
                <p className="text-yellow-500 text-sm">
                  ⚠️ {progress.message}
                </p>
              </div>
            )}

            {/* Retry Messages */}
            {progress?.type === 'retry' && (
              <div className="bg-accent-purple bg-opacity-20 border border-accent-purple rounded-lg p-4 mb-6">
                <p className="text-accent-purple text-sm">
                  🔄 {progress.message}
                </p>
              </div>
            )}
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          {hasError && (
            <>
              <button
                onClick={onCancel}
                className="flex-1 px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-all"
              >
                Try Different Base Word
              </button>
              {error.usernames && error.usernames.length > 0 && (
                <button
                  onClick={() => onStartCreation(error.usernames)}
                  className="flex-1 px-6 py-3 bg-accent-purple text-white font-semibold rounded-lg hover:bg-accent-pink transition-all"
                >
                  Create {error.usernames.length} Accounts Anyway
                </button>
              )}
            </>
          )}

          {isComplete && !hasError && (
            <>
              <button
                onClick={onCancel}
                className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => onStartCreation(progress.usernames)}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-accent-pink to-accent-purple text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                Start Creating {progress.usernames.length} Accounts
              </button>
            </>
          )}

          {!isComplete && !hasError && (
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-all"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Additional Info */}
        {progress?.checked !== undefined && isComplete && (
          <div className="mt-4 text-text-secondary text-xs text-center">
            Checked {progress.checked} usernames total
          </div>
        )}
      </div>
    </div>
  );
}

export default PreparingCreationModal;
