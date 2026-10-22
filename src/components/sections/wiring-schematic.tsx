import { cn } from "@/lib/utils";

/**
 * Wiring schematic of the prototype.
 *
 * Drawn as inline SVG rather than an image so it stays crisp, weighs nothing
 * and can be recoloured by the theme.
 */
export function WiringSchematic({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 900 420"
      role="img"
      aria-labelledby="schematic-title schematic-desc"
      className={cn("h-auto w-full", className)}
    >
      <title id="schematic-title">Prototype wiring schematic</title>
      <desc id="schematic-desc">
        The ESP32 reads an LDR on GPIO34, a PIR sensor on GPIO27 and an ACS712 current sensor on
        GPIO35. It drives a MOSFET gate on GPIO25, a buzzer on GPIO33 and publishes telemetry to
        the cloud over Wi-Fi.
      </desc>

      <defs>
        <linearGradient id="schematic-core" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(0,229,255,0.16)" />
          <stop offset="100%" stopColor="rgba(0,229,255,0.03)" />
        </linearGradient>
        <linearGradient id="schematic-signal" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(0,229,255,0.85)" />
          <stop offset="100%" stopColor="rgba(139,92,246,0.85)" />
        </linearGradient>
      </defs>

      {/* signal wiring */}
      <g stroke="url(#schematic-signal)" strokeWidth="1.4" fill="none" strokeLinecap="round">
        <path d="M330 158 H252 V50 H190" />
        <path d="M330 202 H262 V170 H190" />
        <path d="M330 246 H242 V290 H190" />
        <path d="M570 152 H628 V50 H710" />
        <path d="M570 214 H642 V260 H710" />
        <path d="M570 268 H600 V360 H710" />
        <path d="M785 80 V130" />
      </g>

      {/* power rail */}
      <g stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" fill="none" strokeDasharray="4 5">
        <path d="M95 290 V330 H950" />
      </g>

      {/* module boxes */}
      <Module x={20} y={20} title="LDR" subtitle="GL5528" />
      <Module x={20} y={140} title="PIR" subtitle="HC-SR501" />
      <Module x={20} y={260} title="ACS712" subtitle="5 A Hall" />

      <Module x={710} y={20} title="MOSFET" subtitle="IRLZ44N" />
      <Module x={710} y={130} title="LED LAMP" subtitle="12 V · 30 W" />
      <Module x={710} y={230} title="BUZZER" subtitle="5 V active" />
      <Module x={710} y={330} title="CLOUD" subtitle="ThingSpeak · Telegram" />

      {/* controller */}
      <rect
        x="330"
        y="120"
        width="240"
        height="180"
        rx="14"
        fill="url(#schematic-core)"
        stroke="rgba(0,229,255,0.55)"
        strokeWidth="1.4"
      />
      <text x="450" y="168" textAnchor="middle" className="fill-white" fontSize="17" fontWeight="600">
        ESP32 DevKit V1
      </text>
      <text
        x="450"
        y="192"
        textAnchor="middle"
        className="fill-white/50"
        fontSize="11"
        fontFamily="ui-monospace, monospace"
      >
        ESP32-WROOM-32
      </text>
      <rect x="358" y="210" width="184" height="30" rx="7" fill="rgba(255,255,255,0.04)" />
      <text
        x="450"
        y="229"
        textAnchor="middle"
        className="fill-primary/80"
        fontSize="10.5"
        fontFamily="ui-monospace, monospace"
      >
        500 ms sense · decide · drive
      </text>
      <text
        x="450"
        y="262"
        textAnchor="middle"
        className="fill-white/40"
        fontSize="10.5"
        fontFamily="ui-monospace, monospace"
      >
        3.3 V logic · 12 V lamp rail
      </text>

      {/* pin labels */}
      <Pin x={258} y={148} text="GPIO34 · ADC1_CH6" />
      <Pin x={268} y={192} text="GPIO27 · PIR" />
      <Pin x={248} y={236} text="GPIO35 · ADC1_CH7" />
      <Pin x={578} y={142} text="GPIO25 · LEDC CH0" />
      <Pin x={578} y={204} text="GPIO33" />
      <Pin x={578} y={258} text="Wi-Fi · HTTPS" />
      <Pin x={795} y={112} text="12 V PWM" />
    </svg>
  );
}

function Module({
  x,
  y,
  title,
  subtitle,
}: {
  x: number;
  y: number;
  title: string;
  subtitle: string;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width="170"
        height="60"
        rx="10"
        fill="rgba(255,255,255,0.035)"
        stroke="rgba(255,255,255,0.14)"
      />
      <text x={x + 16} y={y + 26} className="fill-white/85" fontSize="12.5" fontWeight="600">
        {title}
      </text>
      <text
        x={x + 16}
        y={y + 44}
        className="fill-white/40"
        fontSize="10.5"
        fontFamily="ui-monospace, monospace"
      >
        {subtitle}
      </text>
    </g>
  );
}

function Pin({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <text
      x={x}
      y={y}
      className="fill-primary/75"
      fontSize="9.5"
      fontFamily="ui-monospace, monospace"
      letterSpacing="0.04em"
    >
      {text}
    </text>
  );
}
