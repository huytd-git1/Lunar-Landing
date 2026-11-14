import * as THREE from 'three';

/**
 * Generates a high-resolution lunar surface texture map using HTML5 Canvas.
 * Simulates Lunar Reconnaissance Orbiter (LRO) LOLA and WAC polar mosaic
 * with anorthositic highlands, crater ejecta blankets, and permanently shadowed craters.
 */
export function createLunarSurfaceTexture(size: number = 1024): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // 1. Base lunar regolith tone (dark slate gray / anorthosite)
  const grad = ctx.createRadialGradient(size / 2, size / 2, 20, size / 2, size / 2, size / 2);
  grad.addColorStop(0, '#5A606E');
  grad.addColorStop(0.5, '#444955');
  grad.addColorStop(0.85, '#2D323E');
  grad.addColorStop(1, '#1A1D24');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // 2. High-frequency procedural noise (regolith granularity)
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  // Simple pseudo-random hash
  const pseudoRandom = (x: number, y: number) => {
    const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return s - Math.floor(s);
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const noise = (pseudoRandom(x, y) - 0.5) * 32;
      data[idx] = Math.max(0, Math.min(255, data[idx] + noise));
      data[idx + 1] = Math.max(0, Math.min(255, data[idx + 1] + noise));
      data[idx + 2] = Math.max(0, Math.min(255, data[idx + 2] + noise));
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // 3. Draw key South Polar craters onto the texture
  const drawCrater = (
    cx: number,
    cy: number,
    radius: number,
    name: string,
    isPSR: boolean = false
  ) => {
    // Ejecta blanket (brighter ring)
    const ejectaGrad = ctx.createRadialGradient(cx, cy, radius * 0.8, cx, cy, radius * 1.6);
    ejectaGrad.addColorStop(0, 'rgba(180, 190, 205, 0.4)');
    ejectaGrad.addColorStop(0.5, 'rgba(140, 150, 165, 0.2)');
    ejectaGrad.addColorStop(1, 'rgba(60, 65, 75, 0)');
    ctx.fillStyle = ejectaGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Crater Rim (raised bright wall)
    ctx.lineWidth = Math.max(2, radius * 0.15);
    ctx.strokeStyle = '#94A3B8';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Crater Floor (deep shadow / PSR)
    const floorGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.9);
    if (isPSR) {
      floorGrad.addColorStop(0, '#020306'); // Deep permanent shadow
      floorGrad.addColorStop(0.7, '#07090F');
      floorGrad.addColorStop(1, '#1E232D');
    } else {
      floorGrad.addColorStop(0, '#1E232E');
      floorGrad.addColorStop(0.8, '#262C3A');
      floorGrad.addColorStop(1, '#475166');
    }
    ctx.fillStyle = floorGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Label on texture
    ctx.fillStyle = 'rgba(203, 213, 225, 0.7)';
    ctx.font = `${Math.max(10, Math.round(radius * 0.35))}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(name, cx, cy + radius + 14);
  };

  const center = size / 2;
  const scale = size / 260; // scale factor

  // Exact relative pixel locations for polar craters
  drawCrater(center, center, 14 * scale, 'Shackleton', true);
  drawCrater(center + 20 * scale, center - 45 * scale, 18 * scale, 'de Gerlache', true);
  drawCrater(center - 12 * scale, center + 75 * scale, 22 * scale, 'Malapert', false);
  drawCrater(center + 45 * scale, center + 25 * scale, 24 * scale, 'Shoemaker', true);
  drawCrater(center + 65 * scale, center - 15 * scale, 20 * scale, 'Faustini', true);
  drawCrater(center - 35 * scale, center + 30 * scale, 18 * scale, 'Haworth', true);
  drawCrater(center - 55 * scale, center - 60 * scale, 35 * scale, 'Cabeus', true);
  drawCrater(center + 70 * scale, center + 60 * scale, 36 * scale, 'Amundsen', false);

  // Connecting Ridge between Shackleton and de Gerlache
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 4 * scale;
  ctx.beginPath();
  ctx.moveTo(center + 5 * scale, center - 10 * scale);
  ctx.lineTo(center + 15 * scale, center - 35 * scale);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Creates Earth texture for the 3D celestial sphere.
 */
export function createEarthTexture(size: number = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size / 2;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // Ocean blue background
  ctx.fillStyle = '#0F2B59';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Continents (stylized stylized green/tan)
  ctx.fillStyle = '#22543D';
  // North America
  ctx.beginPath();
  ctx.ellipse(size * 0.25, size * 0.18, size * 0.1, size * 0.08, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // South America
  ctx.beginPath();
  ctx.ellipse(size * 0.32, size * 0.35, size * 0.06, size * 0.1, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Eurasia & Africa
  ctx.beginPath();
  ctx.ellipse(size * 0.65, size * 0.2, size * 0.16, size * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(size * 0.6, size * 0.32, size * 0.08, size * 0.1, -0.1, 0, Math.PI * 2);
  ctx.fill();

  // Australia
  ctx.beginPath();
  ctx.ellipse(size * 0.85, size * 0.35, size * 0.05, size * 0.04, 0, 0, Math.PI * 2);
  ctx.fill();

  // Clouds (white swirls)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.ellipse(
      size * (0.1 + i * 0.11),
      size * (0.12 + (i % 3) * 0.1),
      size * 0.08,
      size * 0.03,
      0.3,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}
