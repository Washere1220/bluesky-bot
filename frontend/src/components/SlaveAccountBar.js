import React from 'react';

function SlaveAccountBar({ slave, onRefresh, mainAccount }) {
  const isError = slave.status === 'error';
  const isSuspended = slave.errorMessage && (slave.errorMessage.includes('taken down') || slave.errorMessage.includes('suspended'));
  const isRunning = slave.status === 'active' || slave.status === 'running';

  const handleStart = async () => {
    console.log(`[${slave.username}] START clicked - Current status: ${slave.status}`);
    const targets = mainAccount.targets || [];

    if (targets.length === 0) {
      alert('Please set targets for this main account first by clicking "Manage Targets"');
      return;
    }

    // Use the first target for individual start (or you could assign specific targets per slave)
    const targetUsername = targets[0];

    try {
      const response = await fetch('http://localhost:3003/api/bot/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: slave.id, targetUsername })
      });
      console.log(`[${slave.username}] START response status: ${response.status}`);
      onRefresh();

      // Log status changes
      setTimeout(() => {
        fetch('http://localhost:3003/api/accounts')
          .then(r => r.json())
          .then(data => {
            const updated = data.slaveAccounts.find(s => s.id === slave.id);
            console.log(`[${slave.username}] Status after START refresh: ${updated?.status}`);
          });
      }, 1000);
    } catch (error) {
      alert('Error starting bot: ' + error.message);
    }
  };

  const handleStop = async () => {
    console.log(`[${slave.username}] STOP clicked - Current status: ${slave.status}`);
    try {
      await fetch('http://localhost:3003/api/bot/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: slave.id })
      });
      onRefresh();
    } catch (error) {
      alert('Error stopping bot: ' + error.message);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`http://localhost:3003/api/slave-accounts/${slave.id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg transition-all ${
        isSuspended
          ? 'bg-yellow-500 bg-opacity-10 border border-yellow-500 border-opacity-30'
          : isError
          ? 'bg-error-red bg-opacity-10 border border-error-red border-opacity-30'
          : 'bg-bg-primary hover:bg-opacity-80'
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Status Indicator */}
        <div className={`w-2 h-2 rounded-full ${isSuspended ? 'bg-yellow-500' : isError ? 'bg-error-red' : isRunning ? 'bg-success-green animate-pulse' : 'bg-text-secondary'}`} />

        {/* Username */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-text-primary font-medium truncate">@{slave.username}</div>
            {/* Method Badge */}
            <span className={`text-xs px-2 py-0.5 rounded ${
              slave.method === 'api'
                ? 'bg-accent-purple bg-opacity-20 text-accent-purple'
                : 'bg-accent-pink bg-opacity-20 text-accent-pink'
            }`}>
              {slave.method === 'api' ? '⚡ API' : '🌐 Browser'}
            </span>
          </div>
          {isSuspended && (
            <div className="text-yellow-500 text-xs">⚠️ Account suspended</div>
          )}
          {isError && !isSuspended && (
            <div className="text-error-red text-xs">Error: Rate limited or failed</div>
          )}
        </div>

        {/* Stats */}
        <div className="hidden md:flex gap-4 text-sm text-text-secondary">
          <div>
            <span className="text-xs">Followers:</span>{' '}
            <span className="text-text-primary font-semibold">{slave.followers || 0}</span>
          </div>
          <div>
            <span className="text-xs">Following:</span>{' '}
            <span className="text-text-primary font-semibold">
              {slave.following ? slave.following.toLocaleString() : '0'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="ml-4 flex gap-2">
        {isRunning ? (
          <button
            onClick={handleStop}
            className="px-4 py-1 bg-error-red text-white text-sm font-semibold rounded hover:opacity-80 transition-all"
          >
            Stop
          </button>
        ) : (
          <button
            onClick={handleStart}
            className="px-4 py-1 bg-success-green text-bg-primary text-sm font-semibold rounded hover:opacity-80 transition-all"
          >
            Start
          </button>
        )}
        <button
          onClick={handleDelete}
          className="w-8 h-8 flex items-center justify-center bg-error-red bg-opacity-20 text-error-red rounded hover:bg-opacity-30 transition-all"
          title="Delete account"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default SlaveAccountBar;