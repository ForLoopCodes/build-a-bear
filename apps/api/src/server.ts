import "dotenv/config";
import cors from "cors";
import express from "express";
import path from "path";
import { loadState, saveState } from "./services/state_store";
import { WalletService } from "./services/wallet_service";
import { runPaperCycleAndReadResult, runTrainingAndReadSummary } from "./services/automation_service";

const app = express();
app.use(cors());
app.use(express.json());

const authorityKeypairPath = process.env.BOT_AUTHORITY_KEYPAIR_PATH ?? process.env.BOT_KEYPAIR_PATH;
const walletService = new WalletService(authorityKeypairPath, process.env.RPC_URL);

app.get("/api/status", async (_, response) => {
  const state = loadState();
  const botBalanceSol = await walletService.getBotBalanceSol();
  response.json({
    botWallet: walletService.getBotAuthorityPublicKey(),
    botBalanceSol,
    state,
  });
});

app.get("/api/deposits/address/:wallet", (request, response) => {
  const { wallet } = request.params;
  if (!wallet) {
    response.status(400).json({ error: "wallet is required" });
    return;
  }

  const depositAddress = walletService.getOrCreateUserDepositAddress(wallet);
  const state = loadState();
  state.userDepositAddressByWallet[wallet] = depositAddress;
  saveState(state);

  response.json({ wallet, depositAddress });
});

app.post("/api/deposits/record", async (request, response) => {
  const { wallet, signature, amountSol } = request.body as {
    wallet: string;
    signature: string;
    amountSol: number;
  };

  if (!wallet || !signature || !Number.isFinite(amountSol) || amountSol <= 0) {
    response.status(400).json({ error: "Invalid deposit payload" });
    return;
  }

  const state = loadState();
  const depositAddress = walletService.getOrCreateUserDepositAddress(wallet);
  const sweep = await walletService.sweepUserDeposit(wallet);

  const creditedAmount = sweep.amountSol > 0 ? sweep.amountSol : amountSol;

  state.depositLedger.unshift({
    wallet,
    signature,
    depositAddress,
    sweepSignature: sweep.signature,
    sweptAmountSol: sweep.amountSol,
    amountSol: creditedAmount,
    timestamp: new Date().toISOString(),
  });
  state.totalDepositsSol += creditedAmount;
  state.claimableByWallet[wallet] = (state.claimableByWallet[wallet] ?? 0) + creditedAmount;
  state.userDepositAddressByWallet[wallet] = depositAddress;
  saveState(state);
  response.json({ ok: true, state });
});

app.post("/api/automation/toggle", (request, response) => {
  const { enabled } = request.body as { enabled: boolean };
  const state = loadState();
  state.isAutomationEnabled = Boolean(enabled);
  saveState(state);
  response.json({ ok: true, enabled: state.isAutomationEnabled });
});

app.post("/api/automation/run-cycle", (_, response) => {
  const cycle = runPaperCycleAndReadResult(true);
  const state = loadState();

  state.lastCycleAt = cycle.timestamp;
  state.pnlSol += cycle.netPnlSol;
  state.pnlUsd += cycle.netPnlUsd;

  const wallets = Object.keys(state.claimableByWallet);
  const totalAllowance = wallets.reduce((sum, wallet) => sum + state.claimableByWallet[wallet], 0);
  if (cycle.netPnlSol > 0 && totalAllowance > 0) {
    wallets.forEach((wallet) => {
      const ratio = state.claimableByWallet[wallet] / totalAllowance;
      state.claimableByWallet[wallet] += cycle.netPnlSol * ratio;
    });
  }

  saveState(state);
  response.json({ ok: true, cycle, state });
});

app.post("/api/training/run", (_, response) => {
  const summary = runTrainingAndReadSummary();
  response.json({ ok: true, summary });
});

app.post("/api/claims/claim", async (request, response) => {
  const { wallet } = request.body as { wallet: string };
  if (!wallet) {
    response.status(400).json({ error: "wallet is required" });
    return;
  }

  const state = loadState();
  const claimable = state.claimableByWallet[wallet] ?? 0;
  if (claimable <= 0) {
    response.status(400).json({ error: "No claimable balance for wallet" });
    return;
  }

  const signature = await walletService.sendClaimSol(wallet, claimable);
  state.claimLedger.unshift({
    wallet,
    signature,
    amountSol: claimable,
    timestamp: new Date().toISOString(),
  });
  state.totalClaimsSol += claimable;
  state.claimableByWallet[wallet] = 0;
  saveState(state);

  response.json({ ok: true, signature, amountSol: claimable, state });
});

app.use(express.static(path.join(process.cwd(), "apps", "web", "dist")));

const port = Number(process.env.API_PORT ?? 8787);
app.listen(port, () => {
  process.stdout.write(`api_server_running_on_${port}\n`);
});
