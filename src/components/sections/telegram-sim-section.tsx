"use client";

import * as React from "react";
import { Bot, MessageSquare, Send, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/shared/reveal";
import { Section } from "@/components/shared/section";
import { getEngine } from "@/lib/simulation/engine";
import { useTelegramStore } from "@/store/telegram-store";

const QUICK_COMMANDS = [
  { cmd: "/status", label: "Get status" },
  { cmd: "/on", label: "Force ON" },
  { cmd: "/off", label: "Force OFF" },
  { cmd: "/auto", label: "Return to AUTO" },
] as const;

export function TelegramSimSection() {
  const messages = useTelegramStore((state) => state.messages);
  const push = useTelegramStore((state) => state.push);
  const [input, setInput] = React.useState("");

  const send = React.useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      push({ role: "user", text: trimmed, kind: "info" });
      const reply = getEngine().executeCommand(trimmed);
      push({ role: "bot", text: reply, kind: "info" });
      setInput("");
    },
    [push],
  );

  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length]);

  return (
    <Section
      id="telegram"
      eyebrow="Remote control"
      title="Telegram bot simulation"
      description="The same command set as the firmware: /status, /on, /off and /auto. Replies mirror the exact format produced by the bot, and manual overrides are released by /auto."
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Reveal>
          <div className="surface-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">SmartStreetBot</p>
                  <p className="font-mono text-[10.5px] text-white/35">@IoT_StreetLight_Bot</p>
                </div>
              </div>
              <Badge variant="primary">
                <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                Online
              </Badge>
            </div>

            <div
              ref={listRef}
              className="flex h-[420px] flex-col gap-3 overflow-y-auto px-5 py-5"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={
                    message.role === "user"
                      ? "ml-auto max-w-[78%] rounded-[1rem] rounded-tr-[0.4rem] border border-primary/30 bg-primary/12 px-4 py-2.5 text-sm text-white"
                      : "max-w-[78%] rounded-[1rem] rounded-tl-[0.4rem] border border-line bg-white/[0.03] px-4 py-2.5 text-sm text-white/80"
                  }
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                  <p className="mt-1.5 text-right font-mono text-[9.5px] text-white/30">
                    {new Date(message.at).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>

            <form
              className="flex items-center gap-2 border-t border-line px-4 py-3"
              onSubmit={(event) => {
                event.preventDefault();
                send(input);
              }}
            >
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Type /status, /on, /off or /auto..."
                className="flex-1 rounded-[var(--radius-control)] border border-line bg-white/[0.02] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
              <Button type="submit" size="sm">
                <Send className="h-3.5 w-3.5" />
                Send
              </Button>
            </form>
          </div>
        </Reveal>

        <div className="flex flex-col gap-4">
          <Reveal delay={0.06}>
            <div className="surface-card p-5 sm:p-6">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-white">Quick commands</h3>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {QUICK_COMMANDS.map((item) => (
                  <button
                    key={item.cmd}
                    type="button"
                    onClick={() => send(item.cmd)}
                    className="rounded-full border border-line bg-white/[0.02] px-3.5 py-1.5 text-xs text-white/70 transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-xs leading-relaxed text-white/45">
                The bot answers from the live engine state. If the lamp is in a fault, /status will
                include the fault reason until recovery completes.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="surface-card p-5 sm:p-6">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-success" />
                <h3 className="text-sm font-semibold text-white">Behaviour notes</h3>
              </div>
              <ul className="mt-4 flex flex-col gap-2 text-sm text-white/55">
                <li className="flex gap-2">
                  <span className="mt-[8px] h-1 w-1 rounded-full bg-primary/60" />
                  Manual /on or /off sets a Telegram override that bypasses the LDR+PIR policy.
                </li>
                <li className="flex gap-2">
                  <span className="mt-[8px] h-1 w-1 rounded-full bg-primary/60" />
                  /auto clears the override and returns to the adaptive five row policy.
                </li>
                <li className="flex gap-2">
                  <span className="mt-[8px] h-1 w-1 rounded-full bg-primary/60" />
                  Faults are pushed automatically to the chat with pole id and recovery time.
                </li>
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
