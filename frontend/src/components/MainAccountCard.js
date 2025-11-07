import React, { useState } from 'react';

function MainAccountCard({ mainAccount, slaveAccounts, onSelect, onRefresh }) {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [label, setLabel] = useState(mainAccount.label);
  const [username, setUsername] = useState(mainAccount.username);
  const fileInputRef = React.useRef(null);

  const activeSlaves = slaveAccounts.filter(s => s.status === 'active' || s.status === 'running').length;
  const totalSlaves = slaveAccounts.length;

  const handleSaveLabel = async () => {
    try {
      await fetch(`http://localhost:3003/api/accounts/main/${mainAccount.id}/label`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label })
      });
      setIsEditingLabel(false);
      onRefresh();
    } catch (error) {
      console.error('Error updating label:', error);
    }
  };

  const handleSaveUsername = async () => {
    try {
      console.log('Saving username:', username);
      const response = await fetch(`http://localhost:3003/api/accounts/main/${mainAccount.id}/username`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      console.log('Response:', response.status);
      if (response.ok) {
        setIsEditingUsername(false);
        onRefresh();
      } else {
        const error = await response.json();
        console.error('Error response:', error);
        alert('Failed to update username: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating username:', error);
      alert('Error updating username: ' + error.message);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result;
      try {
        await fetch(`http://localhost:3003/api/accounts/main/${mainAccount.id}/image`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageData: base64Image })
        });
        onRefresh();
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`http://localhost:3003/api/main-accounts/${mainAccount.id}`, {
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
    <div className="bg-bg-secondary rounded-xl p-6 shadow-2xl hover:shadow-accent-purple/30 transition-all duration-300 transform hover:scale-105 relative">
      {/* Delete Button */}
      <button
        onClick={handleDelete}
        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-error-red bg-opacity-20 text-error-red rounded-full hover:bg-opacity-30 transition-all"
        title="Delete account"
      >
        ✕
      </button>

      {/* Profile Pic */}
      <div className="relative w-24 h-24 mx-auto mb-4">
        {mainAccount.profileImage ? (
          <img
            src={mainAccount.profileImage}
            alt={mainAccount.username}
            className="w-24 h-24 rounded-full object-cover"
          />
        ) : (
          <div className="w-24 h-24 bg-gradient-to-br from-accent-pink to-accent-purple rounded-full flex items-center justify-center text-4xl font-bold">
            {mainAccount.username.charAt(0).toUpperCase()}
          </div>
        )}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-0 right-0 w-8 h-8 bg-accent-purple text-white rounded-full flex items-center justify-center hover:bg-accent-pink transition-all text-sm"
          title="Upload image"
        >
          📷
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {/* Username */}
      <div className="text-center mb-4">
        {isEditingUsername ? (
          <div className="flex gap-2 justify-center">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="flex-1 px-3 py-1 bg-bg-primary text-text-primary rounded-lg border border-accent-purple focus:outline-none focus:border-accent-pink text-center"
              autoFocus
              placeholder="username.bsky.social"
            />
            <button
              onClick={handleSaveUsername}
              className="px-3 py-1 bg-success-green text-bg-primary rounded-lg font-semibold hover:opacity-80"
            >
              ✓
            </button>
            <button
              onClick={() => {
                setUsername(mainAccount.username);
                setIsEditingUsername(false);
              }}
              className="px-3 py-1 bg-error-red text-white rounded-lg font-semibold hover:opacity-80"
            >
              ✕
            </button>
          </div>
        ) : (
          <div
            onClick={() => setIsEditingUsername(true)}
            className="text-text-primary font-semibold text-lg truncate cursor-pointer hover:text-accent-purple transition-colors"
            title="Click to edit username"
          >
            @{mainAccount.username}
          </div>
        )}
      </div>

      {/* Label */}
      <div className="mb-4 text-center">
        {isEditingLabel ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="flex-1 px-3 py-1 bg-bg-primary text-text-primary rounded-lg border border-accent-purple focus:outline-none focus:border-accent-pink"
              autoFocus
            />
            <button
              onClick={handleSaveLabel}
              className="px-3 py-1 bg-success-green text-bg-primary rounded-lg font-semibold hover:opacity-80"
            >
              ✓
            </button>
            <button
              onClick={() => {
                setLabel(mainAccount.label);
                setIsEditingLabel(false);
              }}
              className="px-3 py-1 bg-error-red text-white rounded-lg font-semibold hover:opacity-80"
            >
              ✕
            </button>
          </div>
        ) : (
          <div
            onClick={() => setIsEditingLabel(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-bg-primary rounded-lg cursor-pointer hover:bg-opacity-80"
          >
            <span className="text-xl">🏷️</span>
            <span className="text-accent-purple font-medium">{mainAccount.label}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="space-y-2 mb-4 text-text-secondary text-sm">
        <div className="flex justify-between">
          <span>Followers:</span>
          <span className="text-text-primary font-semibold">
            {mainAccount.followers ? mainAccount.followers.toLocaleString() : '0'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Following:</span>
          <span className="text-text-primary font-semibold">
            {mainAccount.following ? mainAccount.following.toLocaleString() : '0'}
          </span>
        </div>
      </div>

      {/* Slave Count */}
      <div className="border-t border-bg-primary pt-4 mb-4">
        <div className="text-center text-text-secondary text-sm mb-1">
          {totalSlaves} Slave{totalSlaves !== 1 ? 's' : ''}
        </div>
        <div className="text-center">
          <span className="inline-flex items-center gap-2 text-success-green font-semibold">
            <span className="w-2 h-2 bg-success-green rounded-full animate-pulse"></span>
            {activeSlaves} Active
          </span>
        </div>
      </div>

      {/* View Button */}
      <button
        onClick={onSelect}
        className="w-full py-3 bg-gradient-to-r from-accent-pink to-accent-purple text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
      >
        View
      </button>
    </div>
  );
}

export default MainAccountCard;