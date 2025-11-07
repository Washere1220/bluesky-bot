import React, { useState, useEffect, useRef } from 'react';
import Dashboard from './components/Dashboard';
import SlaveAccountView from './components/SlaveAccountView';
import TargetDiscovery from './components/TargetDiscovery';

function App() {
  const [accounts, setAccounts] = useState({ mainAccounts: [], slaveAccounts: [], totalFollowsToday: 0 });
  const [selectedMainAccount, setSelectedMainAccount] = useState(null);
  const [showTargetsPage, setShowTargetsPage] = useState(false);
  const [activityFeed, setActivityFeed] = useState([]);
  const wsRef = useRef(null);

  // Fetch accounts from backend
  const fetchAccounts = async () => {
    try {
      const response = await fetch('http://localhost:3003/api/accounts');
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  // Auto-refresh accounts every 5 seconds
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      fetchAccounts();
    }, 5000);

    return () => clearInterval(refreshInterval);
  }, []);

  // WebSocket connection
  useEffect(() => {
    fetchAccounts();

    const ws = new WebSocket('ws://localhost:3004');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to backend WebSocket');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleWebSocketMessage(message);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('Disconnected from backend WebSocket');
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  const handleWebSocketMessage = (message) => {
    const { type, data } = message;

    switch (type) {
      case 'follow_success':
        addActivity(`@${data.slaveUsername} followed @${data.targetUsername}`, data.timestamp);
        // Force re-render to update counts
        fetchAccounts();
        break;

      case 'total_follows_update':
        setAccounts(prev => ({ ...prev, totalFollowsToday: data.totalToday }));
        break;

      case 'status_update':
        addActivity(`[${data.accountId}] ${data.message}`, Date.now());
        // Update account status in state
        setAccounts(prev => {
          const updated = { ...prev };
          const slave = updated.slaveAccounts.find(s => s.id === data.accountId);
          if (slave) {
            slave.status = data.status;
          }
          return updated;
        });
        break;

      case 'account_stats_update':
        setAccounts(prev => {
          const updated = { ...prev };
          const slave = updated.slaveAccounts.find(s => s.id === data.accountId);
          if (slave) {
            slave.followers = data.followers;
            slave.following = data.following;
          }
          return updated;
        });
        break;

      case 'error':
        addActivity(`[${data.accountId}] ERROR: ${data.error}`, data.timestamp);
        setAccounts(prev => {
          const updated = { ...prev };
          const slave = updated.slaveAccounts.find(s => s.id === data.accountId);
          if (slave) {
            slave.status = 'error';
          }
          return updated;
        });
        break;

      case 'complete':
        addActivity(`[${data.accountId}] Completed! Total: ${data.totalFollowed}`, Date.now());
        break;

      default:
        break;
    }
  };

  const addActivity = (message, timestamp) => {
    const activity = {
      message,
      timestamp,
      timeAgo: getTimeAgo(timestamp)
    };
    setActivityFeed(prev => [activity, ...prev.slice(0, 49)]); // Keep last 50
  };

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // Update time ago every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActivityFeed(prev =>
        prev.map(activity => ({
          ...activity,
          timeAgo: getTimeAgo(activity.timestamp)
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary">
      {showTargetsPage ? (
        <TargetDiscovery
          onBack={() => setShowTargetsPage(false)}
        />
      ) : !selectedMainAccount ? (
        <Dashboard
          accounts={accounts}
          onSelectMainAccount={setSelectedMainAccount}
          onShowTargets={() => setShowTargetsPage(true)}
          onRefresh={fetchAccounts}
        />
      ) : (
        <SlaveAccountView
          mainAccount={selectedMainAccount}
          accounts={accounts}
          activityFeed={activityFeed}
          onBack={() => setSelectedMainAccount(null)}
          onRefresh={fetchAccounts}
        />
      )}
    </div>
  );
}

export default App;