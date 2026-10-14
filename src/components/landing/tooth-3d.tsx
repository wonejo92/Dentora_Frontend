"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { GlassTooth } from "./glass-tooth";

/** Contorno del ícono de Dentora (el mismo de GlassTooth), que se extruye a 3D. */
const TOOTH_PATH =
  "M15 5.5 12 7 9 5.5a3.5 3.5 0 0 0-5 3.5c0 2 1 3.5 1.5 6S6 21 8 21c1.5 0 1.5-4 4-4s2.5 4 4 4c2 0 2-3.5 2.5-6S20 11 20 9a3.5 3.5 0 0 0-5-3.5Z";

/**
 * Diente 3D de la portada (three.js). Se arrastra de lado a lado para girarlo,
 * con inercia; en reposo se balancea suavemente. three.js se carga aparte, solo
 * aquí, y mientras tanto (o sin WebGL) se muestra el diente 2D.
 */
export function Tooth3D({ className }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  // Giro pedido con el teclado (lo lee el bucle de animación).
  const keyNudge = useRef(0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const { SVGLoader } = await import("three/examples/jsm/loaders/SVGLoader.js");
      const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
      if (disposed) return;

      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch {
        return; // Sin WebGL: se queda el diente 2D.
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.95;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      mount.appendChild(renderer.domElement);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envTexture;

      const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
      camera.position.set(0, 0, 62);

      // ─── Geometría: el contorno del ícono con volumen y bordes redondeados ───
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${TOOTH_PATH}"/></svg>`;
      const shapes = new SVGLoader().parse(svg).paths.flatMap((p) => SVGLoader.createShapes(p));
      const geometry = new THREE.ExtrudeGeometry(shapes, {
        depth: 3.6,
        bevelEnabled: true,
        bevelThickness: 1.6,
        bevelSize: 0.9,
        bevelSegments: 14,
        curveSegments: 64,
      });
      geometry.center();
      geometry.scale(1.3, -1.3, 1.3); // El SVG tiene la Y hacia abajo.
      geometry.computeVertexNormals();

      // Degradado vertical: turquesa claro arriba, petróleo abajo.
      const position = geometry.getAttribute("position");
      geometry.computeBoundingBox();
      const { min, max } = geometry.boundingBox!;
      const top = new THREE.Color("#a8e6f0");
      const mid = new THREE.Color("#2aa6c0");
      const bottom = new THREE.Color("#0a5468");
      const colors = new Float32Array(position.count * 3);
      const c = new THREE.Color();
      for (let i = 0; i < position.count; i++) {
        const t = (position.getY(i) - min.y) / (max.y - min.y); // 0 abajo, 1 arriba
        if (t > 0.5) c.lerpColors(mid, top, (t - 0.5) * 2);
        else c.lerpColors(bottom, mid, t * 2);
        colors.set([c.r, c.g, c.b], i * 3);
      }
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      const material = new THREE.MeshPhysicalMaterial({
        vertexColors: true,
        roughness: 0.22,
        metalness: 0,
        clearcoat: 0.9,
        clearcoatRoughness: 0.06,
        envMapIntensity: 0.75,
      });
      const tooth = new THREE.Mesh(geometry, material);
      scene.add(tooth);

      const key = new THREE.DirectionalLight("#ffffff", 1.3);
      key.position.set(-12, 18, 20);
      scene.add(key);
      scene.add(new THREE.AmbientLight("#bfe9f0", 0.35));

      // ─── Tamaño ───
      const resize = () => {
        const { clientWidth: w, clientHeight: h } = mount;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(mount);
      resize();

      // ─── Interacción: arrastrar para girar, con inercia ───
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let rotation = 0;
      let velocity = 0;
      let dragging = false;
      let lastX = 0;
      let lastTouch = -Infinity; // último momento en que alguien lo giró
      const el = renderer.domElement;
      el.style.touchAction = "pan-y";
      el.style.cursor = "grab";

      const onDown = (e: PointerEvent) => {
        dragging = true;
        lastX = e.clientX;
        velocity = 0;
        el.setPointerCapture(e.pointerId);
        el.style.cursor = "grabbing";
      };
      const onMove = (e: PointerEvent) => {
        if (!dragging) return;
        const dx = e.clientX - lastX;
        lastX = e.clientX;
        rotation += dx * 0.012;
        velocity = dx * 0.012;
        lastTouch = performance.now();
      };
      const onUp = () => {
        dragging = false;
        el.style.cursor = "grab";
        lastTouch = performance.now();
      };
      el.addEventListener("pointerdown", onDown);
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerup", onUp);
      el.addEventListener("pointercancel", onUp);

      // ─── Bucle: solo se dibuja mientras el diente está en pantalla ───
      let visible = true;
      const intersection = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
      intersection.observe(mount);

      let frame = 0;
      let last = performance.now();
      const loop = (now: number) => {
        frame = requestAnimationFrame(loop);
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (!visible) return;

        if (keyNudge.current) {
          velocity += keyNudge.current;
          keyNudge.current = 0;
          lastTouch = now;
        }
        if (!dragging) {
          rotation += velocity;
          velocity *= Math.pow(0.04, dt); // la inercia se apaga en ~1 s
          // Tras 2 s sin tocarlo, vuelve suave al frente y se balancea.
          if (now - lastTouch > 2000 && Math.abs(velocity) < 0.002) {
            const turns = Math.round(rotation / (Math.PI * 2)) * Math.PI * 2;
            const sway = reduceMotion ? 0 : Math.sin(now / 1600) * 0.35;
            rotation += (turns + sway - rotation) * Math.min(1, dt * 2.5);
          }
        }
        tooth.rotation.y = rotation;
        tooth.rotation.x = 0.08 + (reduceMotion ? 0 : Math.sin(now / 2300) * 0.04);
        renderer.render(scene, camera);
      };
      frame = requestAnimationFrame(loop);
      setReady(true);

      cleanup = () => {
        cancelAnimationFrame(frame);
        resizeObserver.disconnect();
        intersection.disconnect();
        el.removeEventListener("pointerdown", onDown);
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerup", onUp);
        el.removeEventListener("pointercancel", onUp);
        geometry.dispose();
        material.dispose();
        envTexture.dispose();
        pmrem.dispose();
        renderer.dispose();
        el.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        role="img"
        aria-label="Diente 3D de Dentora. Arrástralo o usa las flechas para girarlo."
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") keyNudge.current = -0.12;
          else if (e.key === "ArrowRight") keyNudge.current = 0.12;
          else return;
          e.preventDefault();
        }}
        className="relative aspect-square w-full rounded-full focus-visible:ring-4 focus-visible:ring-brand-200 focus-visible:outline-none"
      >
        {/* Diente 2D mientras carga three.js (o si no hay WebGL) */}
        <GlassTooth
          idPrefix="hero-fallback"
          className={cn("absolute inset-[12%] transition-opacity duration-700", ready && "opacity-0")}
        />
        <div
          ref={mountRef}
          className={cn("absolute inset-0 transition-opacity duration-700", ready ? "opacity-100" : "opacity-0")}
        />
      </div>
      <div aria-hidden className="-mt-6 h-4 w-1/2 rounded-[50%] bg-night-900/20 blur-md" />
      <p className="mt-5 flex items-center gap-2 text-xs text-muted" aria-hidden>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M8 7 3 12l5 5M16 7l5 5-5 5M3 12h18" />
        </svg>
        Arrástralo para girarlo
      </p>
    </div>
  );
}
