#!/bin/bash

API="http://localhost:4000"
PASS=0
FAIL=0
ERRORS=()

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'
BOLD='\033[1m'

ok()   { echo -e "${GREEN}  ✓${NC} $1"; PASS=$((PASS+1)); }
fail() { echo -e "${RED}  ✗${NC} $1"; FAIL=$((FAIL+1)); ERRORS+=("$1"); }
section() { echo -e "\n${BOLD}${YELLOW}=== $1 ===${NC}"; }

check_status() {
  local label="$1" expected="$2" actual="$3"
  [ "$actual" = "$expected" ] && ok "$label (HTTP $actual)" || fail "$label — expected $expected, got $actual"
}

check_field() {
  local label="$1" field="$2" json="$3"
  echo "$json" | python3 -c "import sys,json; d=json.load(sys.stdin); sys.exit(0 if '$field' in d or '$field' in str(d) else 1)" 2>/dev/null \
    && ok "$label" || fail "$label (field '$field' missing in: ${json:0:120})"
}

# ── SETUP ─────────────────────────────────────────────────────────────────────
# Unique suffix to avoid slug/email conflicts on repeat runs
TS=$(date +%s%3N)
OWNER_EMAIL="owner_${TS}@test.com"
CUSTOMER_EMAIL="customer_${TS}@test.com"
SLUG="test-biz-${TS}"
PASSWORD="test123"

section "1. AUTH — Register"

# 1.1 Register owner
R=$(curl -s -w "\n%{http_code}" -X POST "$API/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$OWNER_EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"Test Owner\",\"phone\":\"+996700000001\"}")
HTTP=$(echo "$R" | tail -1); BODY=$(echo "$R" | head -1)
check_status "Register owner" "201" "$HTTP"
OWNER_TOKEN=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['token'])" 2>/dev/null)
OWNER_ID=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['user']['id'])" 2>/dev/null)
[ -n "$OWNER_TOKEN" ] && ok "Owner token received" || fail "Owner token missing"

# 1.2 Register customer
R=$(curl -s -w "\n%{http_code}" -X POST "$API/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$CUSTOMER_EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"Test Customer\"}")
HTTP=$(echo "$R" | tail -1); BODY=$(echo "$R" | head -1)
check_status "Register customer" "201" "$HTTP"
CUSTOMER_TOKEN=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['token'])" 2>/dev/null)

# 1.3 Duplicate email
R=$(curl -s -w "\n%{http_code}" -X POST "$API/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$OWNER_EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"Dup\"}")
HTTP=$(echo "$R" | tail -1)
check_status "Duplicate email → 409" "409" "$HTTP"

# 1.4 Short password
R=$(curl -s -w "\n%{http_code}" -X POST "$API/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"short_${TS}@test.com\",\"password\":\"12\",\"name\":\"Short\"}")
HTTP=$(echo "$R" | tail -1)
check_status "Short password → 400" "400" "$HTTP"

section "2. AUTH — Login"

# 2.1 Correct login
R=$(curl -s -w "\n%{http_code}" -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$OWNER_EMAIL\",\"password\":\"$PASSWORD\"}")
HTTP=$(echo "$R" | tail -1); BODY=$(echo "$R" | head -1)
check_status "Login success" "200" "$HTTP"
LOGIN_TOKEN=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['token'])" 2>/dev/null)
[ -n "$LOGIN_TOKEN" ] && ok "Login token received" || fail "Login token missing"

# 2.2 Wrong password
R=$(curl -s -w "\n%{http_code}" -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$OWNER_EMAIL\",\"password\":\"wrong\"}")
HTTP=$(echo "$R" | tail -1); BODY=$(echo "$R" | head -1)
check_status "Wrong password → 401" "401" "$HTTP"
MSG=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('error',''))" 2>/dev/null)
[[ "$MSG" != *"object"* ]] && ok "Error is human-readable string: '$MSG'" || fail "Error is object, not string: $MSG"

