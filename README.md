# Kaleido Design System Variables Export

Automated Figma variables export to JSON. Updates every Monday at 12:00 AM UTC via GitHub Actions.

## Setup

✅ **Already configured:**
- GitHub secret `FIGMA_TOKEN` set in your repo
- GitHub Actions workflow configured
- Export schedule: Every Monday at 12:00 AM UTC

## How it works

1. **GitHub Actions** runs the export workflow every Monday at midnight
2. **export-variables.js** fetches all variables from Figma REST API
3. **variables.json** is generated with all collections and modes organized
4. Changes are automatically committed and pushed to the repo

## Manual export

To export variables manually:

```bash
npm install
export FIGMA_TOKEN="your-token-here"
npm run export
```

## Output format

`variables.json` contains:

```json
{
  "metadata": {
    "fileKey": "X0woErS5JGnv0zDLNhjKkg",
    "exportedAt": "2026-03-30T12:00:00.000Z",
    "exportedBy": "Figma Variables Exporter"
  },
  "collections": {
    "Brand: Theme": {
      "id": "...",
      "variables": [
        {
          "id": "...",
          "name": "color-palette/brand/primary/base",
          "type": "COLOR",
          "values": {
            "modeId1": "#FF0000",
            "modeId2": "#0000FF"
          }
        }
      ]
    },
    "Reliant": { ... },
    "DE": { ... }
  }
}
```

## Timezone

The schedule runs at **12:00 AM UTC**. If you need a different time:

1. Edit `.github/workflows/export-kaleido-variables.yml`
2. Change the cron expression in the `schedule` section
3. Commit and push

**Cron reference:**
- `0 0 * * 1` = Monday 12:00 AM UTC
- `0 9 * * 1` = Monday 9:00 AM UTC
- Docs: https://crontab.guru

## Viewing exports

Check **Actions** tab in GitHub to see:
- ✅ Successful exports
- ❌ Failed exports with error messages
- 📝 Commit messages with timestamps

## Using the exported variables

You can now fetch `variables.json` from GitHub:

```
https://raw.githubusercontent.com/KaylaNgaTrinh/kaleido-design-tokens/main/variables.json
```

Or read from the repo locally if you clone it.

## Troubleshooting

**"FIGMA_TOKEN not found"**
- Verify the secret is set in repo Settings → Secrets and variables → Actions
- Ensure it's named exactly `FIGMA_TOKEN`

**"Figma API error 401"**
- Your token may be invalid or expired
- Regenerate a new token at figma.com/account and update the GitHub secret

**Exports stop running**
- GitHub disables Actions if no commits in 60 days
- Make any commit to re-enable it
