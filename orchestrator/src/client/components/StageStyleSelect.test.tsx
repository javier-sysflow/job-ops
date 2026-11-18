import {
  getApplicationStageStyle,
  setApplicationStageStyle,
} from "@client/i18n/stageStyle";
import { createAppSettings } from "@shared/testing/factories.js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../api";
import { StageStyleSelect } from "./StageStyleSelect";

vi.mock("../api", () => ({
  getSettings: vi.fn(),
  updateSettings: vi.fn(),
}));

function renderSelect() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <StageStyleSelect />
    </QueryClientProvider>,
  );
}

const japaneseSettings = () =>
  createAppSettings({
    applicationStageStyle: {
      value: "japanese",
      default: "standard",
      override: "japanese",
    },
  });

describe("StageStyleSelect", () => {
  const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;

  beforeEach(() => {
    vi.clearAllMocks();
    // Radix Select scrolls the active option into view; jsdom lacks it.
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    setApplicationStageStyle("standard");
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: originalScrollIntoView,
    });
  });

  it("switches to the Japanese hiring process and saves the setting", async () => {
    vi.mocked(api.getSettings).mockResolvedValue(createAppSettings());
    vi.mocked(api.updateSettings).mockResolvedValue(japaneseSettings());

    renderSelect();
    const trigger = screen.getByRole("combobox", {
      name: /application stages/i,
    });
    await waitFor(() => expect(trigger).toBeEnabled());
    expect(trigger).toHaveTextContent("Standard");

    fireEvent.click(trigger);
    fireEvent.click(await screen.findByText("Japanese hiring process"));

    await waitFor(() =>
      expect(api.updateSettings).toHaveBeenCalledWith({
        applicationStageStyle: "japanese",
      }),
    );
    await waitFor(() => expect(getApplicationStageStyle()).toBe("japanese"));
  });

  it("clears the override when switching back to the standard names", async () => {
    setApplicationStageStyle("japanese");
    vi.mocked(api.getSettings).mockResolvedValue(japaneseSettings());
    vi.mocked(api.updateSettings).mockResolvedValue(createAppSettings());

    renderSelect();
    const trigger = screen.getByRole("combobox", {
      name: /application stages/i,
    });
    await waitFor(() => expect(trigger).toBeEnabled());
    expect(trigger).toHaveTextContent("Japanese hiring process");

    fireEvent.click(trigger);
    fireEvent.click(await screen.findByText("Standard"));

    await waitFor(() =>
      expect(api.updateSettings).toHaveBeenCalledWith({
        applicationStageStyle: null,
      }),
    );
    await waitFor(() => expect(getApplicationStageStyle()).toBe("standard"));
  });
});