# 2.3 GET /me with valid token
R=$(curl -s -w "\n%{http_code}" "$API/api/auth/me" -H "Authorization: Bearer $OWNER_TOKEN")
HTTP=$(echo "$R" | tail -1); BODY=$(echo "$R" | head -1)
check_status "GET /me" "200" "$HTTP"
check_field "GET /me has email field" "email" "$BODY"

# 2.4 GET /me with bad token
R=$(curl -s -w "\n%{http_code}" "$API/api/auth/me" -H "Authorization: Bearer bad.token.here")
HTTP=$(echo "$R" | tail -1)
check_status "GET /me bad token → 401" "401" "$HTTP"

# 2.5 GET /me without token
R=$(curl -s -w "\n%{http_code}" "$API/api/auth/me")
HTTP=$(echo "$R" | tail -1)
check_status "GET /me no token → 401" "401" "$HTTP"

section "3. AUTH — Profile update"

# 3.1 Update name
R=$(curl -s -w "\n%{http_code}" -X PATCH "$API/api/auth/me" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $OWNER_TOKEN" \
  -d '{"name":"Updated Owner"}')
HTTP=$(echo "$R" | tail -1); BODY=$(echo "$R" | head -1)
check_status "PATCH /me name" "200" "$HTTP"
NAME=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('name',''))" 2>/dev/null)
[ "$NAME" = "Updated Owner" ] && ok "Name updated correctly" || fail "Name not updated: $NAME"

