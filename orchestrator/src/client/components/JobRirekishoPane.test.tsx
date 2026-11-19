import * as api from "@client/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JobRirekishoPane } from "./JobRirekishoPane";

vi.mock("@client/api", () => ({
  getJobRirekisho: vi.fn(),
  saveJobMotivation: vi.fn(),
  generateJobMotivation: vi.fn(),
}));

vi.mock("@/client/lib/private-pdf", () => ({
  downloadJobRirekishoPdf: vi.fn(async () => undefined),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    {children}
  </QueryClientProvider>
);

const STATE = {
  enabled: true,
  motivation: "貴社の事業に惹かれました。",
  motivationSource: "ai" as const,
  updatedAt: "2026-11-19T00:00:00.000Z",
};

describe("JobRirekishoPane", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing without the 職務経歴書 layout", async () => {
    vi.mocked(api.getJobRirekisho).mockResolvedValue({
      ...STATE,
      enabled: false,
    });
    const { container } = render(<JobRirekishoPane jobId="job-1" />, {
      wrapper,
    });
    await waitFor(() =>
      expect(api.getJobRirekisho).toHaveBeenCalledWith("job-1"),
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the job's 志望動機 and saves an edit", async () => {
    vi.mocked(api.getJobRirekisho).mockResolvedValue(STATE);
    vi.mocked(api.saveJobMotivation).mockResolvedValue({
      ...STATE,
      motivation: "書き直しました。",
      motivationSource: "user",
    });
    render(<JobRirekishoPane jobId="job-1" />, { wrapper });

    const textarea = await screen.findByLabelText("志望動機 for this company");
    expect(textarea).toHaveValue("貴社の事業に惹かれました。");
    const save = screen.getByRole("button", { name: /Save/ });
    expect(save).toBeDisabled();

    fireEvent.change(textarea, { target: { value: "書き直しました。" } });
    fireEvent.click(save);

    await waitFor(() =>
      expect(api.saveJobMotivation).toHaveBeenCalledWith(
        "job-1",
        "書き直しました。",
      ),
    );
    expect(await screen.findByText(/Edited by you/)).toBeInTheDocument();
  });

  it("asks before the AI replaces a 志望動機 the user edited", async () => {
    vi.mocked(api.getJobRirekisho).mockResolvedValue({
      ...STATE,
      motivationSource: "user",
    });
    vi.mocked(api.generateJobMotivation).mockResolvedValue(STATE);
    render(<JobRirekishoPane jobId="job-1" />, { wrapper });

    fireEvent.click(
      await screen.findByRole("button", { name: /Rewrite with AI/ }),
    );
    expect(api.generateJobMotivation).not.toHaveBeenCalled();

    fireEvent.click(await screen.findByRole("button", { name: "Rewrite" }));
    await waitFor(() =>
      expect(api.generateJobMotivation).toHaveBeenCalledWith("job-1"),
    );
  });

  it("writes a first draft without asking", async () => {
    vi.mocked(api.getJobRirekisho).mockResolvedValue({
      ...STATE,
      motivation: "",
      motivationSource: null,
    });
    vi.mocked(api.generateJobMotivation).mockResolvedValue(STATE);
    render(<JobRirekishoPane jobId="job-1" />, { wrapper });

    expect(
      await screen.findByText(/No 志望動機 for this company yet/),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Write with AI/ }));
    await waitFor(() =>
      expect(api.generateJobMotivation).toHaveBeenCalledWith("job-1"),
    );
  });
});
