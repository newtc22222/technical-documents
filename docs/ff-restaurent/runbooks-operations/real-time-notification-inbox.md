---
id: real-time-notification-inbox
title: Real-Time Notification Inbox
sidebar_label: Real-Time Notification Inbox
sidebar_position: 3
description: Operating the authenticated Server-Sent Events (SSE) stream that refreshes the in-app notification list and badge in real time.
---

# Operate the real-time notification inbox

FF RESTaurent keeps the notification list and unread badge current while a
member is signed in. The browser opens an authenticated Server-Sent Events
(SSE) connection, receives lightweight invalidation events, and refetches the
authoritative notification list without reloading the page.

> [!NOTE]
> FF-88 was merged into `develop` in
> [PR #90](https://github.com/newtc22222/ff-restaurent/pull/90). The feature
> becomes available in an environment after the merged API and web revision is
> deployed.

This feature is independent of browser push delivery. It does not require
notification permission or Firebase configuration. See
[Push Notifications](./push-notifications.md) for operating FCM delivery when the
application is closed or in the background.

## Understand the data flow

```mermaid
flowchart LR
  A["Notification row"] --> B["Authenticated SSE poll"]
  B --> C["ID and creation cursor"]
  C --> D["Invalidate notification query"]
  D --> E["GET /notifications"]
  E --> F["Header list and unread badge"]
```

The existing `Notification` rows and `GET /notifications` response remain the
source of truth. SSE never carries the notification message, private metadata,
or target URL.

1. The route loader seeds a user-specific TanStack Query cache from its
   notification snapshot.
2. The browser calls `GET /notifications/stream` with the JWT in the
   `Authorization` header. JWTs are never placed in the URL.
3. The API establishes a creation cursor and sends a `ready` frame.
4. The web app refetches `GET /notifications` when the connection opens or
   reconnects, recovering anything created while it was disconnected.
5. The API polls user-owned, in-app-visible rows every two seconds through the
   existing `(userId, createdAt, id)` index.
6. A new row produces an invalidation frame containing only its ID and cursor.
7. The web app invalidates the notification query and refetches the complete
   authoritative list. The header and unread badge update from that cache.

Read and mark-all-read actions update the same cache immediately after their
API mutations succeed. Later refetches reconcile it with the database.

## Know the stream contract

| Behavior | Contract |
| --- | --- |
| Endpoint | Authenticated `GET /notifications/stream` |
| Content type | `text/event-stream` |
| Ownership | Every query includes the authenticated `userId` and `inAppVisible = true` |
| Cursor | ISO creation time plus notification ID, ordered by `(createdAt, id)` |
| Poll interval | Two seconds while the stream is idle |
| Batch size | Up to 100 cursor-ordered rows per query |
| Heartbeat | A comment frame every 15 seconds while idle |
| Reconnect | 1, 2, 4, 8, 16, then at most 30 seconds between attempts |
| Healthy reset | A connection lasting at least 30 seconds resets the next retry delay to one second |
| Re-auth | Each stream ends after at most 60 seconds so reconnect revalidates the session |
| Recovery | The browser sends the last cursor in `Last-Event-ID` and refetches the full list |
| Disconnect | The API aborts polling and releases stream state promptly |
| Failure | Silent fallback to the last authoritative snapshot; no toast or broken navigation |

Repeated invalidations do not duplicate inbox entries because the refetched
database list is authoritative and notifications have stable IDs.

## Deploy the feature

No operator setup is required. In particular, FF-88 adds:

- no database migration or new table
- no Firebase, Pub/Sub, Redis, or WebSocket dependency
- no new environment variable or secret
- no sticky-session requirement

Deploy the API and web application through the normal workflow. The API is
stateless: every Cloud Run instance polls the shared PostgreSQL database, so a
restart or reconnect can recover from the stored cursor. A temporary mixed
deployment degrades safely: an older web build does not open the stream, while
a newer web build silently retries if the API endpoint is not available yet.

The API CORS policy must continue allowing `Authorization` and
`Last-Event-ID`. The checked-in application configuration includes both.

## Verify locally

Browser notification permission is not involved, and the Vite development
server is sufficient for this feature.

1. Start the full stack from the repository root:

   ```powershell
   docker compose up --build
   ```

2. Sign in as a recipient at `http://localhost:5173`.
3. Open browser developer tools and find the pending
   `/notifications/stream` request in the Network panel.
4. Use another eligible account to create a notification, such as sending a
   payment reminder or publishing a product event.
5. Confirm that the recipient's header list and unread badge update within five
   seconds without reloading the page.
6. Disconnect and restore the network. Confirm that the stream reconnects and
   the authoritative list catches up without duplicate entries.
7. Mark one notification read, then mark all read, and confirm that the badge
   changes immediately.

Use an isolated disposable database for the integration suite because the API
integration setup clears its test data. Never point this command at staging or
production:

```powershell
$env:DATABASE_URL = 'postgresql://user:password@localhost:5432/ff_restaurent_test'
$env:RUN_INTEGRATION_TESTS = '1'
npm test
```

The focused coverage verifies authentication, user ownership, cursor recovery,
disconnect cleanup, query invalidation, unread updates, reconnection, and
silent failure.

## Troubleshoot live updates

| Symptom | Check | Resolution |
| --- | --- | --- |
| Stream returns `401` or `403` | Session token and account state | Sign in again; the client deliberately stops retrying rejected authentication |
| Stream returns `404` | Deployed API revision | Deploy the API revision containing FF-88 |
| Browser blocks the preflight | CORS response headers | Confirm `Authorization` and `Last-Event-ID` are allowed |
| Stream stays pending with no events | Heartbeat frames and source rows | A pending request is normal; confirm a visible notification was created for that user |
| Header does not update within five seconds | `/notifications/stream`, `/notifications`, and API logs | Confirm the invalidation arrived and the authoritative refetch succeeded |
| Stream reconnects periodically | Cloud Run or network request lifetime | This is expected; cursor recovery and connection-time refetch handle missed rows |
| Push works but the open tab does not update | SSE endpoint and web revision | Push and the real-time inbox are separate channels; verify FF-88 is deployed to both apps |
| Live inbox works but no system notification appears | Firebase and browser permission | Follow [Push Notifications](./push-notifications.md); SSE does not grant or require push permission |

Stream failures must remain silent. Do not add a user-facing error that blocks
navigation, authentication, notification creation, or push delivery solely
because live invalidation is unavailable.

## Review the implementation

- [FF-88 Linear ticket](https://linear.app/ff-restaurent/issue/FF-88/stream-in-app-notification-updates-in-real-time)
- [Implementation PR #90](https://github.com/newtc22222/ff-restaurent/pull/90)
- [API stream route](https://github.com/newtc22222/ff-restaurent/blob/03301d77943dc0df0800cb167ddc55b9fa089a4d/apps/api/src/routes/notification-routes.ts)
- [Database polling and cursor service](https://github.com/newtc22222/ff-restaurent/blob/03301d77943dc0df0800cb167ddc55b9fa089a4d/apps/api/src/services/notification-stream.ts)
- [Web SSE client](https://github.com/newtc22222/ff-restaurent/blob/03301d77943dc0df0800cb167ddc55b9fa089a4d/apps/web/src/features/notifications/notification-stream.ts)
- [Notification query cache](https://github.com/newtc22222/ff-restaurent/blob/03301d77943dc0df0800cb167ddc55b9fa089a4d/apps/web/src/features/notifications/notification.queries.ts)
- [API integration coverage](https://github.com/newtc22222/ff-restaurent/blob/03301d77943dc0df0800cb167ddc55b9fa089a4d/apps/api/src/phase1.integration.test.ts)
