import { useEffect } from "react";

export interface PlayerShortcutHandlers {
  playing: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onReset: () => void;
  onGoToEnd: () => void;
}

export const SHORTCUT_HINTS: [string, string][] = [
  ["Space", "Play / pause"],
  ["← →", "Step back / forward"],
  ["Home / End", "Jump to start / end"],
  ["R", "Restart"],
];

/**
 * Keyboard transport for the step player.
 *
 * A media-player UI is exactly where a keyboard is expected, and stepping
 * through an algorithm one frame at a time is far nicer with arrow keys than
 * with repeated clicks.
 */
export function usePlayerShortcuts({
  playing,
  onPlay,
  onPause,
  onStepForward,
  onStepBackward,
  onReset,
  onGoToEnd,
}: PlayerShortcutHandlers) {
  useEffect(() => {
    function handler(event: KeyboardEvent) {
      // Never steal keys from a field the user is typing in, and leave browser
      // and OS chords (Ctrl+R, Cmd+←) alone.
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      ) {
        return;
      }

      switch (event.key) {
        case " ":
        case "Spacebar":
          event.preventDefault(); // stop the page scrolling
          if (playing) onPause();
          else onPlay();
          return;
        case "ArrowRight":
          event.preventDefault();
          onStepForward();
          return;
        case "ArrowLeft":
          event.preventDefault();
          onStepBackward();
          return;
        case "Home":
          event.preventDefault();
          onReset();
          return;
        case "End":
          event.preventDefault();
          onGoToEnd();
          return;
        case "r":
        case "R":
          onReset();
          return;
        default:
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [playing, onPlay, onPause, onStepForward, onStepBackward, onReset, onGoToEnd]);
}
