import "./style.css";
import { StoryPlayer, formatTime } from "./player.ts";
import {
  stories,
  storyIds,
  styles,
  type StoryId,
  type StoryStyle,
} from "./stories.ts";

function find<T extends HTMLElement>(selector: string): T {
  const target = document.querySelector<T>(selector);
  if (!target) throw new Error(`Missing SCENE element: ${selector}`);
  return target;
}

const form = find<HTMLFormElement>("#studio-form");
const preview = find("#preview");
const scenes = find("#preview-scenes");
const sceneList = find<HTMLOListElement>("#scene-list");
const seek = find<HTMLInputElement>("#seek");
const play = find<HTMLButtonElement>("#play-toggle");
const timecode = find<HTMLOutputElement>("#timecode");
const status = find("#player-status");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const player = new StoryPlayer();
let storyId: StoryId = "app";
let style: StoryStyle = "dynamic";
let frame = 0;
let activeScene = -1;
let visibleSecond = -1;
let previousStatus = player.status;
let visualScenes: HTMLElement[] = [];
let sceneButtons: HTMLButtonElement[] = [];

function announce(text: string) {
  status.textContent = text;
}
function stopFrames() {
  cancelAnimationFrame(frame);
  frame = 0;
}

function svgSketch() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "sketch app-sketch");
  svg.setAttribute("aria-hidden", "true");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttribute("href", "#sketch");
  svg.append(use);
  return svg;
}

function buildScenes() {
  visualScenes = stories[storyId].scenes.map((scene, index) => {
    const layer = document.createElement("div");
    layer.className = `preview-scene ${scene.art ? "illustrated" : "photographic"}`;
    layer.dataset.art = scene.art ?? "";
    if (scene.image) {
      const image = document.createElement("img");
      // Keep public media inside the current site's hosting subdirectory.
      image.src = `${import.meta.env.BASE_URL}assets/${scene.image}`;
      image.alt = scene.alt ?? "";
      image.width = 900;
      image.height = 1350;
      layer.append(image);
    } else {
      const decor = document.createElement("div");
      decor.className = `app-art art-${scene.art}`;
      decor.setAttribute("aria-hidden", "true");
      if (scene.art === "idea") {
        ["Идея", "Сцена", "История"].forEach((text, i) => {
          const note = document.createElement("span");
          note.className = `paper mini-note mini-${i}`;
          note.textContent = text;
          decor.append(note);
        });
      } else if (scene.art === "timeline") {
        for (let i = 0; i < 3; i++) {
          const clip = document.createElement("div");
          clip.className = "art-clip";
          const number = document.createElement("b");
          number.textContent = `0${i + 1}`;
          clip.append(number);
          decor.append(clip);
        }
      } else decor.append(svgSketch());
      layer.append(decor);
    }
    const caption = document.createElement("div");
    caption.className = `preview-caption${scene.art ? " paper" : ""}`;
    scene.caption.forEach((line) => {
      const span = document.createElement("span");
      span.textContent = line;
      caption.append(span);
    });
    layer.append(caption);
    layer.setAttribute("aria-hidden", String(index !== 0));
    return layer;
  });
  scenes.replaceChildren(...visualScenes);
  sceneButtons = stories[storyId].scenes.map((scene, index) => {
    const button = document.createElement("button");
    button.type = "button";
    const n = document.createElement("span");
    n.className = "scene-index";
    n.textContent = `0${index + 1}`;
    const title = document.createElement("span");
    title.className = "scene-title";
    title.textContent = scene.title;
    const time = document.createElement("span");
    time.className = "scene-time";
    time.textContent = `${formatTime(index * 5)}–${formatTime((index + 1) * 5)}`;
    button.append(n, title, time);
    button.setAttribute("aria-label", `Сцена ${index + 1}: ${scene.title}`);
    button.addEventListener("click", () => {
      player.seek(index * 5, performance.now());
      renderClock();
      if (player.status === "playing") startFrames();
      announce(`Сцена ${index + 1}: ${scene.title}`);
    });
    return button;
  });
  sceneList.replaceChildren(
    ...sceneButtons.map((button) => {
      const li = document.createElement("li");
      li.append(button);
      return li;
    }),
  );
  activeScene = -1;
  visibleSecond = -1;
  preview.setAttribute(
    "aria-label",
    `Превью истории ${stories[storyId].title}`,
  );
}

