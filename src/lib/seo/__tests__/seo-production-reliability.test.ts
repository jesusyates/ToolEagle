import {
  averageRetriesInSnapshots,
  computeProductionReliability,
  decideWatchdogRecovery,
  detectIncompleteOrchestratorCycle,
  detectMissedRuns,
  detectStaleReport,
  type DailyReportSnapshot
} from "../seo-production-reliability";

describe("V155 seo-production-reliability", () => {
  test("detectMissedRuns flags days without history (UTC past days only)", () => {
    const now = new Date("2026-03-28T15:00:00.000Z");
    const snapshots: DailyReportSnapshot[] = [{ date: "2026-03-26", zh_status: "completed", en_status: "completed" }];
    const { missedDates, missed_run_count } = detectMissedRuns(snapshots, now, 3);
    expect(missedDates).toContain("2026-03-27");
    expect(missedDates).toContain("2026-03-25");
    expect(missed_run_count).toBe(2);
  });

  test("detectStaleReport uses updatedAt when fresh", () => {
    const nowMs = 1_700_000_000_000;
    const r = detectStaleReport(
      { updatedAt: new Date(nowMs - 60_000).toISOString() },
      null,
      nowMs,
      3600_000
    );
    expect(r.stale).toBe(false);
    expect(r.source).toBe("updatedAt");
  });

  test("detectStaleReport marks stale when updatedAt too old", () => {
    const nowMs = 1_700_000_000_000;
    const r = detectStaleReport(
      { updatedAt: new Date(nowMs - 50 * 3600_000).toISOString() },
      null,
      nowMs,
      40 * 3600_000
    );
    expect(r.stale).toBe(true);
  });

  test("computeProductionReliability applies penalties and clamps 0–100", () => {
    const hi = computeProductionReliability({
      missed_run_count: 4,
      stale_report_count: 2,
      partial_run_count: 5,
      safe_mode_days: 5,
      recent_days: 14,
      avg_retries: 5,
      long_running: true
    });
    expect(hi.reliability_score).toBeGreaterThanOrEqual(0);
    expect(hi.reliability_score).toBeLessThan(50);

    const clean = computeProductionReliability({
      missed_run_count: 0,
      stale_report_count: 0,
      partial_run_count: 0,
      safe_mode_days: 0,
      recent_days: 7,
      avg_retries: 0,
      long_running: false
    });
    expect(clean.reliability_score).toBe(100);
  });

  test("decideWatchdogRecovery caps and degrades", () => {
    const ok = decideWatchdogRecovery({
      missedOrStale: true,
      recoveryEnabled: true,
      triggersToday: 0,
      maxTriggersPerDay: 2,
      degradedReportingOnly: false
    });
    expect(ok.shouldTrigger).toBe(true);
    expect(ok.capReached).toBe(false);

    const capped = decideWatchdogRecovery({
      missedOrStale: true,
      recoveryEnabled: true,
      triggersToday: 2,
      maxTriggersPerDay: 2,
      degradedReportingOnly: false
    });
    expect(capped.shouldTrigger).toBe(false);
    expect(capped.capReached).toBe(true);

    const degraded = decideWatchdogRecovery({
      missedOrStale: true,
      recoveryEnabled: true,
      triggersToday: 0,
      maxTriggersPerDay: 2,
      degradedReportingOnly: true
    });
    expect(degraded.shouldTrigger).toBe(false);
    expect(degraded.capReached).toBe(true);
  });

  test("detectIncompleteOrchestratorCycle when started long ago without completion", () => {
    const nowMs = 1_700_000_000_000;
    const start = new Date(nowMs - 5 * 3600_000).toISOString();
    expect(
      detectIncompleteOrchestratorCycle(
        { zh_status: "idle", en_status: "idle", last_run_at: null, last_success_at: null, orchestrator_cycle_started_at: start, last_orchestrator_completed_at: null },
        nowMs,
        4 * 3600_000
      )
    ).toBe(true);
  });

  test("averageRetriesInSnapshots", () => {
    const snaps: DailyReportSnapshot[] = [
      { date: "a", zh_status: "c", en_status: "c", retries_count: 2 },
      { date: "b", zh_status: "c", en_status: "c", retries_count: 0 }
    ];
    expect(averageRetriesInSnapshots(snaps)).toBe(1);
  });
});