# 3.2 Change password — wrong current
R=$(curl -s -w "\n%{http_code}" -X PATCH "$API/api/auth/me" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $OWNER_TOKEN" \
  -d '{"currentPassword":"wrong","newPassword":"newpass123"}')
HTTP=$(echo "$R" | tail -1)
check_status "Wrong current password → 400" "400" "$HTTP"

# 3.3 Change password — correct
R=$(curl -s -w "\n%{http_code}" -X PATCH "$API/api/auth/me" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $OWNER_TOKEN" \
  -d "{\"currentPassword\":\"$PASSWORD\",\"newPassword\":\"newpass123\"}")
HTTP=$(echo "$R" | tail -1)
check_status "Change password → 200" "200" "$HTTP"
# Login with new password
R=$(curl -s -w "\n%{http_code}" -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$OWNER_EMAIL\",\"password\":\"newpass123\"}")
HTTP=$(echo "$R" | tail -1)
check_status "Login with new password → 200" "200" "$HTTP"
# Restore original password
curl -s -X PATCH "$API/api/auth/me" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $OWNER_TOKEN" \
  -d "{\"currentPassword\":\"newpass123\",\"newPassword\":\"$PASSWORD\"}" > /dev/null

section "4. BUSINESS — CRUD"

# 4.1 Create business
R=$(curl -s -w "\n%{http_code}" -X POST "$API/api/businesses" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $OWNER_TOKEN" \
  -d "{\"name\":\"Test Salon\",\"slug\":\"$SLUG\",\"type\":\"SALON\",\"description\":\"Test salon\",\"address\":\"Test St 1\"}")
HTTP=$(echo "$R" | tail -1); BODY=$(echo "$R" | head -1)
check_status "Create business" "201" "$HTTP"
BIZ_ID=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',''))" 2>/dev/null)
[ -n "$BIZ_ID" ] && ok "Business ID received: ${BIZ_ID:0:8}..." || fail "Business ID missing"

# 4.2 Duplicate slug
R=$(curl -s -w "\n%{http_code}" -X POST "$API/api/businesses" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $OWNER_TOKEN" \
  -d "{\"name\":\"Another\",\"slug\":\"$SLUG\",\"type\":\"SALON\"}")
HTTP=$(echo "$R" | tail -1)
check_status "Duplicate slug → 409" "409" "$HTTP"

# 4.3 Create without auth
R=$(curl -s -w "\n%{http_code}" -X POST "$API/api/businesses" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Anon\",\"slug\":\"anon-$TS\",\"type\":\"SALON\"}")
HTTP=$(echo "$R" | tail -1)
check_status "Create business without auth → 401" "401" "$HTTP"

# 4.4 Get business by slug (public)
R=$(curl -s -w "\n%{http_code}" "$API/api/businesses/$SLUG")
HTTP=$(echo "$R" | tail -1); BODY=$(echo "$R" | head -1)
check_status "Get business by slug" "200" "$HTTP"

# 4.5 Update business (owner only)
R=$(curl -s -w "\n%{http_code}" -X PATCH "$API/api/businesses/$BIZ_ID" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $OWNER_TOKEN" \
  -d '{"description":"Updated description"}')
HTTP=$(echo "$R" | tail -1)
check_status "Update business (owner)" "200" "$HTTP"

# 4.6 Update business (other user)
R=$(curl -s -w "\n%{http_code}" -X PATCH "$API/api/businesses/$BIZ_ID" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -d '{"description":"Hack"}')
HTTP=$(echo "$R" | tail -1)
check_status "Update business (not owner) → 403" "403" "$HTTP"

# 4.7 List businesses
R=$(curl -s -w "\n%{http_code}" "$API/api/businesses?limit=10")
HTTP=$(echo "$R" | tail -1); BODY=$(echo "$R" | head -1)
check_status "List businesses" "200" "$HTTP"
check_field "List has businesses array" "businesses" "$BODY"
check_field "List has total" "total" "$BODY"

# 4.8 Search businesses
R=$(curl -s "$API/api/businesses?query=Test+Salon")
BODY="$R"
COUNT=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('total',0))" 2>/dev/null)
[ "$COUNT" -ge 1 ] 2>/dev/null && ok "Search found test business (total=$COUNT)" || fail "Search returned no results for 'Test Salon'"

section "5. SERVICES"

# 5.1 Create service
R=$(curl -s -w "\n%{http_code}" -X POST "$API/api/services" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $OWNER_TOKEN" \
  -d "{\"businessId\":\"$BIZ_ID\",\"name\":\"Haircut\",\"durationMinutes\":30,\"price\":1500}")
HTTP=$(echo "$R" | tail -1); BODY=$(echo "$R" | head -1)
check_status "Create service" "201" "$HTTP"
SVC_ID=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',''))" 2>/dev/null)
[ -n "$SVC_ID" ] && ok "Service ID: ${SVC_ID:0:8}..." || fail "Service ID missing"

# 5.2 List services (public)
R=$(curl -s -w "\n%{http_code}" "$API/api/services/business/$BIZ_ID")
HTTP=$(echo "$R" | tail -1); BODY=$(echo "$R" | head -1)
check_status "List services (public)" "200" "$HTTP"
COUNT=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d))" 2>/dev/null)
[ "$COUNT" -ge 1 ] && ok "Services list has $COUNT item(s)" || fail "Services list empty"

# 5.3 Create service for different business (should fail)
R=$(curl -s -w "\n%{http_code}" -X POST "$API/api/services" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -d "{\"businessId\":\"$BIZ_ID\",\"name\":\"Hack\",\"durationMinutes\":30,\"price\":0}")
HTTP=$(echo "$R" | tail -1)
check_status "Create service (not owner) → 403" "403" "$HTTP"

section "6. RESOURCES"

NEXT_WEEK=$(date -d "+7 days" +%Y-%m-%d)
TODAY=$(date +%Y-%m-%d)

# 6.1 Create resource
R=$(curl -s -w "\n%{http_code}" -X POST "$API/api/resources" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $OWNER_TOKEN" \
  -d "{\"businessId\":\"$BIZ_ID\",\"name\":\"Chair 1\",\"capacity\":2}")
HTTP=$(echo "$R" | tail -1); BODY=$(echo "$R" | head -1)
check_status "Create resource" "201" "$HTTP"
RES_ID=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',''))" 2>/dev/null)
[ -n "$RES_ID" ] && ok "Resource ID: ${RES_ID:0:8}..." || fail "Resource ID missing"

# 6.2 Add schedule
DOW=$(python3 -c "from datetime import date; print(date.fromisoformat('$NEXT_WEEK').weekday())" 2>/dev/null || echo "1")
# Convert Python weekday (0=Mon) to JS weekday (0=Sun)
DOW_JS=$(python3 -c "
from datetime import date
d = date.fromisoformat('$NEXT_WEEK')
# Python: 0=Mon, JS: 0=Sun
js_dow = (d.weekday() + 1) % 7
print(js_dow)
" 2>/dev/null || echo "1")

R=$(curl -s -w "\n%{http_code}" -X POST "$API/api/resources/$RES_ID/schedules" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $OWNER_TOKEN" \
  -d "{\"dayOfWeek\":[$DOW_JS],\"startTime\":\"09:00\",\"endTime\":\"18:00\",\"slotDurationMinutes\":60}")
HTTP=$(echo "$R" | tail -1)
check_status "Add schedule" "201" "$HTTP"

# 6.3 Validate startTime < endTime
R=$(curl -s -w "\n%{http_code}" -X POST "$API/api/resources/$RES_ID/schedules" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $OWNER_TOKEN" \
  -d "{\"dayOfWeek\":[$DOW_JS],\"startTime\":\"18:00\",\"endTime\":\"09:00\",\"slotDurationMinutes\":60}")
HTTP=$(echo "$R" | tail -1)
check_status "Schedule startTime > endTime → 400" "400" "$HTTP"

# 6.4 Get slots
R=$(curl -s -w "\n%{http_code}" "$API/api/resources/$RES_ID/slots?date=$NEXT_WEEK")
HTTP=$(echo "$R" | tail -1); BODY=$(echo "$R" | head -1)
check_status "Get slots" "200" "$HTTP"
SLOT_COUNT=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('slots',[])))" 2>/dev/null)
[ "$SLOT_COUNT" -gt 0 ] && ok "Slots returned: $SLOT_COUNT slots" || fail "No slots returned for $NEXT_WEEK"
# Grab first slot
SLOT_START=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['slots'][0]['start'])" 2>/dev/null)
SLOT_END=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['slots'][0]['end'])" 2>/dev/null)

# 6.5 Missing date param
R=$(curl -s -w "\n%{http_code}" "$API/api/resources/$RES_ID/slots")
HTTP=$(echo "$R" | tail -1)
check_status "Slots missing date → 400" "400" "$HTTP"

section "7. BOOKINGS — Core flow"

# 7.1 Create booking (authenticated)
R=$(curl -s -w "\n%{http_code}" -X POST "$API/api/bookings" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -d "{\"resourceId\":\"$RES_ID\",\"serviceId\":\"$SVC_ID\",\"startAt\":\"$SLOT_START\",\"endAt\":\"$SLOT_END\",\"guestCount\":1,\"notes\":\"Test booking\"}")
HTTP=$(echo "$R" | tail -1); BODY=$(echo "$R" | head -1)
check_status "Create booking" "201" "$HTTP"
BOOKING_ID=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',''))" 2>/dev/null)
[ -n "$BOOKING_ID" ] && ok "Booking ID: ${BOOKING_ID:0:8}..." || fail "Booking ID missing — body: ${BODY:0:200}"

# 7.2 Check slot is now taken (slots should exclude it)
R=$(curl -s "$API/api/resources/$RES_ID/slots?date=$NEXT_WEEK")
REMAINING=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('slots',[])))" 2>/dev/null)
[ "$REMAINING" -lt "$SLOT_COUNT" ] && ok "Slot removed after booking ($SLOT_COUNT → $REMAINING)" || fail "Slot still available after booking"

# 7.3 Booking without auth
R=$(curl -s -w "\n%{http_code}" -X POST "$API/api/bookings" \
  -H "Content-Type: application/json" \
  -d "{\"resourceId\":\"$RES_ID\",\"startAt\":\"$SLOT_START\",\"endAt\":\"$SLOT_END\"}")
HTTP=$(echo "$R" | tail -1)
check_status "Booking without auth → 401" "401" "$HTTP"

# 7.4 Past date booking
YESTERDAY="${NEXT_WEEK%%-*}-01-01T10:00:00"  # definitely past
YESTERDAY_END="${NEXT_WEEK%%-*}-01-01T11:00:00"
R=$(curl -s -w "\n%{http_code}" -X POST "$API/api/bookings" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -d "{\"resourceId\":\"$RES_ID\",\"startAt\":\"2020-01-01T10:00:00\",\"endAt\":\"2020-01-01T11:00:00\"}")
HTTP=$(echo "$R" | tail -1); BODY=$(echo "$R" | head -1)
check_status "Past date booking → 400" "400" "$HTTP"
MSG=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('error',''))" 2>/dev/null)
[[ "$MSG" != *"object"* ]] && ok "Error is human-readable: '$MSG'" || fail "Error is object"

# 7.5 startAt after endAt
R=$(curl -s -w "\n%{http_code}" -X POST "$API/api/bookings" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -d "{\"resourceId\":\"$RES_ID\",\"startAt\":\"$SLOT_END\",\"endAt\":\"$SLOT_START\"}")
HTTP=$(echo "$R" | tail -1)
check_status "startAt > endAt → 400" "400" "$HTTP"

# 7.6 Conflict detection
R=$(curl -s -w "\n%{http_code}" -X POST "$API/api/bookings" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -d "{\"resourceId\":\"$RES_ID\",\"startAt\":\"$SLOT_START\",\"endAt\":\"$SLOT_END\"}")
HTTP=$(echo "$R" | tail -1)
check_status "Double booking conflict → 409" "409" "$HTTP"

# 7.7 guestCount exceeds capacity (capacity=2)
R=$(curl -s -w "\n%{http_code}" -X POST "$API/api/bookings" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -d "{\"resourceId\":\"$RES_ID\",\"startAt\":\"${SLOT_START}\",\"endAt\":\"${SLOT_END}\",\"guestCount\":999}")
HTTP=$(echo "$R" | tail -1)
check_status "guestCount > capacity → 400 or 409" "400" "$HTTP"

# 7.8 Service from wrong business
# Create a second business and service
R=$(curl -s -X POST "$API/api/businesses" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $OWNER_TOKEN" \
  -d "{\"name\":\"Other Biz\",\"slug\":\"other-biz-$TS\",\"type\":\"HOTEL\"}")
OTHER_BIZ_ID=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)
R=$(curl -s -X POST "$API/api/services" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $OWNER_TOKEN" \
  -d "{\"businessId\":\"$OTHER_BIZ_ID\",\"name\":\"Other\",\"durationMinutes\":30,\"price\":100}")
OTHER_SVC_ID=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)
# Use second slot
SLOT2_START=$(echo "$BODY2" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('slots',[])[1]['start'] if len(d.get('slots',[]))>1 else '')" 2>/dev/null)
# Grab a different slot from the list
R2=$(curl -s "$API/api/resources/$RES_ID/slots?date=$NEXT_WEEK")
SLOT2_START=$(echo "$R2" | python3 -c "import sys,json; d=json.load(sys.stdin); s=d.get('slots',[]); print(s[0]['start'] if s else '')" 2>/dev/null)
SLOT2_END=$(echo "$R2" | python3 -c "import sys,json; d=json.load(sys.stdin); s=d.get('slots',[]); print(s[0]['end'] if s else '')" 2>/dev/null)
if [ -n "$SLOT2_START" ] && [ -n "$OTHER_SVC_ID" ]; then
  R=$(curl -s -w "\n%{http_code}" -X POST "$API/api/bookings" \
    -H "Content-Type: application/json" -H "Authorization: Bearer $CUSTOMER_TOKEN" \
    -d "{\"resourceId\":\"$RES_ID\",\"serviceId\":\"$OTHER_SVC_ID\",\"startAt\":\"$SLOT2_START\",\"endAt\":\"$SLOT2_END\"}")
  HTTP=$(echo "$R" | tail -1)
  check_status "Service from wrong business → 400" "400" "$HTTP"
fi

section "8. BOOKINGS — Status & Access"

# 8.1 GET my bookings
R=$(curl -s -w "\n%{http_code}" "$API/api/bookings/my" -H "Authorization: Bearer $CUSTOMER_TOKEN")
HTTP=$(echo "$R" | tail -1); BODY=$(echo "$R" | head -1)
check_status "GET /my bookings" "200" "$HTTP"
COUNT=$(echo "$BODY" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null)
[ "$COUNT" -ge 1 ] && ok "My bookings: $COUNT booking(s)" || fail "My bookings empty"

# 8.2 GET booking by ID (owner)
R=$(curl -s -w "\n%{http_code}" "$API/api/bookings/$BOOKING_ID" -H "Authorization: Bearer $OWNER_TOKEN")
HTTP=$(echo "$R" | tail -1)
check_status "GET booking by ID (owner)" "200" "$HTTP"

# 8.3 GET booking by ID (customer)
R=$(curl -s -w "\n%{http_code}" "$API/api/bookings/$BOOKING_ID" -H "Authorization: Bearer $CUSTOMER_TOKEN")
HTTP=$(echo "$R" | tail -1)
check_status "GET booking by ID (customer)" "200" "$HTTP"

# 8.4 GET booking by ID (other user — register a third user)
R=$(curl -s -X POST "$API/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"spy_${TS}@test.com\",\"password\":\"$PASSWORD\",\"name\":\"Spy\"}")
SPY_TOKEN=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)
R=$(curl -s -w "\n%{http_code}" "$API/api/bookings/$BOOKING_ID" -H "Authorization: Bearer $SPY_TOKEN")
HTTP=$(echo "$R" | tail -1)
check_status "GET booking by ID (other user) → 403" "403" "$HTTP"

