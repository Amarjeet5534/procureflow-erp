# Submission Guide (ProcureFlow)

This guide maps directly to your required submission format.

## 1) Repository Submission (GitHub / GitLab)

If your folder is not a git repository yet, run:

```bash
git init
git add .
git commit -m "Initial submission: ProcureFlow"
```

Create a new empty repo on GitHub/GitLab, then run:

```bash
git branch -M main
git remote add origin <YOUR_REPO_URL>
git push -u origin main
```

If remote already exists:

```bash
git remote -v
git push
```

What to verify before sharing:
- README exists and explains setup
- Source code is pushed
- Edge function code is pushed
- No secrets committed accidentally

## 2) Database Requirement (.sql export or migration)

Your project already contains a migration script here:
- supabase/migrations/20260313060136_348f1503-89be-45b2-94fe-f5135c405f58.sql

This satisfies the migration-script requirement.

Optional (if they explicitly ask for full SQL export):

```bash
npx supabase db dump --linked --schema public -f db_export.sql
```

Then commit db_export.sql.

## 3) 2-Minute Video Demo (Create PO flow)

Record using Loom/OBS/Screen Recorder.

### Suggested 2-minute script

0:00-0:15
- Show app running locally.
- Show login is working.

0:15-0:35
- Open Vendors page and show at least one vendor exists.
- Open Products page and show at least one product exists.

0:35-1:30 (Main Requirement)
- Go to Purchase Orders page.
- Click Create PO.
- Select vendor.
- Add one or more line items (product, qty, price).
- Show subtotal, tax, total calculation.
- Click Create Order.
- Show new PO appears in list.

1:30-1:50
- Change PO status (draft/pending/approved).
- Open PO details and show items.

1:50-2:00
- Briefly show code structure:
  - src/pages/PurchaseOrders.tsx
  - src/context/DataContext.tsx
  - supabase/migrations/...
  - supabase/functions/generate-description/index.ts

## Final Submission Package

Share these 3 items:
1. Repository URL (GitHub/GitLab)
2. DB migration file path (or db_export.sql)
3. Video demo link

## Pre-Submit Checklist

- App starts on local host and core pages load
- Create PO flow works end-to-end
- New PO visible after creation
- Migration file present in repo
- Video includes Create PO flow clearly
- Repo URL is public or reviewer has access
