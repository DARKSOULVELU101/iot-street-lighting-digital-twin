export interface ComponentPin {
  signal: string;
  pin: string;
  note: string;
}

export interface ComponentSpec {
  label: string;
  value: string;
}

export interface HardwareComponent {
  id: string;
  name: string;
  category: "Controller" | "Sensor" | "Actuator" | "Output" | "Cloud";
  version: string;
  tagline: string;
  specs: ComponentSpec[];
  whyUsed: string[];
  role: string;
  advantages: string[];
  pins: ComponentPin[];
}

export const HARDWARE_COMPONENTS: HardwareComponent[] = [
  {
    id: "esp32",
    name: "ESP32 DevKit V1",
    category: "Controller",
    version: "ESP32-WROOM-32 · 38-pin DevKit V1",
    tagline: "Main controller: senses, decides, drives and reports",
    specs: [
      { label: "Core", value: "Dual-core Xtensa LX6, 240 MHz" },
      { label: "Wireless", value: "Wi-Fi 802.11 b/g/n + Bluetooth 4.2 BLE" },
      { label: "Memory", value: "520 KB SRAM · 4 MB flash" },
      { label: "ADC", value: "12-bit, 18 channels (ADC1_CH6 / ADC1_CH7)" },
      { label: "PWM", value: "16 × LEDC channels, up to 40 MHz" },
      { label: "Logic", value: "3.3 V, not 5 V tolerant" },
    ],
    whyUsed: [
      "Integrated Wi-Fi removes the need for a separate network module",
      "Two cores let the cloud upload run while the control loop stays responsive",
      "12-bit ADC reads the LDR and the ACS712 on two hardware-only pins",
      "Hardware LEDC PWM gives jitter-free brightness control for free",
      "3.3 V logic matches the sensor modules without level shifting",
      "Low unit cost and deep-sleep support for a battery backup path",
    ],
    role:
      "Main controller. Reads the LDR and ACS712 on ADC1, reads the PIR on a digital pin, drives the MOSFET gate with LEDC PWM, refreshes the LCD over I2C, publishes telemetry to ThingSpeak and polls the Telegram Bot API.",
    advantages: [
      "Single board covers sensing, control and connectivity",
      "Adequate GPIO for every peripheral in the design",
      "Large open-source library ecosystem",
      "Can run the control loop on CPU0 and networking on CPU1",
    ],
    pins: [
      { signal: "LDR analog out", pin: "GPIO34 (ADC1_CH6)", note: "Input only, 12-bit" },
      { signal: "ACS712 analog out", pin: "GPIO35 (ADC1_CH7)", note: "Input only, 12-bit" },
      { signal: "PIR output", pin: "GPIO27", note: "Digital input, 3.3 V logic" },
      { signal: "Lamp PWM gate", pin: "GPIO25 (LEDC CH0)", note: "Hardware PWM output" },
      { signal: "Buzzer", pin: "GPIO33", note: "Digital output" },
      { signal: "LCD SDA", pin: "GPIO21", note: "I2C data" },
      { signal: "LCD SCL", pin: "GPIO22", note: "I2C clock" },
    ],
  },
  {
    id: "ldr",
    name: "LDR Sensor Module",
    category: "Sensor",
    version: "GL5528 photoresistor with LM393 comparator",
    tagline: "Ambient illuminance sensing for day/night decisions",
    specs: [
      { label: "Element", value: "GL5528, 5–20 kΩ at 10 lux" },
      { label: "Dark resistance", value: "≈ 1 MΩ" },
      { label: "Outputs", value: "Analog 0–3.3 V + digital comparator" },
      { label: "Supply", value: "3.3–5 V DC" },
      { label: "Adjustment", value: "Potentiometer threshold trim" },
      { label: "Response", value: "≈ 15–35 ms" },
    ],
    whyUsed: [
      "A continuous analog reading supports graded dimming instead of a binary switch",
      "The comparator output gives an independent hardware night trigger",
      "Passive and cheap, with no power draw of consequence",
      "No calibration drift over the service life of the fixture",
    ],
    role:
      "Ambient light sensing. The analog output is sampled every 500 ms; the ADC count decides DAY, DUSK or NIGHT and sets the base dimming level of the lamp.",
    advantages: [
      "Analog plus digital output in one module",
      "Trimmable dusk threshold",
      "Works directly from a 3.3 V rail",
      "Extremely low cost",
    ],
    pins: [
      { signal: "VCC", pin: "3V3 (ESP32)", note: "Power" },
      { signal: "GND", pin: "GND", note: "Ground" },
      { signal: "AO", pin: "GPIO34", note: "Analog to ADC1_CH6" },
      { signal: "DO", pin: "GPIO26 (optional)", note: "Comparator night trigger" },
    ],
  },
  {
    id: "pir",
    name: "PIR HC-SR501",
    category: "Sensor",
    version: "HC-SR501 · 3–5 V PIR motion sensor",
    tagline: "Presence detection that triggers full brightness",
    specs: [
      { label: "Supply", value: "3–5 V DC" },
      { label: "Current", value: "5–15 mA idle" },
      { label: "Detection angle", value: "120°" },
      { label: "Range", value: "3–7 m, potentiometer adjustable" },
      { label: "Output", value: "3.3 V digital HIGH on motion" },
      { label: "Warm-up", value: "≈ 3 s after power-up" },
    ],
    whyUsed: [
      "Only lights the road when somebody is actually there",
      "Digital output plugs straight into a 3.3 V GPIO",
      "Wide cone covers a full road segment from one pole",
      "Retriggerable so a moving target keeps the lamp up",
    ],
    role:
      "Motion sensing. While the output is HIGH the controller raises the nearest lamp from 30 % to 100 % duty and holds it there until the PIR goes LOW.",
    advantages: [
      "Very low standby current",
      "Wide detection cone",
      "Adjustable range and retrigger delay",
      "Logic-level output, no ADC required",
    ],
    pins: [
      { signal: "VCC", pin: "3V3 (ESP32)", note: "Power" },
      { signal: "OUT", pin: "GPIO27", note: "Digital input" },
      { signal: "GND", pin: "GND", note: "Ground" },
    ],
  },
  {
    id: "acs712",
    name: "ACS712 5A Current Sensor",
    category: "Sensor",
    version: "ACS712ELCTR-05B · 0–5 A Hall-effect",
    tagline: "Closed-loop verification that the lamp is really drawing current",
    specs: [
      { label: "Range", value: "0–5 A (5 A variant)" },
      { label: "Sensitivity", value: "185 mV/A" },
      { label: "Zero current output", value: "2.5 V" },
      { label: "Input impedance", value: "1.2 kΩ typical" },
      { label: "Bandwidth", value: "100 kHz" },
      { label: "Isolation", value: "Galvanic, 100 kV/µs" },
    ],
    whyUsed: [
      "Measures the load without putting a shunt in the power path",
      "Galvanic isolation protects the ESP32 from the 12 V rail",
      "Confirms the commanded duty against the real current draw",
      "A zero reading while PWM is commanded is an unambiguous lamp fault",
    ],
    role:
      "Load monitoring. The ADC count is converted back to amperes and compared against the current the duty cycle should produce. A mismatch raises a fault.",
    advantages: [
      "Non-invasive measurement",
      "Wide measurement range with 185 mV/A resolution",
      "Isolated from the high-voltage side",
      "Low cost and no external shunt resistor",
    ],
    pins: [
      { signal: "VCC", pin: "5V (regulated rail)", note: "Sensor supply" },
      { signal: "GND", pin: "GND", note: "Common ground" },
      { signal: "VOUT", pin: "GPIO35", note: "ADC1_CH7, 2.5 V = 0 A" },
      { signal: "IP+", pin: "+12 V lamp feed", note: "Current flows into the module" },
      { signal: "IP-", pin: "MOSFET drain", note: "Current returns to the lamp" },
    ],
  },
  {
    id: "mosfet",
    name: "IRLZ44N MOSFET",
    category: "Actuator",
    version: "IRLZ44N · 55 V logic-level N-channel · TO-220",
    tagline: "The switch that lets a 3.3 V pin control a 12 V lamp",
    specs: [
      { label: "VDS", value: "55 V" },
      { label: "ID", value: "47 A" },
      { label: "RDS(on)", value: "22 mΩ @ 10 V · 0.1 Ω @ 4 V" },
      { label: "Gate threshold", value: "1–2 V, logic level" },
      { label: "Package", value: "TO-220 with insulated tab" },
      { label: "Switching", value: "Avalanche rated, fast switching" },
    ],
    whyUsed: [
      "A GPIO cannot source the current a 30 W street lamp draws",
      "A logic-level gate is fully enhanced by a 3.3 V drive",
      "Low RDS(on) means the lamp voltage is not dragged down when dimming",
      "It isolates the ESP32 from the 12 V rail and any switching transients",
    ],
    role:
      "Low-side switch for the lamp. The ESP32 outputs LEDC PWM on GPIO25, which drives the gate through a 100 Ω resistor, so the lamp receives a chopped 12 V supply whose average power sets the brightness.",
    advantages: [
      "Logic-level gate drive",
      "Very low on-state resistance",
      "Handles the inrush of a capacitive LED driver",
      "Inexpensive and widely available",
    ],
    pins: [
      { signal: "Gate", pin: "GPIO25 via 100 Ω", note: "PWM input" },
      { signal: "Drain", pin: "ACS712 IP- / lamp negative", note: "Switched load" },
      { signal: "Source", pin: "GND", note: "Common ground" },
    ],
  },
  {
    id: "lcd",
    name: "16×2 I2C LCD",
    category: "Output",
    version: "LCD1602 with PCF8574 I2C backpack",
    tagline: "On-site read-out of mode, duty and current",
    specs: [
      { label: "Display", value: "16 columns × 2 rows, HD44780" },
      { label: "Expander", value: "PCF8574, address 0x27" },
      { label: "Bus", value: "I2C, 2 wires" },
      { label: "Supply", value: "5 V typical (3.3 V with level shifting)" },
      { label: "Backlight", value: "Switchable via the backpack" },
      { label: "Library", value: "LiquidCrystal_I2C" },
    ],
    whyUsed: [
      "Gives a technician instant feedback without a phone or laptop",
      "I2C keeps the pin count at two instead of six",
      "The backpack removes the need to drive the RS/EN lines manually",
      "A wide, legible line display suits a control-room status readout",
    ],
    role:
      "Local status display. Shows the active mode, the commanded duty percentage and the measured lamp current, and flashes an error line when a fault is open.",
    advantages: [
      "Two-wire interface",
      "Well supported by the Arduino ecosystem",
      "Readable from several metres away",
      "Very low cost",
    ],
    pins: [
      { signal: "SDA", pin: "GPIO21", note: "I2C data" },
      { signal: "SCL", pin: "GPIO22", note: "I2C clock" },
      { signal: "VCC", pin: "5V (or 3V3 + shifter)", note: "Backlight and logic" },
      { signal: "GND", pin: "GND", note: "Ground" },
    ],
  },
  {
    id: "buzzer",
    name: "Active Buzzer",
    category: "Output",
    version: "5 V active buzzer with integrated oscillator",
    tagline: "Local audible alarm when a fault is detected",
    specs: [
      { label: "Supply", value: "5 V DC" },
      { label: "Current", value: "≈ 30 mA" },
      { label: "Tone", value: "2–3 kHz square wave" },
      { label: "Oscillator", value: "Integrated, no tone generation needed" },
      { label: "Drive", value: "Low-current NPN or direct GPIO drive" },
      { label: "Indicator", value: "Continuous tone or pattern" },
    ],
    whyUsed: [
      "Gives audible local feedback even when the internet is unreachable",
      "Active type needs no PWM tone generation",
      "Draws current small enough to drive from a GPIO with a transistor",
      "Draws attention to a fault that would otherwise be silent",
    ],
    role:
      "Fault annunciator. The controller chirps twice when a lamp fault is confirmed and repeats a short pattern while the fault remains active.",
    advantages: [
      "Immediate local notification",
      "Simple single-pin interface",
      "No tone library needed",
      "Negligible power draw",
    ],
    pins: [
      { signal: "+", pin: "GPIO33 via NPN", note: "Digital output" },
      { signal: "-", pin: "GND", note: "Ground" },
    ],
  },
  {
    id: "lamp",
    name: "12 V LED Street Lamp",
    category: "Actuator",
    version: "12 V DC 30 W LED street lamp with constant-current driver",
    tagline: "The controlled load: the whole point of the system",
    specs: [
      { label: "Input", value: "12 V DC" },
      { label: "Rated power", value: "30 W (≈ 0.35 A at full output)" },
      { label: "Lumens", value: "3000–3600 lm" },
      { label: "Colour temperature", value: "2700–6500 K" },
      { label: "Protection", value: "IP66, surge and reverse polarity" },
      { label: "Dimming", value: "PWM input on the driver" },
    ],
    whyUsed: [
      "A high-efficiency LED replaces a 70 W metal-halide head",
      "The driver accepts a PWM dimming input, so no AC dimmer is required",
      "A constant-current driver keeps the colour stable while dimming",
      "IP66 rating suits outdoor roadside mounting",
    ],
    role:
      "The illuminator under control. The MOSFET chops its supply at the PWM frequency, and the average duty cycle sets the light output between 30 % and 100 %.",
    advantages: [
      "Roughly a 55 % energy saving against the old lamp",
      "Long service life and low maintenance",
      "Instant on/off with no warm-up delay",
      "Dimming does not change the colour temperature",
    ],
    pins: [
      { signal: "+12 V", pin: "Regulated 12 V rail", note: "Unswitched supply" },
      { signal: "-", pin: "MOSFET drain", note: "Switched negative leg" },
      { signal: "Dim input", pin: "Driven by the MOSFET gate", note: "PWM dimming" },
    ],
  },
  {
    id: "thingspeak",
    name: "ThingSpeak Cloud",
    category: "Cloud",
    version: "ThingSpeak channel service · REST API v2",
    tagline: "Hosted time-series storage for the telemetry",
    specs: [
      { label: "Fields", value: "8 numeric fields per channel" },
      { label: "Update", value: "HTTPS GET, 15 s minimum interval" },
      { label: "Storage", value: "Retained with MATLAB Analytics add-on" },
      { label: "Auth", value: "Write API key per channel" },
      { label: "Cost", value: "Free tier available" },
      { label: "Embed", value: "Charts can be embedded as a public URL" },
    ],
    whyUsed: [
      "No server has to be hosted or maintained for the project",
      "Time-series storage and charting come out of the box",
      "A documented GET API is trivial to call from an ESP32 with WiFiClient",
      "The public chart URL can be pasted into the project report",
    ],
    role:
      "Cloud telemetry sink. The controller publishes field1 to field6 every 15 seconds; Section 6 of this site reproduces that channel with the same field mapping.",
    advantages: [
      "Free and instantly available",
      "REST-only integration",
      "Built-in charts and MATLAB analytics",
      "Public embeddable dashboard",
    ],
    pins: [
      { signal: "Software", pin: "HTTPS GET /update", note: "Field1..field6" },
      { signal: "Credentials", pin: "Write API key", note: "Stored in the sketch, not in the UI" },
      { signal: "Transport", pin: "ESP32 Wi-Fi", note: "TLS over port 443" },
    ],
  },
  {
    id: "telegram",
    name: "Telegram Bot API",
    category: "Cloud",
    version: "Telegram Bot API 7.x · HTTPS long polling",
    tagline: "Remote control and alerting from any phone",
    specs: [
      { label: "Transport", value: "HTTPS JSON, long polling or webhook" },
      { label: "Auth", value: "Bot token issued by BotFather" },
      { label: "Commands", value: "/status /on /off /auto" },
      { label: "Rate limit", value: "≈ 30 messages per second" },
      { label: "Cost", value: "Free" },
      { label: "Clients", value: "Any phone with the Telegram app" },
    ],
    whyUsed: [
      "Remote control without writing a mobile application",
      "Fault alerts arrive instantly and are hard to miss",
      "Works over any network, including a phone hotspot on site",
      "The bot token is stored only in the firmware, never in the browser",
    ],
    role:
      "Remote interface. The controller long-polls for updates, replies to /status with live values, applies /on and /off as a manual override and returns to /auto adaptive control.",
    advantages: [
      "Instant two-way control",
      "Zero application development",
      "Rich message formatting for alerts",
      "Free and globally available",
    ],
    pins: [
      { signal: "Software", pin: "getUpdates long polling", note: "Command intake" },
      { signal: "Credentials", pin: "Bot token", note: "Firmware-side only" },
      { signal: "Output", pin: "sendMessage", note: "Status and fault alerts" },
    ],
  },
];

export const COMPONENT_CATEGORIES = [
  "Controller",
  "Sensor",
  "Actuator",
  "Output",
  "Cloud",
] as const;
