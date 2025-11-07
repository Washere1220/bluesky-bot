import React, { useState, useEffect, useRef } from 'react';

function TargetsPage({ onBack }) {
  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState(null);
  const [seeds, setSeeds] = useState([]);
  const [recentDiscoveries, setRecentDiscoveries] = useState([]);
  const [recentPromotions, setRecentPromotions] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [newCustomLink, setNewCustomLink] = useState('');
  const [newSeedUsername, setNewSeedUsername] = useState('');
  const [bulkSeedInput, setBulkSeedInput] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [discoveryAccounts, setDiscoveryAccounts] = useState([]);
  const [discoveryBotUsername, setDiscoveryBotUsername] = useState('');
  const [discoveryBotPassword, setDiscoveryBotPassword] = useState('');
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
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
        // Update current scanning status
        fetchStats();
        break;

      case 'target_discovered':
        // Add to recent discoveries
        setRecentDiscoveries(prev => [{
          username: data.username,
          qualityScore: data.qualityScore,
          followers: data.followers,
          isPremium: data.isPremium,
          foundFrom: data.foundFrom,
          timestamp: Date.now()
        }, ...prev.slice(0, 19)]);
        fetchStats();
        break;

      case 'seed_promoted':
        // Add to recent promotions
        setRecentPromotions(prev => [{
          username: data.username,
          qualityScore: data.qualityScore,
          followers: data.followers,
          timestamp: Date.now()
        }, ...prev.slice(0, 19)]);
        fetchStats();
        fetchSeeds();
        break;

      case 'discovery_stats':
        setStats(data);
        break;

      case 'error':
        console.error('Discovery error:', data.message);
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
        setShowCredentialsModal(false);
        setDiscoveryBotUsername('');
        setDiscoveryBotPassword('');
        fetchDiscoveryAccounts();
        alert('Discovery account added!');
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
      console.log('Stopping discovery...');
      const response = await fetch('http://localhost:3003/api/targets/stop', {
        method: 'POST'
      });
      const result = await response.json();
      console.log('Stop response:', result);

      // Force immediate stats update
      setTimeout(() => fetchStats(), 500);
      setTimeout(() => fetchStats(), 1500);
    } catch (error) {
      console.error('Error stopping discovery:', error);
    }
  };

  const resetDiscoveryState = async () => {
    try {
      console.log('Resetting discovery state...');
      await fetch('http://localhost:3003/api/targets/reset', {
        method: 'POST'
      });
      fetchStats();
      alert('Discovery state reset successfully!');
    } catch (error) {
      console.error('Error resetting discovery:', error);
    }
  };

  const addKeyword = () => {
    if (!newKeyword.trim()) return;
    const keywords = [...(config.keywords || []), newKeyword.trim()];
    updateConfig({ keywords });
    setNewKeyword('');
  };

  const removeKeyword = (keyword) => {
    const keywords = config.keywords.filter(k => k !== keyword);
    updateConfig({ keywords });
  };

  const addCustomLink = () => {
    if (!newCustomLink.trim()) return;
    const customLinks = [...(config.customLinks || []), newCustomLink.trim()];
    updateConfig({ customLinks });
    setNewCustomLink('');
  };

  const removeCustomLink = (link) => {
    const customLinks = config.customLinks.filter(l => l !== link);
    updateConfig({ customLinks });
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
      } else {
        const error = await response.json();
        alert(error.error);
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

  const bulkImportSeeds = async () => {
    try {
      let usernames = [];

      // Try to parse as JSON array first
      try {
        const parsed = JSON.parse(bulkSeedInput.trim());
        if (Array.isArray(parsed)) {
          usernames = parsed;
        }
      } catch {
        // If not JSON, treat as newline or comma separated
        usernames = bulkSeedInput
          .split(/[\n,]/)
          .map(u => u.trim())
          .filter(u => u.length > 0);
      }

      let successCount = 0;
      for (const username of usernames) {
        try {
          const response = await fetch('http://localhost:3003/api/targets/seeds', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
          });
          if (response.ok) successCount++;
        } catch (error) {
          console.error(`Error adding ${username}:`, error);
        }
      }

      alert(`Successfully imported ${successCount} of ${usernames.length} seed accounts`);
      setBulkSeedInput('');
      setShowBulkImport(false);
      fetchSeeds();
      fetchStats();
    } catch (error) {
      console.error('Error bulk importing seeds:', error);
      alert('Error importing seeds: ' + error.message);
    }
  };

  const exportTargets = async (format) => {
    try {
      const response = await fetch(`http://localhost:3003/api/targets/export?format=${format}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'csv' ? 'targets.csv' : 'targets.json';
      a.click();
    } catch (error) {
      console.error('Error exporting targets:', error);
    }
  };

  const exportUsernamesOnly = async () => {
    try {
      const response = await fetch('http://localhost:3003/api/targets/export-usernames');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'premium_targets_usernames.json';
      a.click();
    } catch (error) {
      console.error('Error exporting usernames:', error);
    }
  };

  const clearDatabase = async () => {
    if (!window.confirm('Are you sure you want to clear the entire targets database? This cannot be undone!')) {
      return;
    }
    try {
      await fetch('http://localhost:3003/api/targets/clear', {
        method: 'DELETE'
      });
      fetchStats();
      fetchRecentDiscoveries();
      alert('Database cleared!');
    } catch (error) {
      console.error('Error clearing database:', error);
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
    <div className="min-h-screen bg-bg-primary p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-bg-secondary text-text-primary rounded-lg hover:bg-bg-tertiary transition-colors"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-text-primary">Infinite Target Discovery</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-accent-green' : 'bg-accent-red'} animate-pulse`}></div>
          <span className="text-text-secondary">{isRunning ? 'Running' : 'Stopped'}</span>
          <div className="ml-4 px-4 py-2 bg-bg-secondary rounded-lg">
            <span className="text-text-secondary text-sm">Network Depth: </span>
            <span className="text-accent-blue font-bold">{stats.networkDepth}</span>
          </div>
        </div>
      </div>

      {/* Discovery Stats Dashboard */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-bg-secondary p-6 rounded-lg border border-border-primary">
          <div className="text-text-secondary text-sm mb-2">Total Targets</div>
          <div className="text-3xl font-bold text-accent-blue">{stats.totalTargets || 0}</div>
        </div>
        <div className="bg-bg-secondary p-6 rounded-lg border border-border-primary">
          <div className="text-text-secondary text-sm mb-2">Premium Targets</div>
          <div className="text-3xl font-bold text-accent-purple">{stats.premiumTargets || 0}</div>
        </div>
        <div className="bg-bg-secondary p-6 rounded-lg border border-border-primary">
          <div className="text-text-secondary text-sm mb-2">Total Seeds</div>
          <div className="text-2xl font-bold text-accent-green">
            {stats.totalSeeds || 0}
            <span className="text-sm text-text-secondary ml-2">
              ({stats.manualSeeds}M + {stats.promotedSeeds}P)
            </span>
          </div>
        </div>
        <div className="bg-bg-secondary p-6 rounded-lg border border-border-primary">
          <div className="text-text-secondary text-sm mb-2">Currently Scanning</div>
          <div className="text-lg font-bold text-text-primary truncate">
            {stats.currentlyScanningAccount || 'None'}
          </div>
        </div>
      </div>

      {/* Discovery Bot Accounts */}
      <div className="bg-bg-secondary p-6 rounded-lg border border-border-primary mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-text-primary">Discovery Bot Accounts ({discoveryAccounts.length})</h2>
          <button
            onClick={() => setShowCredentialsModal(true)}
            className="px-4 py-2 bg-accent-blue text-white rounded-lg hover:bg-accent-purple transition-colors"
          >
            + Add Account
          </button>
        </div>
        {discoveryAccounts.length === 0 ? (
          <div className="text-text-secondary text-center py-4">
            No discovery accounts. Add at least one to start discovering.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {discoveryAccounts.map(account => (
              <div key={account.username} className="flex items-center justify-between p-3 bg-bg-primary rounded-lg border border-border-primary">
                <span className="text-text-primary">@{account.username}</span>
                <button
                  onClick={() => removeDiscoveryAccount(account.username)}
                  className="px-3 py-1 bg-accent-red text-white text-sm rounded hover:bg-red-600 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="text-text-secondary text-xs mt-3">
          💡 Add multiple accounts for parallel discovery ({discoveryAccounts.length}x speed multiplier)
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={startDiscovery}
          disabled={isRunning}
          className={`px-6 py-3 rounded-lg font-bold transition-colors ${
            isRunning
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-accent-green text-white hover:bg-green-600'
          }`}
        >
          Start Discovery
        </button>
        <button
          onClick={stopDiscovery}
          disabled={!isRunning}
          className={`px-6 py-3 rounded-lg font-bold transition-colors ${
            !isRunning
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-accent-red text-white hover:bg-red-600'
          }`}
        >
          Stop Discovery
        </button>
        <button
          onClick={resetDiscoveryState}
          className="px-6 py-3 bg-yellow-600 text-white rounded-lg font-bold hover:bg-yellow-700 transition-colors"
          title="Reset if discovery is stuck"
        >
          Reset State
        </button>
        <button
          onClick={() => exportTargets('json')}
          className="px-6 py-3 bg-accent-blue text-white rounded-lg font-bold hover:bg-accent-purple transition-colors"
        >
          Export JSON
        </button>
        <button
          onClick={() => exportTargets('csv')}
          className="px-6 py-3 bg-accent-blue text-white rounded-lg font-bold hover:bg-accent-purple transition-colors"
        >
          Export CSV
        </button>
        <button
          onClick={exportUsernamesOnly}
          className="px-6 py-3 bg-success-green text-bg-primary rounded-lg font-bold hover:opacity-80 transition-colors"
        >
          📋 Usernames Only
        </button>
        <button
          onClick={clearDatabase}
          className="px-6 py-3 bg-accent-red text-white rounded-lg font-bold hover:bg-red-600 transition-colors ml-auto"
        >
          Clear Database
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Keyword Filters */}
          <div className="bg-bg-secondary p-6 rounded-lg border border-border-primary">
            <h2 className="text-xl font-bold text-text-primary mb-4">Bio/Username Keywords</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {config.keywords.map(keyword => (
                <div key={keyword} className="flex items-center gap-2 px-3 py-1 bg-accent-blue text-white rounded-full text-sm">
                  <span>{keyword}</span>
                  <button onClick={() => removeKeyword(keyword)} className="text-white hover:text-accent-red">×</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                placeholder="Add keyword..."
                className="flex-1 px-4 py-2 bg-bg-primary text-text-primary border border-border-primary rounded-lg"
              />
              <button onClick={addKeyword} className="px-4 py-2 bg-accent-blue text-white rounded-lg hover:bg-accent-purple transition-colors">
                Add
              </button>
            </div>
          </div>

          {/* Link Detection */}
          <div className="bg-bg-secondary p-6 rounded-lg border border-border-primary">
            <h2 className="text-xl font-bold text-text-primary mb-4">Detect Monetization Links</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {config.linkPatterns.map(pattern => (
                <div key={pattern} className="flex items-center gap-2">
                  <input type="checkbox" checked readOnly className="accent-accent-blue" />
                  <span className="text-text-primary text-sm">{pattern}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border-primary">
              <div className="text-text-secondary text-sm mb-2">Custom Link Patterns:</div>
              <div className="flex flex-wrap gap-2 mb-2">
                {config.customLinks.map(link => (
                  <div key={link} className="flex items-center gap-2 px-3 py-1 bg-accent-purple text-white rounded-full text-sm">
                    <span>{link}</span>
                    <button onClick={() => removeCustomLink(link)} className="text-white hover:text-accent-red">×</button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCustomLink}
                  onChange={(e) => setNewCustomLink(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomLink()}
                  placeholder="Add custom link pattern..."
                  className="flex-1 px-4 py-2 bg-bg-primary text-text-primary border border-border-primary rounded-lg"
                />
                <button onClick={addCustomLink} className="px-4 py-2 bg-accent-purple text-white rounded-lg hover:bg-purple-600 transition-colors">
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Quality Filters */}
          <div className="bg-bg-secondary p-6 rounded-lg border border-border-primary">
            <h2 className="text-xl font-bold text-text-primary mb-4">Quality Filters</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-text-secondary w-32">Min Followers:</label>
                <input
                  type="number"
                  value={config.minFollowers}
                  onChange={(e) => updateConfig({ minFollowers: parseInt(e.target.value) })}
                  className="px-4 py-2 bg-bg-primary text-text-primary border border-border-primary rounded-lg w-32"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="text-text-secondary w-32">Max Followers:</label>
                <input
                  type="number"
                  value={config.maxFollowers}
                  onChange={(e) => updateConfig({ maxFollowers: parseInt(e.target.value) })}
                  className="px-4 py-2 bg-bg-primary text-text-primary border border-border-primary rounded-lg w-32"
                />
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={config.requireAvatar}
                  onChange={(e) => updateConfig({ requireAvatar: e.target.checked })}
                  className="accent-accent-blue"
                />
                <label className="text-text-primary">Must have profile picture</label>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={config.requireBio}
                  onChange={(e) => updateConfig({ requireBio: e.target.checked })}
                  className="accent-accent-blue"
                />
                <label className="text-text-primary">Must have bio</label>
              </div>
            </div>
          </div>

          {/* Auto-Promotion Settings */}
          <div className="bg-bg-secondary p-6 rounded-lg border border-border-primary">
            <h2 className="text-xl font-bold text-text-primary mb-4">Auto-Promotion Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={config.autoPromoteToSeed}
                  onChange={(e) => updateConfig({ autoPromoteToSeed: e.target.checked })}
                  className="accent-accent-blue"
                />
                <label className="text-text-primary">Auto-promote quality targets to seeds</label>
              </div>
              <div className="flex items-center gap-4">
                <label className="text-text-secondary w-48">Min quality score:</label>
                <input
                  type="number"
                  value={config.seedPromotionMinScore}
                  onChange={(e) => updateConfig({ seedPromotionMinScore: parseInt(e.target.value) })}
                  className="px-4 py-2 bg-bg-primary text-text-primary border border-border-primary rounded-lg w-24"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="text-text-secondary w-48">Min followers:</label>
                <input
                  type="number"
                  value={config.seedPromotionMinFollowers}
                  onChange={(e) => updateConfig({ seedPromotionMinFollowers: parseInt(e.target.value) })}
                  className="px-4 py-2 bg-bg-primary text-text-primary border border-border-primary rounded-lg w-24"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="text-text-secondary w-48">Seed cooldown (days):</label>
                <input
                  type="number"
                  value={config.scanCooldownDays}
                  onChange={(e) => updateConfig({ scanCooldownDays: parseInt(e.target.value) })}
                  className="px-4 py-2 bg-bg-primary text-text-primary border border-border-primary rounded-lg w-24"
                />
              </div>
              <div className="flex items-center gap-4 pt-2 border-t border-border-primary">
                <input
                  type="checkbox"
                  checked={config.rescanDiscoveredTargets}
                  onChange={(e) => updateConfig({ rescanDiscoveredTargets: e.target.checked })}
                  className="accent-accent-blue"
                />
                <label className="text-text-primary">Scan discovered targets when no seeds available</label>
              </div>
              <div className="text-text-secondary text-sm mt-2">
                High-quality targets automatically become new discovery seeds, creating infinite network expansion. Set cooldown to 0 for continuous scanning.
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Seed Management */}
          <div className="bg-bg-secondary p-6 rounded-lg border border-border-primary">
            <h2 className="text-xl font-bold text-text-primary mb-4">Seed Accounts ({seeds.length})</h2>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newSeedUsername}
                onChange={(e) => setNewSeedUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSeed()}
                placeholder="Add seed username..."
                className="flex-1 px-4 py-2 bg-bg-primary text-text-primary border border-border-primary rounded-lg"
              />
              <button onClick={addSeed} className="px-4 py-2 bg-accent-green text-white rounded-lg hover:bg-green-600 transition-colors">
                Add
              </button>
              <button onClick={() => setShowBulkImport(true)} className="px-4 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-pink transition-colors">
                📋 Bulk Import
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {seeds.map(seed => (
                <div key={seed.username} className="flex items-center justify-between p-3 bg-bg-primary rounded-lg border border-border-primary">
                  <div className="flex-1">
                    <div className="text-text-primary font-bold">@{seed.username}</div>
                    <div className="text-text-secondary text-xs">
                      {seed.source === 'manual' ? '📝 Manual' : '⭐ Promoted'} •
                      Scanned {seed.scanCount}x •
                      Found {seed.discoveredTargets} targets
                    </div>
                  </div>
                  <button
                    onClick={() => removeSeed(seed.username)}
                    className="px-3 py-1 bg-accent-red text-white rounded hover:bg-red-600 transition-colors text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Discoveries Feed */}
          <div className="bg-bg-secondary p-6 rounded-lg border border-border-primary">
            <h2 className="text-xl font-bold text-text-primary mb-4">Recent Discoveries</h2>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {recentDiscoveries.length === 0 ? (
                <div className="text-text-secondary text-center py-4">No discoveries yet</div>
              ) : (
                recentDiscoveries.map((discovery, idx) => (
                  <div key={idx} className="p-3 bg-bg-primary rounded-lg border border-border-primary">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-text-primary font-bold">@{discovery.username}</div>
                        <div className="text-text-secondary text-xs">
                          {discovery.isPremium && <span className="text-accent-purple">💎 Premium • </span>}
                          Score: {discovery.qualityScore} •
                          {discovery.followers} followers •
                          Found from @{discovery.foundFrom}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Seed Promotion Feed */}
          <div className="bg-bg-secondary p-6 rounded-lg border border-border-primary">
            <h2 className="text-xl font-bold text-text-primary mb-4">⭐ Seed Promotions</h2>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {recentPromotions.length === 0 ? (
                <div className="text-text-secondary text-center py-4">No promotions yet</div>
              ) : (
                recentPromotions.map((promotion, idx) => (
                  <div key={idx} className="p-3 bg-accent-green bg-opacity-10 rounded-lg border border-accent-green">
                    <div className="text-accent-green font-bold">⭐ @{promotion.username}</div>
                    <div className="text-text-secondary text-xs">
                      Quality: {promotion.qualityScore} • {promotion.followers} followers
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Credentials Modal */}
      {showCredentialsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-bg-secondary p-8 rounded-lg border border-border-primary w-96">
            <h2 className="text-2xl font-bold text-text-primary mb-4">Add Discovery Account</h2>
            <div className="space-y-4">
              <div>
                <label className="text-text-secondary text-sm">Username</label>
                <input
                  type="text"
                  value={discoveryBotUsername}
                  onChange={(e) => setDiscoveryBotUsername(e.target.value)}
                  className="w-full px-4 py-2 bg-bg-primary text-text-primary border border-border-primary rounded-lg mt-1"
                  placeholder="your-bot-account.bsky.social"
                />
              </div>
              <div>
                <label className="text-text-secondary text-sm">App Password</label>
                <input
                  type="password"
                  value={discoveryBotPassword}
                  onChange={(e) => setDiscoveryBotPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-bg-primary text-text-primary border border-border-primary rounded-lg mt-1"
                  placeholder="App password"
                />
              </div>
              <div className="text-text-secondary text-xs">
                Create app passwords at Settings → App Passwords in Bluesky
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
                    setShowCredentialsModal(false);
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

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-bg-secondary p-8 rounded-lg border border-border-primary w-[600px]">
            <h2 className="text-2xl font-bold text-text-primary mb-4">Bulk Import Seed Accounts</h2>
            <div className="space-y-4">
              <div>
                <label className="text-text-secondary text-sm mb-2 block">
                  Paste usernames (JSON array or comma/newline separated)
                </label>
                <textarea
                  value={bulkSeedInput}
                  onChange={(e) => setBulkSeedInput(e.target.value)}
                  className="w-full px-4 py-2 bg-bg-primary text-text-primary border border-border-primary rounded-lg font-mono text-sm"
                  rows={12}
                  placeholder={'[\n  "user1.bsky.social",\n  "user2.bsky.social"\n]\n\nor\n\nuser1.bsky.social\nuser2.bsky.social\n\nor\n\nuser1.bsky.social, user2.bsky.social'}
                />
              </div>
              <div className="text-text-secondary text-xs">
                💡 Accepts JSON arrays or usernames separated by commas or newlines
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={bulkImportSeeds}
                  className="flex-1 px-4 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-pink transition-colors font-bold"
                >
                  Import
                </button>
                <button
                  onClick={() => {
                    setShowBulkImport(false);
                    setBulkSeedInput('');
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

export default TargetsPage;