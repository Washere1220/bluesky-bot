# Bluesky Multi-Account Automation Bot

A powerful automation tool for managing multiple Bluesky accounts with advanced target discovery and following features.

## Features

- **Multi-Account Management**: Create and manage multiple Bluesky accounts
- **Automated Account Creation**: Browser-based account creation with profile setup
- **Target Discovery**: Intelligent algorithm to find relevant accounts to follow
- **Follow Automation**: Automated following with configurable settings
- **Profile Customization**: Auto-generate bios, profile pictures with variations
- **Proxy Support**: Use proxies for each account to avoid rate limits
- **Real-time Dashboard**: Beautiful UI to monitor all accounts and activity
- **WebSocket Updates**: Live updates of account activities

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Windows/Mac/Linux

## Installation

**Step 1:** Download or clone this repository

**Step 2:** Open terminal in the project folder and run:
```bash
npm install
```

**Step 3:** Install frontend dependencies:
```bash
npm install --prefix frontend
```

## Configuration

### Proxies (Optional)

If you want to use proxies, add them to `backend/proxies/proxies.txt`:

```
ip:port:username:password
123.45.67.89:8080:user:pass
```

### Profile Images

Place profile images in `backend/profiles/` folder. The bot will randomly select and transform them for new accounts.

## Running the Application

**Terminal 1 - Start Backend:**
```bash
npm run backend
```

**Terminal 2 - Start Frontend:**
```bash
npm run frontend
```

Open your browser to `http://localhost:3000`

## Usage

### 1. Add a Main Account

1. Open http://localhost:3000
2. Click "Add Main Account"
3. Enter a Bluesky username to use as the main account
4. This account will be the "hub" for slave accounts

### 2. Add Target Accounts

Navigate to the main account and add target accounts (accounts your bots will follow):
- Click on "Add Target"
- Enter Bluesky usernames of accounts you want your bots to follow

### 3. Create Slave Accounts

1. Click "Create Slave Accounts"
2. Configure the settings:
   - Number of accounts to create
   - Bio template
   - Age and gender
   - Profile variations
   - Repost settings
3. Click "Start Creation"
4. Wait for the browsers to complete the captcha and account setup

**Note**: The browser windows will open automatically. You'll need to manually solve any captchas that appear.

### 4. Start Following

Once accounts are created:
1. Select the main account
2. View all slave accounts
3. Click "Start All Bots" to begin automated following
4. Monitor activity in real-time on the dashboard

### 5. Target Discovery

Access the Target Discovery feature to automatically find relevant accounts:
1. Click "Target Discovery" from the dashboard
2. Add discovery accounts (Bluesky accounts used for searching)
3. Add starting point accounts (accounts to discover from)
4. Configure quality filters (follower counts, bio requirements)
5. Click "Start Discovery"
6. The system will automatically find and add high-quality targets

## Project Structure

```
barebones bluesky/
├── backend/
│   ├── data/                    # Data storage (accounts, targets)
│   ├── services/                # Core services
│   │   ├── accountCreationOrchestrator.js
│   │   ├── browserAccountCreator.js
│   │   ├── concurrentBrowserManager.js
│   │   ├── profileSetupService.js
│   │   └── accountStorage.js
│   ├── utils/                   # Utility functions
│   │   ├── bioGenerator.js
│   │   ├── imageTransformer.js
│   │   └── proxyParser.js
│   ├── routes/                  # API routes
│   ├── sessions/               # Account sessions
│   ├── profiles/               # Profile images
│   ├── proxies/                # Proxy configurations
│   ├── server.js               # Main server
│   ├── TargetsManager.js       # Target discovery logic
│   └── DiscoveryAccountsManager.js
├── frontend/
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── Dashboard.js
│   │   │   ├── SlaveAccountView.js
│   │   │   ├── TargetDiscovery.js
│   │   │   └── ...
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   └── package.json
├── package.json
└── README.md
```

## API Endpoints

### Accounts
- `GET /api/accounts` - Get all accounts
- `POST /api/accounts/main` - Add main account
- `DELETE /api/accounts/main/:id` - Delete main account

### Targets
- `POST /api/accounts/main/:id/targets` - Add target to main account
- `DELETE /api/accounts/main/:id/targets` - Remove target

### Account Creation
- `POST /api/bulk-create` - Create multiple accounts

### Following
- `POST /api/accounts/slave/:id/start` - Start following for slave account
- `POST /api/accounts/slave/:id/stop` - Stop following

### Target Discovery
- `GET /api/targets/stats` - Get discovery statistics
- `GET /api/targets/config` - Get discovery configuration
- `POST /api/targets/config` - Update configuration
- `POST /api/targets/start` - Start target discovery
- `POST /api/targets/stop` - Stop discovery
- `GET /api/targets/export` - Export discovered targets

## Configuration Options

### Account Creation Settings

- **Bio Template**: Template for generating bios (use `[mainUsername]` as placeholder)
- **Age**: Age for account creation
- **Gender**: Gender for account creation
- **Profile Variations**: Create image variations for profile pictures
- **Include Main in Bio**: Add main account mention in bio
- **Repost Settings**: Configure automatic reposting from main account

### Target Discovery Settings

- **Minimum Followers**: Minimum follower count for targets
- **Maximum Followers**: Maximum follower count
- **Require Avatar**: Only include accounts with profile pictures
- **Require Bio**: Only include accounts with bios
- **Auto-Promote to Seeds**: Automatically use quality targets as new discovery seeds
- **Scan Cooldown**: Days to wait before rescanning a seed account

## Troubleshooting

### Accounts not showing after creation
- Refresh the page manually
- Check `backend/data/accounts.json` to verify accounts were saved
- Check browser console and backend logs for errors

### Captcha issues
- Bluesky requires manual captcha solving during account creation
- Make sure to solve captchas when browser windows open
- Don't close browsers until profile setup is complete

### Proxy errors
- Verify proxy format is correct: `ip:port:username:password`
- Test proxies independently before using with the bot
- Some proxies may be blocked by Bluesky

### Follow limits
- Bluesky has rate limits for following
- Adjust delay settings if you encounter rate limits
- Use multiple accounts to distribute load

## Security Notes

- Never share your `backend/data/` folder (contains account credentials)
- Never share your `backend/sessions/` folder (contains session data)
- Add sensitive files to `.gitignore` before sharing
- Use app passwords instead of main passwords when possible
- Regularly backup your data

## Tech Stack

- **Backend**: Node.js, Express, WebSocket
- **Frontend**: React, Tailwind CSS
- **Automation**: Playwright
- **API**: Bluesky AT Protocol (@atproto/api)

## License

This software is provided as-is for personal use. Use responsibly and in accordance with Bluesky's Terms of Service.

## Disclaimer

This tool is for educational and automation purposes. Users are responsible for ensuring their use complies with Bluesky's Terms of Service and applicable laws. Automated account creation and following may be against platform policies.

## Support

For issues, questions, or contributions, please open an issue in the repository.

---

**Happy Automating! 🚀**
