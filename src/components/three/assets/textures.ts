"use client";

import * as THREE from "three";
import { Rng } from "@/lib/simulation/prng";

/**
 * Procedural texture factory.
 *
 * The project ships no binary art assets: every texture is generated on the
 * client at runtime from a seeded generator. That keeps the payload under a
 * few kilobytes, removes every asset-loading failure mode, and guarantees the
 * city looks identical on every visit.
 */

function createCanvas(size: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");
  return { canvas, ctx };
}

let windowTexture: THREE.CanvasTexture | null = null;

/** Facade with a grid of lit and unlit windows. */
export function getWindowTexture(): THREE.CanvasTexture {
  if (windowTexture) return windowTexture;
  const size = 256;
  const { canvas, ctx } = createCanvas(size);
  const rng = new Rng(0x5eab10);
  const cells = 4;
  const cell = size / cells;

  ctx.fillStyle = "#0a0e1c";
  ctx.fillRect(0, 0, size, size);

  // Faint concrete grain.
  for (let i = 0; i < 2600; i += 1) {
    const x = rng.range(0, size);
    const y = rng.range(0, size);
    const shade = Math.floor(rng.range(6, 18));
    ctx.fillStyle = `rgba(${shade},${shade + 4},${shade + 14},0.55)`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  const warm = ["#ffd9a0", "#ffe9c4", "#cfe6ff", "#fff3d6"];
  for (let row = 0; row < cells; row += 1) {
    for (let col = 0; col < cells; col += 1) {
      const pad = cell * 0.18;
      const x = col * cell + pad;
      const y = row * cell + pad;
      const w = cell - pad * 2;
      const h = cell - pad * 2;
      const lit = rng.bool(0.58);
      if (lit) {
        const colour = rng.pick(warm);
        ctx.fillStyle = colour;
        ctx.globalAlpha = rng.range(0.55, 0.95);
        ctx.fillRect(x, y, w, h);
        ctx.globalAlpha = 1;
        // Soft spill around the window.
        const gradient = ctx.createRadialGradient(
          x + w / 2,
          y + h / 2,
          1,
          x + w / 2,
          y + h / 2,
          w * 1.6,
        );
        gradient.addColorStop(0, "rgba(255,214,150,0.22)");
        gradient.addColorStop(1, "rgba(255,214,150,0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(x - w, y - h, w * 3, h * 3);
      } else {
        ctx.fillStyle = "rgba(24,32,56,0.9)";
        ctx.fillRect(x, y, w, h);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  windowTexture = texture;
  return texture;
}

let asphaltTexture: THREE.CanvasTexture | null = null;

/** Asphalt with lane paint baked into the strip. */
export function getRoadTexture(): THREE.CanvasTexture {
  if (asphaltTexture) return asphaltTexture;
  const size = 256;
  const { canvas, ctx } = createCanvas(size);
  const rng = new Rng(0xa5fa17);

  ctx.fillStyle = "#12151f";
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 5200; i += 1) {
    const x = rng.range(0, size);
    const y = rng.range(0, size);
    const shade = Math.floor(rng.range(16, 34));
    ctx.fillStyle = `rgba(${shade},${shade + 2},${shade + 9},0.6)`;
    ctx.fillRect(x, y, 1.6, 1.6);
  }

  // Faint tyre polish along the wheel tracks.
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "#39405c";
  ctx.fillRect(size * 0.24, 0, size * 0.07, size);
  ctx.fillRect(size * 0.69, 0, size * 0.07, size);
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  asphaltTexture = texture;
  return texture;
}

let groundTexture: THREE.CanvasTexture | null = null;

/** Dark ground plane with subtle plot divisions. */
export function getGroundTexture(): THREE.CanvasTexture {
  if (groundTexture) return groundTexture;
  const size = 512;
  const { canvas, ctx } = createCanvas(size);
  const rng = new Rng(0x91a2d3);

  ctx.fillStyle = "#080b16";
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 9000; i += 1) {
    const x = rng.range(0, size);
    const y = rng.range(0, size);
    const shade = Math.floor(rng.range(10, 22));
    ctx.fillStyle = `rgba(${shade},${shade + 3},${shade + 10},0.5)`;
    ctx.fillRect(x, y, 2, 2);
  }

  ctx.strokeStyle = "rgba(120,150,200,0.07)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 8; i += 1) {
    const p = (size / 8) * i;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  groundTexture = texture;
  return texture;
}

let particleTexture: THREE.CanvasTexture | null = null;

export function getParticleTexture(): THREE.CanvasTexture {
  if (particleTexture) return particleTexture;
  const size = 64;
  const { canvas, ctx } = createCanvas(size);
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.35, "rgba(160,225,255,0.55)");
  gradient.addColorStop(1, "rgba(0,229,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  particleTexture = texture;
  return texture;
}
