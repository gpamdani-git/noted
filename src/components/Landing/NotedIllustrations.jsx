import React, { useEffect, useRef } from 'react';

/**
 * 3D Projection Math Helper
 * Rotates a 3D point (x, y, z) around X and Y axes and projects to 2D screen space
 */
function project3D(x, y, z, rotX, rotY, width, height, fov = 420) {
  // Rotate around Y axis
  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);
  const x1 = x * cosY - z * sinY;
  const z1 = z * cosY + x * sinY;

  // Rotate around X axis
  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);
  const y2 = y * cosX - z1 * sinX;
  const z2 = z1 * cosX + y * sinX;

  const scale = fov / (fov + z2 + 220);
  return {
    x: width / 2 + x1 * scale,
    y: height / 2 + y2 * scale,
    scale,
    z: z2
  };
}

/**
 * Interactive 3D Canvas Background & Orbital Polyhedron Engine for Hero
 * Renders a 3D wireframe Local Vault Cube, AI Octahedron, and Cloud Node
 * connected by flowing 3D data packets synchronized with activeStageIndex.
 */
export function NotedHero3DCanvas({ activeStage = 0, theme = 'dark', tilt = { x: 0, y: 0 } }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof canvas.getContext !== 'function') return;
    if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent || '')) return;
    let ctx = null;
    try {
      ctx = canvas.getContext('2d');
    } catch {
      return;
    }
    if (!ctx) return;

    let animationFrameId;
    let time = 0;

    // 3D Cube vertices (centered at origin, size 1)
    const cubeVerts = [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
    ];
    const cubeEdges = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7]
    ];

    // 3D Octahedron vertices for AI Node
    const octaVerts = [
      [0, -1.25, 0], [1.05, 0, 0], [0, 0, 1.05],
      [-1.05, 0, 0], [0, 0, -1.05], [0, 1.25, 0]
    ];
    const octaEdges = [
      [0, 1], [0, 2], [0, 3], [0, 4],
      [5, 1], [5, 2], [5, 3], [5, 4],
      [1, 2], [2, 3], [3, 4], [4, 1]
    ];

    const stageColors = [
      '#2383E2', // 0: Write & Slash (Blue)
      '#9B6DD7', // 1: AI Agent (Purple)
      '#10B981', // 2: Local Vault (Emerald)
      '#06B6D4'  // 3: Cloud Sync (Cyan)
    ];

    // 4 horizontally aligned node X positions matching the 4 workflow columns
    const nodeXs = [-275, -92, 92, 275];

    const render = () => {
      time += 0.016;
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const isDark = theme === 'dark';
      const activeIdx = activeStage % 4;
      const activeColor = stageColors[activeIdx];
      const rotX = 0.28 + tilt.y * 0.08;
      const rotY = tilt.x * 0.08;

      const nodeCenters = nodeXs.map((nx) => project3D(nx, 0, 0, rotX, rotY, width, height, 600));

      // Subtle connecting line between the 4 nodes
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(nodeCenters[0].x, nodeCenters[0].y);
      ctx.lineTo(nodeCenters[3].x, nodeCenters[3].y);
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(55, 53, 47, 0.09)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.restore();

      // Single calm flowing pulse along the line
      const pulseT = (time * 0.32) % 1;
      const pulseX = nodeCenters[0].x + (nodeCenters[3].x - nodeCenters[0].x) * pulseT;
      const pulseY = nodeCenters[0].y;
      ctx.save();
      ctx.beginPath();
      ctx.arc(pulseX, pulseY, 3, 0, Math.PI * 2);
      ctx.fillStyle = activeColor;
      ctx.shadowColor = activeColor;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();

      // Active node soft radial halo
      const activeCenter = nodeCenters[activeIdx];
      ctx.save();
      const grad = ctx.createRadialGradient(
        activeCenter.x, activeCenter.y, 2,
        activeCenter.x, activeCenter.y, 34
      );
      grad.addColorStop(0, `${activeColor}28`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(activeCenter.x, activeCenter.y, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      const spin = time * 0.7;
      const cosS = Math.cos(spin);
      const sinS = Math.sin(spin);
      const mutedStroke = isDark ? 'rgba(255, 255, 255, 0.24)' : 'rgba(55, 53, 47, 0.26)';

      // Node 0: 3D Document Block Sheet
      ctx.save();
      ctx.strokeStyle = activeIdx === 0 ? stageColors[0] : mutedStroke;
      ctx.lineWidth = activeIdx === 0 ? 1.8 : 1.15;
      const sheetScale = activeIdx === 0 ? 15 : 13;
      const sheetVerts = [
        [-0.9, -1.15, 0], [0.9, -1.15, 0], [0.9, 1.15, 0], [-0.9, 1.15, 0],
        [-0.5, -0.45, 0.1], [0.5, -0.45, 0.1],
        [-0.5, 0.1, 0.1], [0.5, 0.1, 0.1],
        [-0.5, 0.65, 0.1], [0.2, 0.65, 0.1]
      ].map(([vx, vy, vz]) => {
        const c = Math.cos(Math.sin(time * 0.9) * 0.35);
        const s = Math.sin(Math.sin(time * 0.9) * 0.35);
        return project3D(
          nodeXs[0] + (vx * c - vz * s) * sheetScale,
          vy * sheetScale,
          (vz * c + vx * s) * sheetScale,
          rotX, rotY, width, height, 600
        );
      });
      [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [6, 7], [8, 9]].forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(sheetVerts[a].x, sheetVerts[a].y);
        ctx.lineTo(sheetVerts[b].x, sheetVerts[b].y);
        ctx.stroke();
      });
      ctx.restore();

      // Node 1: 3D AI Octahedron Crystal
      ctx.save();
      ctx.strokeStyle = activeIdx === 1 ? stageColors[1] : mutedStroke;
      ctx.lineWidth = activeIdx === 1 ? 1.8 : 1.15;
      const octaScale = activeIdx === 1 ? 15 : 13;
      const projectedOcta = octaVerts.map(([vx, vy, vz]) => {
        const rx = vx * cosS - vz * sinS;
        const rz = vz * cosS + vx * sinS;
        return project3D(
          nodeXs[1] + rx * octaScale,
          vy * octaScale,
          rz * octaScale,
          rotX, rotY, width, height, 600
        );
      });
      octaEdges.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(projectedOcta[a].x, projectedOcta[a].y);
        ctx.lineTo(projectedOcta[b].x, projectedOcta[b].y);
        ctx.stroke();
      });
      ctx.restore();

      // Node 2: 3D Isometric Vault Cube
      ctx.save();
      ctx.strokeStyle = activeIdx === 2 ? stageColors[2] : mutedStroke;
      ctx.lineWidth = activeIdx === 2 ? 1.8 : 1.15;
      const cubeScale = activeIdx === 2 ? 14 : 12;
      const projectedCube = cubeVerts.map(([vx, vy, vz]) => {
        const rx = vx * cosS - vz * sinS;
        const rz = vz * cosS + vx * sinS;
        return project3D(
          nodeXs[2] + rx * cubeScale,
          vy * cubeScale,
          rz * cubeScale,
          rotX, rotY, width, height, 600
        );
      });
      cubeEdges.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(projectedCube[a].x, projectedCube[a].y);
        ctx.lineTo(projectedCube[b].x, projectedCube[b].y);
        ctx.stroke();
      });
      ctx.restore();

      // Node 3: 3D Cloud Rings
      ctx.save();
      ctx.strokeStyle = activeIdx === 3 ? stageColors[3] : mutedStroke;
      ctx.lineWidth = activeIdx === 3 ? 1.8 : 1.15;
      const ringRadius = activeIdx === 3 ? 16 : 14;
      [-7, 0, 7].forEach((layerY, idx) => {
        ctx.beginPath();
        const segments = 20;
        for (let s = 0; s <= segments; s++) {
          const angle = (s / segments) * Math.PI * 2 + time * 0.5 * (idx % 2 === 0 ? 1 : -1);
          const rx = Math.cos(angle) * ringRadius;
          const rz = Math.sin(angle) * ringRadius;
          const pt = project3D(nodeXs[3] + rx, layerY, rz, rotX, rotY, width, height, 600);
          if (s === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      });
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [activeStage, theme, tilt.x, tilt.y]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="hero-3d-canvas"
      width={840}
      height={92}
      className="noted-hero-3d-canvas"
      aria-hidden="true"
    />
  );
}

