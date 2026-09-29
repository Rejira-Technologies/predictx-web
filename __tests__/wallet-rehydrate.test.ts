import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useWallet } from "../hooks/use-wallet";
import * as freighter from "@stellar/freighter-api";

vi.mock("@stellar/freighter-api", () => ({
  isConnected: vi.fn(),
  getAddress: vi.fn(),
  getNetwork: vi.fn(),
  requestAccess: vi.fn(),
}));

describe("Wallet session persistence and rehydration revalidation", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    useWallet.setState({
      isConnected: false,
      isConnecting: false,
      address: "",
      balance: 0,
      balanceStatus: "idle",
      balanceError: null,
      network: "testnet",
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("partialize persists identity only (address and network)", () => {
    useWallet.setState({
      isConnected: true,
      isConnecting: true,
      address: "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H",
      balance: 150.5,
      balanceStatus: "ok",
      balanceError: null,
      network: "mainnet",
    });

    const persistOptions = (useWallet as any).persist?.getOptions?.();
    expect(persistOptions).toBeDefined();

    const partialState = persistOptions.partialize(useWallet.getState());
    expect(partialState).toEqual({
      address: "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H",
      network: "mainnet",
    });

    expect((partialState as any).isConnecting).toBeUndefined();
    expect((partialState as any).isConnected).toBeUndefined();
    expect((partialState as any).balance).toBeUndefined();
  });

  it("resets isConnecting to false upon rehydration", () => {
    const persistOptions = (useWallet as any).persist?.getOptions?.();
    const onRehydrate = persistOptions.onRehydrateStorage();

    const hydratedState = {
      isConnecting: true,
      isConnected: true,
      address: "",
      network: "testnet",
    };

    onRehydrate(hydratedState);
    expect(hydratedState.isConnecting).toBe(false);
    expect(hydratedState.isConnected).toBe(false);
  });

  it("clears session if Freighter is not installed or not connected", async () => {
    vi.mocked(freighter.isConnected).mockResolvedValue({ isConnected: false });

    const testAddress = "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H";
    useWallet.setState({
      address: testAddress,
      isConnected: false,
      isConnecting: false,
    });

    const persistOptions = (useWallet as any).persist?.getOptions?.();
    const onRehydrate = persistOptions.onRehydrateStorage();

    const hydratedState = {
      address: testAddress,
      network: "testnet" as const,
      isConnected: false,
      isConnecting: false,
    };

    onRehydrate(hydratedState);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(useWallet.getState().isConnected).toBe(false);
    expect(useWallet.getState().address).toBe("");
  });

  it("clears session if active Freighter address differs from persisted address", async () => {
    vi.mocked(freighter.isConnected).mockResolvedValue({ isConnected: true });
    vi.mocked(freighter.getAddress).mockResolvedValue({
      address: "GDIFFERENTACCOUNTADDRESS2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONU",
    });

    const savedAddress = "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H";
    useWallet.setState({
      address: savedAddress,
      isConnected: false,
    });

    const persistOptions = (useWallet as any).persist?.getOptions?.();
    const onRehydrate = persistOptions.onRehydrateStorage();

    onRehydrate({
      address: savedAddress,
      network: "testnet",
      isConnected: false,
      isConnecting: false,
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(useWallet.getState().isConnected).toBe(false);
    expect(useWallet.getState().address).toBe("");
  });

  it("clears session if Horizon balance fetch fails with 404 (wrong network or unfunded)", async () => {
    const testAddress = "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H";
    vi.mocked(freighter.isConnected).mockResolvedValue({ isConnected: true });
    vi.mocked(freighter.getAddress).mockResolvedValue({ address: testAddress });
    vi.mocked(freighter.getNetwork).mockResolvedValue({
      network: "TESTNET",
      networkPassphrase: "Test SDF Network ; September 2015",
    });

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({}),
    });

    useWallet.setState({
      address: testAddress,
      isConnected: false,
    });

    const persistOptions = (useWallet as any).persist?.getOptions?.();
    const onRehydrate = persistOptions.onRehydrateStorage();

    onRehydrate({
      address: testAddress,
      network: "testnet",
      isConnected: false,
      isConnecting: false,
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(useWallet.getState().isConnected).toBe(false);
    expect(useWallet.getState().address).toBe("");
  });

  it("re-verifies and restores session when Freighter and Horizon validation succeed", async () => {
    const testAddress = "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H";
    vi.mocked(freighter.isConnected).mockResolvedValue({ isConnected: true });
    vi.mocked(freighter.getAddress).mockResolvedValue({ address: testAddress });
    vi.mocked(freighter.getNetwork).mockResolvedValue({
      network: "TESTNET",
      networkPassphrase: "Test SDF Network ; September 2015",
    });

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        balances: [{ asset_type: "native", balance: "245.7500000" }],
      }),
    });

    useWallet.setState({
      address: testAddress,
      network: "testnet",
      isConnected: false,
      balance: 0,
    });

    const persistOptions = (useWallet as any).persist?.getOptions?.();
    const onRehydrate = persistOptions.onRehydrateStorage();

    onRehydrate({
      address: testAddress,
      network: "testnet",
      isConnected: false,
      isConnecting: false,
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    const state = useWallet.getState();
    expect(state.isConnected).toBe(true);
    expect(state.isConnecting).toBe(false);
    expect(state.address).toBe(testAddress);
    expect(state.balance).toBe(245.75);
    expect(state.balanceStatus).toBe("ok");
    expect(state.balanceError).toBeNull();
  });

  it("clears session if getAddress returns an error", async () => {
    const testAddress = "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H";
    vi.mocked(freighter.isConnected).mockResolvedValue({ isConnected: true });
    vi.mocked(freighter.getAddress).mockResolvedValue({
      address: "",
      error: "User rejected or wallet locked",
    } as any);

    useWallet.setState({
      address: testAddress,
      isConnected: false,
    });

    const persistOptions = (useWallet as any).persist?.getOptions?.();
    const onRehydrate = persistOptions.onRehydrateStorage();

    onRehydrate({
      address: testAddress,
      network: "testnet",
      isConnected: false,
      isConnecting: false,
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(useWallet.getState().isConnected).toBe(false);
    expect(useWallet.getState().address).toBe("");
  });

  it("clears session if getNetwork returns an error", async () => {
    const testAddress = "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H";
    vi.mocked(freighter.isConnected).mockResolvedValue({ isConnected: true });
    vi.mocked(freighter.getAddress).mockResolvedValue({ address: testAddress });
    vi.mocked(freighter.getNetwork).mockResolvedValue({
      network: "",
      networkPassphrase: "",
      error: "Network unavailable",
    } as any);

    useWallet.setState({
      address: testAddress,
      isConnected: false,
    });

    const persistOptions = (useWallet as any).persist?.getOptions?.();
    const onRehydrate = persistOptions.onRehydrateStorage();

    onRehydrate({
      address: testAddress,
      network: "testnet",
      isConnected: false,
      isConnecting: false,
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(useWallet.getState().isConnected).toBe(false);
    expect(useWallet.getState().address).toBe("");
  });

  it("synchronizes network to mainnet if Freighter is on PUBLIC", async () => {
    const testAddress = "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H";
    vi.mocked(freighter.isConnected).mockResolvedValue({ isConnected: true });
    vi.mocked(freighter.getAddress).mockResolvedValue({ address: testAddress });
    vi.mocked(freighter.getNetwork).mockResolvedValue({
      network: "PUBLIC",
      networkPassphrase: "Public Global Stellar Network ; September 2015",
    });

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        balances: [{ asset_type: "native", balance: "99.0000000" }],
      }),
    });

    useWallet.setState({
      address: testAddress,
      network: "testnet",
      isConnected: false,
      balance: 0,
    });

    const persistOptions = (useWallet as any).persist?.getOptions?.();
    const onRehydrate = persistOptions.onRehydrateStorage();

    onRehydrate({
      address: testAddress,
      network: "testnet",
      isConnected: false,
      isConnecting: false,
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    const state = useWallet.getState();
    expect(state.isConnected).toBe(true);
    expect(state.network).toBe("mainnet");
    expect(state.balance).toBe(99);
  });
});
