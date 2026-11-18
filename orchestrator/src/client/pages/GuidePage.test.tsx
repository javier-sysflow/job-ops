import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AppModeContext } from "../components/layout";
import { openWelcomeGuide } from "../components/WelcomeGuideDialog";
import { GuidePage } from "./GuidePage";

vi.mock("../components/WelcomeGuideDialog", () => ({
  openWelcomeGuide: vi.fn(),
}));

const renderGuide = (appMode: "local" | "hosted" = "local") =>
  render(
    <AppModeContext.Provider value={{ appMode, isPending: false }}>
      <MemoryRouter>
        <GuidePage />
      </MemoryRouter>
    </AppModeContext.Provider>,
  );

describe("GuidePage", () => {
  it("walks through the five steps with links to each screen", () => {
    renderGuide();

    expect(
      screen.getByRole("heading", { level: 1, name: "Guide" }),
    ).toBeInTheDocument();

    const steps = screen.getAllByRole("heading", { level: 3 });
    expect(steps.map((step) => step.textContent)).toEqual([
      "Check your resume",
      "Find jobs",
      "Review the matches",
      "Tailor and apply",
      "Track your progress",
    ]);

    expect(
      screen.getByRole("link", { name: "Open Resume Studio" }),
    ).toHaveAttribute("href", "/design-resume");
    expect(
      screen.getByRole("link", { name: "See discovered jobs" }),
    ).toHaveAttribute("href", "/jobs/discovered");
    expect(
      screen.getByRole("link", { name: "Open the board" }),
    ).toHaveAttribute("href", "/applications/in-progress");
  });

  it("lists the extra tools, hiding the tracking inbox in hosted mode", () => {
    const { unmount } = renderGuide("local");
    const tools = () =>
      within(
        screen
          .getByRole("heading", { name: "More tools" })
          .closest("section") as HTMLElement,
      );
    expect(tools().getByText("Tracking Inbox")).toBeInTheDocument();
    unmount();

    renderGuide("hosted");
    expect(tools().queryByText("Tracking Inbox")).not.toBeInTheDocument();
    expect(tools().getByText("Watchlist")).toBeInTheDocument();
  });

  it("reopens the welcome dialog", () => {
    renderGuide();

    fireEvent.click(screen.getByRole("button", { name: /Show welcome again/ }));

    expect(openWelcomeGuide).toHaveBeenCalledTimes(1);
  });
});
