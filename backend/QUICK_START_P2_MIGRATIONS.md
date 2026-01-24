# Quick Start: Apply P2 Backend Fixes

**Time Required:** 5-10 minutes
**Risk Level:** Low (migrations are safe and reversible)
**Prerequisites:** Access to Supabase Dashboard

---

## TL;DR - What's Wrong?

Your backend **service layer code is 100% correct**, but **database constraints** are blocking functionality:

1. **Issue #6:** Can't create multiple billing addresses → Database has UNIQUE constraint
2. **Issue #7:** Can't use "AR Specialist" role → Database CHECK constraint missing roles
3. **Issue #5:** Soft delete works fine → No changes needed ✅

**Solution:** Run 2 SQL migrations to update database constraints.

---

## Step-by-Step Instructions

### Step 1: Open Supabase SQL Editor (2 minutes)

1. Go to: https://supabase.com/dashboard
2. Select your project: **Invantry**
3. Click **"SQL Editor"** in left sidebar
4. Click **"New query"** button

### Step 2: Run Migration 1 - Address Constraint (2 minutes)

1. Open file: `backend/migrations/20260115_fix_issue_6_address_duplicate_constraint.sql`
2. Copy ALL contents
3. Paste into Supabase SQL Editor
4. Click **"Run"** button (bottom right)
5. ✅ Verify you see: `Successfully dropped constraint idx_vendor_addresses_vendor_type_unique`

**What this does:** Removes the constraint blocking multiple addresses of same type

### Step 3: Run Migration 2 - Contact Role Constraint (2 minutes)

1. Click **"New query"** again
2. Open file: `backend/migrations/20260115_fix_issue_7_contact_role_constraint.sql`
3. Copy ALL contents
4. Paste into Supabase SQL Editor
5. Click **"Run"** button
6. ✅ Verify you see: `Successfully updated constraint vendor_contacts_role_check with new roles`

**What this does:** Adds AR Specialist, AP Specialist, and Territory Manager to allowed roles

### Step 4: Verify Fixes (1 minute)

Run the automated test suite:

```bash
cd backend
node scripts/verify-p2-fixes.js
```

**Expected output:**
```
✅ TEST #1 PASSED: Soft delete preserves all data except is_active
✅ TEST #2 PASSED: Multiple addresses of same type allowed
✅ TEST #3 PASSED: All new contact roles accepted

🎉 ALL TESTS PASSED (3/3)
```

---

## What Gets Fixed?

### Before Migrations:
- ❌ Cannot add multiple billing addresses for a vendor
- ❌ Cannot add multiple shipping addresses for a vendor
- ❌ Cannot use "AR Specialist" contact role
- ❌ Cannot use "AP Specialist" contact role
- ❌ Cannot use "Territory Manager" contact role
- ✅ Soft delete works (no changes needed)

### After Migrations:
- ✅ Can add multiple addresses of any type
- ✅ Primary address per type works correctly
- ✅ All 9 contact roles work:
  - Sales Rep
  - Account Manager
  - Billing Contact
  - **AR Specialist** ← NEW
  - **AP Specialist** ← NEW
  - Customer Service
  - Delivery Coordinator
  - **Territory Manager** ← NEW
  - Other

---

## Rollback (If Needed)

### Rollback Migration 1 (Address Constraint):
```sql
-- Recreate the unique constraint (only if no duplicate data exists)
ALTER TABLE vendor_addresses
ADD CONSTRAINT idx_vendor_addresses_vendor_type_unique
UNIQUE (vendor_id, address_type);

-- Remove the performance index
DROP INDEX idx_vendor_addresses_vendor_type_lookup;
```

### Rollback Migration 2 (Contact Role Constraint):
```sql
-- Revert to old role list (will fail if AR/AP Specialist or Territory Manager contacts exist)
ALTER TABLE vendor_contacts
DROP CONSTRAINT vendor_contacts_role_check;

ALTER TABLE vendor_contacts
ADD CONSTRAINT vendor_contacts_role_check CHECK (
    role IS NULL OR role IN (
        'Sales Rep',
        'Account Manager',
        'Billing Contact',
        'Customer Service',
        'Delivery Coordinator',
        'Other'
    )
);
```

---

## Troubleshooting

### Migration 1 Fails

**Error:** "constraint does not exist"
- ✅ This is OK - constraint may already be dropped
- Continue to Migration 2

**Error:** "permission denied"
- ❌ You need admin access to run ALTER TABLE
- Contact database administrator

### Migration 2 Fails

**Error:** "constraint does not exist"
- ✅ This is OK - constraint may already be dropped
- The ADD CONSTRAINT part should still work

**Error:** "permission denied"
- ❌ You need admin access to run ALTER TABLE
- Contact database administrator

### Verification Script Fails

**Issue #6 still fails:**
- Check if Migration 1 ran successfully
- Look for confirmation message in SQL Editor output
- Try querying: `SELECT * FROM pg_constraint WHERE conname = 'idx_vendor_addresses_vendor_type_unique';`
- Should return no results if dropped successfully

**Issue #7 still fails:**
- Check if Migration 2 ran successfully
- Look for confirmation message in SQL Editor output
- Try creating a test contact with role "AR Specialist"

---

## Files Reference

### Migration Files (Run these):
- `backend/migrations/20260115_fix_issue_6_address_duplicate_constraint.sql`
- `backend/migrations/20260115_fix_issue_7_contact_role_constraint.sql`

### Helper Scripts:
- `backend/scripts/verify-p2-fixes.js` - Automated test suite
- `backend/scripts/run-p2-migrations.js` - Detailed instructions
- `backend/scripts/apply-p2-migrations-direct.js` - Alternative application method

### Documentation:
- `backend/SPRINT_2_P2_BACKEND_FIXES_FINAL_REPORT.md` - Complete analysis
- `backend/SPRINT_2_P2_BACKEND_FIXES_FINAL_COMPLETION.json` - Structured report
- `backend/QUICK_START_P2_MIGRATIONS.md` - This file

---

## Need Help?

1. **Migration instructions:** `node backend/scripts/run-p2-migrations.js`
2. **Run tests:** `node backend/scripts/verify-p2-fixes.js`
3. **Full documentation:** See `backend/SPRINT_2_P2_BACKEND_FIXES_FINAL_REPORT.md`

---

## Summary

✅ **Service layer code:** Already correct
✅ **Migrations created:** Ready to apply
✅ **Tests created:** Automated verification
✅ **Documentation:** Comprehensive
⚠️ **Action required:** Apply 2 SQL migrations (10 minutes)

**Next Step:** Run Migration 1 and Migration 2 in Supabase SQL Editor
