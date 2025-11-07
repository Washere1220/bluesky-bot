import React, { useState } from 'react';

function AddAccountModal({ type, mainAccountId, onClose }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [label, setLabel] = useState('');
  const [method, setMethod] = useState('browser'); // For slave accounts only
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim() || (type === 'main' && !label.trim())) {
      alert('Please fill in all fields');
      return;
    }

    // For slave accounts with API method, require password
    if (type === 'slave' && method === 'api' && !password.trim()) {
      alert('Password is required for API method');
      return;
    }

    setLoading(true);

    try {
      const endpoint = type === 'main' ? '/api/accounts/main' : '/api/accounts/slave';
      const body = type === 'main'
        ? {
            username: username.trim(),
            label: label.trim()
          }
        : {
            username: username.trim(),
            mainAccountId,
            method: method,
            ...(method === 'api' && password.trim() ? { password: password.trim() } : {})
          };

      const response = await fetch(`http://localhost:3003${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        if (type === 'slave' && method === 'api') {
          alert('Worker account added with API method! No browser login needed.');
        } else {
          alert(`${type === 'main' ? 'Main' : 'Worker'} account added! ${type === 'main' || method === 'browser' ? 'The browser will open for you to log in.' : ''}`);
        }
        onClose();
      } else {
        const data = await response.json();
        alert('Error: ' + (data.error || 'Failed to add account'));
      }
    } catch (error) {
      alert('Error adding account: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-secondary rounded-xl p-8 max-w-md w-full shadow-2xl">
        <h2 className="text-2xl font-bold text-text-primary mb-6">
          Add {type === 'main' ? 'Main' : 'Slave'} Account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-text-secondary text-sm mb-2">Username</label>
            <input
              type="text"
              placeholder="e.g., account.bsky.social"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-bg-primary text-text-primary rounded-lg border border-accent-purple focus:outline-none focus:border-accent-pink"
              disabled={loading}
            />
          </div>

          {type === 'main' && (
            <div>
              <label className="block text-text-secondary text-sm mb-2">Label</label>
              <input
                type="text"
                placeholder="e.g., Gothic, Anime, Fitness"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full px-4 py-3 bg-bg-primary text-text-primary rounded-lg border border-accent-purple focus:outline-none focus:border-accent-pink"
                disabled={loading}
              />
            </div>
          )}

          {type === 'slave' && (
            <>
              <div>
                <label className="block text-text-secondary text-sm mb-2">Follow Method</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full px-4 py-3 bg-bg-primary text-text-primary rounded-lg border border-accent-purple focus:outline-none focus:border-accent-pink"
                  disabled={loading}
                >
                  <option value="browser">🌐 Browser Automation (Safer, Slower)</option>
                  <option value="api">⚡ API Following (Faster, Requires Password)</option>
                </select>
                <p className="text-text-secondary text-xs mt-2">
                  {method === 'browser' && 'Uses Playwright to follow like a human. Safer but slower.'}
                  {method === 'api' && 'Uses Bluesky API to follow instantly. Faster but requires password.'}
                </p>
              </div>

              {method === 'api' && (
                <div>
                  <label className="block text-text-secondary text-sm mb-2">Password (for API method)</label>
                  <input
                    type="password"
                    placeholder="Bluesky password or app password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-bg-primary text-text-primary rounded-lg border border-accent-purple focus:outline-none focus:border-accent-pink"
                    disabled={loading}
                  />
                  <p className="text-text-secondary text-xs mt-2">
                    Required for API authentication. Stored securely.
                  </p>
                </div>
              )}
            </>
          )}

          <div className="flex gap-4 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-accent-pink to-accent-purple text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Account'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 bg-bg-primary text-text-secondary font-semibold rounded-lg hover:bg-opacity-80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-bg-primary rounded-lg">
          <p className="text-text-secondary text-sm">
            <strong className="text-accent-purple">Note:</strong> {type === 'main'
              ? 'A browser window will open. You\'ll have 60 seconds to log in to Bluesky. Your session will be saved for future use.'
              : method === 'browser'
                ? 'Browser method: A browser window will open. You\'ll have 60 seconds to log in. Your session will be saved.'
                : 'API method: Uses your password to authenticate. No browser needed - follows happen instantly via Bluesky API.'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default AddAccountModal;