# 8.5 Customer can cancel
R=$(curl -s -w "\n%{http_code}" -X PATCH "$API/api/bookings/$BOOKING_ID/status" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -d '{"status":"CANCELLED"}')
HTTP=$(echo "$R" | tail -1); BODY=$(echo "$R" | head -1)
check_status "Customer can cancel booking" "200" "$HTTP"
STATUS=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null)
[ "$STATUS" = "CANCELLED" ] && ok "Booking status = CANCELLED" || fail "Status not CANCELLED: $STATUS"

# 8.6 Customer cannot change cancelled booking
R=$(curl -s -w "\n%{http_code}" -X PATCH "$API/api/bookings/$BOOKING_ID/status" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -d '{"status":"CONFIRMED"}')
HTTP=$(echo "$R" | tail -1)
check_status "Change cancelled booking → 400" "400" "$HTTP"

# 8.7 Customer cannot CONFIRM (only cancel)
# Make a new booking first
R=$(curl -s "$API/api/resources/$RES_ID/slots?date=$NEXT_WEEK")
S=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); s=d.get('slots',[]); print(s[0]['start'] if s else '')" 2>/dev/null)
E=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); s=d.get('slots',[]); print(s[0]['end'] if s else '')" 2>/dev/null)
R=$(curl -s -X POST "$API/api/bookings" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -d "{\"resourceId\":\"$RES_ID\",\"startAt\":\"$S\",\"endAt\":\"$E\"}")
BK2=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)
if [ -n "$BK2" ]; then
  R=$(curl -s -w "\n%{http_code}" -X PATCH "$API/api/bookings/$BK2/status" \
    -H "Content-Type: application/json" -H "Authorization: Bearer $CUSTOMER_TOKEN" \
    -d '{"status":"CONFIRMED"}')
  HTTP=$(echo "$R" | tail -1)
  check_status "Customer cannot CONFIRM → 403" "403" "$HTTP"
