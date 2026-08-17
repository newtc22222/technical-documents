---
id: push-notifications
title: Push Notifications
sidebar_label: Push Notifications
sidebar_position: 2
description: Configuring Firebase Cloud Messaging (FCM), browser push delivery, Cloud Run runtime, and delivery troubleshooting.
---

# Configure and operate push notifications

FF RESTaurent stores every notification in the application and uses Firebase Cloud Messaging (FCM) for best-effort browser delivery. This guide explains how to configure Firebase, test push delivery locally, prepare the production runtime, and diagnose failed delivery.

For authenticated updates to the notification list and unread badge while the
application is open, see [Real-Time Notification Inbox](./real-time-notification-inbox.md).

> [!IMPORTANT]
> The notification implementation is merged into `develop`, but the current production web build and Cloud Run deployment do not pass the Firebase environment variables. Complete the [production enablement](#enable-push-delivery-in-production) steps before treating push delivery as active.

## Understand the delivery contract

The in-app `Notification` row remains the source of truth. Push delivery never blocks or fails the action that creates a restaurant, publishes a Collection, or sends a payment reminder.

| Event | Audience | Default in-app state | Default push state |
| --- | --- | --- | --- |
| Payment reminder | Eligible unpaid participants with `paymentRemindersEnabled` enabled | Enabled | Sent when the browser has a current subscription |
| New restaurant | Active members except the actor | Enabled | Disabled until the member opts in |
| New public Collection | Active members except the actor | Enabled | Disabled until the member opts in |
| Meal-voting lifecycle | Reserved for a later phase | Not exposed | Not exposed |

Product-event publishers use a deduplication key. Repeating the same publish action does not create or resend the same event. Push-only preferences create a hidden source row, so delivery state remains observable without displaying an in-app entry.

The implementation silently skips push delivery when:

- Firebase is not configured
- The browser does not support service workers or notifications
- The member denies notification permission
- The member has no current Firebase registration token
- Firebase rejects or expires the registered token

## Prepare the Firebase project

Use the existing FF RESTaurent Google Cloud project so Cloud Run can authenticate with its service identity.

1. Open the [Firebase console](https://console.firebase.google.com/).
2. Select **Add Firebase to Google Cloud project** and choose the FF RESTaurent project.
3. Register a Web app from **Project overview**.
4. Copy `apiKey`, `projectId`, `messagingSenderId`, and `appId` from the Web app configuration.
5. Open **Project settings**, then **Cloud Messaging**.
6. Enable the Firebase Cloud Messaging API (HTTP v1).
7. Under **Web Push certificates**, generate a key pair and copy the public VAPID key.

The Firebase Web configuration and public VAPID key are client identifiers. Never expose a service-account private key through a `VITE_` variable.

Enable the API with Google Cloud CLI if the console reports it as disabled:

```powershell
$projectId = 'your_project_id_here'
gcloud services enable fcm.googleapis.com --project $projectId
```

Firebase documents the [Web app registration](https://firebase.google.com/docs/web/setup), [Web Push certificate](https://firebase.google.com/docs/cloud-messaging/web/get-started), and [FCM server environment](https://firebase.google.com/docs/cloud-messaging/server-environment) procedures.

## Configure the local web build

Vite reads the Firebase Web configuration at build time. Create `apps/web/.env.local` with these values:

```dotenv
VITE_API_URL=http://localhost:4000
VITE_FIREBASE_API_KEY=your_web_api_key_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
VITE_FIREBASE_APP_ID=your_web_app_id_here
VITE_FIREBASE_VAPID_KEY=your_public_vapid_key_here
```

The repository ignores `.env.local`. Do not commit environment-specific values.

The service worker registers only in a production build. Build and preview the web app instead of using the Vite development server:

```powershell
npm run build -w @ff-restaurent/web
Set-Location apps/web
npx vite preview --host 0.0.0.0 --port 5173
```

Open `http://localhost:5173` after the preview server starts.

## Configure the local API

The API reads `FIREBASE_PROJECT_ID` and uses Google Application Default Credentials (ADC) to send messages. Authenticate your local shell with Google Cloud CLI:

```powershell
gcloud auth login
gcloud auth application-default login
gcloud config set project your_project_id_here
```

Add the Firebase project ID to the same PowerShell session that starts the API:

```powershell
$env:FIREBASE_PROJECT_ID = 'your_project_id_here'
$env:DATABASE_URL = 'your_existing_database_url_here'
npm run dev -w @ff-restaurent/api
```

If ADC login is unavailable, store a service-account JSON key outside the repository and point the API process to it:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = `
  'C:\secure\firebase_service_account.json'
$env:FIREBASE_PROJECT_ID = 'your_project_id_here'
```

Do not commit the JSON key or copy it into the web application. Firebase recommends ADC for Google-hosted runtimes and documents local service-account authentication in the [Admin SDK setup guide](https://firebase.google.com/docs/admin/setup).

## Verify push delivery locally

Use two accounts because product-event notifications exclude the actor.

1. Apply the current Prisma migrations and start the API.
2. Build and preview the web app at `http://localhost:5173`.
3. Open the recipient account in Chrome or Edge.
4. Reset the site's notification permission if the browser previously denied it.
5. Open **Profile**, then **Notification preferences**.
6. Enable **Push alert** for new restaurants or public Collections.
7. Accept the browser permission prompt.
8. Use another account to create a restaurant or publish a public Collection.
9. Move the recipient tab to the background and confirm that the browser displays the notification.
10. Select the notification and confirm that the application opens its internal target.

Inspect the database when you need delivery evidence:

- `PushSubscription` contains the Firebase token and member locale
- `Notification.category` identifies the event
- `Notification.targetUrl` contains an internal application path
- `Notification.pushStatus` records `NOT_REQUESTED`, `PENDING`, `SENT`, or `SKIPPED`
- `Notification.pushAttemptedAt` and `pushSentAt` record delivery timing

The API removes tokens that Firebase reports as unregistered.

## Enable push delivery in production

Production requires both a configured web build and an authorized API runtime. The checked-in deployment workflow does not yet provide the required Firebase values.

### Pass Firebase values into the web image

Add build arguments and matching environment assignments for these values in `apps/web/Dockerfile`:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_VAPID_KEY`

Store the values as GitHub repository variables and pass them to the web image build in `.github/workflows/gcp-deploy.yml`. Vite embeds these values in the static assets, so changing them requires a new web build and deployment.

### Configure the Cloud Run API

Set `FIREBASE_PROJECT_ID` on the API service. Keep service-account JSON keys out of Cloud Run because the Firebase Admin SDK uses the attached runtime service account through ADC.

Grant that runtime service account permission to send FCM messages:

```powershell
$projectId = 'your_project_id_here'
$runtimeServiceAccount = `
  'your_runtime_service_account@your_project_id_here.iam.gserviceaccount.com'

gcloud projects add-iam-policy-binding $projectId `
  --member "serviceAccount:$runtimeServiceAccount" `
  --role roles/firebasecloudmessaging.admin
```

Google documents the [Firebase Cloud Messaging API Admin role](https://cloud.google.com/iam/docs/roles-permissions/firebasecloudmessaging) and [Cloud Run service identity](https://cloud.google.com/run/docs/configuring/services/service-identity) behavior.

### Complete the production smoke test

Do not mark production push as enabled until all checks pass:

1. Confirm the deployed web assets contain the Firebase Web configuration.
2. Confirm the Cloud Run API has `FIREBASE_PROJECT_ID`.
3. Confirm the runtime service account has `roles/firebasecloudmessaging.admin`.
4. Register a real browser from the production Profile page.
5. Confirm the database contains its `PushSubscription` row.
6. Trigger an event from another member account.
7. Confirm the in-app row exists even if browser delivery fails.
8. Confirm successful delivery records `pushStatus = SENT`.
9. Confirm the notification opens only an internal application URL.

## Troubleshoot push delivery

Use the source row and browser state to isolate failures.

| Symptom | Check | Resolution |
| --- | --- | --- |
| Browser reports denied permission | Site notification permission | Reset the permission, reload, and enable a push category from Profile again |
| Browser never asks for permission | Build mode and service worker | Use `vite preview`, confirm `/sw.js` is registered, and retry from a user action |
| No `PushSubscription` row | Web environment and token registration | Confirm all five `VITE_FIREBASE_*` values and inspect browser service-worker errors |
| Notification exists with `SKIPPED` | Subscription and API configuration | Confirm the member has a current token, `FIREBASE_PROJECT_ID` is set, and ADC can send messages |
| API logs `push_send_failed` | FCM API and Identity and Access Management (IAM) | Enable `fcm.googleapis.com` and grant the runtime service account the FCM API Admin role |
| Actor receives no product notification | Audience rules | This is expected because restaurant and Collection events exclude the actor |
| Re-publishing a Collection sends nothing | Deduplication key | This is expected because one Collection publish event is delivered once |
| Token disappears after a send | Firebase token status | This is expected when Firebase reports the token as unregistered |

Push failures must not change the originating request result. Investigate warnings and delivery status without retrying the product action solely to force a push.

## Review the implementation

Use these source files when changing the feature:

- [Web registration policy](https://github.com/newtc22222/ff-restaurent/blob/develop/apps/web/src/lib/push.ts)
- [Service worker delivery and click handling](https://github.com/newtc22222/ff-restaurent/blob/develop/apps/web/public/sw.js)
- [Profile preference controls](https://github.com/newtc22222/ff-restaurent/blob/develop/apps/web/src/features/profile/ProfilePage.tsx)
- [API product-event publisher](https://github.com/newtc22222/ff-restaurent/blob/develop/apps/api/src/services/notification-service.ts)
- [Firebase Admin send adapter](https://github.com/newtc22222/ff-restaurent/blob/develop/apps/api/src/services/push-messaging.ts)
- [Notification routes](https://github.com/newtc22222/ff-restaurent/blob/develop/apps/api/src/routes/notification-routes.ts)
- [Notification persistence](https://github.com/newtc22222/ff-restaurent/blob/develop/apps/api/prisma/schema.prisma)
- [Environment variable template](https://github.com/newtc22222/ff-restaurent/blob/develop/.env.example)
- [FF-81 implementation pull request](https://github.com/newtc22222/ff-restaurent/pull/84)
