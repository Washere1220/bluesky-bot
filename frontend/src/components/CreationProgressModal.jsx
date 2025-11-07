import React from 'react';

function CreationProgressModal({ isOpen, browserStates, overallProgress, onPause, onCancel }) {
  if (!isOpen) return null;

  // Get status emoji
  const getStatusEmoji = (stage) => {
    switch (stage) {
      case 'launching':
        return '🚀';
      case 'navigating':
        return '🌐';
      case 'filling':
        return '✍️';
      case 'waiting_captcha':
        return '🔒';
      case 'completing':
        return '⚙️';
      case 'extracting':
        return '📦';
      case 'complete':
        return '✅';
      case 'error':
        return '❌';
      // Profile setup stages
      case 'initializing':
      case 'logged_in':
        return '🔐';
      case 'uploading_image':
      case 'transforming_image':
      case 'image_uploaded':
        return '📸';
      case 'generating_bio':
      case 'setting_bio':
      case 'profile_updated':
        return '📝';
      case 'following_main':
      case 'followed_main':
        return '➕';
      case 'fetching_posts':
      case 'found_posts':
      case 'reposting':
      case 'reposted_all':
        return '🔄';
      case 'profile_setup_complete':
        return '✅';
      default:
        return '⏳';
    }
  };

  // Get status color
  const getStatusColor = (stage) => {
    switch (stage) {
      case 'complete':
      case 'profile_setup_complete':
        return 'text-success-green';
      case 'error':
      case 'image_error':
      case 'follow_error':
      case 'repost_error':
        return 'text-error-red';
      case 'waiting_captcha':
        return 'text-yellow-500';
      default:
        return 'text-accent-purple';
    }
  };

  // Get friendly stage name
  const getStageName = (stage) => {
    switch (stage) {
      case 'launching': return 'Launching Browser';
      case 'navigating': return 'Navigating';
      case 'filling': return 'Filling Forms';
      case 'waiting_captcha': return 'Waiting for Captcha';
      case 'completing': return 'Completing';
      case 'extracting': return 'Extracting Session';
      case 'complete': return 'Browser Complete';
      // Profile setup
      case 'initializing': return 'Initializing API';
      case 'logged_in': return 'Logged In';
      case 'uploading_image': return 'Uploading Image';
      case 'transforming_image': return 'Transforming Image';
      case 'image_uploaded': return 'Image Uploaded';
      case 'generating_bio': return 'Generating Bio';
      case 'setting_bio': return 'Setting Bio';
      case 'profile_updated': return 'Profile Updated';
      case 'following_main': return 'Following Main';
      case 'followed_main': return 'Following Main';
      case 'fetching_posts': return 'Fetching Posts';
      case 'found_posts': return 'Found Posts';
      case 'reposting': return 'Reposting';
      case 'reposted_all': return 'Reposted All';
      case 'profile_setup_complete': return 'Complete';
      case 'error': return 'Failed';
      default: return stage || 'Idle';
    }
  };

  // Calculate overall progress
  const progressPercentage = overallProgress
    ? Math.round((overallProgress.completed / overallProgress.total) * 100)
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-bg-secondary rounded-xl p-8 max-w-5xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-3xl font-bold text-text-primary mb-2">
          🤖 Creating Accounts
        </h2>
        <p className="text-text-secondary text-sm mb-6">
          Running {browserStates?.length || 0} concurrent browsers
        </p>

        {/* Overall Progress */}
        {overallProgress && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-text-secondary mb-2">
              <span>
                Overall Progress: {overallProgress.completed}/{overallProgress.total} accounts
              </span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="w-full bg-bg-primary rounded-full h-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent-pink to-accent-purple transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {/* Stats */}
            <div className="flex gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-success-green font-semibold">✅ {overallProgress.completed}</span>
                <span className="text-text-secondary">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-accent-purple font-semibold">⏳ {overallProgress.inProgress}</span>
                <span className="text-text-secondary">In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-error-red font-semibold">❌ {overallProgress.failed}</span>
                <span className="text-text-secondary">Failed</span>
              </div>
            </div>
          </div>
        )}

        {/* Browser Cards */}
        <div className="space-y-4 mb-6">
          {browserStates && browserStates.length > 0 ? (
            browserStates.map((browser, index) => (
              <div
                key={index}
                className="bg-bg-primary rounded-lg p-4 border-2 border-accent-purple border-opacity-30 hover:border-opacity-60 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getStatusEmoji(browser.stage)}</span>
                    <div>
                      <div className="text-text-primary font-semibold">
                        Browser #{index + 1}
                      </div>
                      <div className="text-text-secondary text-sm">
                        {browser.username ? (
                          <span className="font-mono">{browser.username}.bsky.social</span>
                        ) : (
                          <span className="italic">Idle</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={`text-sm font-semibold ${getStatusColor(browser.stage)}`}>
                    {getStageName(browser.stage)}
                  </div>
                </div>

                {/* Progress Message */}
                {browser.message && (
                  <div className="text-text-secondary text-sm mt-2 pl-11">
                    {browser.message}
                  </div>
                )}

                {/* Error Message */}
                {browser.error && (
                  <div className="bg-error-red bg-opacity-20 border border-error-red rounded-lg p-2 mt-2 pl-11">
                    <p className="text-error-red text-sm">{browser.error}</p>
                  </div>
                )}

                {/* Captcha Warning */}
                {browser.stage === 'waiting_captcha' && (
                  <div className="bg-yellow-500 bg-opacity-20 border border-yellow-500 rounded-lg p-3 mt-2 pl-11">
                    <p className="text-yellow-500 text-sm font-semibold">
                      ⚠️ Please solve the captcha in the browser window, then click the red "Solved?" button (or press Ctrl+Enter)
                    </p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-text-secondary text-center py-8">
              No active browsers
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4 border-t border-bg-primary">
          {/* <button
            onClick={onPause}
            className="px-6 py-3 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition-all"
          >
            Pause All
          </button> */}
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-all"
          >
            Cancel & Close
          </button>
        </div>

        {/* Info */}
        <div className="mt-4 text-text-secondary text-xs text-center">
          Make sure to solve captchas when they appear. The browser extension provides a "Solved?" button in each browser window.
        </div>
      </div>
    </div>
  );
}

export default CreationProgressModal;
