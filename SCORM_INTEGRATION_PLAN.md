# Project Plan: SCORM LMS Integration

## 1. Project Goal

The primary objective is to integrate SCORM (Sharable Content Object Reference Model) capabilities into the existing Tabbed Policy Hub application. This involves building the functionality to upload, launch, and track SCORM-compliant e-learning courses directly within the platform, using the current technology stack.

## 2. Technology Stack

*   **Frontend:** React, TypeScript, Vite
*   **Backend:** Supabase (PostgreSQL, Auth, Edge Functions)
*   **UI:** Shadcn UI, Tailwind CSS

## 3. Progress Summary

We have successfully laid the foundational groundwork for the SCORM integration across the full stack:

*   **Database Schema:**
    *   Designed and created a new database migration file (`20250924050516_create_scorm_tables.sql`).
    *   This migration will create two new tables:
        *   `scorm_courses`: To store metadata about uploaded SCORM packages.
        *   `scorm_tracking`: To store user progress and CMI data for each course.
    *   This new schema is intended to replace the functionality of the existing `scorm_sessions` table with a more robust structure.

*   **Frontend Implementation:**
    *   Created a new reusable React component: `src/components/training/ScormPlayer.tsx`.
    *   This component renders SCORM content in an `<iframe>` and exposes a basic SCORM 1.2 JavaScript API (`API.LMSInitialize`, `API.LMSCommit`, etc.) to the content loaded within it.
    *   Integrated this `ScormPlayer` component into the `src/components/training/CourseManagement.tsx` page. It now launches within a dialog when a user clicks the "Launch" button on a SCORM course.

*   **Backend Implementation:**
    *   Created a new Supabase Edge Function: `supabase/functions/scorm-api/index.ts`.
    *   This function serves as the backend endpoint for the SCORM player.
    *   It is designed to receive tracking data from the frontend `ScormPlayer` component (via the `LMSCommit` call) and securely save it to the `scorm_tracking` table.

## 4. Current Blocker: Database Migration Failure

We are currently blocked from applying the new database schema due to a series of errors with the Supabase CLI.

1.  **Initial Error:** The `supabase db push` command failed because of a mismatch between the local migration history and the remote database's history.
2.  **Repair Attempt:** Following the CLI's recommendation, we attempted to use `supabase migration repair` to resolve the discrepancies.
3.  **Connection Failure:** The repair commands are now consistently failing with a **`connection refused`** error. The error log `unexpected unban status 400: {"message":"ipv4_addresses: Expected array, received null"}` strongly indicates that the issue is **Supabase Network Restrictions** blocking the CLI's connection attempts.

## 5. Action Plan & Next Steps

The path forward requires a specific sequence of actions to resolve the blocker and complete the database setup.

*   **Step 1: User Action - Resolve Network Restrictions**
    *   The user needs to navigate to their **Supabase Project Dashboard**.
    *   Go to **Settings** -> **Database** -> **Network Restrictions**.
    *   **Option A (Recommended):** Add their current public IP address to the allowlist.
    *   **Option B (Temporary):** Disable the "Restrict IP addresses" toggle for the duration of this setup.
    *   **Optional (Good Practice):** The user should consider updating their Supabase CLI to the latest version (`brew upgrade supabase` or `npm i -g supabase`) to avoid any known bugs.

*   **Step 2: AI Action - Resume and Complete Database Migration**
    *   Once the user confirms the network settings are updated, the AI assistant must resume the migration repair process.
    *   Execute the remaining `supabase migration repair` commands that were suggested by the CLI.
    *   After all repairs are successful, run `supabase db pull` one more time to ensure the local state is perfectly synced.
    *   Finally, execute `supabase db push` to apply our new SCORM migration file (`..._create_scorm_tables.sql`).

*   **Step 3: AI Action - Test and Finalize**
    *   Once the database is successfully updated, the next logical step is to test the entire flow with a sample SCORM 1.2 package.
    *   This will involve uploading a package, launching the player, and verifying that the tracking data is correctly saved in the `scorm_tracking` table via the Edge Function.