fi

# 8.8 GET business bookings (not owner)
R=$(curl -s -w "\n%{http_code}" "$API/api/bookings/business/$BIZ_ID" -H "Authorization: Bearer $CUSTOMER_TOKEN")
HTTP=$(echo "$R" | tail -1)
check_status "GET business bookings (not owner) → 403" "403" "$HTTP"

section "9. STAFF"

# 9.1 Add staff
R=$(curl -s -w "\n%{http_code}" -X POST "$API/api/staff" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $OWNER_TOKEN" \
  -d "{\"businessId\":\"$BIZ_ID\",\"email\":\"$CUSTOMER_EMAIL\",\"position\":\"Stylist\"}")
HTTP=$(echo "$R" | tail -1); BODY=$(echo "$R" | head -1)
check_status "Add staff" "201" "$HTTP"
STAFF_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)

# 9.2 Non-existent user
R=$(curl -s -w "\n%{http_code}" -X POST "$API/api/staff" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $OWNER_TOKEN" \
  -d "{\"businessId\":\"$BIZ_ID\",\"email\":\"nobody_${TS}@test.com\"}")
HTTP=$(echo "$R" | tail -1)
check_status "Add non-existent user as staff → 404" "404" "$HTTP"

# 9.3 List staff
R=$(curl -s -w "\n%{http_code}" "$API/api/staff/business/$BIZ_ID" -H "Authorization: Bearer $OWNER_TOKEN")
HTTP=$(echo "$R" | tail -1); BODY=$(echo "$R" | head -1)
check_status "List staff" "200" "$HTTP"

# 9.4 Remove staff
if [ -n "$STAFF_ID" ]; then
  R=$(curl -s -w "\n%{http_code}" -X DELETE "$API/api/staff/$STAFF_ID" -H "Authorization: Bearer $OWNER_TOKEN")
  HTTP=$(echo "$R" | tail -1)
  check_status "Remove staff" "200" "$HTTP"
fi

section "10. STATS"

# 10.1 Owner can get stats
R=$(curl -s -w "\n%{http_code}" "$API/api/stats/business/$BIZ_ID" -H "Authorization: Bearer $OWNER_TOKEN")
HTTP=$(echo "$R" | tail -1); BODY=$(echo "$R" | head -1)
check_status "GET stats (owner)" "200" "$HTTP"
check_field "Stats has today" "today" "$BODY"
check_field "Stats has revenueMonth" "revenueMonth" "$BODY"

# 10.2 Non-owner cannot get stats
R=$(curl -s -w "\n%{http_code}" "$API/api/stats/business/$BIZ_ID" -H "Authorization: Bearer $CUSTOMER_TOKEN")
HTTP=$(echo "$R" | tail -1)
check_status "GET stats (not owner) → 403" "403" "$HTTP"

section "11. PAYMENT"

# 11.1 Initiate payment without service — should fail
R=$(curl -s "$API/api/resources/$RES_ID/slots?date=$NEXT_WEEK")
S=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); s=d.get('slots',[]); print(s[0]['start'] if s else '')" 2>/dev/null)
E=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); s=d.get('slots',[]); print(s[0]['end'] if s else '')" 2>/dev/null)
# Booking without service
R=$(curl -s -X POST "$API/api/bookings" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -d "{\"resourceId\":\"$RES_ID\",\"startAt\":\"$S\",\"endAt\":\"$E\"}")
NO_SVC_BK=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)
if [ -n "$NO_SVC_BK" ]; then
  R=$(curl -s -w "\n%{http_code}" -X POST "$API/api/payments/initiate" \
    -H "Content-Type: application/json" -H "Authorization: Bearer $CUSTOMER_TOKEN" \
    -d "{\"bookingId\":\"$NO_SVC_BK\"}")
  HTTP=$(echo "$R" | tail -1)
  check_status "Initiate payment without service → 400" "400" "$HTTP"
