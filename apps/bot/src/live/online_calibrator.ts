import { EdgeSignal } from "@build-a-bear/core";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname } from "path";

export type CalibratorState = {
  alpha: number;
  beta: number;
  count: number;
};

export class OnlineCalibrator {
  private state: CalibratorState;

  constructor(initial?: Partial<CalibratorState>) {
    this.state = {
      alpha: initial?.alpha ?? 1,
      beta: initial?.beta ?? 1,
      count: initial?.count ?? 0,
    };
  }

  calibrate(signals: EdgeSignal[]): EdgeSignal[] {
    const scale = this.state.alpha / Math.max(this.state.alpha + this.state.beta, 1e-9);
    return signals.map((signal) => ({
      ...signal,
      expectedNetApy: signal.expectedNetApy * (0.6 + scale),
      confidence: Math.max(0.05, Math.min(0.98, signal.confidence * (0.5 + scale))),
    }));
  }

  update(realizedReward: number): void {
    if (realizedReward >= 0) {
      this.state.alpha += 1;
    } else {
      this.state.beta += 1;
    }
    this.state.count += 1;
  }

  snapshot(): CalibratorState {
    return { ...this.state };
  }

  save(path: string): void {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(this.state, null, 2), "utf-8");
  }

  static load(path: string): OnlineCalibrator {
    if (!existsSync(path)) {
      return new OnlineCalibrator();
    }
    const payload = JSON.parse(readFileSync(path, "utf-8")) as CalibratorState;
    return new OnlineCalibrator(payload);
  }
}