/**
 * Custom Bespoke Illustrations for Product Dropdown Menu
 * Replaces generic FileText, Database, Bot, Monitor, Smartphone icons
 */
export function ProductMenuIllustration({ type }) {
  const testId = `product-illust-${type}`;
  switch (type) {
    case 'docs':
      return (
        <svg data-testid={testId} width="28" height="28" viewBox="0 0 28 28" fill="none" className="noted-custom-illust" aria-hidden="true">
          <rect x="3" y="3" width="22" height="22" rx="6" fill="rgba(35, 131, 226, 0.12)" stroke="#2383E2" strokeWidth="1.4" />
          <path d="M8 9.5H15M8 14H20M8 18.5H17" stroke="#2383E2" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="19.5" cy="9.5" r="2" fill="#2383E2" />
        </svg>
      );
    case 'database':
      return (
        <svg data-testid={testId} width="28" height="28" viewBox="0 0 28 28" fill="none" className="noted-custom-illust" aria-hidden="true">
          <rect x="3" y="4" width="22" height="20" rx="5" fill="rgba(16, 185, 129, 0.12)" stroke="#10B981" strokeWidth="1.4" />
          <path d="M3 10.5H25M11 10.5V24" stroke="#10B981" strokeWidth="1.4" />
          <circle cx="7" cy="7.2" r="1.2" fill="#10B981" />
          <rect x="14" y="13.5" width="7" height="2.5" rx="1.2" fill="#10B981" />
          <rect x="14" y="18.5" width="5" height="2.5" rx="1.2" fill="#10B981" opacity="0.6" />
        </svg>
      );
    case 'ai':
      return (
        <svg data-testid={testId} width="28" height="28" viewBox="0 0 28 28" fill="none" className="noted-custom-illust" aria-hidden="true">
          <rect x="3" y="3" width="22" height="22" rx="6" fill="rgba(168, 85, 247, 0.12)" stroke="#A855F7" strokeWidth="1.4" />
          <path d="M14 6.5L15.9 12.1L21.5 14L15.9 15.9L14 21.5L12.1 15.9L6.5 14L12.1 12.1L14 6.5Z" fill="rgba(168, 85, 247, 0.28)" stroke="#A855F7" strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="20" cy="8" r="1.3" fill="#A855F7" />
        </svg>
      );
    case 'desktop':
      return (
        <svg data-testid={testId} width="28" height="28" viewBox="0 0 28 28" fill="none" className="noted-custom-illust" aria-hidden="true">
          <rect x="3" y="5" width="22" height="15" rx="3.5" fill="rgba(56, 189, 248, 0.12)" stroke="#0EA5E9" strokeWidth="1.5" />
          <path d="M10 23.5H18M14 20V23.5" stroke="#0EA5E9" strokeWidth="1.6" strokeLinecap="round" />
          <rect x="7" y="8.5" width="6" height="4" rx="1" fill="#0EA5E9" opacity="0.7" />
          <path d="M15 9.5H21M15 12.5H19" stroke="#0EA5E9" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case 'mobile':
      return (
        <svg data-testid={testId} width="28" height="28" viewBox="0 0 28 28" fill="none" className="noted-custom-illust" aria-hidden="true">
          <rect x="7.5" y="3" width="13" height="22" rx="3.5" fill="rgba(245, 158, 11, 0.12)" stroke="#F59E0B" strokeWidth="1.5" />
          <path d="M12 6H16" stroke="#F59E0B" strokeWidth="1.4" strokeLinecap="round" />
          <rect x="10" y="9.5" width="8" height="5" rx="1.2" fill="#F59E0B" opacity="0.65" />
          <circle cx="14" cy="21.5" r="1.1" fill="#F59E0B" />
        </svg>
      );
    default:
      return null;
  }
}

/**
 * Custom Platform Illustrations (Section 3)
 * Electron (Desktop), Android (Mobile), and Browser (Web) use the user's bespoke Ø brand icon image
 */
export function PlatformCardIllustration({ type }) {
  const testId = `platform-illust-${type}`;
  switch (type) {
    case 'desktop':
      return (
        <svg data-testid={testId} width="42" height="42" viewBox="0 0 42 42" fill="none" className="platform-custom-illust" aria-hidden="true">
          <rect x="5" y="7" width="32" height="22" rx="4" fill="rgba(56, 189, 248, 0.12)" stroke="#0EA5E9" strokeWidth="1.6" />
          <path d="M15 35H27M21 29V35" stroke="#0EA5E9" strokeWidth="1.8" strokeLinecap="round" />
          <rect x="10" y="12" width="9" height="6" rx="1.5" fill="#0EA5E9" opacity="0.8" />
          <path d="M22 13H31M22 17H28" stroke="#0EA5E9" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'mobile':
      return (
        <svg data-testid={testId} width="42" height="42" viewBox="0 0 42 42" fill="none" className="platform-custom-illust" aria-hidden="true">
          <rect x="11" y="5" width="20" height="32" rx="5" fill="rgba(245, 158, 11, 0.12)" stroke="#F59E0B" strokeWidth="1.6" />
          <path d="M18 9H24" stroke="#F59E0B" strokeWidth="1.6" strokeLinecap="round" />
          <rect x="15" y="14" width="12" height="7" rx="2" fill="#F59E0B" opacity="0.75" />
          <circle cx="21" cy="31" r="1.6" fill="#F59E0B" />
        </svg>
      );
    case 'web':
      return (
        <svg data-testid={testId} width="42" height="42" viewBox="0 0 42 42" fill="none" className="platform-custom-illust" aria-hidden="true">
          <rect x="5" y="7" width="32" height="26" rx="5" fill="rgba(16, 185, 129, 0.12)" stroke="#10B981" strokeWidth="1.6" />
          <path d="M5 15H37" stroke="#10B981" strokeWidth="1.4" />
          <circle cx="9.5" cy="11" r="1.5" fill="#10B981" />
          <circle cx="14" cy="11" r="1.5" fill="#10B981" opacity="0.6" />
          <circle cx="18.5" cy="11" r="1.5" fill="#10B981" opacity="0.4" />
          <rect x="10" y="20" width="13" height="4" rx="1.2" fill="#10B981" opacity="0.7" />
          <path d="M10 28H28" stroke="#10B981" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
        </svg>
      );
    case 'vault':
      return (
        <svg data-testid={testId} width="42" height="42" viewBox="0 0 42 42" fill="none" className="platform-custom-illust" aria-hidden="true">
          <path d="M21 5L35 13V29L21 37L7 29V13L21 5Z" fill="rgba(245, 158, 11, 0.12)" stroke="#F59E0B" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M7 13L21 21L35 13M21 21V37" stroke="#F59E0B" strokeWidth="1.4" strokeLinejoin="round" />
          <circle cx="21" cy="21" r="3.2" fill="#F59E0B" />
        </svg>
      );
    default:
      return null;
  }
}

/**
 * Custom Rich Miniature UI Illustrations for the 6 Capabilities Cards (Section 5)
 * Replaces plain emojis with modern visual storytelling diagrams
 */
export function CapabilityCardIllustration({ illustKey }) {
  const testId = `capability-illust-${illustKey}`;
  switch (illustKey) {
    case 'cmdPalette':
      return (
        <svg data-testid={testId} width="100%" height="76" viewBox="0 0 220 76" fill="none" className="capability-svg-illust" aria-hidden="true">
          <rect x="10" y="10" width="200" height="56" rx="10" fill="rgba(35, 131, 226, 0.07)" stroke="rgba(35, 131, 226, 0.28)" strokeWidth="1.2" />
          {/* Keycaps ⌘ + K */}
          <rect x="22" y="21" width="32" height="32" rx="7" fill="rgba(35, 131, 226, 0.16)" stroke="#2383E2" strokeWidth="1.5" />
          <text x="38" y="42" textAnchor="middle" fill="#2383E2" fontSize="15" fontWeight="700" fontFamily="sans-serif">⌘</text>
          <rect x="60" y="21" width="32" height="32" rx="7" fill="rgba(35, 131, 226, 0.16)" stroke="#2383E2" strokeWidth="1.5" />
          <text x="76" y="42" textAnchor="middle" fill="#2383E2" fontSize="14" fontWeight="700" fontFamily="sans-serif">K</text>
          {/* Instant Command Results */}
          <rect x="104" y="22" width="92" height="12" rx="4" fill="#2383E2" opacity="0.85" />
          <rect x="104" y="40" width="68" height="10" rx="4" fill="#2383E2" opacity="0.3" />
          <circle cx="188" cy="45" r="4.5" fill="#10B981" />
        </svg>
      );
    case 'versionHistory':
      return (
        <svg data-testid={testId} width="100%" height="76" viewBox="0 0 220 76" fill="none" className="capability-svg-illust" aria-hidden="true">
          <rect x="10" y="10" width="200" height="56" rx="10" fill="rgba(168, 85, 247, 0.07)" stroke="rgba(168, 85, 247, 0.28)" strokeWidth="1.2" />
          {/* Timeline track */}
          <path d="M30 38H190" stroke="#A855F7" strokeWidth="2" strokeDasharray="4 4" />
          <circle cx="52" cy="38" r="6" fill="#A855F7" opacity="0.4" />
          <circle cx="110" cy="38" r="6" fill="#A855F7" opacity="0.7" />
          <circle cx="168" cy="38" r="8" fill="#A855F7" />
          <circle cx="168" cy="38" r="3.5" fill="#FFFFFF" />
          {/* Snapshot badges */}
          <rect x="36" y="18" width="32" height="10" rx="3" fill="#A855F7" opacity="0.25" />
          <rect x="94" y="18" width="32" height="10" rx="3" fill="#A855F7" opacity="0.45" />
          <rect x="146" y="16" width="44" height="12" rx="4" fill="#A855F7" />
        </svg>
      );
    case 'comments':
      return (
        <svg data-testid={testId} width="100%" height="76" viewBox="0 0 220 76" fill="none" className="capability-svg-illust" aria-hidden="true">
          <rect x="10" y="10" width="200" height="56" rx="10" fill="rgba(245, 158, 11, 0.07)" stroke="rgba(245, 158, 11, 0.28)" strokeWidth="1.2" />
          {/* Highlighted Document Line */}
          <rect x="24" y="24" width="88" height="10" rx="3" fill="rgba(245, 158, 11, 0.35)" stroke="#F59E0B" strokeWidth="1.2" />
          <rect x="24" y="40" width="64" height="8" rx="3" fill="rgba(245, 158, 11, 0.2)" />
          {/* Floating Comment Bubble */}
          <path d="M124 22C124 18.6863 126.686 16 130 16H190C193.314 16 196 18.6863 196 22V46C196 49.3137 193.314 52 190 52H138L128 58V52H130C126.686 52 124 49.3137 124 46V22Z" fill="rgba(245, 158, 11, 0.16)" stroke="#F59E0B" strokeWidth="1.5" />
          <circle cx="136" cy="30" r="4.5" fill="#F59E0B" />
          <rect x="146" y="27" width="38" height="6" rx="3" fill="#F59E0B" />
          <rect x="136" y="39" width="48" height="5" rx="2.5" fill="#F59E0B" opacity="0.55" />
        </svg>
      );
    case 'themeMode':
      return (
        <svg data-testid={testId} width="100%" height="76" viewBox="0 0 220 76" fill="none" className="capability-svg-illust" aria-hidden="true">
          <rect x="10" y="10" width="200" height="56" rx="10" fill="rgba(14, 165, 233, 0.07)" stroke="rgba(14, 165, 233, 0.28)" strokeWidth="1.2" />
          {/* Left Light Half */}
          <path d="M20 18H110V58H20C17.7909 58 16 56.2091 16 54V22C16 19.7909 17.7909 18 20 18Z" fill="rgba(255, 255, 255, 0.85)" stroke="#0EA5E9" strokeWidth="1.2" />
          <circle cx="42" cy="38" r="9" fill="#F59E0B" />
          <rect x="58" y="32" width="38" height="5" rx="2.5" fill="#334155" opacity="0.7" />
          <rect x="58" y="41" width="26" height="4" rx="2" fill="#334155" opacity="0.4" />
          {/* Right Dark Half */}
          <path d="M110 18H200C202.209 18 204 19.7909 204 22V54C204 56.2091 202.209 58 200 58H110V18Z" fill="#0F172A" stroke="#0EA5E9" strokeWidth="1.2" />
          <path d="M138 31C134.5 31 132 34 132 38C132 42.5 135.5 46 140 46C143 46 145.5 44.5 146.5 42C142.5 42.5 139 39.5 139 35.5C139 33.5 139.8 32 141 31C140 31 139 31 138 31Z" fill="#38BDF8" />
          <rect x="154" y="32" width="36" height="5" rx="2.5" fill="#F8FAFC" opacity="0.85" />
          <rect x="154" y="41" width="24" height="4" rx="2" fill="#94A3B8" opacity="0.6" />
        </svg>
      );
    case 'markdownExport':
      return (
        <svg data-testid={testId} width="100%" height="76" viewBox="0 0 220 76" fill="none" className="capability-svg-illust" aria-hidden="true">
          <rect x="10" y="10" width="200" height="56" rx="10" fill="rgba(16, 185, 129, 0.07)" stroke="rgba(16, 185, 129, 0.28)" strokeWidth="1.2" />
          {/* .MD Document Badge */}
          <rect x="28" y="18" width="64" height="40" rx="6" fill="rgba(16, 185, 129, 0.16)" stroke="#10B981" strokeWidth="1.5" />
          <text x="60" y="43" textAnchor="middle" fill="#10B981" fontSize="14" fontWeight="800" fontFamily="monospace">.MD</text>
          {/* Bidirectional Flow Arrows */}
          <path d="M104 33H134M128 28L134 33L128 38" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M134 45H104M110 40L104 45L110 50" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
          {/* Portable Vault Box */}
          <rect x="146" y="20" width="48" height="36" rx="6" fill="rgba(16, 185, 129, 0.22)" stroke="#10B981" strokeWidth="1.5" />
          <path d="M160 34L167 41L180 28" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'databaseKanban':
    default:
      return (
        <svg data-testid={testId} width="100%" height="76" viewBox="0 0 220 76" fill="none" className="capability-svg-illust" aria-hidden="true">
          <rect x="10" y="10" width="200" height="56" rx="10" fill="rgba(236, 72, 153, 0.07)" stroke="rgba(236, 72, 153, 0.28)" strokeWidth="1.2" />
          {/* 3 Kanban Columns */}
          <rect x="22" y="18" width="52" height="40" rx="5" fill="rgba(236, 72, 153, 0.12)" stroke="#EC4899" strokeWidth="1.2" />
          <rect x="28" y="24" width="40" height="10" rx="3" fill="#EC4899" opacity="0.75" />
          <rect x="28" y="38" width="32" height="10" rx="3" fill="#EC4899" opacity="0.35" />

          <rect x="84" y="18" width="52" height="40" rx="5" fill="rgba(35, 131, 226, 0.12)" stroke="#2383E2" strokeWidth="1.2" />
          <rect x="90" y="24" width="40" height="12" rx="3" fill="#2383E2" opacity="0.8" />

          <rect x="146" y="18" width="52" height="40" rx="5" fill="rgba(16, 185, 129, 0.12)" stroke="#10B981" strokeWidth="1.2" />
          <rect x="152" y="24" width="40" height="10" rx="3" fill="#10B981" opacity="0.8" />
          <rect x="152" y="38" width="40" height="10" rx="3" fill="#10B981" opacity="0.5" />
        </svg>
      );
  }
}

/**
 * Custom Architectural Illustrations for Bento Tabs & Philosophy Cards
 */
export function PhilosophyIllustration({ iconType }) {
  const testId = `philosophy-illust-${iconType}`;
  if (iconType === 'zap') {
    return (
      <svg data-testid={testId} width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
        <circle cx="13" cy="13" r="12" fill="rgba(245, 158, 11, 0.15)" stroke="#F59E0B" strokeWidth="1.4" />
        <path d="M14.2 6.5L8.5 14H13L11.8 19.5L17.5 12H13L14.2 6.5Z" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1.1" strokeLinejoin="round" />
      </svg>
    );
  }
  if (iconType === 'shield') {
    return (
      <svg data-testid={testId} width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
        <circle cx="13" cy="13" r="12" fill="rgba(16, 185, 129, 0.15)" stroke="#10B981" strokeWidth="1.4" />
        <path d="M13 6.5L19 9V13.2C19 16.8 16.4 19.8 13 20.8C9.6 19.8 7 16.8 7 13.2V9L13 6.5Z" fill="rgba(16, 185, 129, 0.25)" stroke="#10B981" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M10.5 13.5L12.2 15.2L15.8 11.6" stroke="#10B981" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg data-testid={testId} width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <circle cx="13" cy="13" r="12" fill="rgba(35, 131, 226, 0.15)" stroke="#2383E2" strokeWidth="1.4" />
      <path d="M9.5 17.5H17.2C19 17.5 20.2 16.3 20.2 14.6C20.2 13.1 19.1 11.9 17.6 11.7C17.1 9.4 15.1 8 12.8 8C10.1 8 8.1 10 8.1 12.5C6.8 12.8 6 13.9 6 15.2C6 16.6 7.2 17.5 9.5 17.5Z" fill="rgba(35, 131, 226, 0.25)" stroke="#2383E2" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
