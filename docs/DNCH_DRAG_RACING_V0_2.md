# DNCH Drag Racing v0.2 — Performance & Traction (prototype)

## Purpose

Replaces v0.1's simplified power-to-acceleration arcade calculation with a **side-view, tunable longitudinal vehicle simulation** for 402.336 metres. This is an educational arcade/physics hybrid. It is NOT a validated vehicle dynamics simulator, does not reproduce specific real cars and does not certify real-world performance.

Launch:
- BG https://dnchcoin.github.io/dnch-coin/bg/drag-racing.html
- EN https://dnchcoin.github.io/dnch-coin/drag-racing.html

## Driving physics

- Three **fictional** cars with distinctly configured drivetrain and engine:
  - V8 Street Beast — RWD and naturally aspirated V8
  - Turbo Spark — FWD with time-dependent turbo spool
  - Midnight Muscle — AWD with mechanically supercharged engine
- Tuned, RPM-dependent engine **torque curve** with gradual reduction near redline; numerical torque converted through chosen gear ratios, final-drive gearing, drivetrain loss, wheel circumference/radius.
- Speed-dependent engine RPM coupling through a simplified launch clutch, RPM reduction after gear changes, transmission shift delay, gear-specific redline and high-RPM torque reduction.
- Front/rear driven-axle friction limits with longitudinal load transfer approximation. Strong throttle can exceed traction and incur wheelspin penalties. Different launch percentages, traction-control setting, vehicle drivetrain and parts affect outcomes.
- Tire grip upgrades increase the traction limit; engine upgrades produce more torque, so a poorly balanced high-power FWD/RWD build may become slower despite increasing horsepower. Transmission upgrades shorten shift interruptions.
- Aerodynamic drag proportional to speed squared plus a rolling-resistance approximation. Dynamic turbo-spool lag on the turbo car, no spool penalty on atmospheric or supercharged cars.
- Head-to-head scripted computer opponent, reaction delays and a quarter-mile elapsed-time result. False throttle before green incurs a 0.35s penalty; the user controls gas, manual shifts, optional automatic shifting, traction control and launch throttle (35–100% until 14 m/s).
- **Removed nitro from the main simulation mode.** No cryptographic or real-money incentives.

### Graphics and controls

The game canvas displays **side-profile vehicles**, rotating wheels, simulated tire smoke when slipping, scrolling roadway with distance markings, rival in a separate lane, elapsed-distance progress bar and starter light. Touch controls are START, hold GAS and SHIFT; desktop controls ENTER, W/Right arrow, Space/Up arrow. Dashboard includes speed, RPM, gear, distance, wheelspin and race time.

The game uses static Canvas, CSS and JS; no downloaded images, remote engine, paid APIs, account login or data uploads.

### Preserving existing garages

The game migrates **on read** from the previous `dnch-drag-v1` save to `dnch-drag-v2`; source v1 data is never deleted. Credits, selected car, part upgrade levels, races/wins and auto-shift setting are copied through validation. Previous v1 personal bests are preserved internally as `legacyBest` but are **not shown as current v0.2 records** because the old and new physics models are not comparable. All new records use v0.2 timing. Current game localStorage is `dnch-drag-v2` and remains browser-only.

## Simulations and verification

- JavaScript syntax validation on standalone physics engine and controller.
- Six distinct drivetrain/gear-shifting combinations completed 402.336 m with finite times and valid results.
- 18 simulations (3 cars × 3 launch throttle settings × TCS on/off) finished the distance. These exposed meaningful traction differences:
  - Stock V8 RWD, 70% launch / TCS off ~13.99 s, 100% / TCS off ~14.63 s, 100% / TCS on ~13.71 s.
  - Stock FWD Turbo, 70% / TCS off ~14.23 s, 100% / TCS off ~14.36 s, 100% / TCS on ~13.74 s.
  - Stock AWD Midnight Muscle, 100% / TCS off ~13.10 s and almost no wheelspin.
  - An unbalanced 3-stage-engine V8 at 100% / TCS off slowed to ~15.38 s from ~14.63 s because of excess tire slip.
- Mock Canvas/DOM integration: **12/12 checks passed** for car list, launch percent, TCS toggle, persistent settings, countdown, gas readiness, finished race, telemetry and persisted credits.
- Checked all **27** UI element IDs referenced by the JS against both EN/BG game pages, and removed main-game nitro button.
- PWA public cache version incremented to `dnch-mobile-public-v5`; game scripts and game pages remain explicitly allowlisted public optional cached resources; private forum, Supabase Auth, API responses, wallets and admin excluded.
- No Supabase SQL/Auth configuration, token economics, Radio playback, paid services or AI configuration changed.

### Real-browser acceptance checklist (still required)

1. Load BG link on Android Chrome. Verify sideways car profiles render, wheels rotate as you accelerate, and both lanes are visible.
2. Start a race, wait for green, then hold GAS. Shift manually before redline; repeat with Auto Shift turned on.
3. Test V8 70% vs 100% launch with traction control OFF, and observe more tire slip with a strong launch. Repeat with TCS ON and compare ET.
4. Try all 3 cars and compare RWD, FWD and AWD; verify turbo is comparatively less responsive until boost builds.
5. Buy an engine upgrade without tires, compare 100% launch ET; then buy tires and see if additional grip helps.
6. Reload page: previous garage money and upgrades are retained; new v0.2 bests are tracked separately from old v0.1 race records. Neither save includes keys, forum logins or crypto account data.
7. Test phone portrait/landscape, keyboard/desktop, focus, scrolling, reduced motion and offline PWA after cache refresh.
8. Confirm no nitro main button and that the PWA still launches MY DNCH correctly.

**Remaining limitations:** simplified clutch, drivetrain loss, tire friction and turbo model; no suspension/temperature or steering/track position interactions; no physical sound synthesis; no live multiplayer; no anti-cheat/leaderboards; no real calibrated vehicle data. v0.2 will need tuning based on the owner's actual phone testing.
