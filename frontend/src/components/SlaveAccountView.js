import React, { useState, useEffect, useRef } from 'react';
import SlaveAccountBar from './SlaveAccountBar';
import AddAccountModal from './AddAccountModal';
import AccountCreationModal from './AccountCreationModal';
import PreparingCreationModal from './PreparingCreationModal';
import CreationProgressModal from './CreationProgressModal';
import CreationCompleteModal from './CreationCompleteModal';
import { prepareAvailableUsernamesWithRetry } from '../services/accountCreationService';

function SlaveAccountView({ mainAccount, accounts, activityFeed, onBack, onRefresh }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showBulkCreateModal, setShowBulkCreateModal] = useState(false);
  const [showPreparingModal, setShowPreparingModal] = useState(false);
  const [showCreationModal, setShowCreationModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [preparingProgress, setPreparingProgress] = useState(null);
  const [preparingError, setPreparingError] = useState(null);
  const [formDataCache, setFormDataCache] = useState(null);
  const [browserStates, setBrowserStates] = useState([]);
  const [overallProgress, setOverallProgress] = useState({ total: 0, completed: 0, failed: 0, inProgress: 0 });
  const [creationResults, setCreationResults] = useState(null);
  const [targetList, setTargetList] = useState((mainAccount.targets || []).join('\n'));
  const [globalSpeed, setGlobalSpeed] = useState('normal');
  const wsRef = useRef(null);

  // WebSocket connection for real-time progress
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3004');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleWebSocketMessage(message);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  // Handle WebSocket messages
  const handleWebSocketMessage = (message) => {
    const { type, data } = message;

    switch (type) {
      case 'account_creation_started':
        // Update browser state
        setBrowserStates(prev => {
          const newStates = [...prev];
          const index = data.index % formDataCache?.concurrentBrowsers || 0;
          newStates[index] = {
            username: data.username,
            stage: 'launching',
            message: 'Starting browser...'
          };
          return newStates;
        });
        break;

      case 'account_creation_progress':
        // Update specific browser progress
        setBrowserStates(prev => {
          const newStates = [...prev];
          const index = data.index % formDataCache?.concurrentBrowsers || 0;
          newStates[index] = {
            username: data.username,
            stage: data.stage,
            message: data.message
          };
          return newStates;
        });

        // Update overall progress
        setOverallProgress({
          total: data.total,
          completed: data.completed,
          failed: data.failed,
          inProgress: data.inProgress
        });
        break;

      case 'account_creation_complete':
        // Mark browser as complete
        setBrowserStates(prev => {
          const newStates = [...prev];
          const index = data.index % formDataCache?.concurrentBrowsers || 0;
          newStates[index] = {
            username: data.username,
            stage: 'complete',
            message: 'Account created successfully!'
          };
          return newStates;
        });
        break;

      case 'account_creation_error':
        // Mark browser as error
        setBrowserStates(prev => {
          const newStates = [...prev];
          const index = data.index % formDataCache?.concurrentBrowsers || 0;
          newStates[index] = {
            username: data.username,
            stage: 'error',
            message: data.message,
            error: data.error
          };
          return newStates;
        });
        break;

      case 'profile_setup_started':
        // Profile setup started
        setBrowserStates(prev => {
          const newStates = [...prev];
          const index = data.index % formDataCache?.concurrentBrowsers || 0;
          newStates[index] = {
            username: data.username,
            stage: 'initializing',
            message: 'Setting up profile...'
          };
          return newStates;
        });
        break;

      case 'profile_setup_progress':
        // Profile setup progress
        setBrowserStates(prev => {
          const newStates = [...prev];
          const index = data.index % formDataCache?.concurrentBrowsers || 0;
          newStates[index] = {
            username: data.username,
            stage: data.stage,
            message: data.message
          };
          return newStates;
        });
        break;

      case 'profile_setup_complete':
        // Profile setup complete
        setBrowserStates(prev => {
          const newStates = [...prev];
          const index = data.index % formDataCache?.concurrentBrowsers || 0;
          newStates[index] = {
            username: data.username,
            stage: 'profile_setup_complete',
            message: `Profile setup complete! Reposted ${data.repostedCount || 0} posts`
          };
          return newStates;
        });
        break;

      case 'profile_setup_error':
        // Profile setup error
        setBrowserStates(prev => {
          const newStates = [...prev];
          const index = data.index % formDataCache?.concurrentBrowsers || 0;
          newStates[index] = {
            username: data.username,
            stage: 'error',
            message: data.message,
            error: data.error
          };
          return newStates;
        });
        break;

      case 'account_creation_all_complete':
        // All done!
        setCreationResults(data.results);
        setShowCreationModal(false);
        setBrowserStates([]);
        setShowCompleteModal(true);
        onRefresh();
        break;

      default:
        break;
    }
  };

  const slaveAccounts = accounts.slaveAccounts.filter(s => s.mainAccountId === mainAccount.id);
  const activeCount = slaveAccounts.filter(s => s.status === 'active' || s.status === 'running').length;
  const errorCount = slaveAccounts.filter(s => s.status === 'error').length;
  const apiCount = slaveAccounts.filter(s => s.method === 'api').length;
  const browserCount = slaveAccounts.filter(s => s.method !== 'api').length;

  const parseTargets = (text) => {
    // Parse URLs and usernames
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const targets = [];

    for (const line of lines) {
      if (line.includes('bsky.app/profile/')) {
        // Extract username from URL
        const match = line.match(/bsky\.app\/profile\/([^/?\s]+)/);
        if (match) targets.push(match[1]);
      } else if (line.includes('.bsky.social')) {
        // Direct username
        targets.push(line.replace('@', ''));
      } else {
        // Try as-is
        targets.push(line.replace('@', ''));
      }
    }

    return targets;
  };

  const handleSaveTargets = async () => {
    const targets = parseTargets(targetList);

    try {
      await fetch(`http://localhost:3003/api/accounts/main/${mainAccount.id}/targets`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets })
      });
      setShowTargetModal(false);
      onRefresh();
      alert(`${targets.length} targets saved!`);
    } catch (error) {
      alert('Error saving targets: ' + error.message);
    }
  };

  const handleSpeedChange = async (e) => {
    const newSpeed = e.target.value;
    setGlobalSpeed(newSpeed);

    // Update all API method slave accounts
    const apiSlaves = slaveAccounts.filter(s => s.method === 'api');

    for (const slave of apiSlaves) {
      try {
        await fetch(`http://localhost:3003/api/accounts/slave/${slave.id}/speed`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ speed: newSpeed })
        });
      } catch (error) {
        console.error(`Error updating speed for ${slave.id}:`, error);
      }
    }

    onRefresh();
  };

  const handleStartAll = async () => {
    const targets = mainAccount.targets || [];

    if (targets.length === 0) {
      alert('Please set targets first by clicking "Manage Targets"');
      return;
    }

    try {
      const response = await fetch('http://localhost:3003/api/bot/start-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mainAccountId: mainAccount.id })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start bots');
      }
      onRefresh();
    } catch (error) {
      console.error('Error starting bots:', error);
      alert('Error starting bots: ' + error.message);
    }
  };

  const handleStopAll = async () => {
    try {
      const response = await fetch('http://localhost:3003/api/bot/stop-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mainAccountId: mainAccount.id })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to stop bots');
      }
      onRefresh();
    } catch (error) {
      console.error('Error stopping bots:', error);
      alert('Error stopping bots: ' + error.message);
    }
  };

  const handleExportTargets = async () => {
    try {
      const response = await fetch('http://localhost:3003/api/targets/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mainAccountId: mainAccount.id })
      });
      const data = await response.json();

      // Create downloadable JSON
      const blob = new Blob([JSON.stringify(data.targets, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `targets_${mainAccount.username}_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      alert(`Exported ${data.count} targets successfully!`);
    } catch (error) {
      console.error('Error exporting targets:', error);
      alert('Error exporting targets: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="px-4 py-2 bg-bg-secondary text-accent-purple font-semibold rounded-lg hover:bg-opacity-80 transition-all"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-3xl font-bold text-text-primary">
                AutoSky <span className="text-accent-purple">&gt;</span> {mainAccount.username}
              </h1>
              <div className="text-text-secondary text-sm mt-1">
                🏷️ {mainAccount.label}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowBulkCreateModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-accent-pink to-accent-purple text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              ⚡ Bulk Create Slaves
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-accent-purple text-white font-semibold rounded-lg hover:bg-accent-pink transition-all"
            >
              + Add Slave
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-bg-secondary rounded-lg p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-text-secondary">
                  Targets: <span className="text-accent-purple font-semibold">
                    {(mainAccount.targets || []).length}
                  </span>
                </span>
                <button
                  onClick={() => setShowTargetModal(true)}
                  className="px-4 py-2 bg-accent-purple text-white font-semibold rounded-lg hover:bg-accent-pink transition-all"
                >
                  Manage Targets
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-text-secondary">API Speed:</span>
                <select
                  value={globalSpeed}
                  onChange={handleSpeedChange}
                  className="px-3 py-2 bg-bg-primary text-text-primary rounded-lg border border-accent-purple focus:outline-none focus:border-accent-pink"
                >
                  <option value="max">⚡ MAX (No Delay)</option>
                  <option value="normal">🚀 Normal (2-5s)</option>
                  <option value="slow">🐢 Slow (5-10s)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleStartAll}
                className="px-6 py-2 bg-success-green text-bg-primary font-semibold rounded-lg hover:opacity-80 transition-all"
              >
                Start All
              </button>
              <button
                onClick={handleStopAll}
                className="px-6 py-2 bg-error-red text-white font-semibold rounded-lg hover:opacity-80 transition-all"
              >
                Stop All
              </button>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="bg-bg-secondary rounded-lg p-4 mb-6">
          <div className="text-text-secondary text-sm">
            Slaves: <span className="text-text-primary font-semibold">{slaveAccounts.length} total</span>
            {' - '}
            <span className="text-success-green font-semibold">{activeCount} active</span>
            {errorCount > 0 && (
              <>
                {', '}
                <span className="text-error-red font-semibold">{errorCount} error</span>
              </>
            )}
            {' | '}
            <span className="text-accent-purple font-semibold">⚡ {apiCount} API</span>
            {', '}
            <span className="text-accent-pink font-semibold">🌐 {browserCount} Browser</span>
          </div>
        </div>
      </div>

      {/* Slave Accounts List */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Slave List */}
        <div className="bg-bg-secondary rounded-lg p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Slave Accounts</h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {slaveAccounts.length === 0 ? (
              <div className="text-text-secondary text-center py-8">
                No slave accounts yet. Add some to get started!
              </div>
            ) : (
              slaveAccounts.map(slave => (
                <SlaveAccountBar
                  key={slave.id}
                  slave={slave}
                  onRefresh={onRefresh}
                  mainAccount={mainAccount}
                />
              ))
            )}
          </div>
        </div>

        {/* Right: Activity Feed */}
        <div className="bg-bg-secondary rounded-lg p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Live Activity Feed</h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {activityFeed.length === 0 ? (
              <div className="text-text-secondary text-center py-8">
                No activity yet
              </div>
            ) : (
              activityFeed.map((activity, index) => (
                <div key={index} className="flex items-start gap-2 text-sm py-2 border-b border-bg-primary">
                  <span className="text-accent-pink">•</span>
                  <span className="flex-1 text-text-primary">{activity.message}</span>
                  <span className="text-text-secondary text-xs whitespace-nowrap">{activity.timeAgo}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Slave Modal */}
      {showAddModal && (
        <AddAccountModal
          type="slave"
          mainAccountId={mainAccount.id}
          onClose={() => {
            setShowAddModal(false);
            onRefresh();
          }}
        />
      )}

      {/* Manage Targets Modal */}
      {showTargetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-secondary rounded-xl p-8 max-w-2xl w-full shadow-2xl">
            <h2 className="text-2xl font-bold text-text-primary mb-4">
              Manage Target List
            </h2>
            <p className="text-text-secondary text-sm mb-4">
              Paste target usernames or profile URLs (one per line). The bot will automatically parse them.
            </p>

            <textarea
              value={targetList}
              onChange={(e) => setTargetList(e.target.value)}
              placeholder="Examples:&#10;yuumii.bsky.social&#10;@johndoe.bsky.social&#10;https://bsky.app/profile/janedoe.bsky.social"
              className="w-full h-64 px-4 py-3 bg-bg-primary text-text-primary rounded-lg border border-accent-purple focus:outline-none focus:border-accent-pink font-mono text-sm"
            />

            <div className="mt-4 text-text-secondary text-sm">
              Targets will be distributed evenly across all {slaveAccounts.length} slave accounts
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleSaveTargets}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-accent-pink to-accent-purple text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                Save Targets
              </button>
              <button
                onClick={() => setShowTargetModal(false)}
                className="px-6 py-3 bg-bg-primary text-text-secondary font-semibold rounded-lg hover:bg-opacity-80 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Create Modal */}
      {showBulkCreateModal && (
        <AccountCreationModal
          mainAccount={mainAccount}
          isOpen={showBulkCreateModal}
          onClose={() => setShowBulkCreateModal(false)}
          onSubmit={async (formData) => {
            // Cache form data for later use
            setFormDataCache(formData);

            // Close form modal
            setShowBulkCreateModal(false);

            // Open preparing modal
            setShowPreparingModal(true);
            setPreparingProgress(null);
            setPreparingError(null);

            // Start username preparation
            const result = await prepareAvailableUsernamesWithRetry(
              formData.baseUsername,
              formData.accountCount,
              (progress) => {
                setPreparingProgress(progress);
              },
              3 // max retries
            );

            if (!result.success) {
              // Show error in preparing modal
              setPreparingError({
                message: result.message,
                found: result.found,
                needed: result.needed,
                usernames: result.usernames
              });
            }
          }}
        />
      )}

      {/* Preparing Creation Modal */}
      {showPreparingModal && (
        <PreparingCreationModal
          isOpen={showPreparingModal}
          progress={preparingProgress}
          error={preparingError}
          onCancel={() => {
            // Reset and go back to form
            setShowPreparingModal(false);
            setPreparingProgress(null);
            setPreparingError(null);
            setShowBulkCreateModal(true);
          }}
          onStartCreation={async (usernames) => {
            // Close preparing modal
            setShowPreparingModal(false);

            // Initialize browser states
            const initialStates = Array(formDataCache.concurrentBrowsers).fill(null).map(() => ({
              username: null,
              stage: null,
              message: 'Waiting...'
            }));
            setBrowserStates(initialStates);
            setOverallProgress({ total: usernames.length, completed: 0, failed: 0, inProgress: 0 });

            // Open creation progress modal
            setShowCreationModal(true);

            // Start account creation via API with orchestrator
            try {
              const response = await fetch('http://localhost:3003/api/bulk-create-accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  usernames,
                  formData: formDataCache,
                  mainAccount: mainAccount
                })
              });

              const result = await response.json();
              console.log('Bulk creation orchestration started:', result);
            } catch (error) {
              console.error('Error starting bulk creation:', error);
              alert('Failed to start account creation: ' + error.message);
              setShowCreationModal(false);
            }
          }}
        />
      )}

      {/* Creation Progress Modal */}
      {showCreationModal && (
        <CreationProgressModal
          isOpen={showCreationModal}
          browserStates={browserStates}
          overallProgress={overallProgress}
          onPause={() => {
            // TODO: Implement pause functionality
            alert('Pause functionality coming soon');
          }}
          onCancel={() => {
            if (window.confirm('Are you sure you want to cancel account creation?')) {
              setShowCreationModal(false);
              setBrowserStates([]);
              setOverallProgress({ total: 0, completed: 0, failed: 0, inProgress: 0 });
              // Refresh accounts to show any that were created before cancel
              setTimeout(() => onRefresh(), 1000);
            }
          }}
        />
      )}

      {/* Creation Complete Modal */}
      {showCompleteModal && (
        <CreationCompleteModal
          isOpen={showCompleteModal}
          results={creationResults}
          onViewAccounts={() => {
            setShowCompleteModal(false);
            onRefresh();
          }}
          onCreateMore={() => {
            setShowCompleteModal(false);
            setCreationResults(null);
            setShowBulkCreateModal(true);
          }}
          onClose={() => {
            setShowCompleteModal(false);
            setCreationResults(null);
          }}
        />
      )}
    </div>
  );
}

export default SlaveAccountView;