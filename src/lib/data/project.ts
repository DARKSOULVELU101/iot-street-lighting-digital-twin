export interface OverviewBlock {
  title: string;
  body: string;
  points: string[];
}

export const PROBLEM_STATEMENT: OverviewBlock = {
  title: "The problem with conventional street lighting",
  body: "Conventional municipal lighting runs on a fixed schedule. Fixtures are switched on at dusk and off at dawn regardless of whether anybody is on the road, and a failed lamp stays dark until a maintenance crew happens to drive past it.",
  points: [
    "Unoccupied streets burn full output through the whole night",
    "Lamp failures are discovered days later by complaint, not by measurement",
    "Every manual inspection round costs fuel, labour and vehicle hours",
    "Energy price volatility makes the fixed-output profile expensive to run",
  ],
};

export const SOLUTION_OVERVIEW: OverviewBlock = {
  title: "What this system does instead",
  body: "An ESP32 reads ambient light, presence and load current continuously, then drives a 12 V LED lamp through a MOSFET with hardware PWM. Darkness alone drops the lamp to a 30 % dim level; confirmed motion raises the nearest poles to 100 % within one second. Every sample is uploaded to a ThingSpeak channel and every alarm is pushed to a Telegram bot.",
  points: [
    "Ambient light decides the base level, so daytime output is exactly zero",
    "Motion presence promotes the nearest poles to full output",
    "Current measurement closes the loop and detects a failed lamp",
    "Cloud telemetry and Telegram alerts replace the manual patrol",
  ],
};

export interface WorkflowStep {
  id: string;
  title: string;
  detail: string;
  signal: string;
}

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: "ldr",
    title: "LDR detects darkness",
    detail:
      "The GL5528 divider output falls as the scene darkens. The controller compares the ADC count against the dusk threshold of 1150 and classifies the scene as DAY or NIGHT.",
    signal: "ADC1_CH6 / GPIO34",
  },
  {
    id: "read",
    title: "ESP32 samples the sensors",
    detail:
      "Every 500 ms the firmware reads the LDR on ADC1_CH6, the ACS712 on ADC1_CH7 and the PIR on GPIO27, then timestamps the sample.",
    signal: "500 ms control period",
  },
  {
    id: "pir",
    title: "PIR confirms motion",
    detail:
      "The HC-SR501 drives its output HIGH when a target enters the 120° cone within the configured 3–7 m range, so the controller knows the road is in use.",
    signal: "GPIO27 digital input",
  },
  {
    id: "pwm",
    title: "PWM duty is commanded",
    detail:
      "LEDC channel 0 writes the duty cycle to GPIO25. The signal drives the IRLZ44N gate, which chops the 12 V supply to the lamp driver.",
    signal: "LEDC CH0 / GPIO25",
  },
  {
    id: "lamp",
    title: "Lamp brightness changes",
    detail:
      "Night without motion holds 30 % duty. Motion inside the detection radius promotes the affected poles to 100 %. Daylight forces the duty to zero.",
    signal: "0 % / 30 % / 100 %",
  },
  {
    id: "current",
    title: "Current is measured back",
    detail:
      "The ACS712 reports the load current, which is converted back to amperes and compared against the current the commanded duty should produce.",
    signal: "ADC1_CH7 / GPIO35",
  },
  {
    id: "cloud",
    title: "Telemetry is published",
    detail:
      "Every 15 s the controller pushes six fields to the ThingSpeak channel and posts any fault to the Telegram bot, then returns to the next control period.",
    signal: "ThingSpeak + Telegram",
  },
];

export interface ArchitectureLayer {
  id: string;
  label: string;
  caption: string;
  items: string[];
}

export const ARCHITECTURE_LAYERS: ArchitectureLayer[] = [
  {
    id: "perception",
    label: "Perception",
    caption: "Analog and digital sensing",
    items: ["LDR Sensor Module", "PIR HC-SR501", "ACS712 5A"],
  },
  {
    id: "control",
    label: "Control",
    caption: "Sense, decide, drive, report",
    items: ["ESP32 DevKit V1"],
  },
  {
    id: "power",
    label: "Power stage",
    caption: "Low-side switching and load",
    items: ["IRLZ44N MOSFET", "12 V LED Street Lamp"],
  },
  {
    id: "connectivity",
    label: "Connectivity",
    caption: "Cloud telemetry and alerting",
    items: ["ThingSpeak Cloud", "Telegram Bot API"],
  },
];

export interface BenefitMetric {
  id: string;
  label: string;
  value: number;
  suffix: string;
  detail: string;
  basis: string;
}

