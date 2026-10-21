"use client";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRotation: number;
  size: number;
  color: string;
  shape: "rect" | "circle";
  life: number;
}

const COLORS = ["#0f6b3f", "#4ade80", "#facc15", "#fb923c", "#f472b6", "#60a5fa"];

/**
 * Fires a one-off confetti burst from the given screen coordinates.
 * Creates a temporary full-viewport canvas, animates particles
 * falling/fading out, then removes itself — no persistent DOM, no
 * dependencies, safe to call repeatedly. Used only for the vote button's
 * emoji-pick confirmation.
 */
export function fireConfetti(
  originX?: number,
  originY?: number,
  options?: { count?: number; speed?: number; spreadUp?: boolean }
) {
  if (typeof window === "undefined") return;

  const count = options?.count ?? 60;
  const speedMultiplier = options?.speed ?? 1;

  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }
  ctx.scale(dpr, dpr);

  const cx = originX ?? window.innerWidth / 2;
  const cy = originY ?? window.innerHeight / 3;

  const particles: Particle[] = Array.from({ length: count }, () => {
    const angle = options?.spreadUp
      ? -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI * 0.9) // mostly upward cone
      : Math.random() * Math.PI * 2;
    const speed = (4 + Math.random() * 9) * speedMultiplier;
    return {
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      rotation: Math.random() * 360,
      vRotation: (Math.random() - 0.5) * 20,
      size: 5 + Math.random() * 5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: Math.random() > 0.5 ? "rect" : "circle",
      life: 1,
    };
  });

  const gravity = 0.22;
  const drag = 0.985;
  let running = true;

  function tick() {
    if (!running || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let anyAlive = false;
    for (const p of particles) {
      if (p.life <= 0) continue;
      anyAlive = true;

      p.vx *= drag;
      p.vy = p.vy * drag + gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vRotation;
      p.life -= 0.014;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.fillStyle = p.color;
      if (p.shape === "rect") {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (anyAlive) {
      requestAnimationFrame(tick);
    } else {
      running = false;
      canvas.remove();
    }
  }

  requestAnimationFrame(tick);

  setTimeout(() => {
    running = false;
    canvas.remove();
  }, 4000);
}
