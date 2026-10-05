import { useEffect, useState } from "react";
import { getAdminStats, sendFeedback, type AdminStats, type Status } from "../lib/api";
import { getReduceMotion, getTheme } from "../lib/prefs";
import { Group, SubpageHeader } from "../components/SettingsList";
import { Button, Panel } from "../components/ui";

type Kind = "feedback" | "bug" | "idea";
const KINDS: [Kind, string, string][] = [
  ["bug", "Something broke", "What happened, and what did you expect?"],
  ["idea", "I have an idea", "What would make Gotcha better?"],
  ["feedback", "Just saying", "Anything at all."],
];

// Where a tester tells us something. The details of their phone and screen go along with it, so a
// bug report doesn't need a back and forth.
export function FeedbackPage({ status }: { status: Status | null }) {
  const [kind, setKind] = useState<Kind>("bug");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function send() {
    const info = [
      `Gotcha ${__APP_VERSION__} (${import.meta.env.MODE})`,
      `Page: ${window.location.hash || "#/"}`,
      `Theme: ${getTheme()}, reduce motion: ${getReduceMotion()}`,
      `Screen: ${window.innerWidth}x${window.innerHeight} @${window.devicePixelRatio}x`,
      `Catches today: ${status ? `${status.used}/${status.cap}` : "unknown"}`,
      `Browser: ${navigator.userAgent}`,
    ].join("\n");
    setState("sending");
    setError(null);
    try {
      await sendFeedback(kind, message, info);
      setState("sent");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send that.");
      setState("idle");
    }
  }

  if (state === "sent")
    return (
      <div className="page max-w-[680px]">
        <SubpageHeader title="Send feedback" />
        <Panel className="mt-5 p-6 text-center">
          <h2 className="font-display text-[22px] font-extrabold tracking-tight">Thank you!</h2>
          <p className="mt-2 text-[14.5px] text-ink-2">That went straight to the people making Gotcha.</p>
          <Button className="mt-5" onClick={() => (setMessage(""), setState("idle"))} variant="secondary" size="sm">
            Send another
          </Button>
        </Panel>
      </div>
    );

  const hint = KINDS.find((k) => k[0] === kind)![2];
  return (
    <div className="page max-w-[680px]">
      <SubpageHeader title="Send feedback" />
      <div className="mt-5 flex flex-wrap gap-2">
        {KINDS.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setKind(k)}
            aria-pressed={kind === k}
            className={`rounded-full px-4 py-2 text-[14px] font-semibold transition ${kind === k ? "bg-canopy text-white" : "bg-paper shadow-soft hover:bg-paper-3"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={1200}
        rows={6}
        placeholder={hint}
        className="mt-4 w-full resize-y rounded-2xl bg-paper p-4 text-[15px] shadow-soft outline-none focus-visible:ring-2 focus-visible:ring-canopy"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-[12.5px] text-ink-3">Your phone and screen details are included to help us fix things.</p>
        <Button onClick={send} disabled={state === "sending" || message.trim().length < 3}>
          {state === "sending" ? "Sending" : "Send"}
        </Button>
      </div>
      {error && <p className="mt-3 text-[13.5px] text-danger">{error}</p>}
    </div>
  );
}

const pct = (n: number | null) => (n == null ? "Not enough yet" : `${n}%`);

// A private look at how testing is going. Only the developer account can load it.
export function StatsPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    getAdminStats().then(setStats).catch(() => setFailed(true));
  }, []);

  const tiles: [string, string][] = stats
    ? [
        ["Players", String(stats.players)],
        ["Active today", String(stats.activeToday)],
        ["Active this week", String(stats.activeWeek)],
        ["Came back after a week", pct(stats.weekRetention)],
        ["Catches", String(stats.cards)],
        ["Wild share", `${stats.wildShare}%`],
        ["On the boards", String(stats.onBoard)],
        ["Crews", String(stats.crews)],
      ]
    : [];
  const peak = Math.max(1, ...(stats?.perDay.map((d) => d.catches) ?? []));

  return (
    <div className="page max-w-[680px]">
      <SubpageHeader title="How testing is going" />
      {failed && <p className="mt-5 text-[14.5px] text-ink-2">Couldn't load. Only the developer account can see this.</p>}
      {!stats && !failed && <div className="skeleton mt-5 h-[300px] rounded-2xl" />}
      {stats && (
        <>
          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {tiles.map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-paper p-3.5 shadow-soft">
                <div className="font-display text-[24px] leading-none font-extrabold tabular">{v}</div>
                <div className="mt-1.5 text-[11.5px] leading-tight font-semibold text-ink-3">{k}</div>
              </div>
            ))}
          </div>

          <Group title="Catches, last 14 days">
            <div className="px-4 py-4">
              {stats.perDay.length === 0 ? (
                <p className="text-[14px] text-ink-2">No catches yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {stats.perDay.map((d) => (
                    <div key={d.day} className="flex items-center gap-3 text-[12.5px]">
                      <span className="w-12 shrink-0 text-ink-3 tabular">{d.day.slice(5)}</span>
                      <span className="h-3 rounded-full bg-canopy" style={{ width: `${(d.catches / peak) * 100}%`, minWidth: 6 }} />
                      <span className="tabular">
                        {d.catches} <span className="text-ink-3">by {d.players}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Group>

          <Group title="Reports" footer="Three different people reporting a name takes it off the boards.">
            {stats.reports.length === 0 ? (
              <div className="px-4 py-4 text-[14px] text-ink-2">None.</div>
            ) : (
              stats.reports.map((r) => (
                <div key={r.target_name} className="px-4 py-3.5 text-[14px] [&+&]:border-t [&+&]:border-line">
                  <span className="font-semibold">{r.target_name}</span> · {r.reports} {r.reports === 1 ? "report" : "reports"} · {r.reason}
                </div>
              ))
            )}
          </Group>

          <Group title="Feedback">
            {stats.feedback.length === 0 ? (
              <div className="px-4 py-4 text-[14px] text-ink-2">Nothing yet.</div>
            ) : (
              stats.feedback.map((f) => (
                <details key={f.id} className="px-4 py-3.5 [&+&]:border-t [&+&]:border-line">
                  <summary className="cursor-pointer text-[14.5px]">
                    <span className="mr-2 rounded-full bg-paper-2 px-2 py-0.5 text-[11.5px] font-semibold text-ink-2">{f.kind}</span>
                    {f.message.length > 90 ? `${f.message.slice(0, 90)}…` : f.message}
                  </summary>
                  <p className="mt-2 text-[14px] whitespace-pre-wrap">{f.message}</p>
                  <pre className="mt-2 overflow-x-auto rounded-xl bg-paper-2 p-3 text-[11.5px] text-ink-3">{`${f.created_at}\n${f.app_info}`}</pre>
                </details>
              ))
            )}
          </Group>
        </>
      )}
    </div>
  );
}
