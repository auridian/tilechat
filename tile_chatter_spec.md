# tile‑chatter — hyperlocal verified‑human chat

## 1. purpose
create a lightweight, hackathon‑ready web app that lets one **real** human per 100 m plus‑code tile chat and tip in tiny usdc without bot spam or lasting data.

## 2. key primitives
| element | spec |
|---------|------|
| identity | single‑human credential from entity["organization","alien.org","identity verification startup"] (jwt holds `alien_pk`) |
| location tile | 6‑digit [Open Location Code] plus‑code (~100 m) derived from `navigator.geolocation` (rounded) |
| room id | `sha256(tile + slot)`, where `slot = floor(now / 30 min)` |
| payment (optional) | micro‑tips via phantom wallet on entity["organization","Solana","layer1 blockchain"] |
| message TTL | 2 h (auto‑purged) |
| map preview | static tile render from entity["organization","Mapbox","mapping sdk"] |

## 3. client flow
1. **login** → alien widget returns `jwt(alien_pk)`.
2. **gps prompt** → browser gets lat/lon, converts to plus‑code `tile`.
3. **join room** → compute `hash = sha256(tile + slot)`, `socket.emit('join', hash, jwt)`.
4. **post** → if 90 s cooldown passed: `socket.emit('post', {jwt, hash, body})`.
5. **receive** → socket pushes `message` + `now_playing` (optional audio stream future).
6. **room rollover** → at slot change, recompute hash, re‑join; UI wipes old feed.

## 4. backend surfaces
### tables (duckdb)
```sql
create table rooms(
  hash text primary key,
  expires_ts timestamptz  -- slot end (now + 30m)
);

create table posts(
  id uuid primary key,
  hash text,
  pk  text,
  body text,
  ts  timestamptz
);
```

### express routes
| route | verb | purpose |
|-------|------|---------|
| `/auth` | POST | verify jwt, set `pk` cookie |
| `/history/:hash` | GET | last 50 posts for late joiner |
| `/nearby/:hash` | GET | return 8 neighbor tile hashes still alive |

### socket events
- `join (hash, jwt)` ➜ validate pk uniqueness & roam guard, subscribe.
- `post ({jwt, hash, body})` ➜ throttle, persist, broadcast `{pk_stub, body, ts}`.
- server cron every 5 min: delete `rooms` & cascading `posts` where `expires_ts < now`.

## 5. anti‑sock & abuse limits
- **one‑session rule**: if `pk` already in active room list, reject join.
- **cooldown**: one post / 90 s / pk / room.
- **soft roam guard**: block if user moves >1 km in <5 min.
- **message size**: 280 chars, emoji safe list.

## 6. tech stack
- front‑end: next.js + tailwind (pwa mode)  
- sockets: socket.io (ws fallback ok)  
- db: duckdb file mode on fly.io or render  
- geocode util: `pluscodes` npm  
- crypt/hash: `crypto.subtle` (browser) & `node:crypto` (server)

## 7. build milestones
| time | deliverable |
|------|-------------|
| 0‑1 h | scaffold next.js, integrate alien widget & phantom demo pay |
| 1‑2 h | tile/slot calc utils, socket handshake |
| 2‑3 h | express + duckdb, join/post handlers, cron prune |
| 3‑4 h | basic ui (feed, send, cooldown) + map preview |
| 4‑5 h | roam guard & one‑session logic, polish to demo |

## 8. stretch goals
- tip button (usdc) with skip‑refund on quick roam.  
- private room invite via symmetric secret + pk.  
- ephemerality slider (30 m–6 h) per room voted by members.

## 9. future riffs
- audio jukebox mode: queue youtube iframe per room with pay‑per‑song.  
- anon q&a board for conferences (tile = venue hall).  
- micro‑task bounty drops visible only inside factory floor.

---
**deliverable**: running pwa + demo video showing two phones in same tile chat; third phone 1 km away rejected. 🎉