fi

# 11.2 Initiate payment WITH service
R=$(curl -s "$API/api/resources/$RES_ID/slots?date=$NEXT_WEEK")
S=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); s=d.get('slots',[]); print(s[0]['start'] if s else '')" 2>/dev/null)
E=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); s=d.get('slots',[]); print(s[0]['end'] if s else '')" 2>/dev/null)
R=$(curl -s -X POST "$API/api/bookings" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -d "{\"resourceId\":\"$RES_ID\",\"serviceId\":\"$SVC_ID\",\"startAt\":\"$S\",\"endAt\":\"$E\"}")
PAY_BK=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)
if [ -n "$PAY_BK" ]; then
  R=$(curl -s -w "\n%{http_code}" -X POST "$API/api/payments/initiate" \
    -H "Content-Type: application/json" -H "Authorization: Bearer $CUSTOMER_TOKEN" \
    -d "{\"bookingId\":\"$PAY_BK\"}")
  HTTP=$(echo "$R" | tail -1); BODY=$(echo "$R" | head -1)
  check_status "Initiate payment" "200" "$HTTP"
  check_field "Payment has payUrl" "payUrl" "$BODY"
  PAY_TX=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('transactionId',''))" 2>/dev/null)
  PAY_AMT=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('amount',0))" 2>/dev/null)
  [ "$PAY_AMT" = "1500" ] && ok "Amount correct: $PAY_AMT (from DB, not client)" || fail "Amount wrong: $PAY_AMT (expected 1500)"
