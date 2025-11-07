import React from 'react';

function CreationCompleteModal({ isOpen, results, onViewAccounts, onCreateMore, onClose }) {
  if (!isOpen) return null;

  const successCount = results?.completed?.length || 0;
  const failedCount = results?.failed?.length || 0;
  const totalCount = successCount + failedCount;

  // Calculate stats
  const totalProfilesConfigured = results?.completed?.filter(a => a.profileSetup)?.length || 0;
  const totalPostsReposted = results?.completed?.reduce((sum, a) => sum + (a.repostedCount || 0), 0) || 0;
  const totalTime = results?.timeTaken || 0;

  // Format time
  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-bg-secondary rounded-xl p-8 max-w-3xl w-full shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-4xl font-bold text-text-primary mb-2">
            {failedCount === 0 ? '✅' : successCount > 0 ? '⚠️' : '❌'} Account Creation {failedCount === 0 ? 'Complete' : 'Finished'}
          </h2>
          <p className="text-text-secondary text-lg">
            {successCount > 0 ? `Created ${successCount} account${successCount !== 1 ? 's' : ''} successfully` : 'No accounts were created'}
          </p>
        </div>

        {/* Success/Failure Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-success-green bg-opacity-20 border border-success-green rounded-lg p-4">
            <div className="text-success-green text-3xl font-bold mb-1">{successCount}</div>
            <div className="text-text-secondary text-sm">Successful</div>
          </div>

          {failedCount > 0 && (
            <div className="bg-error-red bg-opacity-20 border border-error-red rounded-lg p-4">
              <div className="text-error-red text-3xl font-bold mb-1">{failedCount}</div>
              <div className="text-text-secondary text-sm">Failed</div>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {successCount > 0 && (
          <div className="bg-bg-primary rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-text-primary mb-4">Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Profiles Configured:</span>
                <span className="text-accent-purple font-semibold">{totalProfilesConfigured}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Posts Reposted:</span>
                <span className="text-accent-pink font-semibold">{totalPostsReposted}</span>
              </div>
              {totalTime > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Time Taken:</span>
                  <span className="text-text-primary font-semibold">{formatTime(totalTime)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Failed Accounts List */}
        {failedCount > 0 && (
          <div className="bg-error-red bg-opacity-10 border border-error-red rounded-lg p-4 mb-6 max-h-48 overflow-y-auto">
            <h4 className="text-error-red font-semibold mb-2">Failed Accounts:</h4>
            <div className="space-y-1">
              {results?.failed?.map((account, index) => (
                <div key={index} className="text-text-secondary text-sm">
                  • {account.username} - {account.error || 'Unknown error'}
                </div>
              ))}
            </div>
            <p className="text-text-secondary text-xs mt-3">
              You can retry failed accounts manually later
            </p>
          </div>
        )}

        {/* Successful Accounts Preview */}
        {successCount > 0 && (
          <div className="bg-success-green bg-opacity-10 border border-success-green rounded-lg p-4 mb-6 max-h-48 overflow-y-auto">
            <h4 className="text-success-green font-semibold mb-2">Created Accounts:</h4>
            <div className="grid grid-cols-2 gap-2">
              {results?.completed?.slice(0, 10).map((account, index) => (
                <div key={index} className="text-text-primary text-sm font-mono">
                  ✓ {account.username}.bsky.social
                </div>
              ))}
              {successCount > 10 && (
                <div className="text-text-secondary text-xs col-span-2 mt-2">
                  ...and {successCount - 10} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          {successCount > 0 && (
            <button
              onClick={onViewAccounts}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-accent-pink to-accent-purple text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              View Accounts
            </button>
          )}
          <button
            onClick={onCreateMore}
            className="flex-1 px-6 py-3 bg-accent-purple text-white font-semibold rounded-lg hover:bg-accent-pink transition-all"
          >
            Create More
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-all"
          >
            Close
          </button>
        </div>

        {/* Next Steps */}
        {successCount > 0 && (
          <div className="mt-6 text-center">
            <p className="text-text-secondary text-sm">
              🎉 All accounts are ready for automation! They have been configured with profiles, bios, and reposts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CreationCompleteModal;