export const BENEFITS: BenefitMetric[] = [
  {
    id: "energy",
    label: "Electricity saved",
    value: 62,
    suffix: "%",
    detail:
      "A 30 W LED head driven at 30 % for most night hours replaces a 70 W high-pressure sodium lamp left at full output.",
    basis: "Modelled from the simulated duty profile",
  },
  {
    id: "maintenance",
    label: "Manual rounds avoided",
    value: 24,
    suffix: "",
    detail:
      "Failed lamps raise an alert instead of waiting for the next scheduled inspection circuit, so patrol vehicles only travel when there is a confirmed fault.",
    basis: "Two patrol rounds per day eliminated",
  },
  {
    id: "detection",
    label: "Fault detection latency",
    value: 1,
    suffix: " s",
    detail:
      "Load current is sampled every 500 ms. A zero reading while a duty cycle is commanded raises a fault within a single sample.",
    basis: "500 ms control period",
  },
  {
    id: "cloud",
    label: "Telemetry publish interval",
    value: 15,
    suffix: " s",
    detail:
      "Every field is written to the ThingSpeak channel on a fixed cadence, so a reviewer can open the live chart from anywhere without a server.",
    basis: "ThingSpeak minimum update window",
  },
  {
    id: "levels",
    label: "Adaptive brightness levels",
    value: 3,
    suffix: "",
    detail:
      "Off, 30 % dim and 100 % full give the lamp enough states to match real road demand instead of a binary on/off schedule.",
    basis: "Firmware duty table",
  },
];

export interface TechStackItem {
  name: string;
  role: string;
  icon: string;
  href?: string;
}

export const TECH_STACK: TechStackItem[] = [
  { name: "ESP32-WROOM-32", role: "Firmware controller", icon: "cpu" },
  { name: "Arduino IDE", role: "Firmware toolchain", icon: "terminal" },
  { name: "ThingSpeak", role: "Cloud telemetry", icon: "cloud" },
  { name: "Telegram Bot API", role: "Remote control and alerts", icon: "send" },
  { name: "React 19", role: "UI runtime", icon: "atom" },
  { name: "Next.js 15", role: "App framework", icon: "layers" },
  { name: "TypeScript", role: "Type safety", icon: "braces" },
  { name: "Tailwind CSS 4", role: "Styling system", icon: "wind" },
  { name: "Three.js", role: "3D renderer", icon: "box" },
  { name: "React Three Fiber", role: "React scene graph", icon: "orbit" },
  { name: "Framer Motion", role: "Interface motion", icon: "zap" },
  { name: "Zustand", role: "Simulation state", icon: "database" },
  { name: "Recharts", role: "Analytics charts", icon: "chart" },
  { name: "GSAP", role: "Scroll choreography", icon: "waves" },
  { name: "Drei", role: "Scene helpers", icon: "component" },
  { name: "shadcn/ui", role: "Interface primitives", icon: "layout" },
  { name: "Vercel", role: "Hosting and CDN", icon: "triangle" },
];

export interface ReportSection {
  id: string;
  title: string;
  summary: string;
  body: string[];
  table?: { head: string[]; rows: string[][] };
}

