// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePlayerShortcuts, type PlayerShortcutHandlers } from "./usePlayerShortcuts";

function setup(overrides: Partial<PlayerShortcutHandlers> = {}) {
  const handlers: PlayerShortcutHandlers = {
    playing: false,
    onPlay: vi.fn(),
    onPause: vi.fn(),
    onStepForward: vi.fn(),
    onStepBackward: vi.fn(),
    onReset: vi.fn(),
    onGoToEnd: vi.fn(),
    ...overrides,
  };
  const view = renderHook(() => usePlayerShortcuts(handlers));
  return { handlers, view };
}

const press = (key: string, init: KeyboardEventInit = {}, target: EventTarget = window) =>
  target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...init }));

describe("usePlayerShortcuts", () => {
  it("toggles play and pause on Space", () => {
    const paused = setup({ playing: false });
    press(" ");
    expect(paused.handlers.onPlay).toHaveBeenCalledTimes(1);
    expect(paused.handlers.onPause).not.toHaveBeenCalled();

    const playing = setup({ playing: true });
    press(" ");
    expect(playing.handlers.onPause).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["ArrowRight", "onStepForward"],
    ["ArrowLeft", "onStepBackward"],
    ["Home", "onReset"],
    ["End", "onGoToEnd"],
    ["r", "onReset"],
    ["R", "onReset"],
  ] as const)("maps %s to %s", (key, handler) => {
    const { handlers } = setup();
    press(key);
    expect(handlers[handler]).toHaveBeenCalledTimes(1);
  });

  it("ignores keys while typing in a field", () => {
    const { handlers } = setup();
    const input = document.createElement("input");
    document.body.appendChild(input);

    press(" ", {}, input);
    press("ArrowRight", {}, input);
    expect(handlers.onPlay).not.toHaveBeenCalled();
    expect(handlers.onStepForward).not.toHaveBeenCalled();

    input.remove();
  });

  it("leaves browser and OS chords alone", () => {
    const { handlers } = setup();
    press("r", { ctrlKey: true });
    press("ArrowLeft", { metaKey: true });
    press(" ", { altKey: true });
    expect(handlers.onReset).not.toHaveBeenCalled();
    expect(handlers.onStepBackward).not.toHaveBeenCalled();
    expect(handlers.onPlay).not.toHaveBeenCalled();
  });

  it("stops listening after unmount", () => {
    const { handlers, view } = setup();
    view.unmount();
    press("ArrowRight");
    expect(handlers.onStepForward).not.toHaveBeenCalled();
  });

  it("ignores unrelated keys", () => {
    const { handlers } = setup();
    press("q");
    press("Enter");
    for (const fn of Object.values(handlers)) {
      if (typeof fn === "function") expect(fn).not.toHaveBeenCalled();
    }
  });
});
