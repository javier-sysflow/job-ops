import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  openWelcomeGuide,
  WELCOME_GUIDE_SEEN_KEY,
  WelcomeGuideDialog,
} from "./WelcomeGuideDialog";

const onboarding = vi.hoisted(() => ({ complete: true }));

vi.mock("@client/hooks/useOnboardingStatus", () => ({
  useOnboardingStatus: () => ({ complete: onboarding.complete }),
}));

const renderDialog = (enabled = true) =>
  render(
    <MemoryRouter initialEntries={["/overview"]}>
      <WelcomeGuideDialog enabled={enabled} />
      <Routes>
        <Route path="/overview" element={<div>overview page</div>} />
        <Route path="/guide" element={<div>guide page</div>} />
        <Route path="/jobs/ready" element={<div>jobs page</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe("WelcomeGuideDialog", () => {
  beforeEach(() => {
    localStorage.clear();
    onboarding.complete = true;
  });

  it("opens once after onboarding and remembers it was seen", () => {
    const { unmount } = renderDialog();

    expect(
      screen.getByRole("dialog", { name: "Welcome to JobOps" }),
    ).toBeInTheDocument();
    expect(localStorage.getItem(WELCOME_GUIDE_SEEN_KEY)).toBe("1");
    unmount();

    renderDialog();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("waits until onboarding is complete", () => {
    onboarding.complete = false;
    renderDialog();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(localStorage.getItem(WELCOME_GUIDE_SEEN_KEY)).toBeNull();
  });

  it("stays closed on screens without the app shell", () => {
    renderDialog(false);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("can be reopened and links to the guide and the jobs page", () => {
    localStorage.setItem(WELCOME_GUIDE_SEEN_KEY, "1");
    renderDialog();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    act(() => openWelcomeGuide());
    fireEvent.click(
      screen.getByRole("button", { name: "Read the full guide" }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("guide page")).toBeInTheDocument();

    act(() => openWelcomeGuide());
    fireEvent.click(screen.getByRole("button", { name: /Start finding jobs/ }));
    expect(screen.getByText("jobs page")).toBeInTheDocument();
  });
});