fi

# 11.3 Other user cannot initiate payment
if [ -n "$PAY_BK" ]; then
  R=$(curl -s -w "\n%{http_code}" -X POST "$API/api/payments/initiate" \
    -H "Content-Type: application/json" -H "Authorization: Bearer $SPY_TOKEN" \
    -d "{\"bookingId\":\"$PAY_BK\"}")
  HTTP=$(echo "$R" | tail -1)
  check_status "Initiate payment (wrong user) → 403" "403" "$HTTP"
fi

# 11.4 Payment callback spoofed txId
if [ -n "$PAY_BK" ]; then
  R=$(curl -s -w "\n%{http_code}" "$API/api/payments/result?bookingId=$PAY_BK&txId=SPOOFED-TX-123")
  HTTP=$(echo "$R" | tail -1)
  [[ "$HTTP" = "302" || "$HTTP" = "301" ]] && ok "Spoofed txId → redirect (not 200)" || fail "Spoofed txId unexpected HTTP $HTTP"
fi

# 11.5 Payment status auth check
if [ -n "$PAY_BK" ]; then
  R=$(curl -s -w "\n%{http_code}" "$API/api/payments/status/$PAY_BK" -H "Authorization: Bearer $SPY_TOKEN")
  HTTP=$(echo "$R" | tail -1)
  check_status "Payment status (wrong user) → 403" "403" "$HTTP"
