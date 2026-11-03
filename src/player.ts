export const STORY_DURATION = 15;
export const SCENE_DURATION = 5;
export type PlayerStatus = "idle" | "playing" | "paused" | "ended";

/** All playback is derived from a monotonic clock, never the frame count. */
export class StoryPlayer {
  private base = 0;
  private startedAt = 0;
  status: PlayerStatus = "idle";

  play(now: number) {
    if (this.status === "playing") return;
    if (this.status === "ended") this.base = 0;
    this.startedAt = now;
    this.status = "playing";
  }

  pause(now: number) {
    if (this.status !== "playing") return;
    const snapshot = this.snapshot(now);
    this.base = snapshot.position;
    this.status = snapshot.status === "ended" ? "ended" : "paused";
  }

  reset() {
    this.base = 0;
    this.startedAt = 0;
    this.status = "idle";
  }

  seek(seconds: number, now: number) {
    this.base = Math.min(
      STORY_DURATION,
      Math.max(0, Number.isFinite(seconds) ? seconds : 0),
    );
    this.startedAt = now;
    if (this.base === STORY_DURATION) this.status = "ended";
    else if (
      this.status === "ended" ||
      (this.status === "idle" && this.base > 0)
    )
      this.status = "paused";
  }

  snapshot(now: number) {
    const position =
      this.status === "playing"
        ? Math.min(
            STORY_DURATION,
            this.base + Math.max(0, now - this.startedAt) / 1000,
          )
        : this.base;
    if (position >= STORY_DURATION && this.status === "playing") {
      this.base = STORY_DURATION;
      this.status = "ended";
    }
    const index = Math.min(2, Math.floor(position / SCENE_DURATION));
    return {
      position,
      status: this.status,
      index,
      sceneProgress: Math.min(
        1,
        (position - index * SCENE_DURATION) / SCENE_DURATION,
      ),
      progress: position / STORY_DURATION,
    };
  }
}

export function formatTime(seconds: number) {
  return `00:${Math.min(STORY_DURATION, Math.max(0, Math.floor(seconds)))
    .toString()
    .padStart(2, "0")}`;
}
