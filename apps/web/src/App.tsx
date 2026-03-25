import { useCallback, useEffect, useMemo, useState } from "react";
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "./components/ui/button";
import { Card, CardDescription, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";

type ApiStatus = {
  botWallet: string;
  botBalanceSol: number;
  state: {
    isAutomationEnabled: boolean;
    lastCycleAt: string | null;
    pnlSol: number;
    pnlUsd: number;
    totalDepositsSol: number;
    totalClaimsSol: number;
    claimableByWallet: Record<string, number>;
    depositLedger: Array<{ wallet: string; signature: string; amountSol: number; timestamp: string }>;
    claimLedger: Array<{ wallet: string; signature: string; amountSol: number; timestamp: string }>;
  };
};

const API_BASE = "http://localhost:8787/api";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { "content-type": "application/json" },
    ...init,
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

function formatNumber(value: number, digits = 4): string {
  return Number.isFinite(value) ? value.toFixed(digits) : "0.0000";
}

function short(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export default function App(): JSX.Element {
  const wallet = useWallet();
  const [status, setStatus] = useState<ApiStatus | null>(null);
  const [depositAmount, setDepositAmount] = useState("0.1");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>("");

  const connection = useMemo(() => new Connection("https://api.devnet.solana.com", "confirmed"), []);

  const loadStatus = useCallback(async () => {
    const next = await fetchJson<ApiStatus>(`${API_BASE}/status`);
    setStatus(next);
  }, []);

  useEffect(() => {
    loadStatus().catch(() => undefined);
    const timer = setInterval(() => {
      loadStatus().catch(() => undefined);
    }, 7000);
    return () => clearInterval(timer);
  }, [loadStatus]);

  const claimable = wallet.publicKey && status
    ? status.state.claimableByWallet[wallet.publicKey.toBase58()] ?? 0
    : 0;

  async function handleDeposit(): Promise<void> {
    if (!wallet.publicKey || !wallet.sendTransaction || !status) {
      setMessage("Connect wallet first");
      return;
    }

    const amount = Number(depositAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage("Enter a valid SOL amount");
      return;
    }

    setBusy(true);
    setMessage("Sending SOL deposit transaction...");
    try {
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: new PublicKey(status.botWallet),
          lamports: Math.round(amount * LAMPORTS_PER_SOL),
        }),
      );
      const signature = await wallet.sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, "confirmed");

      await fetchJson(`${API_BASE}/deposits/record`, {
        method: "POST",
        body: JSON.stringify({
          wallet: wallet.publicKey.toBase58(),
          signature,
          amountSol: amount,
        }),
      });

      setMessage(`Deposit recorded: ${signature}`);
      await loadStatus();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function handleRunCycle(): Promise<void> {
    setBusy(true);
    setMessage("Running strategy cycle...");
    try {
      await fetchJson(`${API_BASE}/automation/run-cycle`, { method: "POST" });
      await loadStatus();
      setMessage("Cycle complete");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function handleTrainingRun(): Promise<void> {
    setBusy(true);
    setMessage("Running ML production training...");
    try {
      const result = await fetchJson<{ summary: { edgeRmse: number; rlBestReward: number } }>(
        `${API_BASE}/training/run`,
        { method: "POST" },
      );
      setMessage(`Training complete. RMSE=${result.summary.edgeRmse.toFixed(4)} Reward=${result.summary.rlBestReward.toFixed(4)}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleAutomation(enabled: boolean): Promise<void> {
    setBusy(true);
    try {
      await fetchJson(`${API_BASE}/automation/toggle`, {
        method: "POST",
        body: JSON.stringify({ enabled }),
      });
      await loadStatus();
      setMessage(enabled ? "Automation enabled" : "Automation paused");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function handleClaim(): Promise<void> {
    if (!wallet.publicKey) {
      setMessage("Connect wallet first");
      return;
    }
    setBusy(true);
    try {
      const result = await fetchJson<{ signature: string; amountSol: number }>(`${API_BASE}/claims/claim`, {
        method: "POST",
        body: JSON.stringify({ wallet: wallet.publicKey.toBase58() }),
      });
      await loadStatus();
      setMessage(`Claim sent: ${result.amountSol.toFixed(4)} SOL (${result.signature})`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <div className="toolbar">
        <div>
          <h1 style={{ margin: 0, fontSize: "1.2rem", letterSpacing: "0.03em" }}>Drift Bot Control Plane</h1>
          <p style={{ margin: "0.35rem 0 0", color: "#a1a1aa", fontSize: "0.85rem" }}>
            Minimal control dashboard for wallet deposits, bot automation, and claimable outcomes.
          </p>
        </div>
        <WalletMultiButton />
      </div>

      <div className="grid grid-3">
        <Card>
          <CardTitle>Bot Wallet</CardTitle>
          <CardDescription>Funding destination for deposits and claim source.</CardDescription>
          <div className="metric-value mono">{status ? short(status.botWallet) : "--"}</div>
          <div className="tag" style={{ marginTop: "0.55rem" }}>Balance {status ? formatNumber(status.botBalanceSol, 3) : "0.000"} SOL</div>
        </Card>
        <Card>
          <CardTitle>Live PnL</CardTitle>
          <CardDescription>Aggregated bot paper strategy PnL from cycle history.</CardDescription>
          <div className={`metric-value ${(status?.state.pnlUsd ?? 0) >= 0 ? "positive" : "negative"}`}>
            ${status ? formatNumber(status.state.pnlUsd, 2) : "0.00"}
          </div>
          <div className={`tag ${(status?.state.pnlSol ?? 0) >= 0 ? "positive" : "negative"}`} style={{ marginTop: "0.55rem" }}>
            {status ? formatNumber(status.state.pnlSol, 4) : "0.0000"} SOL
          </div>
        </Card>
        <Card>
          <CardTitle>Your Claimable</CardTitle>
          <CardDescription>Allowance generated from your funding share and strategy results.</CardDescription>
          <div className="metric-value">{formatNumber(claimable, 4)} SOL</div>
          <Button className="w-full" style={{ marginTop: "0.8rem" }} onClick={handleClaim} disabled={busy || claimable <= 0}>
            Claim Payout
          </Button>
        </Card>
      </div>

      <div className="grid grid-2" style={{ marginTop: "1rem" }}>
        <Card>
          <CardTitle>Deposit SOL To Bot</CardTitle>
          <CardDescription>Send SOL from connected wallet to bot account and register funding ledger.</CardDescription>
          <div style={{ marginTop: "0.8rem" }}>
            <Label htmlFor="deposit">Amount (SOL)</Label>
            <Input
              id="deposit"
              value={depositAmount}
              onChange={(event) => setDepositAmount(event.target.value)}
              placeholder="0.10"
              disabled={busy}
            />
          </div>
          <Button className="w-full" style={{ marginTop: "0.8rem" }} onClick={handleDeposit} disabled={busy}>
            Deposit To Bot Wallet
          </Button>
        </Card>

        <Card>
          <CardTitle>Automation Controls</CardTitle>
          <CardDescription>Control trade cycle execution using trained strategy and RL policy.</CardDescription>
          <div style={{ display: "flex", gap: "0.55rem", marginTop: "0.8rem", flexWrap: "wrap" }}>
            <Button variant="default" onClick={handleRunCycle} disabled={busy}>Run Strategy Cycle</Button>
            <Button variant="ghost" onClick={handleTrainingRun} disabled={busy}>Run ML Training</Button>
            <Button
              variant="outline"
              onClick={() => handleToggleAutomation(!(status?.state.isAutomationEnabled ?? false))}
              disabled={busy}
            >
              {status?.state.isAutomationEnabled ? "Pause Automation" : "Enable Automation"}
            </Button>
          </div>
          <div className="tag" style={{ marginTop: "0.8rem" }}>
            Automation {status?.state.isAutomationEnabled ? "ON" : "OFF"}
          </div>
          <div className="tag" style={{ marginTop: "0.45rem" }}>
            Last Cycle {status?.state.lastCycleAt ?? "--"}
          </div>
        </Card>
      </div>

      <div className="grid grid-2" style={{ marginTop: "1rem" }}>
        <Card>
          <CardTitle>Deposits Ledger</CardTitle>
          <CardDescription>Recorded wallet funding transfers to bot account.</CardDescription>
          <div className="ledger" style={{ marginTop: "0.7rem" }}>
            <table>
              <thead>
                <tr>
                  <th>Wallet</th>
                  <th>Amount</th>
                  <th>Signature</th>
                </tr>
              </thead>
              <tbody>
                {(status?.state.depositLedger ?? []).slice(0, 8).map((row) => (
                  <tr key={row.signature}>
                    <td className="mono">{short(row.wallet)}</td>
                    <td>{formatNumber(row.amountSol, 4)} SOL</td>
                    <td className="mono">{short(row.signature)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardTitle>Claims Ledger</CardTitle>
          <CardDescription>Payout history sent from bot wallet to users.</CardDescription>
          <div className="ledger" style={{ marginTop: "0.7rem" }}>
            <table>
              <thead>
                <tr>
                  <th>Wallet</th>
                  <th>Amount</th>
                  <th>Signature</th>
                </tr>
              </thead>
              <tbody>
                {(status?.state.claimLedger ?? []).slice(0, 8).map((row) => (
                  <tr key={row.signature}>
                    <td className="mono">{short(row.wallet)}</td>
                    <td>{formatNumber(row.amountSol, 4)} SOL</td>
                    <td className="mono">{short(row.signature)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <p style={{ marginTop: "1rem", fontSize: "0.82rem", color: "#a1a1aa" }}>
        {message}
      </p>
    </div>
  );
}
