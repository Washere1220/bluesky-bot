import React, { useState, useEffect } from 'react';
import MainAccountCard from './MainAccountCard';
import AddAccountModal from './AddAccountModal';

function Dashboard({ accounts, onSelectMainAccount, onShowTargets, onRefresh }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statsUsername, setStatsUsername] = useState('');
  const [statsPassword, setStatsPassword] = useState('');
  const [statsAccount, setStatsAccount] = useState(null);

  // Fetch stats account on load
  useEffect(() => {
    fetchStatsAccount();
  }, []);

  const fetchStatsAccount = async () => {
    try {
      const response = await fetch('http://localhost:3003/api/stats-account');
      const data = await response.json();
      setStatsAccount(data);
    } catch (error) {
      console.error('Error fetching stats account:', error);
    }
  };

  const connectStatsAccount = async () => {
    try {
      const response = await fetch('http://localhost:3003/api/stats-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: statsUsername, password: statsPassword })
      });
      if (response.ok) {
        setShowStatsModal(false);
        setStatsUsername('');
        setStatsPassword('');
        fetchStatsAccount();
        alert('Stats account connected! Main account stats will update every 10 seconds.');
      } else {
        const error = await response.json();
        alert('Error: ' + error.error);
      }
    } catch (error) {
      alert('Error connecting stats account');
    }
  };

  const disconnectStatsAccount = async () => {
    try {
      await fetch('http://localhost:3003/api/stats-account', { method: 'DELETE' });
      setStatsAccount(null);
    } catch (error) {
      console.error('Error disconnecting stats account:', error);
    }
  };

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold text-text-primary mb-4">
          Auto<span className="text-accent-pink">Sky</span>
        </h1>
        <div className="mt-8 mb-6">
          <div className="text-text-secondary text-lg mb-2">Total Follows Today</div>
          <div className="text-7xl font-bold bg-gradient-to-r from-accent-pink to-accent-purple bg-clip-text text-transparent">
            {accounts.totalFollowsToday.toLocaleString()}
          </div>
        </div>
        <div className="flex gap-4 justify-center flex-wrap">
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-accent-pink to-accent-purple text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            + Add Main Account
          </button>
          <button
            onClick={onShowTargets}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-accent-blue to-accent-purple text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            🎯 Targets Discovery
          </button>
          {statsAccount ? (
            <button
              onClick={disconnectStatsAccount}
              className="mt-4 px-6 py-3 bg-success-green text-white font-semibold rounded-lg shadow-lg hover:opacity-80 transition-all flex items-center gap-2"
            >
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              Stats Connected (@{statsAccount.username})
            </button>
          ) : (
            <button
              onClick={() => setShowStatsModal(true)}
              className="mt-4 px-6 py-3 bg-yellow-600 text-white font-semibold rounded-lg shadow-lg hover:bg-yellow-700 transition-all"
            >
              📊 Connect Stats Account
            </button>
          )}
        </div>
      </div>

      {/* Main Account Cards Grid */}
      {accounts.mainAccounts.length === 0 ? (
        <div className="text-center text-text-secondary text-xl mt-16">
          No main accounts yet. Add one to get started!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {accounts.mainAccounts.map(mainAccount => (
            <MainAccountCard
              key={mainAccount.id}
              mainAccount={mainAccount}
              slaveAccounts={accounts.slaveAccounts.filter(s => s.mainAccountId === mainAccount.id)}
              onSelect={() => onSelectMainAccount(mainAccount)}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}

      {/* Add Account Modal */}
      {showAddModal && (
        <AddAccountModal
          type="main"
          onClose={() => {
            setShowAddModal(false);
            onRefresh();
          }}
        />
      )}

      {/* Stats Account Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-bg-secondary p-8 rounded-lg border border-border-primary w-96">
            <h2 className="text-2xl font-bold text-text-primary mb-4">Connect Stats Account</h2>
            <p className="text-text-secondary text-sm mb-4">
              This account will fetch follower/following counts for all main accounts every 10 seconds
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-text-secondary text-sm">Username</label>
                <input
                  type="text"
                  value={statsUsername}
                  onChange={(e) => setStatsUsername(e.target.value)}
                  className="w-full px-4 py-2 bg-bg-primary text-text-primary border border-border-primary rounded-lg mt-1"
                  placeholder="account.bsky.social"
                />
              </div>
              <div>
                <label className="text-text-secondary text-sm">App Password</label>
                <input
                  type="password"
                  value={statsPassword}
                  onChange={(e) => setStatsPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-bg-primary text-text-primary border border-border-primary rounded-lg mt-1"
                  placeholder="App password"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={connectStatsAccount}
                  className="flex-1 px-4 py-2 bg-success-green text-white rounded-lg hover:opacity-80 transition-colors font-bold"
                >
                  Connect
                </button>
                <button
                  onClick={() => {
                    setShowStatsModal(false);
                    setStatsUsername('');
                    setStatsPassword('');
                  }}
                  className="flex-1 px-4 py-2 bg-bg-tertiary text-text-primary rounded-lg hover:bg-bg-primary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;