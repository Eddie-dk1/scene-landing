import assert from "node:assert/strict";
import test from "node:test";
import { StoryPlayer, formatTime } from "../src/player.ts";
import { stories, storyIds } from "../src/stories.ts";

test("each story has exactly three complete scenes", () => {
  for (const id of storyIds) {
    assert.equal(stories[id].scenes.length, 3);
    for (const scene of stories[id].scenes) {
      assert.ok(scene.title && scene.caption.length);
      assert.ok(scene.image || scene.art);
      if (scene.image) assert.ok(scene.alt);
    }
  }
});

test("starts at zero without playback", () => {
  assert.deepEqual(new StoryPlayer().snapshot(5000), {
    position: 0,
    status: "idle",
    index: 0,
    sceneProgress: 0,
    progress: 0,
  });
});

test("scene boundaries and a delayed frame use actual elapsed time", () => {
  const player = new StoryPlayer();
  player.play(1000);
  assert.equal(player.snapshot(5999).index, 0);
  assert.equal(player.snapshot(6000).index, 1);
  assert.equal(player.snapshot(11000).index, 2);
  assert.equal(player.snapshot(13500).position, 12.5);
});

test("pause and resume preserve fractional time and exclude a pause", () => {
  const player = new StoryPlayer();
  player.play(1000);
  player.pause(2540);
  assert.equal(player.snapshot(20000).position, 1.54);
  player.play(20000);
  assert.equal(player.snapshot(21000).position, 2.54);
});

test("seeking during playback preserves playback and resets its origin", () => {
  const player = new StoryPlayer();
  player.play(1000);
  player.seek(8, 2000);
  assert.equal(player.snapshot(2500).position, 8.5);
  assert.equal(player.status, "playing");
});

test("seeking from idle does not start playback", () => {
  const player = new StoryPlayer();
  player.seek(7, 1000);
  assert.equal(player.snapshot(5000).position, 7);
  assert.equal(player.status, "paused");
});

test("end is clamped to fifteen seconds and replay starts from zero", () => {
  const player = new StoryPlayer();
  player.play(0);
  assert.equal(player.snapshot(20000).position, 15);
  assert.equal(player.status, "ended");
  assert.equal(player.snapshot(30000).index, 2);
  player.play(30000);
  assert.equal(player.snapshot(30000).position, 0);
});

test("seeking away from end allows paused playback", () => {
  const player = new StoryPlayer();
  player.seek(15, 0);
  player.seek(5, 1000);
  assert.equal(player.status, "paused");
  player.play(2000);
  assert.equal(player.snapshot(3000).position, 6);
});

test("seek clamps out-of-range and invalid values", () => {
  const player = new StoryPlayer();
  player.seek(-5, 0);
  assert.equal(player.snapshot(0).position, 0);
  player.seek(40, 0);
  assert.equal(player.snapshot(0).position, 15);
  player.seek(NaN, 0);
  assert.equal(player.snapshot(0).position, 0);
});

test("reset stops and clears progress", () => {
  const player = new StoryPlayer();
  player.play(0);
  player.snapshot(7000);
  player.reset();
  assert.equal(player.snapshot(20000).position, 0);
  assert.equal(player.status, "idle");
});

test("repeated play never changes the origin of a playing clock", () => {
  const player = new StoryPlayer();
  player.play(0);
  player.play(4000);
  assert.equal(player.snapshot(5000).position, 5);
});

test("time labels are bounded and tabular", () => {
  assert.equal(formatTime(4.99), "00:04");
  assert.equal(formatTime(15), "00:15");
  assert.equal(formatTime(-1), "00:00");
});