export const REPORT_MAPPING: ReportSection[] = [
  {
    id: "hardware",
    title: "Hardware components",
    summary: "The ten physical parts that make up the prototype.",
    body: [
      "The prototype is built from ten modules that were selected for cost, availability and interface compatibility with the ESP32.",
      "A single ESP32 owns sensing, decision, switching, display, sound and both cloud integrations, which keeps the bill of materials small enough for a final-year project budget.",
      "Every module runs from the same 5 V rail with a regulated 3.3 V output for the ESP32 and the logic-level sensors.",
    ],
    table: {
      head: ["Module", "Version", "Interface"],
      rows: [
        ["ESP32 DevKit V1", "ESP32-WROOM-32", "Wi-Fi, ADC, PWM, I2C"],
        ["LDR Sensor Module", "GL5528 + LM393", "Analog + digital"],
        ["PIR HC-SR501", "HC-SR501", "Digital 3.3 V"],
        ["ACS712 5A", "ACS712ELCTR-05B", "Analog 2.5 V offset"],
        ["IRLZ44N MOSFET", "TO-220 logic-level", "PWM gate drive"],
        ["16×2 I2C LCD", "LCD1602 + PCF8574", "I2C"],
        ["Active Buzzer", "5 V with oscillator", "Digital"],
        ["12 V LED Street Lamp", "30 W constant-current", "12 V + PWM dimming"],
        ["ThingSpeak", "REST API v2", "HTTPS"],
        ["Telegram Bot API", "API 7.x", "HTTPS long polling"],
      ],
    },
  },
  {
    id: "pins",
    title: "Pin mapping",
    summary: "The exact pin assignment used by the firmware.",
    body: [
      "ADC1 channels are used for both analog sensors because ADC2 is unavailable while the Wi-Fi radio is active, which would make the readings unreliable.",
      "GPIO34 and GPIO35 are input-only pins, which is exactly what the LDR and the ACS712 need.",
      "GPIO25 drives the LEDC PWM channel that gates the MOSFET, and GPIO33 drives the buzzer through a small NPN transistor.",
    ],
    table: {
      head: ["Signal", "GPIO", "Direction", "Notes"],
      rows: [
        ["LDR analog out", "GPIO34", "Input", "ADC1_CH6, input only"],
        ["ACS712 analog out", "GPIO35", "Input", "ADC1_CH7, input only"],
        ["PIR output", "GPIO27", "Input", "3.3 V logic"],
        ["Lamp PWM gate", "GPIO25", "Output", "LEDC channel 0"],
        ["Buzzer", "GPIO33", "Output", "Via NPN transistor"],
        ["LCD SDA", "GPIO21", "Bidirectional", "I2C"],
        ["LCD SCL", "GPIO22", "Output", "I2C"],
      ],
    },
  },
  {
    id: "firmware",
    title: "Firmware logic",
    summary: "The loop that ties every module together.",
    body: [
      "setup() brings up the I2C bus for the LCD, configures GPIO27 and GPIO33, attaches the PWM channel to GPIO25 at 1 kHz with 8-bit resolution, and connects to Wi-Fi.",
      "loop() runs on a 500 ms period. It samples the LDR and the ACS712 through analogRead(), reads the PIR pin, then evaluates the decision function.",
      "The resulting duty cycle is written with ledcWrite(), the LCD line is refreshed, and a counter decides whether the 15 s ThingSpeak window has elapsed.",
      "The Telegram client is polled with getUpdates() on the same loop, and each /command is applied to a small state machine that either overrides or restores adaptive control.",
    ],
  },
  {
    id: "control",
    title: "Control algorithm",
    summary: "The exact decision table implemented in the sketch.",
    body: [
      "The control law is deliberately a small decision table rather than a fuzzy or PID controller, because the correct behaviour is a policy, not a continuous optimum.",
      "The important detail is that the ambient reading is always sampled, even during the day, so the controller can react to a sudden eclipse or a storm without waiting for dusk.",
    ],
    table: {
      head: ["Condition", "Duty", "Mode", "Current"],
      rows: [
        ["LDR ADC > 1150", "0 %", "DAY", "0.00 A"],
        ["LDR ADC ≤ 1150 and PIR LOW", "30 %", "NIGHT", "0.12 A"],
        ["LDR ADC ≤ 1150 and PIR HIGH", "100 %", "NIGHT", "0.35 A"],
        ["Telegram /on", "100 %", "Manual", "0.35 A"],
        ["Telegram /off", "0 %", "Manual", "0.00 A"],
      ],
    },
  },
  {
    id: "fault",
    title: "Fault algorithm",
    summary: "How a failed lamp is detected and recovered.",
    body: [
      "A fault is declared when the measured current stays below 0.02 A for two consecutive samples while the commanded duty is above 20 %.",
      "Two consecutive samples are required so that a single inrush transient during lamp warm-up cannot produce a false alarm.",
      "While the fault is open the duty is forced to zero, the buzzer chirps, the LCD shows the error line and a Telegram message is posted.",
      "The controller keeps re-testing the circuit every second. When the current returns to the expected value the fault closes automatically and the lamp resumes its adaptive duty.",
    ],
  },
  {
    id: "thingspeak",
    title: "ThingSpeak fields",
    summary: "The six channel fields written every 15 seconds.",
    body: [
      "The channel is written with a single HTTPS GET request that carries all six fields as query parameters.",
      "The API key is stored only in the firmware sketch. It is never exposed to a browser, which is why this site reproduces the channel with a local simulation engine instead of calling the service with a credential.",
    ],
    table: {
      head: ["Field", "Quantity", "Unit", "Source"],
      rows: [
        ["field1", "Ambient light", "lux", "LDR analog"],
        ["field2", "Load current", "A", "ACS712"],
        ["field3", "Supply voltage", "V", "Constant 12 V rail"],
        ["field4", "Instantaneous power", "W", "V × I"],
        ["field5", "Cumulative energy", "Wh", "Trapezoidal integral"],
        ["field6", "Lamp state", "0/1", "Duty > 0"],
      ],
    },
  },
  {
    id: "telegram",
    title: "Telegram commands",
    summary: "The command set exposed to the operator.",
    body: [
      "The bot accepts four commands. Three of them act on the controller and one simply reports the live state.",
      "Manual overrides are always temporary. Any subsequent /auto command restores the adaptive policy, which keeps the remote interface from being a permanent bypass of the energy saving logic.",
    ],
    table: {
      head: ["Command", "Effect", "Answer"],
      rows: [
        ["/status", "None", "Live mode, ambient, PIR, duty, current, power, energy"],
        ["/on", "Forces 100 % duty", "Confirmation with the new duty"],
        ["/off", "Forces 0 % duty", "Confirmation with the new duty"],
        ["/auto", "Restores adaptive control", "Confirmation that the policy is active again"],
      ],
    },
  },
];
