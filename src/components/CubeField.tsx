"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

// Brand palette for the cube field — violet/pink/magenta/gold, matching
// the gradient identity in globals.css (kept as plain hex here instead of
// reading CSS custom properties, since the scene is built once on mount
// and doesn't need to track live theme changes).
const PALETTE = ["#7c3aed", "#a855f7", "#ec4899", "#e0227a", "#b3186f", "#f472b6", "#ffb020"];

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(callback: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}
function getReducedMotionSnapshot() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}
function getReducedMotionServerSnapshot() {
  return false;
}

// A full-viewport WebGL background: a grid of instanced cubes that
// breathe outward from the center — far enough to fly past the edges of
// the screen, some swelling toward the camera as if popping out of it —
// cycling through the brand colors as they go. Built with three.js,
// animated with anime.js v4's three.js adapter.
//
// The spread (and therefore how far the cubes travel) is computed from
// the camera's actual frustum at render time, not a fixed number, so the
// field always reaches every edge of whatever screen it's on — a phone
// held upright or a wide desktop window — instead of looking like a
// mobile-sized animation stranded in the middle of a big page.
//
// Fixed + full-bleed by default: it's meant to sit behind a page's real
// content as ambient background, not to be sized like a normal element.
export default function CubeField({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  useEffect(() => {
    if (reduced) return;
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    // Three.js and anime.js are sizeable — load them only once we know
    // we're actually going to animate, and only in the browser.
    Promise.all([import("three"), import("animejs"), import("animejs/adapters/three")]).then(
      ([THREE, { animate, createTimer, stagger }, { getInstances }]) => {
        if (cancelled || !container) return;

        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || window.innerHeight;

        const renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
          powerPreference: "low-power",
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const fov = 50;
        const cameraDistance = 1.5;
        const camera = new THREE.PerspectiveCamera(fov, width / height, 0.01, 100);
        camera.position.set(0, 0, cameraDistance);
        scene.add(camera);

        scene.add(new THREE.AmbientLight(0xffffff, 0.45));
        const light = new THREE.DirectionalLight(0xffffff, 2);
        light.position.set(2, 3, 4);
        scene.add(light);

        // Half-height/width of what the camera actually sees at z=0 (where
        // the cube grid is centered) — the real, device-aware size of the
        // screen in world units. An overscan factor pushes the resting
        // spread a bit past that, so the outer cubes travel off-frame
        // instead of stopping exactly at the visible edge.
        const OVERSCAN = 1.4;
        const halfHeight = Math.tan((fov * Math.PI) / 360) * cameraDistance;
        const halfWidth = halfHeight * (width / height);
        const spread = Math.max(halfWidth, halfHeight) * OVERSCAN;

        const gridSize = 6;
        const cellSize = spread / gridSize;
        const geometry = new THREE.BoxGeometry(cellSize, cellSize, cellSize);
        const material = new THREE.MeshLambertMaterial();
        const mesh = new THREE.InstancedMesh(geometry, material, gridSize ** 3);
        scene.add(mesh);

        const instances = getInstances(mesh);
        const gridAxis = (axis: "x" | "y" | "z", span = spread) =>
          stagger([-span, span], { grid: [gridSize, gridSize, gridSize], axis });

        const rotationAnim = animate(mesh, {
          rotateY: 360,
          rotateX: 360,
          duration: 26000,
          loop: true,
          ease: "linear",
        });

        const instanceAnim = animate(instances, {
          color: PALETTE,
          // z gets a slightly wider throw than x/y: those instances swell
          // toward the camera (cameraDistance is only 1.5 world units
          // away) as they approach, reading as "popping out of the
          // screen" rather than just sliding sideways off it.
          x: [gridAxis("x", spread * 0.2), gridAxis("x")],
          y: [gridAxis("y", spread * 0.2), gridAxis("y")],
          z: [gridAxis("z", spread * 0.2), gridAxis("z", spread * 1.15)],
          scale: [0.08, 0.3, 0.08],
          delay: stagger([0, 3200], { grid: [gridSize, gridSize, gridSize], from: "center", reversed: true }),
          duration: 2400,
          loopDelay: 500,
          loop: true,
          alternate: true,
          ease: "inOutQuad",
        });

        let running = true;
        const timer = createTimer({
          onUpdate: () => {
            if (running) renderer.render(scene, camera);
          },
        });

        // Pause the render loop (not the GPU-idle animations themselves;
        // anime.js keeps ticking, but we simply stop asking the GPU to
        // draw) whenever the tab isn't visible, to be kind to battery.
        const onVisibility = () => {
          running = document.visibilityState === "visible";
        };
        document.addEventListener("visibilitychange", onVisibility);

        // Rotating a phone, or resizing a desktop window, changes the
        // camera's aspect immediately so the picture never looks
        // stretched. It does not re-derive `spread` — reflowing the whole
        // grid live would mean restarting every in-flight animation — so
        // a dramatic resize (e.g. portrait to landscape) is fully
        // corrected on the next remount rather than instantly.
        const resize = () => {
          if (!container) return;
          const w = container.clientWidth || width;
          const h = container.clientHeight || height;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        };
        const observer = new ResizeObserver(resize);
        observer.observe(container);

        cleanup = () => {
          document.removeEventListener("visibilitychange", onVisibility);
          observer.disconnect();
          timer.cancel();
          rotationAnim.revert();
          instanceAnim.revert();
          renderer.dispose();
          geometry.dispose();
          material.dispose();
          if (renderer.domElement.parentNode === container) {
            container.removeChild(renderer.domElement);
          }
        };
      },
    );

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [reduced]);

  if (reduced) {
    // Reduced-motion fallback: a soft static wash of the same brand
    // gradient, no WebGL, no motion.
    return (
      <div
        className={`pointer-events-none fixed inset-0 -z-10 ${className}`}
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 60%)",
        }}
        aria-hidden
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none fixed inset-0 -z-10 h-screen w-screen ${className}`}
      aria-hidden
    />
  );
}