fi

section "12. RATE LIMITING"

# 12.1 Brute-force login
BAD_PASS_RESPONSES=()
for i in $(seq 1 12); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"ratelimit_test@test.com","password":"bad"}')
  BAD_PASS_RESPONSES+=("$CODE")
done
# At least one should be 429
GOT_429=false
for code in "${BAD_PASS_RESPONSES[@]}"; do
  [ "$code" = "429" ] && GOT_429=true && break
done
$GOT_429 && ok "Rate limit triggered (429) after repeated attempts" || fail "Rate limit NOT triggered — all responses: ${BAD_PASS_RESPONSES[*]}"

section "13. HEALTH & ERROR PAGES"

# 13.1 Health endpoint
R=$(curl -s "$API/health")
STATUS=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null)
[ "$STATUS" = "ok" ] && ok "Health: ok" || fail "Health endpoint broken"

# 13.2 Non-existent route
R=$(curl -s -w "\n%{http_code}" "$API/api/nonexistent")
HTTP=$(echo "$R" | tail -1)
[ "$HTTP" = "404" ] && ok "Non-existent route → 404" || fail "Non-existent route → $HTTP"

# 13.3 Web 404 page
R=$(curl -s -w "\n%{http_code}" "http://localhost:3000/this-does-not-exist")
HTTP=$(echo "$R" | tail -1)
[ "$HTTP" = "404" ] && ok "Web 404 page" || fail "Web 404: $HTTP"

# ── SUMMARY ───────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
TOTAL=$((PASS+FAIL))
echo -e "${BOLD}Results: ${GREEN}$PASS passed${NC} / ${RED}$FAIL failed${NC} / $TOTAL total${NC}"
if [ ${#ERRORS[@]} -gt 0 ]; then
  echo -e "\n${RED}Failed tests:${NC}"
  for e in "${ERRORS[@]}"; do echo -e "  ${RED}✗${NC} $e"; done
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
exit $FAIL
