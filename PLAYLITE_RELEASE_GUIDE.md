# Playlite — GitHub Actions Release Guide

> **Stack:** Tauri v2 · Rust · React · Windows (MSI)  
> **Automation:** Push a `v*` tag → GitHub Actions builds and publishes the release automatically.

---

## Table of Contents

1. [How It Works](#how-it-works)
2. [One-Time Setup](#one-time-setup)
3. [Making a Release](#making-a-release)
4. [File Reference](#file-reference)
5. [Troubleshooting](#troubleshooting)
6. [Security Checklist](#security-checklist)

---

## How It Works

```
You push a tag (e.g. v3.3.0)
        │
        ▼
GitHub Actions triggers release.yml
        │
        ├─ Checkout code
        ├─ Setup Node.js 20
        ├─ Setup Rust (stable)
        ├─ npm install
        └─ tauri-apps/tauri-action@v0
                │
                ├─ Compiles Rust backend
                ├─ Builds React frontend
                ├─ Bundles MSI installer
                ├─ Signs binaries with your private key
                ├─ Generates latest.json  ← updater reads this
                └─ Creates GitHub Release with all assets
                        │
                        ▼
        Users with older versions see
        an in-app update notification
```

---

## One-Time Setup

### Step 1 — Generate signing keys

Run this once and keep the output safe:

```bash
cd src-tauri
tauri signer generate -w ./
```

This creates two files:
- `private_key.txt` — your signing private key (**never commit this**)
- `public_key.txt` — your signing public key (already set in `tauri.conf.json`)

> **Backup `private_key.txt` somewhere safe** (password manager, encrypted drive).  
> If you lose it, you cannot sign future updates — users would need to reinstall manually.

### Step 2 — Add the secret to GitHub

1. Go to your repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `TAURI_SIGNING_PRIVATE_KEY`
4. Value: paste the full contents of `private_key.txt`
5. Click **Add secret**

> If you set a password when generating the key, also add a second secret:
> - Name: `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
> - Value: the password you chose

### Step 3 — Protect your private key

Add to your `.gitignore`:

```gitignore
# Tauri signing keys — NEVER commit these
private_key.txt
src-tauri/private_key.txt
*.key
*.pem
```

### Step 4 — Sync versions (if not already)

Before your first release, confirm these three files all have the same version number:

| File | Field |
|------|-------|
| `package.json` | `"version"` |
| `src-tauri/Cargo.toml` | `version` under `[package]` |
| `src-tauri/tauri.conf.json` | `"version"` |

---

## Making a Release

### Option A — Automatic (recommended)

```bash
# Bumps version in package.json, commits, and creates a git tag
npm version patch        # 3.2.0 → 3.2.1
# or
npm version minor        # 3.2.0 → 3.3.0
# or
npm version major        # 3.2.0 → 4.0.0

# Push the commit and the new tag
git push origin main --follow-tags
```

> ⚠️ `npm version` only updates `package.json`. You still need to manually update
> `src-tauri/Cargo.toml` and `src-tauri/tauri.conf.json` to match before pushing,
> or the build will have mismatched versions.

### Option B — Manual

```bash
# 1. Update the version in all three files manually, then:
git add .
git commit -m "chore: bump version to 3.3.0"

# 2. Create the tag
git tag v3.3.0

# 3. Push
git push origin main
git push origin v3.3.0
```

### Monitoring the build

Go to your repository → **Actions** → **Publish Playlite**

The workflow takes roughly 15–20 minutes. When it finishes:
- A new entry appears under **Releases**
- The release contains: `Playlite_x.x.x_x64_en-US.msi`, `Playlite_x.x.x_x64_en-US.msi.sig`, and `latest.json`
- Users running an older version will see the in-app update dialog on next launch

### Testing before a real release (recommended)

Use a pre-release tag first to validate the workflow without affecting users:

```bash
git tag v3.3.0-beta1
git push origin v3.3.0-beta1
```

Check that:
- [ ] Workflow completes without errors
- [ ] The release assets are present (`.msi`, `.sig`, `latest.json`)
- [ ] `latest.json` is reachable at:  
  `https://github.com/playlite-app/playlite/releases/latest/download/latest.json`

Then delete the pre-release tag and proceed with the real one.

---

## File Reference

### `.github/workflows/release.yml`

```yaml
name: Publish Playlite
on:
  push:
    tags:
      - 'v*'
jobs:
  publish-tauri:
    permissions:
      contents: write
    runs-on: windows-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install Rust stable
        uses: dtolnay/rust-toolchain@stable
      - name: Install frontend dependencies
        run: npm install
      - name: Build and publish Tauri app
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
          # Uncomment if your key has a password:
          # TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
        with:
          tagName: v__VERSION__
          releaseName: 'Playlite v__VERSION__'
          releaseBody: |
            Automated release generated by GitHub Actions.
            See the assets below to download the installer.
          releaseDraft: false
          prerelease: false
```

**Notes:**
- `tauri-action@v0` is correct for Tauri v2. It auto-generates `latest.json` with valid signatures — do not generate this file manually.
- The workflow is Windows-only, matching `"targets": "msi"` in `tauri.conf.json`. This is intentional for a Windows-focused app.
- `fetch-depth: 0` is required so the action can read git tags properly.
- Optional improvement: add `swatinem/rust-cache@v2` before the `npm install` step to cut build times significantly.

### `src-tauri/tauri.conf.json` — updater section

```json
"plugins": {
  "updater": {
    "active": true,
    "endpoints": [
      "https://github.com/playlite-app/playlite/releases/latest/download/latest.json"
    ],
    "dialog": true,
    "pubkey": "<your public key here>"
  }
}
```

**Notes:**
- The endpoint URL is correct. GitHub serves the file from the latest non-prerelease release.
- `"dialog": true` shows the built-in Tauri update dialog — no extra UI code needed.
- The `pubkey` value must match the public key generated by `tauri signer generate`. Already configured ✅

**One thing to revisit:** the `identifier` field is currently `"com.game-manager.dev"`. Consider changing it to something permanent and project-specific (e.g. `"io.github.playlite-app.playlite"`) before your first public release. Changing it later breaks the Windows installer upgrade path and the updater, requiring users to uninstall and reinstall.

### `scripts/generate-latest-json.js` — do not use with GitHub Actions

This script was created as a manual fallback, but **it generates a `latest.json` with empty signatures**, which will cause the Tauri updater to reject the update for security reasons. It also uses incorrect platform keys for Tauri v2 (`"darwin"` instead of `"darwin-x86_64"`).

Since `tauri-action@v0` generates a correctly signed `latest.json` automatically, this script is not needed. Keep it only if you ever move to a fully custom build pipeline outside of GitHub Actions.

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `TAURI_SIGNING_PRIVATE_KEY not found` | Secret not configured | Follow Step 2 in One-Time Setup |
| `signature verification failed` | Wrong key or empty signature | Make sure you're using `tauri-action@v0` to generate `latest.json`, not the manual script |
| `Rust compilation error` | Code issue | Run `npm run build` locally first to confirm the build passes |
| Update dialog never appears | Version mismatch or wrong endpoint | Check that the `version` in all three config files is lower than the release tag; verify `latest.json` URL is reachable |
| Workflow does not trigger | Tag format wrong | Tags must start with `v` (e.g. `v3.3.0`, not `3.3.0`) |
| Build takes 20+ minutes | No Rust cache | Add `swatinem/rust-cache@v2` to the workflow |

### Rollback a bad release

```bash
# Delete tag locally
git tag -d v3.3.0

# Delete tag remotely
git push origin --delete v3.3.0

# Then delete the release manually on GitHub → Releases → Delete
```

---

## Security Checklist

Before every release:

- [ ] `private_key.txt` is in `.gitignore` and not tracked by git
- [ ] `TAURI_SIGNING_PRIVATE_KEY` secret is set on GitHub
- [ ] You have an offline backup of your private key
- [ ] You did not manually edit or upload `latest.json` — let the action generate it
- [ ] Versions in `package.json`, `Cargo.toml`, and `tauri.conf.json` are all in sync

---

## Quick Reference

```bash
# First-time key setup
cd src-tauri && tauri signer generate -w ./

# Patch release  (3.2.0 → 3.2.1)
npm version patch && git push origin main --follow-tags

# Minor release  (3.2.0 → 3.3.0)
npm version minor && git push origin main --follow-tags

# Pre-release test
git tag v3.3.0-beta1 && git push origin v3.3.0-beta1

# Monitor build
# → GitHub → Actions → Publish Playlite
```
