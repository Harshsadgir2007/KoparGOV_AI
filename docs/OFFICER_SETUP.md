# KoparGov AI - Municipal Officer Pre-Provisioning Guide

This guide explains how to pre-provision a verified municipal officer account for **KoparGov AI** using the Firebase Console and Cloud Firestore officer registry.

---

## ⚠️ Important Security Rules

1. **Never commit officer passwords** to GitHub or version control.
2. **Never put officer passwords** in frontend code or repository `.env` files.
3. **Never store passwords in Firestore** (Firebase Authentication handles all credentials and password hashing).
4. **Officer accounts CANNOT be created via public registration**. They must be pre-provisioned in the municipal officer registry (`officers/{uid}`).

---

## Step-by-Step Officer Pre-Provisioning Workflow

```
[Firebase Console]                  [Cloud Firestore]
1. Auth -> Add User      ----->     2. officers/{COPIED_UID}
   (Email & Password)                  (verified=true, active=true)
                                                |
                                                v
                                    3. Officer Logs In via Portal
                                       -> Backend verifies token
                                       -> Checks officers/{UID}
                                       -> Unlocks Officer Dashboard
```

---

### Step 1: Create the User in Firebase Authentication

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select your project (e.g. `kopargov-ai`).
3. In the left sidebar, navigate to **Build** → **Authentication**.
4. Select the **Users** tab and click **Add user**.
5. Enter the officer's official email address and a strong temporary password:
   * **Email**: `officer@kopargaon.gov.in` (or your demo officer email)
   * **Password**: `[Choose a strong password provided out-of-band]`
6. Click **Add user**.
7. In the users table, **Copy the generated User UID** (e.g., `8F9kLm2N0pQ7rStUvWxYz...`).

---

### Step 2: Register the Officer in Firestore `officers` Collection

1. In the Firebase Console left sidebar, navigate to **Build** → **Firestore Database**.
2. If the `officers` collection does not exist yet, click **Start collection** and name it `officers`.
3. Click **Add document**.
4. In the **Document ID** field, **paste the copied Firebase UID** from Step 1.
5. Add the following fields to the document:

| Field Name | Type | Value / Example | Required |
| :--- | :--- | :--- | :--- |
| `name` | `string` | `Demo Municipal Officer` | Yes |
| `employeeId` | `string` | `KOP-DEMO-001` | Yes |
| `designation` | `string` | `Chief Municipal Officer (CMO)` | Yes |
| `department` | `string` | `Kopargaon Municipal Council (KMC)` | Yes |
| `ward` | `string` | `Ward 5 - Shivaji Chowk` | Yes |
| `email` | `string` | `officer@kopargaon.gov.in` | Yes |
| `verified` | `boolean` | `true` | **Yes (Must be true)** |
| `active` | `boolean` | `true` | **Yes (Must be true)** |
| `createdAt` | `string` | `2026-08-30T00:00:00Z` (or current ISO time) | Yes |

6. Click **Save**.

---

### Step 3: (Optional) Initialize Citizen / Profile in `users` Collection

In the `users` collection, you may optionally create `users/{COPIED_UID}`:
```json
{
  "name": "Demo Municipal Officer",
  "email": "officer@kopargaon.gov.in",
  "role": "officer",
  "createdAt": "2026-08-30T00:00:00Z"
}
```

> **Note**: The backend will **never** grant officer privileges based on `users.role` alone. Officer status is **strictly governed by `officers/{UID}`** where `verified == true` and `active == true`.

---

### Step 4: Verify Officer Login on the Web Portal

1. Start the FastAPI backend:
   ```bash
   cd backend
   .\.venv\Scripts\python.exe -m uvicorn app.main:app --port 8000
   ```
2. Start the Frontend:
   ```bash
   cd frontend
   npm.cmd run dev
   ```
3. Open `http://localhost:5173/login`.
4. Switch to the **Municipal Officer** tab.
5. Enter `officer@kopargaon.gov.in` and the password created in Step 1.
6. Click **Authenticate Officer Session**.
7. The system will:
   - Authenticate with Firebase.
   - Send `Authorization: Bearer <ID_TOKEN>` to `/api/auth/me`.
   - Verify that `officers/{UID}` exists with `verified: true` and `active: true`.
   - Redirect to the **Officer Command Dashboard** (`/dashboard`).

---

## Authorization Scenarios Summary

| User State | Token Present? | Exists in `officers/{uid}`? | `verified` & `active` | Result |
| :--- | :--- | :--- | :--- | :--- |
| **Anonymous / No Token** | No | N/A | N/A | `401 Unauthorized` |
| **Invalid / Expired Token** | Invalid | N/A | N/A | `401 Unauthorized` |
| **Citizen Account** | Yes | No | N/A | `403 Forbidden` on Officer APIs |
| **Random Google / Gmail User** | Yes | No | N/A | `403 Forbidden` on Officer APIs |
| **Officer (`verified: false`)** | Yes | Yes | `false` | `403 Forbidden` (Pending review) |
| **Officer (`active: false`)** | Yes | Yes | `false` | `403 Forbidden` (Suspended) |
| **Authorized Officer** | Yes | Yes | `true` | **`200 OK` (Access Granted)** |