function renderClock(now = performance.now()) {
  const snap = player.snapshot(now);
  preview.style.setProperty("--scene-progress", snap.sceneProgress.toFixed(4));
  seek.style.setProperty("--position", `${snap.progress * 100}%`);
  seek.value = snap.position.toFixed(2);
  if (Math.floor(snap.position) !== visibleSecond) {
    visibleSecond = Math.floor(snap.position);
    timecode.value = `${formatTime(snap.position)} / 00:15`;
    seek.setAttribute(
      "aria-valuetext",
      `${visibleSecond} секунд из 15, сцена ${snap.index + 1}`,
    );
  }
  if (snap.index !== activeScene) {
    activeScene = snap.index;
    visualScenes.forEach((layer, index) => {
      layer.classList.toggle("is-active", index === activeScene);
      layer.setAttribute("aria-hidden", String(index !== activeScene));
    });
    sceneButtons.forEach((button, index) => {
      button.classList.toggle("is-active", index === activeScene);
      if (index === activeScene) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
    find("#preview-scene-number").textContent = `0${activeScene + 1} / 03`;
    if (snap.status === "playing")
      announce(
        `Сцена ${activeScene + 1}: ${stories[storyId].scenes[activeScene].title}`,
      );
  }
  if (preview.dataset.status !== snap.status)
    preview.dataset.status = snap.status;
  const playLabel =
    snap.status === "playing"
      ? "Пауза"
      : snap.status === "paused"
        ? "Продолжить"
        : snap.status === "ended"
          ? "Повторить"
          : "Воспроизвести";
  if (play.firstElementChild!.textContent !== playLabel)
    play.firstElementChild!.textContent = playLabel;
  const symbol =
    snap.status === "playing" ? "Ⅱ" : snap.status === "ended" ? "↺" : "▶";
  const symbolElement = find("#play-symbol");
  if (symbolElement.textContent !== symbol) symbolElement.textContent = symbol;
  if (snap.status === "ended" && previousStatus !== "ended")
    announce(
      "История завершена. Можно посмотреть ещё раз или выбрать другой сценарий.",
    );
  previousStatus = snap.status;
  return snap;
}

function tick(now: number) {
  frame = 0;
  const snap = renderClock(now);
  if (snap.status === "playing") frame = requestAnimationFrame(tick);
}
function startFrames() {
  if (!frame) frame = requestAnimationFrame(tick);
}

function selectStory(nextStory: StoryId, nextStyle: StoryStyle) {
  stopFrames();
  player.reset();
  storyId = nextStory;
  style = nextStyle;
  form.querySelector<HTMLInputElement>(
    `input[name="story"][value="${storyId}"]`,
  )!.checked = true;
  form.querySelector<HTMLInputElement>(
    `input[name="style"][value="${style}"]`,
  )!.checked = true;
  preview.dataset.style = style;
  buildScenes();
  renderClock();
  announce(
    `${stories[storyId].title}. ${style === "dynamic" ? "Динамичный" : "Спокойный"} стиль. Превью готово к запуску.`,
  );
}

form.addEventListener("change", () => {
  const values = new FormData(form);
  const nextStory = values.get("story") as StoryId;
  const nextStyle = values.get("style") as StoryStyle;
  if (storyIds.includes(nextStory) && styles.includes(nextStyle))
    selectStory(nextStory, nextStyle);
});

document.querySelectorAll<HTMLAnchorElement>("[data-open]").forEach((link) => {
  link.addEventListener("click", () => {
    const id = link.dataset.open as StoryId;
    if (storyIds.includes(id)) selectStory(id, style);
  });
});

play.addEventListener("click", () => {
  if (player.status === "playing") {
    player.pause(performance.now());
    stopFrames();
    announce("Превью на паузе.");
  } else {
    player.play(performance.now());
    startFrames();
    announce("Воспроизведение началось.");
  }
  renderClock();
});
find<HTMLButtonElement>("#restart").addEventListener("click", () => {
  stopFrames();
  player.reset();
  renderClock();
  announce("История возвращена к началу.");
});
seek.addEventListener("input", () => {
  player.seek(Number(seek.value), performance.now());
  renderClock();
  if (player.status === "playing") startFrames();
  else stopFrames();
});
document.addEventListener("visibilitychange", () => {
  document.documentElement.classList.toggle("is-hidden", document.hidden);
  if (document.hidden && player.status === "playing") {
    player.pause(performance.now());
    stopFrames();
    renderClock();
    announce("Превью на паузе, пока вкладка скрыта.");
  }
});

selectStory("app", "dynamic");

const panels = [...document.querySelectorAll<HTMLElement>("main > section")];
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) =>
        entry.target.classList.toggle("is-in-view", entry.isIntersecting),
      ),
    { threshold: 0.12 },
  );
  panels.forEach((panel) => observer.observe(panel));
}
if (!reducedMotion.matches && "IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      }),
    { threshold: 0.08 },
  );
  document.querySelectorAll<HTMLElement>(".reveal").forEach((target, index) => {
    target.classList.add("will-reveal");
    target.style.setProperty("--delay", `${Math.min(index % 4, 2) * 65}ms`);
    revealObserver.observe(target);
  });
  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) {
      revealObserver.disconnect();
      document
        .querySelectorAll(".will-reveal")
        .forEach((t) => t.classList.add("is-visible"));
    }
  });
}

