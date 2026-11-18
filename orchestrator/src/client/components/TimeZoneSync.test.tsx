import { createAppSettings } from "@shared/testing/factories.js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../api";
import { TimeZoneSync } from "./TimeZoneSync";

vi.mock("../api", () => ({
  getSettings: vi.fn(),
  updateSettings: vi.fn(),
}));

function renderWithClient() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <TimeZoneSync />
    </QueryClientProvider>,
  );
}

describe("TimeZoneSync", () => {
  const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.updateSettings).mockResolvedValue(createAppSettings());
  });

  it("saves the browser time zone when it differs from the stored one", async () => {
    vi.mocked(api.getSettings).mockResolvedValue(
      createAppSettings({ timeZone: null }),
    );

    renderWithClient();

    await waitFor(() =>
      expect(api.updateSettings).toHaveBeenCalledWith({
        timeZone: browserTimeZone,
      }),
    );
  });

  it("does nothing when the stored time zone already matches", async () => {
    vi.mocked(api.getSettings).mockResolvedValue(
      createAppSettings({ timeZone: browserTimeZone }),
    );

    renderWithClient();

    await waitFor(() => expect(api.getSettings).toHaveBeenCalled());
    expect(api.updateSettings).not.toHaveBeenCalled();
  });
});
