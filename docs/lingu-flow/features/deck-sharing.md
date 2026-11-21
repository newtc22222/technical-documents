---
id: deck-sharing
title: "Deck Sharing"
sidebar_label: "Deck Sharing"
sidebar_position: 11
description: "Share links that let a signed-in user preview a deck and copy it into their library, and paged loading for big decks."
---

# Deck Sharing

Share a deck with anyone who has an account, without giving them access to your original.

## How it works

- The deck owner turns a **share link** on from the deck's share panel in the Library. There is at most one link per deck.
- A signed-in user who opens the link sees a **preview**: deck name, description, card count, owner name and the first cards.
- **Copy** adds the whole deck to their library as a **private deck**. The copy is theirs to edit.
- Study progress is never shared: the copy starts with fresh schedules (the share panel says so).
- **Rotate** replaces the token, so the old URL stops working at once. **Turn off** deletes the link.

## Why it is not ordinary sharing

Item sharing (`item_access`) grants a person read or write access to the original, and a grantee there can edit. A share link is a separate capability that only allows preview and copy, so it has its own table, `deck_share_links` ([migration `0029`](../architecture/database-design.md)), and its own endpoints ([API](../architecture/api-documentation.md)).

## Big decks

Decks with 1,000+ cards load in pages. The Library shows per-deck status counts (new, learning, mastered, due) and a big-deck flag first, then streams card rows in windows through `GET /api/decks/{id}/cards/page`. Learn and Match walk big decks with a progress indicator.

## Study screens

- **Review** is reveal-then-grade with numbered grade buttons; **Learn** answers are numbered too, so the whole flow works from the keyboard.
- The Library shows decks as a card grid with a form dialog, a due-today strip and quick study actions.
