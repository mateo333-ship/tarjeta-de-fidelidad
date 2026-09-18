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

// A small, self-contained WebGL hero flourish: a grid of instanced cubes
// that breathe outward from the center, cycle through the brand colors,
// and slowly tumble — built with three.js, animated with anime.js v4's
// three.js adapter. Everything (scene setup, the animation loop, and
// cleanup) lives inside one effect so navigating away disposes the GPU
// resources instead of leaking them.
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

        const width = container.clientWidth || 220;
        const height = container.clientHeight || 220;

        const renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
          powerPreference: "low-power",
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(50, width / height, 0.01, 100);
        camera.position.set(0, 0, 1.5);
        scene.add(camera);

        scene.add(new THREE.AmbientLight(0xffffff, 0.45));
        const light = new THREE.DirectionalLight(0xffffff, 2);
        light.position.set(2, 3, 4);
        scene.add(light);

        const gridSize = 5;
        const cellSize = 2 / gridSize;
        const spread = ((gridSize - 1) / 2) * cellSize;
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
          x: [gridAxis("x", spread * 0.25), gridAxis("x")],
          y: [gridAxis("y", spread * 0.25), gridAxis("y")],
          z: [gridAxis("z", spread * 0.25), gridAxis("z")],
          scale: [0.1, 0.25, 0.1],
          delay: stagger([0, 3000], { grid: [gridSize, gridSize, gridSize], from: "center", reversed: true }),
          duration: 2200,
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
    // Reduced-motion fallback: the same brand gradient, no motion.
    return (
      <div
        className={`rounded-[28px] ${className}`}
        style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
        aria-hidden
      />
    );
  }

  return <div ref={containerRef} className={className} aria-hidden />;
}
