# IoT Enabled Street Lighting Management System

### 3D Smart City Digital Twin Simulation

A final-year engineering project that reproduces, end to end, an ESP32 based adaptive
street-lighting controller — from the analog sensor readings on the bench to a live 3D smart
city, cloud-style telemetry charts, Telegram remote control and automatic fault recovery.

This repository contains the **report and demonstration website**. It is not a mock-up: the
3D city, the sensor telemetry, the decision table and the fault handling are all driven by a
deterministic simulation engine that models the real firmware behaviour.

---

## Table of contents

- [What the system does](#what-the-system-does)
- [Live demonstration](#live-demonstration)
- [Hardware](#hardware)
- [Firmware behaviour](#firmware-behaviour)
- [How the simulation works](#how-the-simulation-works)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [Scripts](#scripts)
- [Honest notes on the 3D assets](#honest-notes-on-the-3d-assets)
- [Publish to GitHub](#publish-to-github)
- [Deploy to Vercel](#deploy-to-vercel)
- [License](#license)

---

## What the system does

Conventional municipal lighting runs on a fixed schedule: fixtures switch on at dusk and stay
at full output until dawn, regardless of whether the road is in use, and a failed lamp stays
dark until a maintenance crew happens to drive past.

This project replaces the timer with a measurement-driven control loop:

1. An **ESP32** samples ambient light (**LDR**), presence (**PIR**) and load current
   (**ACS712**) every 500 ms.
2. A five-row **decision table** maps those readings to a PWM duty cycle of 0 %, 30 % or
   100 %.
3. A **logic-level MOSFET** chops the 12 V supply to a 30 W LED street lamp under hardware
   PWM, so a 3.3 V pin controls the full load.
4. The measured current is compared with the current the commanded duty should produce, which
   closes the loop and detects a dead lamp.
5. Six fields are published to a **ThingSpeak** style channel every 15 seconds, and any fault
   is pushed to a **Telegram** bot that also accepts `/status`, `/on`, `/off` and `/auto`.

The website presents all twelve parts of the report: overview, hardware components, the live
digital twin, sensor behaviour, architecture, cloud analytics, Telegram control, fault
handling, workflow, report mapping, benefits and the technology stack.

---

## Live demonstration

The site is a single page with twelve anchored sections:

| Section | Anchor | What it shows |
| --- | --- | --- |
| Hero | `#top` | Live Node A readouts (LDR, PIR, duty, current) |
| Overview | `#overview` | Problem statement and the adaptive solution |
| Hardware components | `#components` | Ten modules, wiring schematic, pin mapping |
| Digital twin | `#digital-twin` | Interactive 3D city rendered from the engine |
| Sensors | `#sensors` | Live sensor samples and the decision table |
| Architecture | `#architecture` | Four layers and the end-to-end data flow |
| Cloud analytics | `#dashboard` | ThingSpeak style charts and channel mapping |
| Telegram | `#telegram` | Working bot simulation with real command handling |
| Faults | `#faults` | Fault injection, detection and automatic recovery |
| Workflow | `#workflow` | The seven-step control loop |
| Report mapping | `#report` | How each report chapter is covered |
| Benefits | `#benefits` | Modelled energy and maintenance outcomes |
| Tech stack | `#stack` | The full build stack |

Interactive features:

- **Orbit, zoom and focus** the 3D city; camera presets jump to Node A, a corridor or a
  junction.
- **Traffic and pedestrians** run on a deterministic 60 Hz engine — vehicles obey the same
  signal phases as the firmware simulation.
- **Telegram chat** accepts the real command set and answers from live engine state.
- **A fault is injected every ~45 seconds** on Node A and recovers automatically after 8
  seconds, so detection and recovery can be watched without waiting.

---

## Hardware

Ten modules, all on a single breadboard:

| Module | Version | Interface |
| --- | --- | --- |
| ESP32 DevKit V1 | ESP32-WROOM-32 | Wi-Fi, ADC, PWM, I2C |
| LDR Sensor Module | GL5528 + LM393 | Analog + digital |
| PIR HC-SR501 | HC-SR501 | Digital 3.3 V |
| ACS712 5A | ACS712ELCTR-05B | Analog, 2.5 V offset |
| IRLZ44N MOSFET | TO-220 logic-level | PWM gate drive |
| 16×2 I2C LCD | LCD1602 + PCF8574 | I2C |
| Active Buzzer | 5 V with oscillator | Digital |
| 12 V LED Street Lamp | 30 W constant-current | 12 V + PWM dimming |
| ThingSpeak | REST API v2 | HTTPS |
| Telegram Bot API | API 7.x | HTTPS long polling |

### Pin mapping

| Signal | GPIO | Direction | Notes |
| --- | --- | --- | --- |
| LDR analog out | GPIO34 | Input | ADC1_CH6, input only |
| ACS712 analog out | GPIO35 | Input | ADC1_CH7, input only |
| PIR output | GPIO27 | Input | 3.3 V logic |
| Lamp PWM gate | GPIO25 | Output | LEDC channel 0 |
| Buzzer | GPIO33 | Output | Via NPN transistor |
| LCD SDA | GPIO21 | Bidirectional | I2C |
| LCD SCL | GPIO22 | Output | I2C |

ADC1 channels are used for both analog sensors because ADC2 is unavailable while the Wi-Fi
radio is active. GPIO34 and GPIO35 are input-only pins, which is exactly what the LDR and the
ACS712 need.

---

## Firmware behaviour

```cpp
void controlStreetLight() {
  uint16_t ambientADC = readLDR();
  bool motionDetected = readPIR();

  if (ambientADC > DUSK_LIMIT) {
    setLamp(OFF, 0);            // DAY
  } else if (motionDetected) {
    setLamp(FULL, 100);         // NIGHT + movement
  } else {
    setLamp(DIM, 30);           // NIGHT, street is quiet
  }
}
```

| Condition | Duty | Mode | Current |
| --- | --- | --- | --- |
| LDR ADC > 1150 | 0 % | DAY | 0.00 A |
| LDR ADC ≤ 1150 and PIR LOW | 30 % | NIGHT | 0.12 A |
| LDR ADC ≤ 1150 and PIR HIGH | 100 % | NIGHT | 0.35 A |
| Telegram `/on` | 100 % | Manual | 0.35 A |
| Telegram `/off` | 0 % | Manual | 0.00 A |

The lamp current model used by the simulation is
`I = 0.0214 + 0.003286 × duty`, which matches the measured prototype (0 A off, 0.12 A at
30 %, 0.35 A at 100 %).

### Fault detection

A fault is declared when the measured current stays below 0.02 A for two consecutive samples
while the commanded duty is above 20 %. While the fault is open the duty is forced to zero,
the buzzer chirps, the LCD shows the error line and a Telegram message is posted. The
controller re-tests every second and closes the fault automatically when the expected load
returns.

---

## How the simulation works

The whole site is driven by a single **mutable `SimulationEngine` singleton** so that the 3D
scene, the charts and the UI always agree.

- **Fixed timestep.** The engine advances in `SIM_STEP = 1/60` s slices with an accumulator
  and a render-time interpolation factor (`alpha`), capped at 8 steps per frame. A
  `mulberry32` PRNG seeded with `0x5eed1a` makes every run reproducible.
- **No React re-render at 60 Hz.** React Three Fiber components read the engine's arrays
  directly inside `useFrame`. The UI subscribes to **throttled 10 Hz snapshots** published to
  Zustand stores by `src/store/runtime.ts`.
- **City topology.** A 4×4 grid of intersections (`[-60, -20, 20, 60]`) produces 16 nodes, 48
  directed edges, 24 street segments, 9 blocks, 48 poles and 12 signalized nodes. Traffic
  keeps right, U-turns are excluded to prevent deadlock, and a shortest-angle helper keeps
  vehicle headings continuous.
- **Day/night cycle.** `DAY_CYCLE = 160` s. The LDR crosses the dusk threshold of
  ADC 1150 twice per cycle, flipping the whole lighting policy.
- **Signals.** Fixed-time phases: 10 s green, 2 s amber, 1 s all-red per axis.

---

## Tech stack

**Firmware / hardware concepts:** ESP32-WROOM-32, Arduino IDE, ThingSpeak, Telegram Bot API.

**Web:** React 19, Next.js 15 (App Router), TypeScript, Tailwind CSS 4, Three.js, React Three
Fiber, Drei, `@react-three/postprocessing`, Framer Motion, GSAP, Zustand, Recharts,
`shadcn/ui` primitives, Lucide icons. Hosted on Vercel.

---

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
# open http://localhost:3000
```

Requires **Node.js 20.11 or newer**.

> The Google fonts Inter and JetBrains Mono are fetched through `next/font/google` at build
> time, so the first build needs network access.

---

## Project structure

```
src/
  app/                 App Router pages, SEO (sitemap, robots, manifest), global CSS
  components/
    layout/            Site header and footer
    providers/         Tooltip provider + simulation runtime mount
    sections/          The twelve content sections
    shared/            Section shell, stat tile, counter, reveal primitives
    three/             3D digital twin
      assets/          Procedural canvas textures
      scene/           World, street lights, traffic, effects, particles, camera rig
    ui/                shadcn-style interface primitives
  lib/
    data/              Hardware components and project content
    simulation/        Engine, city plan, lighting, traffic, PRNG, constants, types
  store/               Six Zustand stores + the rAF runtime driver
```

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create an optimized production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run `tsc --noEmit` |
| `npm run analyze` | Production build with the bundle analyzer |

---

## Honest notes on the 3D assets

All geometry in the digital twin is **generated procedurally in code** — roads, sidewalks,
markings, buildings, poles, lamps, signals, vehicles, pedestrians, particles. All textures are
**generated at runtime from seeded canvases**. No `.glb`/`.gltf` models are loaded or bundled,
and no binary art assets ship with the project.

An earlier plan considered loading low-poly GLB models with a procedural fallback; that chain
was dropped in favour of the fully procedural approach for reproducibility, bundle size and
licensing clarity. This is stated here so the report does not claim an asset pipeline that was
not used.

---

## Publish to GitHub

Create an empty repository on GitHub (for example `iot-street-lighting-digital-twin`), then:

```bash
git init

git add .

git commit -m "IoT street lighting digital twin: initial commit"

git branch -M main

git remote add origin https://github.com/<your-username>/<your-repo>.git

git push -u origin main
```

If the repository already exists and you want to overwrite its history, add `--force` to the
last command. Confirm the remote with `git remote -v` before pushing.

---

## Deploy to Vercel

### Option A — from the dashboard

1. Go to [vercel.com/new](https://vercel.com/new) and sign in.
2. Import the GitHub repository you just pushed.
3. Vercel auto-detects Next.js. Keep the defaults:
   - **Framework preset:** Next.js
   - **Build command:** `npm run build`
   - **Output directory:** `.next`
   - **Install command:** `npm install`
4. Click **Deploy**. Every push to `main` then redeploys automatically.

### Option B — from the CLI

```bash
npm install -g vercel

vercel login

# preview deployment
vercel

# production deployment
vercel --prod
```

No environment variables are required. The site is fully static apart from the client-side
simulation, which runs entirely in the browser.

---

## License

Released for academic use as part of a final-year engineering project. The hardware design,
firmware logic and simulation are original work; the web stack is built on the open-source
libraries listed above.
