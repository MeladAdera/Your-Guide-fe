# NN · Feature name

Status: spec · building · verified · done. Dates for each.

## 1. Job

One or two sentences: what the person can do after this feature that they could not before, and the product rules that apply (never diagnose, the goal comes last, the person stays the author).

## 2. Pages and routes

| Route | What it shows | Reached from |
| --- | --- | --- |

## 3. What is on the page

A list of the elements in reading order, with the copy keys they use (`messages/*.json`). Mark which element is the one primary action.

## 4. Layout

Phone (about 400px) and laptop (about 1024px). A sketch is fine:

```
+----------------------------+
| header                     |
| ...                        |
+----------------------------+
```

States: empty, loading (what the skeleton looks like), error (which message, which action), success (what changes on screen).

## 5. API integration

| Call | When | On success | Error codes handled and what the UI does |
| --- | --- | --- | --- |

Query keys used and which mutations invalidate them. Anything optimistic, and how it rolls back.

## 6. Decisions

Technical, performance and UX decisions taken while building, each with the reason and the alternative we did not take. Anything app-wide is also added to `DECISIONS.md`.

## 7. Tests

Unit tests (what logic), the Playwright path, and what was verified by hand against the API in English and Arabic, phone and laptop.

## 8. Open questions and follow-ups

What we deferred, and what the backend might need to add.
