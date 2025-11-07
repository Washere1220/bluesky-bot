import React, { useState } from 'react';

function AccountCreationModal({ mainAccount, isOpen, onClose, onSubmit }) {
  // Form state
  const [baseUsername, setBaseUsername] = useState('');
  const [password, setPassword] = useState('');
  const [profileImages, setProfileImages] = useState([]);
  const [createVariations, setCreateVariations] = useState(true);
  const [bioTemplate, setBioTemplate] = useState('');
  const [mainAccountTag, setMainAccountTag] = useState('');
  const [age, setAge] = useState(19);
  const [gender, setGender] = useState('F');
  const [includeMainInBio, setIncludeMainInBio] = useState(true);
  const [accountCount, setAccountCount] = useState(100);
  const [concurrentBrowsers, setConcurrentBrowsers] = useState(3);
  const [proxyList, setProxyList] = useState('');
  const [repostAllImages, setRepostAllImages] = useState(true);
  const [startOldest, setStartOldest] = useState(true);
  const [skipReplies, setSkipReplies] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  // Parse proxy list
  const proxies = proxyList
    .split('\n')
    .map(line => line.trim())
    .filter(line => line);

  // Calculate actual account count (limited by proxies if provided)
  const actualAccountCount = proxies.length > 0 && proxies.length < accountCount
    ? proxies.length
    : accountCount;

  // Proxy status message
  const getProxyStatus = () => {
    if (proxies.length === 0) {
      return { icon: 'ℹ️', text: 'No proxies - Will use your IP', color: 'text-text-secondary' };
    } else if (proxies.length >= accountCount) {
      return { icon: '✓', text: `${proxies.length} proxies - 1:1 ratio`, color: 'text-success-green' };
    } else {
      return { icon: '⚠️', text: `${proxies.length} proxies - Will stop after ${proxies.length} accounts`, color: 'text-yellow-500' };
    }
  };

  const proxyStatus = getProxyStatus();

  // Handle image upload
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const newImages = await Promise.all(files.map(async (file) => {
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
      return {
        file,
        base64,
        preview: URL.createObjectURL(file),
        id: Math.random().toString(36).substring(7)
      };
    }));
    setProfileImages([...profileImages, ...newImages]);
  };

  // Remove image
  const removeImage = (id) => {
    setProfileImages(profileImages.filter(img => img.id !== id));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!baseUsername.trim()) {
      newErrors.baseUsername = 'Base username is required';
    }

    if (!password || password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (profileImages.length === 0) {
      newErrors.profileImages = 'At least one profile picture is required';
    }

    if (!bioTemplate.trim()) {
      newErrors.bioTemplate = 'Bio template is required';
    }

    if (age < 18) {
      newErrors.age = 'Age must be at least 18';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const formData = {
      baseUsername: baseUsername.trim(),
      password,
      profileImages,
      createVariations,
      bioTemplate: bioTemplate.trim(),
      mainAccountTag: mainAccountTag.trim() || mainAccount.username,
      age,
      gender,
      includeMainInBio,
      accountCount: actualAccountCount,
      concurrentBrowsers,
      proxies,
      repostSettings: {
        repostAllImages,
        startOldest,
        skipReplies
      }
    };

    onSubmit(formData);
  };

  const isFormValid = baseUsername.trim() && password.length >= 8 && profileImages.length > 0 && bioTemplate.trim() && age >= 18;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-bg-secondary rounded-xl p-8 max-w-4xl w-full shadow-2xl my-8 mt-4">
        <h2 className="text-3xl font-bold text-text-primary mb-2">
          ⚡ Bulk Create Slave Accounts
        </h2>
        <p className="text-text-secondary text-sm mb-6">
          Create multiple slave accounts for @{mainAccount.username}
        </p>

        <div className="space-y-6">
          {/* Basic Info Section */}
          <div className="bg-bg-primary rounded-lg p-6">
            <h3 className="text-xl font-semibold text-text-primary mb-4">Basic Info</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Base Username</label>
                <input
                  type="text"
                  placeholder="Mary"
                  value={baseUsername}
                  onChange={(e) => setBaseUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-bg-secondary text-text-primary rounded-lg border border-accent-purple focus:outline-none focus:border-accent-pink transition-all"
                />
                <p className="text-gray-400 text-xs mt-1">
                  Examples: Marryxx, MaryCutie (no numbers, max double letters)
                </p>
                {errors.baseUsername && (
                  <p className="text-error-red text-xs mt-1">{errors.baseUsername}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Password</label>
                <input
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-bg-secondary text-text-primary rounded-lg border border-accent-purple focus:outline-none focus:border-accent-pink transition-all"
                />
                {errors.password && (
                  <p className="text-error-red text-xs mt-1">{errors.password}</p>
                )}
              </div>
            </div>
          </div>

          {/* Profile Pictures Section */}
          <div className="bg-bg-primary rounded-lg p-6">
            <h3 className="text-xl font-semibold text-text-primary mb-4">Profile Pictures</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Upload Images</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="inline-block px-6 py-3 bg-accent-purple text-white font-semibold rounded-lg hover:bg-accent-pink transition-all cursor-pointer"
                >
                  📁 Upload Images
                </label>
                {errors.profileImages && (
                  <p className="text-error-red text-xs mt-1">{errors.profileImages}</p>
                )}
              </div>

              {profileImages.length > 0 && (
                <div className="grid grid-cols-4 gap-4 max-h-64 overflow-y-auto">
                  {profileImages.map((img) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.preview}
                        alt="Profile preview"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeImage(img.id)}
                        className="absolute top-2 right-2 bg-error-red text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="create-variations"
                  checked={createVariations}
                  onChange={(e) => setCreateVariations(e.target.checked)}
                  className="w-4 h-4 accent-accent-purple"
                />
                <label htmlFor="create-variations" className="text-text-primary text-sm">
                  🎨 Create unique variations for each account
                </label>
              </div>
              <p className="text-gray-400 text-xs">
                Applies simple transforms: crop, flip, brightness, metadata removal
              </p>
            </div>
          </div>

          {/* Bio Configuration Section */}
          <div className="bg-bg-primary rounded-lg p-6">
            <h3 className="text-xl font-semibold text-text-primary mb-4">Bio Configuration</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Bio Template</label>
                <textarea
                  placeholder="Artist dabbling in paint | Horror enthusiast | Plant mom | Hiker"
                  value={bioTemplate}
                  onChange={(e) => setBioTemplate(e.target.value)}
                  rows="4"
                  className="w-full px-4 py-3 bg-bg-secondary text-text-primary rounded-lg border border-accent-purple focus:outline-none focus:border-accent-pink transition-all"
                />
                <p className="text-gray-400 text-xs mt-1">
                  Bot creates variations. Don't include age/gender - those are auto-added
                </p>
                {errors.bioTemplate && (
                  <p className="text-error-red text-xs mt-1">{errors.bioTemplate}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Main Account Tag (Optional)</label>
                <input
                  type="text"
                  placeholder={`@${mainAccount.username}`}
                  value={mainAccountTag}
                  onChange={(e) => setMainAccountTag(e.target.value)}
                  className="w-full px-4 py-3 bg-bg-secondary text-text-primary rounded-lg border border-accent-purple focus:outline-none focus:border-accent-pink transition-all"
                />
                <p className="text-gray-400 text-xs mt-1">
                  Leave empty to use @{mainAccount.username}, or specify a different account
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Age</label>
                  <input
                    type="number"
                    min="18"
                    value={age}
                    onChange={(e) => setAge(parseInt(e.target.value) || 18)}
                    className="w-full px-4 py-3 bg-bg-secondary text-text-primary rounded-lg border border-accent-purple focus:outline-none focus:border-accent-pink transition-all"
                  />
                  {errors.age && (
                    <p className="text-error-red text-xs mt-1">{errors.age}</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-3 bg-bg-secondary text-text-primary rounded-lg border border-accent-purple focus:outline-none focus:border-accent-pink transition-all"
                  >
                    <option value="F">F</option>
                    <option value="M">M</option>
                    <option value="NB">NB</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="include-main"
                    checked={includeMainInBio}
                    onChange={(e) => setIncludeMainInBio(e.target.checked)}
                    className="w-4 h-4 accent-accent-purple"
                  />
                  <label htmlFor="include-main" className="text-text-primary text-sm">
                    Include main account in bio
                  </label>
                </div>

                <div className="bg-bg-secondary rounded-lg p-3">
                  <p className="text-gray-400 text-sm">
                    ℹ️ All bios end with: {age}{gender}{includeMainInBio && ` | Main: @${mainAccountTag || mainAccount.username}`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Settings Section */}
          <div className="bg-bg-primary rounded-lg p-6">
            <h3 className="text-xl font-semibold text-text-primary mb-4">Account Settings</h3>

            <div className="space-y-6">
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Number of Accounts: <span className="text-accent-pink font-semibold">{accountCount}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="500"
                  value={accountCount}
                  onChange={(e) => setAccountCount(parseInt(e.target.value))}
                  className="w-full accent-accent-pink"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Concurrent Browsers: <span className="text-accent-pink font-semibold">{concurrentBrowsers}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={concurrentBrowsers}
                  onChange={(e) => setConcurrentBrowsers(parseInt(e.target.value))}
                  className="w-full accent-accent-pink"
                />
                <p className="text-gray-400 text-xs mt-1">
                  More = faster, but more captchas simultaneously
                </p>
              </div>
            </div>
          </div>

          {/* Proxies Section */}
          <div className="bg-bg-primary rounded-lg p-6">
            <h3 className="text-xl font-semibold text-text-primary mb-4">Proxies (Optional)</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Proxies (Optional - uses your IP if empty)</label>
                <textarea
                  placeholder="portal.anyip.io:1080:user:pass&#10;another.proxy.com:8080:user:pass"
                  value={proxyList}
                  onChange={(e) => setProxyList(e.target.value)}
                  rows="6"
                  className="w-full px-4 py-3 bg-bg-secondary text-text-primary rounded-lg border border-accent-purple focus:outline-none focus:border-accent-pink transition-all font-mono text-sm"
                />
                <p className="text-gray-400 text-xs mt-1">
                  1 per line
                </p>
              </div>

              <div className={`bg-bg-secondary rounded-lg p-3 ${proxyStatus.color}`}>
                <p className="text-sm">
                  {proxyStatus.icon} {proxyStatus.text}
                </p>
              </div>
            </div>
          </div>

          {/* Repost Strategy Section */}
          <div className="bg-bg-primary rounded-lg p-6">
            <h3 className="text-xl font-semibold text-text-primary mb-4">Repost Strategy</h3>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="repost-all"
                  checked={repostAllImages}
                  onChange={(e) => setRepostAllImages(e.target.checked)}
                  className="w-4 h-4 accent-accent-purple"
                />
                <label htmlFor="repost-all" className="text-text-primary text-sm">
                  Repost ALL image posts from @{mainAccount.username}
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="start-oldest"
                  checked={startOldest}
                  onChange={(e) => setStartOldest(e.target.checked)}
                  className="w-4 h-4 accent-accent-purple"
                />
                <label htmlFor="start-oldest" className="text-text-primary text-sm">
                  Start with oldest, go to newest
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="skip-replies"
                  checked={skipReplies}
                  onChange={(e) => setSkipReplies(e.target.checked)}
                  className="w-4 h-4 accent-accent-purple"
                />
                <label htmlFor="skip-replies" className="text-text-primary text-sm">
                  Skip replies
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isFormValid}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-accent-pink to-accent-purple text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Creation ({actualAccountCount} accounts)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountCreationModal;
