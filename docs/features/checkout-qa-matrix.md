# Checkout QA Edge-Case Matrix

Covers restaurant + grocery delivery checkout flows.

## How to use

For each scenario, trigger the condition manually or with a mock/flag, then verify the expected outcome.
Mark each row `PASS`, `FAIL`, or `SKIP` as you test.

---

## 1. Entry Gates

| ID | Scenario | How to trigger | Expected result |
|----|----------|----------------|-----------------|
| E-01 | Empty cart | Open checkout with no items | CTA is disabled; banner: "Your cart is empty" |
| E-02 | Restaurant closed | Set `restaurant.isOpen = false` in DB | Server returns `RESTAURANT_CLOSED`; inline error with "Browse restaurants" CTA |
| E-03 | Minimum order not met | Cart subtotal below restaurant minimum | CTA disabled; inline banner shows exact shortfall; "Add more items" note |
| E-04 | No delivery address set | Reach checkout without setting address | Map picker opens automatically on CTA tap |

---

## 2. Address Validation

| ID | Scenario | How to trigger | Expected result |
|----|----------|----------------|-----------------|
| A-01 | Valid, fully verified address | Enter a known real address | No error; proceeds to validate endpoint |
| A-02 | Address partially unverified (Google API) | Enter an address with missing unit/floor | Modal: "Edit address" or "Continue anyway" — no premature navigation |
| A-03 | Address out of restaurant range | Enter address >25 km from restaurant | Server returns `ADDRESS_OUT_OF_RANGE`; inline error with "Change address" CTA |
| A-04 | Address changed after error | User taps "Change address", selects new pin | Error clears; re-validation runs on next CTA tap |
| A-05 | Address API unreachable | Kill Google Maps key or offline | Treated as verified; checkout continues (fail-open for availability) |

---

## 3. Inventory / Item States

| ID | Scenario | How to trigger | Expected result |
|----|----------|----------------|-----------------|
| I-01 | All items available | Normal cart | No inventory error; proceeds |
| I-02 | One item unavailable (mock) | Set `menuItem.isAvailable = false` in mock data | Server returns `ITEMS_UNAVAILABLE` with item list; inline error + "Set preference" CTA |
| I-03 | Preference: refund | Set preference then item goes unavailable | `handleItemUnavailable` removes item, recalculates total, emits `order:item_unavailable` with `action: 'refunded'` |
| I-04 | Preference: cancel order | Set preference then item goes unavailable | Order status → `cancelled`; socket emits cancellation to customer and restaurant |
| I-05 | Preference: merchant recommend | Set preference then item goes unavailable | Socket emits `order:item_unavailable` with `action: 'select_replacement'` |
| I-06 | Preference: contact me | Set preference then item goes unavailable | Socket emits `order:item_unavailable` with `action: 'contact_required'` |
| I-07 | No preference set, item unavailable | Leave preference unset | Defaults to `contact_me` behavior |

---

## 4. Pricing / Cost Gate

| ID | Scenario | How to trigger | Expected result |
|----|----------|----------------|-----------------|
| P-01 | Server total matches client total | Normal order | No price-change review; proceeds directly to submit |
| P-02 | Server total differs by >$0.01 | Manually offset mock price vs client price | Price-change banner appears with old/new total; two CTAs: "Cancel" and "Accept & place order" |
| P-03 | User accepts price change | Tap "Accept & place order" | Order submitted with server-computed total |
| P-04 | User cancels price change | Tap "Cancel" | Returns to idle checkout; no order created |
| P-05 | Tip changes total | Select a tip chip | Total updates immediately in summary; server total revalidated on next submit |

---

## 5. Submission and Idempotency

| ID | Scenario | How to trigger | Expected result |
|----|----------|----------------|-----------------|
| S-01 | Normal submit | Full valid order | Order created; cart cleared; navigate to tracking |
| S-02 | Double tap "Place Order" | Tap CTA twice rapidly | CTA disabled after first tap; no duplicate order created |
| S-03 | Same idempotency key (retry after failure) | First attempt fails (network), retry | Server finds existing key → returns original order; no duplicate |
| S-04 | New checkout session | Clear cart, come back | New `idempotencyKey` generated on mount; no cross-session collision |
| S-05 | Order already placed (key reused) | Manually send duplicate request with same key | Server returns `200` with existing order; client navigates to tracking |

---

## 6. Loading and Feedback Loops

| ID | Scenario | How to trigger | Expected result |
|----|----------|----------------|-----------------|
| L-01 | Validating phase | Normal tap on CTA | Button shows spinner + "Checking your order..." |
| L-02 | Placing phase | Validation passes | Button shows spinner + "Placing order..." |
| L-03 | Long-running request >2.5s | Slow network / add artificial delay | Label escalates to "Still confirming with restaurant..." |
| L-04 | Success feedback | Order created | Cart cleared; navigate to `/customer/delivery/tracking/:id` |
| L-05 | Failure — server error | Force 500 from server | Inline error with "Try again" CTA; cart, address, instructions preserved |
| L-06 | Failure — network offline | Airplane mode during submit | Inline error: "You appear to be offline." + "Try again" CTA |
| L-07 | Failure — timeout | ECONNABORTED error code | Inline error with retry; same idempotency key reused |
| L-08 | Recovery via retry | Tap "Try again" in error banner | Same idempotency key used; no new key generated |

---

## 7. Interactive Elements Map

| Element | Source component | Destination / action |
|---------|-----------------|---------------------|
| Delivery address card | `checkout.tsx` | Opens `MapPickerModal` |
| Delivery instructions card | `checkout.tsx` | Opens instructions bottom sheet modal |
| "Send as gift" | `checkout.tsx` | Navigates to `/customer/delivery/gifting` |
| "Deals & gift cards" | `checkout.tsx` | Navigates to `/customer/delivery/deals` |
| "If an item is unavailable" | `checkout.tsx` | Opens `SoldOutPreferenceModal` |
| Tip chips | `checkout.tsx` | Updates `tipAmount` state; total recomputes immediately |
| "Place Order" CTA | `checkout.tsx` | Runs full checkout pipeline (address → validate → submit) |
| "Accept & place order" | `checkout.tsx` (price change) | Skips re-validation; submits with server total |
| "Change address" (error CTA) | Error banner | Opens `MapPickerModal`; clears error on selection |
| "Set preference" (ITEMS_UNAVAILABLE) | Error banner | Opens `SoldOutPreferenceModal` |
| "Try again" (network/server error) | Error banner | Calls `handlePlaceOrder()` with same idempotency key |
| "Browse restaurants" | Error banner | Navigates to restaurants list |
| "Edit address" (unverified) | Unverified address banner | Opens `MapPickerModal` |
| "Continue anyway" (unverified) | Unverified address banner | Resolves address check as true; proceeds to validate |

---

## 8. Ship-Gate Checklist

- [ ] E-01 through E-04 all PASS
- [ ] A-01 through A-05 all PASS
- [ ] I-01 through I-07 all PASS
- [ ] P-01 through P-05 all PASS
- [ ] S-01 through S-05 all PASS
- [ ] L-01 through L-08 all PASS
- [ ] Interactive elements table verified against live app
- [ ] No console errors or unhandled promise rejections during any scenario
- [ ] Cart, notes, address, and promo preserved across all failure paths
