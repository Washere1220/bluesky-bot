import React, { useState, useEffect, useRef } from 'react';

function TargetsPageSimplified({ onBack }) {
  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState(null);
  const [seeds, setSeeds] = useState([]);
  const [recentDiscoveries, setRecentDiscoveries] = useState([]);
  const [discoveryAccounts, setDiscoveryAccounts] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // overview, config, seeds, history
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
      <div className="min-h-screen bg-bg-primary p-8">
        <div className="text-text-primary text-xl">Loading...</div>
      </div>
    );
  }

  const isRunning = stats.discoveryRunning;

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Simplified Header */}
      <div className="bg-bg-secondary border-b border-border-primary p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold text-text-primary">Target Discovery</h1>
            <div className={`ml-4 w-2 h-2 rounded-full ${isRunning ? 'bg-accent-green animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-text-secondary text-sm">{isRunning ? 'Active' : 'Inactive'}</span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            {isRunning ? (
              <button
                onClick={stopDiscovery}
                className="px-5 py-2 bg-accent-red text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Stop
              </button>
            ) : (
              <button
                onClick={startDiscovery}
                disabled={discoveryAccounts.length === 0}
                className={`px-5 py-2 rounded-lg transition-colors ${
                  discoveryAccounts.length === 0
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-accent-green text-white hover:bg-green-600'
                }`}
              >
                Start
              </button>
            )}
            <button
              onClick={exportTargets}
              className="px-5 py-2 bg-bg-tertiary text-text-primary rounded-lg hover:bg-accent-blue hover:text-white transition-colors"
            >
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-bg-tertiary border-b border-border-primary px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
          <div className="flex items-center gap-8">
            <div>
              <span className="text-text-secondary">Total Targets: </span>
              <span className="text-accent-blue font-bold text-lg">{stats.totalTargets || 0}</span>
            </div>
            <div>
              <span className="text-text-secondary">Premium: </span>
              <span className="text-accent-purple font-bold text-lg">{stats.premiumTargets || 0}</span>
            </div>
            <div>
              <span className="text-text-secondary">Seeds: </span>
              <span className="text-accent-green font-bold text-lg">{stats.totalSeeds || 0}</span>
            </div>
            <div>
              <span className="text-text-secondary">Accounts: </span>
              <span className="text-text-primary font-bold">{discoveryAccounts.length}</span>
            </div>
          </div>
          {stats.currentlyScanningAccount && (
            <div className="text-text-secondary">
              Scanning: <span className="text-accent-blue">@{stats.currentlyScanningAccount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-bg-secondary border-b border-border-primary px-6">
        <div className="max-w-7xl mx-auto flex gap-6">
          {['overview', 'config', 'seeds', 'history'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-4 capitalize transition-colors border-b-2 ${
                activeTab === tab
                  ? 'text-accent-blue border-accent-blue'
                  : 'text-text-secondary border-transparent hover:text-text-primary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Discovery Accounts */}
            <div className="bg-bg-secondary rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary">Discovery Accounts</h2>
                <button
                  onClick={() => setShowAddAccountModal(true)}
                  className="px-4 py-2 bg-accent-blue text-white rounded-lg hover:bg-accent-purple transition-colors text-sm"
                >
                  + Add Account
                </button>
              </div>
              {discoveryAccounts.length === 0 ? (
                <div className="text-text-secondary text-center py-8 bg-bg-primary rounded-lg">
                  No accounts configured. Add at least one to start discovering.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {discoveryAccounts.map(account => (
                    <div key={account.username} className="flex items-center justify-between p-3 bg-bg-primary rounded-lg">
                      <span className="text-text-primary">@{account.username}</span>
                      <button
                        onClick={() => removeDiscoveryAccount(account.username)}
                        className="text-accent-red hover:bg-accent-red hover:text-white px-2 py-1 rounded transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-bg-secondary rounded-lg p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Discovery Progress</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Network Depth</span>
                    <span className="text-accent-blue font-bold">{stats.networkDepth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Manual Seeds</span>
                    <span className="text-text-primary">{stats.manualSeeds}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Promoted Seeds</span>
                    <span className="text-accent-green">{stats.promotedSeeds}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Discovery Rate</span>
                    <span className="text-text-primary">
                      {stats.totalTargets > 0 ? Math.round(stats.premiumTargets / stats.totalTargets * 100) : 0}% premium
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-bg-secondary rounded-lg p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Recent Activity</h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {recentDiscoveries.slice(0, 5).map((disc, idx) => (
                    <div key={idx} className="text-sm">
                      <span className="text-accent-blue">@{disc.username}</span>
                      <span className="text-text-secondary ml-2">
                        {disc.isPremium && '💎'} {disc.followers} followers
                      </span>
                    </div>
                  ))}
                  {recentDiscoveries.length === 0 && (
                    <div className="text-text-secondary">No recent discoveries</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Config Tab */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            <div className="bg-bg-secondary rounded-lg p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Quality Filters</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-text-secondary text-sm">Follower Range</label>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="number"
                      value={config.minFollowers}
                      onChange={(e) => updateConfig({ minFollowers: parseInt(e.target.value) })}
                      className="px-3 py-2 bg-bg-primary text-text-primary rounded-lg w-24"
                      placeholder="Min"
                    />
                    <span className="text-text-secondary self-center">to</span>
                    <input
                      type="number"
                      value={config.maxFollowers}
                      onChange={(e) => updateConfig({ maxFollowers: parseInt(e.target.value) })}
                      className="px-3 py-2 bg-bg-primary text-text-primary rounded-lg w-24"
                      placeholder="Max"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.requireAvatar}
                      onChange={(e) => updateConfig({ requireAvatar: e.target.checked })}
                      className="accent-accent-blue"
                    />
                    <span className="text-text-primary">Must have profile picture</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.requireBio}
                      onChange={(e) => updateConfig({ requireBio: e.target.checked })}
                      className="accent-accent-blue"
                    />
                    <span className="text-text-primary">Must have bio</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-bg-secondary rounded-lg p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Auto-Promotion</h2>
              <div className="space-y-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.autoPromoteToSeed}
                    onChange={(e) => updateConfig({ autoPromoteToSeed: e.target.checked })}
                    className="accent-accent-blue"
                  />
                  <span className="text-text-primary">Auto-promote quality targets to seeds</span>
                </label>
                {config.autoPromoteToSeed && (
                  <div className="ml-6 space-y-3">
                    <div className="flex items-center gap-4">
                      <span className="text-text-secondary w-32">Min Score:</span>
                      <input
                        type="number"
                        value={config.seedPromotionMinScore}
                        onChange={(e) => updateConfig({ seedPromotionMinScore: parseInt(e.target.value) })}
                        className="px-3 py-2 bg-bg-primary text-text-primary rounded-lg w-20"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-text-secondary w-32">Min Followers:</span>
                      <input
                        type="number"
                        value={config.seedPromotionMinFollowers}
                        onChange={(e) => updateConfig({ seedPromotionMinFollowers: parseInt(e.target.value) })}
                        className="px-3 py-2 bg-bg-primary text-text-primary rounded-lg w-20"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Seeds Tab */}
        {activeTab === 'seeds' && (
          <div className="space-y-6">
            <div className="bg-bg-secondary rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary">Seed Accounts ({seeds.length})</h2>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSeedUsername}
                    onChange={(e) => setNewSeedUsername(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSeed()}
                    placeholder="Username..."
                    className="px-3 py-2 bg-bg-primary text-text-primary rounded-lg"
                  />
                  <button
                    onClick={addSeed}
                    className="px-4 py-2 bg-accent-green text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Add Seed
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {seeds.map(seed => (
                  <div key={seed.username} className="flex items-center justify-between p-3 bg-bg-primary rounded-lg">
                    <div>
                      <div className="text-text-primary font-medium">@{seed.username}</div>
                      <div className="text-text-secondary text-xs">
                        {seed.source === 'manual' ? 'Manual' : '⭐ Promoted'} •
                        Scanned {seed.scanCount}x •
                        Found {seed.discoveredTargets}
                      </div>
                    </div>
                    <button
                      onClick={() => removeSeed(seed.username)}
                      className="text-accent-red hover:bg-accent-red hover:text-white px-3 py-1 rounded transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {seeds.length === 0 && (
                  <div className="col-span-2 text-text-secondary text-center py-8">
                    No seed accounts. Add some to start discovering.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-bg-secondary rounded-lg p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Discovery History</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {recentDiscoveries.map((discovery, idx) => (
                <div key={idx} className="p-3 bg-bg-primary rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-text-primary font-medium">@{discovery.username}</span>
                    {discovery.isPremium && <span className="text-accent-purple ml-2">💎 Premium</span>}
                  </div>
                  <div className="text-text-secondary text-sm">
                    Score: {discovery.qualityScore} • {discovery.followers} followers • via @{discovery.foundFrom}
                  </div>
                </div>
              ))}
              {recentDiscoveries.length === 0 && (
                <div className="text-text-secondary text-center py-8">
                  No discoveries yet. Start the discovery process to find targets.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      {showAddAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-bg-secondary p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold text-text-primary mb-4">Add Discovery Account</h2>
            <div className="space-y-4">
              <div>
                <label className="text-text-secondary text-sm">Username</label>
                <input
                  type="text"
                  value={discoveryBotUsername}
                  onChange={(e) => setDiscoveryBotUsername(e.target.value)}
                  className="w-full px-4 py-2 bg-bg-primary text-text-primary rounded-lg mt-1"
                  placeholder="account.bsky.social"
                />
              </div>
              <div>
                <label className="text-text-secondary text-sm">App Password</label>
                <input
                  type="password"
                  value={discoveryBotPassword}
                  onChange={(e) => setDiscoveryBotPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-bg-primary text-text-primary rounded-lg mt-1"
                  placeholder="App password"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={addDiscoveryAccount}
                  className="flex-1 px-4 py-2 bg-accent-blue text-white rounded-lg hover:bg-accent-purple transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddAccountModal(false);
                    setDiscoveryBotUsername('');
                    setDiscoveryBotPassword('');
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

export default TargetsPageSimplified;