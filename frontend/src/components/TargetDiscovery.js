import React, { useState, useEffect, useRef } from 'react';

function TargetDiscovery({ onBack }) {
  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState(null);
  const [seeds, setSeeds] = useState([]);
  const [recentDiscoveries, setRecentDiscoveries] = useState([]);
  const [discoveryAccounts, setDiscoveryAccounts] = useState([]);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [discoveryBotUsername, setDiscoveryBotUsername] = useState('');
  const [discoveryBotPassword, setDiscoveryBotPassword] = useState('');
  const [newSeedUsername, setNewSeedUsername] = useState('');
  const wsRef = useRef(null);

  useEffect(() => {
    fetchConfig();
    fetchStats();
    fetchSeeds();
    fetchRecentDiscoveries();
    fetchDiscoveryAccounts();
    setupWebSocket();

    const statsInterval = setInterval(fetchStats, 5000);

    return () => {
      clearInterval(statsInterval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const setupWebSocket = () => {
    const ws = new WebSocket('ws://localhost:3004');
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleWebSocketMessage(message);
    };
  };

  const handleWebSocketMessage = (message) => {
    const { type, data } = message;

    switch (type) {
      case 'discovery_status':
        fetchStats();
        break;

      case 'target_discovered':
        setRecentDiscoveries(prev => [{
          username: data.username,
          qualityScore: data.qualityScore,
          followers: data.followers,
          isPremium: data.isPremium,
          foundFrom: data.foundFrom,
          timestamp: Date.now()
        }, ...prev.slice(0, 49)]);
        fetchStats();
        break;

      case 'seed_promoted':
        fetchStats();
        fetchSeeds();
        break;

      case 'discovery_stats':
        setStats(data);
        break;

      default:
        break;
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await fetch('http://localhost:3003/api/targets/config');
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const fetchDiscoveryAccounts = async () => {
    try {
      const response = await fetch('http://localhost:3003/api/targets/credentials');
      const data = await response.json();
      setDiscoveryAccounts(data);
    } catch (error) {
      console.error('Error fetching discovery accounts:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:3003/api/targets/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchSeeds = async () => {
    try {
      const response = await fetch('http://localhost:3003/api/targets/seeds');
      const data = await response.json();
      setSeeds(data);
    } catch (error) {
      console.error('Error fetching seeds:', error);
    }
  };

  const fetchRecentDiscoveries = async () => {
    try {
      const response = await fetch('http://localhost:3003/api/targets/recent');
      const data = await response.json();
      setRecentDiscoveries(data.map(t => ({
        username: t.username,
        qualityScore: t.qualityScore,
        followers: t.followers,
        isPremium: t.isPremiumTarget,
        foundFrom: t.foundFrom,
        timestamp: t.addedAt
      })));
    } catch (error) {
      console.error('Error fetching recent discoveries:', error);
    }
  };

  const updateConfig = async (updates) => {
    try {
      const response = await fetch('http://localhost:3003/api/targets/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await response.json();
      setConfig(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error('Error updating config:', error);
    }
  };

  const addDiscoveryAccount = async () => {
    try {
      const response = await fetch('http://localhost:3003/api/targets/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: discoveryBotUsername,
          password: discoveryBotPassword
        })
      });

      if (response.ok) {
        setShowAddAccountModal(false);
        setDiscoveryBotUsername('');
        setDiscoveryBotPassword('');
        fetchDiscoveryAccounts();
      } else {
        const error = await response.json();
        alert('Error: ' + error.error);
      }
    } catch (error) {
      console.error('Error adding account:', error);
      alert('Error adding account');
    }
  };

  const removeDiscoveryAccount = async (username) => {
    try {
      await fetch(`http://localhost:3003/api/targets/credentials/${encodeURIComponent(username)}`, {
        method: 'DELETE'
      });
      fetchDiscoveryAccounts();
    } catch (error) {
      console.error('Error removing account:', error);
    }
  };

  const startDiscovery = async () => {
    try {
      const response = await fetch('http://localhost:3003/api/targets/start', {
        method: 'POST'
      });
      if (response.ok) {
        fetchStats();
      } else {
        const error = await response.json();
        alert('Error starting discovery: ' + error.error);
      }
    } catch (error) {
      console.error('Error starting discovery:', error);
      alert('Error starting discovery. Make sure credentials are set.');
    }
  };

  const stopDiscovery = async () => {
    try {
      const response = await fetch('http://localhost:3003/api/targets/stop', {
        method: 'POST'
      });
      await response.json();
      setTimeout(() => fetchStats(), 500);
    } catch (error) {
      console.error('Error stopping discovery:', error);
    }
  };

  const addSeed = async () => {
    if (!newSeedUsername.trim()) return;
    try {
      const response = await fetch('http://localhost:3003/api/targets/seeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newSeedUsername.trim() })
      });
      if (response.ok) {
        setNewSeedUsername('');
        fetchSeeds();
        fetchStats();
      }
    } catch (error) {
      console.error('Error adding seed:', error);
    }
  };

  const removeSeed = async (username) => {
    try {
      await fetch(`http://localhost:3003/api/targets/seeds/${encodeURIComponent(username)}`, {
        method: 'DELETE'
      });
      fetchSeeds();
      fetchStats();
    } catch (error) {
      console.error('Error removing seed:', error);
    }
  };

  const exportTargets = async () => {
    try {
      const response = await fetch('http://localhost:3003/api/targets/export?format=json');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'targets.json';
      a.click();
    } catch (error) {
      console.error('Error exporting targets:', error);
    }
  };

  if (!config || !stats) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-text-primary text-xl">Loading...</div>
      </div>
    );
  }

  const isRunning = stats.discoveryRunning;

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Simple Top Bar */}
      <div className="border-b border-border-primary bg-bg-secondary">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-xl font-semibold text-text-primary">Target Discovery</h1>
          </div>

          <div className="flex items-center gap-3">
            {isRunning ? (
              <button
                onClick={stopDiscovery}
                className="px-4 py-2 bg-accent-red text-white rounded-lg hover:opacity-90 transition-all font-medium"
              >
                Stop Discovery
              </button>
            ) : (
              <button
                onClick={startDiscovery}
                disabled={discoveryAccounts.length === 0}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  discoveryAccounts.length === 0
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-accent-pink text-white hover:bg-accent-pink-hover'
                }`}
              >
                Start Discovery
              </button>
            )}
            <button
              onClick={exportTargets}
              className="px-4 py-2 border border-border-primary text-text-primary rounded-lg hover:bg-bg-tertiary transition-all"
            >
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-bg-secondary border border-border-primary rounded-lg p-5">
            <div className="text-text-secondary text-sm mb-1">Targets Found</div>
            <div className="text-3xl font-bold text-text-primary">{stats.totalTargets || 0}</div>
          </div>
          <div className="bg-bg-secondary border border-border-primary rounded-lg p-5">
            <div className="text-text-secondary text-sm mb-1">High Quality</div>
            <div className="text-3xl font-bold text-accent-pink">{stats.premiumTargets || 0}</div>
          </div>
          <div className="bg-bg-secondary border border-border-primary rounded-lg p-5">
            <div className="text-text-secondary text-sm mb-1">Discovery Accounts</div>
            <div className="text-3xl font-bold text-text-primary">{discoveryAccounts.length}</div>
          </div>
          <div className="bg-bg-secondary border border-border-primary rounded-lg p-5">
            <div className="text-text-secondary text-sm mb-1">Status</div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-success-green' : 'bg-gray-500'}`} />
              <span className="text-lg font-semibold text-text-primary">{isRunning ? 'Running' : 'Stopped'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Discovery Accounts */}
          <div className="col-span-1">
            <div className="bg-bg-secondary border border-border-primary rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-text-primary">Discovery Accounts</h2>
                <button
                  onClick={() => setShowAddAccountModal(true)}
                  className="text-accent-pink hover:text-accent-pink-hover transition-colors text-sm font-medium"
                >
                  + Add
                </button>
              </div>
              {discoveryAccounts.length === 0 ? (
                <div className="text-text-secondary text-sm text-center py-8 bg-bg-primary rounded-lg border border-border-primary">
                  Add an account to start finding targets
                </div>
              ) : (
                <div className="space-y-2">
                  {discoveryAccounts.map(account => (
                    <div key={account.username} className="flex items-center justify-between p-3 bg-bg-primary rounded-lg border border-border-primary">
                      <span className="text-text-primary text-sm">@{account.username}</span>
                      <button
                        onClick={() => removeDiscoveryAccount(account.username)}
                        className="text-text-secondary hover:text-accent-red transition-colors text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Starting Points */}
            <div className="bg-bg-secondary border border-border-primary rounded-lg p-5 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-text-primary">Starting Points</h2>
                <span className="text-text-secondary text-sm">{seeds.length} total</span>
              </div>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newSeedUsername}
                  onChange={(e) => setNewSeedUsername(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSeed()}
                  placeholder="username.bsky.social"
                  className="flex-1 px-3 py-2 bg-bg-primary text-text-primary border border-border-primary rounded-lg text-sm placeholder-text-secondary focus:outline-none focus:border-accent-pink"
                />
                <button
                  onClick={addSeed}
                  className="px-4 py-2 bg-accent-pink text-white rounded-lg hover:bg-accent-pink-hover transition-all text-sm font-medium"
                >
                  Add
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {seeds.map(seed => (
                  <div key={seed.username} className="flex items-center justify-between p-2 bg-bg-primary rounded border border-border-primary">
                    <div className="flex-1 min-w-0">
                      <div className="text-text-primary text-sm truncate">@{seed.username}</div>
                      <div className="text-text-secondary text-xs">Found {seed.discoveredTargets} targets</div>
                    </div>
                    <button
                      onClick={() => removeSeed(seed.username)}
                      className="text-text-secondary hover:text-accent-red transition-colors text-xs ml-2"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {seeds.length === 0 && (
                  <div className="text-text-secondary text-sm text-center py-4">
                    Add accounts to start from
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Discoveries */}
          <div className="col-span-2">
            <div className="bg-bg-secondary border border-border-primary rounded-lg p-5">
              <h2 className="text-base font-semibold text-text-primary mb-4">Recent Discoveries</h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {recentDiscoveries.length === 0 ? (
                  <div className="text-text-secondary text-sm text-center py-12 bg-bg-primary rounded-lg border border-border-primary">
                    No targets discovered yet. Start discovery to find potential targets.
                  </div>
                ) : (
                  recentDiscoveries.map((discovery, idx) => (
                    <div key={idx} className="p-4 bg-bg-primary rounded-lg border border-border-primary hover:border-accent-pink transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-text-primary font-medium">@{discovery.username}</span>
                            {discovery.isPremium && (
                              <span className="px-2 py-0.5 bg-accent-pink bg-opacity-10 text-accent-pink text-xs rounded border border-accent-pink">
                                High Quality
                              </span>
                            )}
                          </div>
                          <div className="text-text-secondary text-sm">
                            {discovery.followers.toLocaleString()} followers • Quality Score: {discovery.qualityScore}
                          </div>
                          <div className="text-text-secondary text-xs mt-1">
                            Found from @{discovery.foundFrom}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Settings Section */}
        <div className="mt-6 bg-bg-secondary border border-border-primary rounded-lg p-5">
          <h2 className="text-base font-semibold text-text-primary mb-4">Settings</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-text-secondary text-sm mb-2 block">Minimum Followers</label>
              <input
                type="number"
                value={config.minFollowers}
                onChange={(e) => updateConfig({ minFollowers: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-bg-primary text-text-primary border border-border-primary rounded-lg focus:outline-none focus:border-accent-pink"
              />
            </div>
            <div>
              <label className="text-text-secondary text-sm mb-2 block">Maximum Followers</label>
              <input
                type="number"
                value={config.maxFollowers}
                onChange={(e) => updateConfig({ maxFollowers: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-bg-primary text-text-primary border border-border-primary rounded-lg focus:outline-none focus:border-accent-pink"
              />
            </div>
            <div className="col-span-2 flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.requireAvatar}
                  onChange={(e) => updateConfig({ requireAvatar: e.target.checked })}
                  className="w-4 h-4 accent-accent-pink"
                />
                <span className="text-text-primary text-sm">Must have profile picture</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.requireBio}
                  onChange={(e) => updateConfig({ requireBio: e.target.checked })}
                  className="w-4 h-4 accent-accent-pink"
                />
                <span className="text-text-primary text-sm">Must have bio</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Add Account Modal */}
      {showAddAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-bg-secondary border border-border-primary rounded-lg p-6 w-96">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Add Discovery Account</h2>
            <div className="space-y-4">
              <div>
                <label className="text-text-secondary text-sm mb-2 block">Username</label>
                <input
                  type="text"
                  value={discoveryBotUsername}
                  onChange={(e) => setDiscoveryBotUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-primary text-text-primary border border-border-primary rounded-lg focus:outline-none focus:border-accent-pink placeholder-text-secondary"
                  placeholder="account.bsky.social"
                />
              </div>
              <div>
                <label className="text-text-secondary text-sm mb-2 block">App Password</label>
                <input
                  type="password"
                  value={discoveryBotPassword}
                  onChange={(e) => setDiscoveryBotPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-primary text-text-primary border border-border-primary rounded-lg focus:outline-none focus:border-accent-pink placeholder-text-secondary"
                  placeholder="••••••••"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={addDiscoveryAccount}
                  className="flex-1 px-4 py-2 bg-accent-pink text-white rounded-lg hover:bg-accent-pink-hover transition-all font-medium"
                >
                  Add Account
                </button>
                <button
                  onClick={() => {
                    setShowAddAccountModal(false);
                    setDiscoveryBotUsername('');
                    setDiscoveryBotPassword('');
                  }}
                  className="flex-1 px-4 py-2 border border-border-primary text-text-primary rounded-lg hover:bg-bg-primary transition-all"
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

export default TargetDiscovery;
