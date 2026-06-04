# LeadFilter by Sharim Studios

A premium, lightweight Google Maps lead filtering tool and Google Sheets sync dashboard.

## 🚀 Features
- **Instant Filtering**: Paste Google Maps JSON from Apify to instantly filter leads by website status (with website, without website, or all leads).
- **Direct Sheet Sync**: Upload filtered leads directly to Google Sheets using a simple Google Apps Script.
- **Fast Clipboard Export**: Copy data in tab-separated format to paste directly into Google Sheets (`Ctrl+V`).
- **CSV Download**: Download leads as a standard `.csv` spreadsheet file.
- **WhatsApp Contact Form**: Pre-configured modal to send custom project inquiries directly to your agency's WhatsApp.

---

## 💻 Local Development

To run the project locally on your machine:
1. Navigate to the project directory:
   ```bash
   cd C:\Users\msi\.gemini\antigravity\scratch\gmaps-filter
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

---

## 🌐 How to Deploy to GitHub Pages (For Free)

Because this application uses standard HTML, CSS, and vanilla JS, you can host it live on GitHub Pages for free **without needing any complex build steps**.

### Step 1: Create a GitHub Repository
1. Go to [github.com](https://github.com/) and log in.
2. Click the green **"New"** button to create a new repository.
3. Name your repository (e.g., `gmaps-lead-filter`).
4. Keep it **Public** (required for free GitHub Pages).
5. Leave "Add a README", "Add .gitignore", and "Choose a license" **unchecked** (we already have them).
6. Click **Create repository**.

### Step 2: Push your code to GitHub
Open your terminal (PowerShell or Git Bash) inside the project folder `C:\Users\msi\.gemini\antigravity\scratch\gmaps-filter` and run the following commands:

```bash
# Initialize a local Git repository
git init

# Add all files to staging (our .gitignore will automatically skip node_modules)
git add .

# Commit your files
git commit -m "Initial commit of LeadFilter dashboard"

# Rename branch to main
git branch -M main

# Link your local project to the GitHub repo (Copy this command from your GitHub page!)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push your code to GitHub
git push -u origin main
```

### Step 3: Turn on GitHub Pages
1. On your GitHub repository page, click the **Settings** tab (gear icon at the top).
2. On the left sidebar, click **Pages**.
3. Under the **"Build and deployment"** section:
   - Source: **Deploy from a branch**
   - Branch: **main** | Folder: **/ (root)**
4. Click the **Save** button.
5. Wait about 1-2 minutes. Refresh the page, and GitHub will display your live URL at the top (e.g., `https://your-username.github.io/gmaps-lead-filter/`).

---

## 🛠️ Google Sheets Apps Script Code
The Apps Script code required to receive direct sync data is saved inside the [google_apps_script.js](google_apps_script.js) file in this directory.
