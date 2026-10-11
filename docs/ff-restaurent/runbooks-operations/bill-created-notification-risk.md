---
id: bill-created-notification-risk
title: Bill-Created Notification Risk
sidebar_label: Bill-Created Notification Risk
sidebar_position: 9
description: The accepted risk that any active member can be added to a bill, and the rate limits and notification preferences that limit it.
---

# Bill-created notification risk

:::note

Source: `wiki/Bill-Created-Notification-Risk.md` on the [`docs/roadmap-and-wiki`](https://github.com/newtc22222/ff-restaurent/tree/docs/roadmap-and-wiki) branch (snapshot `702f576`). It was moved off `develop` by [#172](https://github.com/newtc22222/ff-restaurent/pull/172) and was written with the [v2.4.5](../releases/release-v2.4.5.md) performance and safety follow-up (#165).

:::

Accepted risk. `validateParticipantIds` checks only that each id is an
ACTIVE user. A sous chef or head chef can put any active member on a bill.
There is no team, friendship, or directory scope beyond that.

What limits the blast:

- One actor may create `BILL_CREATE_RATE_LIMIT_MAX` bills per minute (default
  10).
- Those bills may name `BILL_CREATED_FANOUT_MAX` other people per minute
  (default 30). The actor is not counted. A create that would exceed either cap
  is rejected with 429 `RATE_LIMITED` and is not saved. A refused fan-out
  does not consume a create. A duplicate of an existing bill returns 409 and
  does not consume the budget.
- `BILL_CREATED` is a notification preference. A member can turn off both
  in-app and push for that category. The publisher skips a recipient when
  both channels are off. The default, when no preference row exists, is
  in-app on and push off.

What remains accepted: within those per-minute caps, any ACTIVE user can
still be added and, unless they have turned the category off, they receive
the in-app notice.
