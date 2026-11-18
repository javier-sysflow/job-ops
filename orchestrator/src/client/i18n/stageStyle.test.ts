import { afterEach, describe, expect, it, vi } from "vitest";
import { stageEventTitle, stageLabel } from "./labels";
import {
  getApplicationStageStyle,
  STAGE_STYLE_STORAGE_KEY,
  setApplicationStageStyle,
  subscribeApplicationStageStyle,
} from "./stageStyle";

describe("application stage style", () => {
  afterEach(() => {
    setApplicationStageStyle("standard");
  });

  it("uses the standard labels by default", () => {
    expect(getApplicationStageStyle()).toBe("standard");
    expect(stageLabel("technical_interview")).toBe("Technical Interview");
    expect(stageLabel("recruiter_screen")).toBe("Recruiter Screen");
  });

  it("labels stages as the Japanese hiring sequence when selected", () => {
    setApplicationStageStyle("japanese");
    expect(stageLabel("recruiter_screen")).toBe("Document screening");
    expect(stageLabel("assessment")).toBe("Aptitude test");
    expect(stageLabel("hiring_manager_screen")).toBe("1st interview");
    expect(stageLabel("technical_interview")).toBe("2nd interview");
    expect(stageLabel("onsite")).toBe("Final interview");
    expect(stageLabel("offer")).toBe("Offer");
  });

  it("remembers the style on this device and notifies subscribers", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeApplicationStageStyle(listener);

    setApplicationStageStyle("japanese");
    setApplicationStageStyle("japanese");

    expect(listener).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(STAGE_STYLE_STORAGE_KEY)).toBe(
      "japanese",
    );
    unsubscribe();
  });
});

describe("stageEventTitle", () => {
  afterEach(() => {
    setApplicationStageStyle("standard");
  });

  it("shows titles the app wrote as the current stage label", () => {
    setApplicationStageStyle("japanese");
    expect(
      stageEventTitle("Moved to Technical Interview", "technical_interview"),
    ).toBe("2nd interview");
    expect(stageEventTitle("Recruiter Screen", "recruiter_screen")).toBe(
      "Document screening",
    );
    expect(stageEventTitle("onsite", "onsite")).toBe("Final interview");
    expect(stageEventTitle("", "offer")).toBe("Offer");
    expect(stageEventTitle(null, "applied")).toBe("Applied");
  });

  it("keeps titles the user typed", () => {
    setApplicationStageStyle("japanese");
    expect(stageEventTitle("Call with the hiring team", "onsite")).toBe(
      "Call with the hiring team",
    );
  });
});