const hero = find(".hero");
const precisePointer = matchMedia("(pointer:fine)");
let pointerFrame = 0,
  targetX = 0,
  targetY = 0,
  currentX = 0,
  currentY = 0,
  lastAt = 0;
function smoothPointer(now: number) {
  const amount = 1 - Math.exp(-Math.min(lastAt ? now - lastAt : 16, 50) / 125);
  lastAt = now;
  currentX += (targetX - currentX) * amount;
  currentY += (targetY - currentY) * amount;
  hero.style.setProperty("--drift-x", `${currentX.toFixed(2)}px`);
  hero.style.setProperty("--drift-y", `${currentY.toFixed(2)}px`);
  if (Math.abs(targetX - currentX) + Math.abs(targetY - currentY) > 0.025)
    pointerFrame = requestAnimationFrame(smoothPointer);
  else {
    pointerFrame = 0;
    lastAt = 0;
  }
}
function schedulePointer() {
  if (!pointerFrame) pointerFrame = requestAnimationFrame(smoothPointer);
}
function clearPointer() {
  cancelAnimationFrame(pointerFrame);
  pointerFrame = 0;
  lastAt = 0;
  targetX = targetY = currentX = currentY = 0;
  hero.style.setProperty("--drift-x", "0px");
  hero.style.setProperty("--drift-y", "0px");
}
hero.addEventListener("pointermove", (event: PointerEvent) => {
  if (reducedMotion.matches || !precisePointer.matches) return;
  const box = hero.getBoundingClientRect();
  targetX = ((event.clientX - box.left) / box.width - 0.5) * 10;
  targetY = ((event.clientY - box.top) / box.height - 0.5) * 7;
  schedulePointer();
});
hero.addEventListener("pointerleave", () => {
  targetX = targetY = 0;
  if (!reducedMotion.matches) schedulePointer();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) clearPointer();
});
reducedMotion.addEventListener("change", () => {
  if (reducedMotion.matches) clearPointer();
});
