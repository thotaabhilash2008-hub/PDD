// frontend/src/components/ThreeBloodDropHero.tsx
// Cinematic 3D Translucent Ruby Blood Drop & Interactive Network Constellation
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface ThreeBloodDropHeroProps {
  scrollProgress?: number; // 0 to 1 for scroll-based storytelling
  currentSection?: number; // 0 = hero, 1 = matching, 2 = location, 3 = emergency, 4 = community
  onSkipIntro?: () => void;
  className?: string;
}

export default function ThreeBloodDropHero({
  scrollProgress = 0,
  currentSection = 0,
  onSkipIntro,
  className = ""
}: ThreeBloodDropHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webGLSupported, setWebGLSupported] = useState(true);
  const [introFinished, setIntroFinished] = useState(false);

  // References for animation state
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Check WebGL availability
    const checkWebGL = () => {
      try {
        const canvas = document.createElement("canvas");
        return !!(window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
      } catch {
        return false;
      }
    };

    if (!checkWebGL()) {
      setWebGLSupported(false);
      return;
    }

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // Check user reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x190d13, 0.08);

    // Camera setup
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    // Renderer setup with high visual fidelity
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance"
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;
    } catch {
      setWebGLSupported(false);
      return;
    }

    // --- 1. Procedural 3D Blood Drop Geometry ---
    // Precision spline lathe curve for smooth organic teardrop profile
    const points: THREE.Vector2[] = [];
    const segments = 40;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      // y from bottom -1.3 to top tip +1.35
      const y = -1.3 + t * 2.65;
      
      // Teardrop radius function: rounded bottom, widest at t ~ 0.35, tapering smoothly to sharp tip at t = 1
      let r = 0;
      if (t < 0.4) {
        // Spherical bottom expansion
        const u = t / 0.4;
        r = Math.sin((u * Math.PI) / 2) * 1.05;
      } else {
        // Cubic taper to tip
        const u = (t - 0.4) / 0.6;
        r = 1.05 * Math.pow(1 - u, 1.4) * (1 - 0.2 * u);
      }
      points.push(new THREE.Vector2(Math.max(0, r), y));
    }

    const dropGeometry = new THREE.LatheGeometry(points, 64);
    dropGeometry.computeVertexNormals();

    // Outer Translucent Ruby Glass Material (PBR MeshPhysicalMaterial)
    const dropMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#C72C41"),
      emissive: new THREE.Color("#30050D"),
      roughness: 0.14,
      metalness: 0.04,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      transmission: 0.72,
      ior: 1.42,
      thickness: 1.6,
      specularIntensity: 1.0,
      specularColor: new THREE.Color("#FFF7F5"),
      transparent: true,
      opacity: 0.96
    });

    const bloodDropMesh = new THREE.Mesh(dropGeometry, dropMaterial);
    bloodDropMesh.scale.set(1.15, 1.15, 1.15);
    scene.add(bloodDropMesh);

    // Inner Luminous Core (Soft internal crimson pulse)
    const innerPoints: THREE.Vector2[] = points.map(p => new THREE.Vector2(p.x * 0.65, p.y * 0.65));
    const innerGeometry = new THREE.LatheGeometry(innerPoints, 32);
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#FF334F"),
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending
    });
    const innerCoreMesh = new THREE.Mesh(innerGeometry, innerMaterial);
    bloodDropMesh.add(innerCoreMesh);

    // --- 2. Floating Ambient Particulate Dust ---
    const particleCount = 140;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleScales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 14;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1;
      particleScales[i] = Math.random() * 0.6 + 0.4;
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: new THREE.Color("#E8A0AA"),
      size: 0.045,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // --- 3. Constellation of Network Nodes around the Drop ---
    const nodeGroup = new THREE.Group();
    scene.add(nodeGroup);

    interface NetworkNode {
      position: THREE.Vector3;
      mesh: THREE.Mesh;
      halo: THREE.Mesh;
      color: string;
      label: string;
      type: "donor" | "hospital" | "emergency" | "hub";
    }

    const nodeData = [
      { pos: new THREE.Vector3(-2.4, 1.2, 0.4), color: "#22C55E", type: "donor", label: "Donor O+" },
      { pos: new THREE.Vector3(2.6, 1.4, -0.2), color: "#38BDF8", type: "hospital", label: "Apollo Hub" },
      { pos: new THREE.Vector3(-2.2, -1.4, 0.5), color: "#FF334F", type: "emergency", label: "Trauma ICU" },
      { pos: new THREE.Vector3(2.3, -1.2, 0.3), color: "#22C55E", type: "donor", label: "Donor O-" },
      { pos: new THREE.Vector3(0.1, 2.3, -0.4), color: "#E8A0AA", type: "hub", label: "Dijkstra Node" },
      { pos: new THREE.Vector3(-0.2, -2.4, -0.3), color: "#E05263", type: "donor", label: "Donor A+" }
    ];

    const networkNodes: NetworkNode[] = [];
    const sphereGeo = new THREE.SphereGeometry(0.09, 16, 16);
    const haloGeo = new THREE.SphereGeometry(0.18, 16, 16);

    nodeData.forEach(d => {
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(d.color) });
      const haloMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(d.color),
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending
      });
      const mesh = new THREE.Mesh(sphereGeo, mat);
      const halo = new THREE.Mesh(haloGeo, haloMat);
      mesh.position.copy(d.pos);
      halo.position.copy(d.pos);
      nodeGroup.add(mesh);
      nodeGroup.add(halo);
      networkNodes.push({
        position: d.pos,
        mesh,
        halo,
        color: d.color,
        label: d.label,
        type: d.type as any
      });
    });

    // --- 4. Animated Connection Lines ---
    const lineMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color("#C72C41"),
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });

    const lineGroup = new THREE.Group();
    scene.add(lineGroup);

    // Create lines connecting adjacent nodes and central drop
    const connections: [number, number][] = [
      [0, 4],
      [4, 1],
      [1, 3],
      [3, 5],
      [5, 2],
      [2, 0],
      [0, 3],
      [1, 2]
    ];

    connections.forEach(([from, to]) => {
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        networkNodes[from].position,
        networkNodes[to].position
      ]);
      const line = new THREE.Line(lineGeo, lineMaterial);
      lineGroup.add(line);
    });

    // Pulses traveling along lines
    const pulseGeo = new THREE.SphereGeometry(0.045, 8, 8);
    const pulseMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#FFF7F5"),
      blending: THREE.AdditiveBlending
    });
    const pulses: { mesh: THREE.Mesh; from: THREE.Vector3; to: THREE.Vector3; progress: number; speed: number }[] = [];

    connections.forEach(([from, to], i) => {
      const pMesh = new THREE.Mesh(pulseGeo, pulseMat);
      scene.add(pMesh);
      pulses.push({
        mesh: pMesh,
        from: networkNodes[from].position,
        to: networkNodes[to].position,
        progress: (i / connections.length),
        speed: 0.006 + Math.random() * 0.004
      });
    });

    // --- 5. Sophisticated Volumetric & Studio Lighting ---
    // Restrained Key Light
    const keyLight = new THREE.DirectionalLight(0xfff7f5, 1.8);
    keyLight.position.set(4, 5, 4);
    scene.add(keyLight);

    // Deep Ruby Fill Light
    const fillLight = new THREE.PointLight(0xa91f36, 2.2, 18);
    fillLight.position.set(-4, -2, 3);
    scene.add(fillLight);

    // Subtle Crimson Rim Light from behind
    const rimLight = new THREE.PointLight(0xff334f, 3.0, 16);
    rimLight.position.set(0, 2, -4);
    scene.add(rimLight);

    // Ambient Warm Burgundy Light
    const ambientLight = new THREE.AmbientLight(0x27121b, 0.9);
    scene.add(ambientLight);

    // --- 6. Mouse Interaction & Parallax ---
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseRef.current.targetX = x * 0.6;
      mouseRef.current.targetY = y * 0.4;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Window Resize Handler
    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // --- 7. Animation Loop with 0-6s Intro Sequence ---
    const startTime = performance.now();
    let isDisposed = false;

    const animate = (currentTime: number) => {
      if (isDisposed) return;
      animFrameRef.current = requestAnimationFrame(animate);

      const elapsedSec = (currentTime - startTime) / 1000;

      // 0–6 Second Intro Staging
      if (!prefersReducedMotion && elapsedSec < 5.5) {
        // Fade in lighting & drop scale
        dropMaterial.opacity = Math.min(0.96, elapsedSec * 0.28);
        innerMaterial.opacity = Math.min(0.28, Math.max(0, (elapsedSec - 1.0) * 0.15));
        lineMaterial.opacity = Math.min(0.35, Math.max(0, (elapsedSec - 2.5) * 0.25));
        particleMat.opacity = Math.min(0.45, elapsedSec * 0.15);
      } else {
        if (!introFinished) setIntroFinished(true);
        dropMaterial.opacity = 0.96;
        innerMaterial.opacity = 0.28;
        lineMaterial.opacity = 0.35;
        particleMat.opacity = 0.45;
      }

      // Smooth mouse damping (Lerp)
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      const time = currentTime * 0.001;

      // Natural harmonic floating & rotation of Blood Drop
      const floatY = Math.sin(time * 1.4) * 0.14;
      const floatTiltX = Math.cos(time * 1.1) * 0.08;
      const floatTiltZ = Math.sin(time * 0.9) * 0.06;

      // Scroll-based positional choreography (Section 0 to 4)
      let targetPosX = 1.35 - (scrollProgress || 0) * 0.3; // default center-right on desktop
      let targetPosY = 0.1;
      let targetScale = 1.15;

      if (window.innerWidth < 768) {
        targetPosX = 0; // centered on mobile
        targetPosY = 1.2;
        targetScale = 0.85;
      } else if (currentSection === 1) {
        // Section 2: Intelligent Matching — drop shifts to the left
        targetPosX = -1.6;
        targetPosY = 0;
        targetScale = 1.05;
      } else if (currentSection === 2) {
        // Section 3: GIS Location — drop elevates gently
        targetPosX = 2.0;
        targetPosY = 0.3;
        targetScale = 0.95;
      } else if (currentSection === 3) {
        // Section 4: Emergency Response — dramatic ruby focus
        targetPosX = -1.6;
        targetPosY = 0.1;
        targetScale = 1.25;
      } else if (currentSection === 4) {
        // Section 5: Community — elevated halo
        targetPosX = 0;
        targetPosY = 2.0;
        targetScale = 0.75;
      }

      bloodDropMesh.position.x += (targetPosX + mouseRef.current.x * 0.8 - bloodDropMesh.position.x) * 0.06;
      bloodDropMesh.position.y += (targetPosY + floatY + mouseRef.current.y * 0.6 - bloodDropMesh.position.y) * 0.06;
      bloodDropMesh.rotation.y = time * 0.45 + mouseRef.current.x * 0.5;
      bloodDropMesh.rotation.x = floatTiltX + mouseRef.current.y * 0.3;
      bloodDropMesh.rotation.z = floatTiltZ;

      const currentScale = bloodDropMesh.scale.x;
      const newScale = currentScale + (targetScale - currentScale) * 0.05;
      bloodDropMesh.scale.set(newScale, newScale, newScale);

      // Heartbeat pulse modulation of inner luminous core
      const pulseSpeed = currentSection === 3 ? 3.5 : 2.2;
      const heartPulse = 1.0 + Math.pow(Math.sin(time * pulseSpeed), 6) * 0.18;
      innerCoreMesh.scale.set(heartPulse, heartPulse, heartPulse);
      innerMaterial.opacity = 0.22 + Math.pow(Math.sin(time * pulseSpeed), 6) * 0.25;

      // Animate Constellation of Nodes & halos
      nodeGroup.position.copy(bloodDropMesh.position);
      nodeGroup.rotation.y = time * 0.12;

      networkNodes.forEach((node, idx) => {
        const haloScale = 1.0 + Math.sin(time * 2.5 + idx) * 0.25;
        node.halo.scale.set(haloScale, haloScale, haloScale);
      });

      // Animate Data Pulses along network lines
      pulses.forEach(p => {
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;
        p.mesh.position.lerpVectors(p.from, p.to, p.progress);
        p.mesh.position.add(bloodDropMesh.position);
      });

      // Subtle particle orbital drift
      particleSystem.rotation.y = time * 0.03;
      particleSystem.rotation.x = mouseRef.current.y * 0.05;

      renderer.render(scene, camera);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    // Cleanup on unmount
    return () => {
      isDisposed = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);

      dropGeometry.dispose();
      dropMaterial.dispose();
      innerGeometry.dispose();
      innerMaterial.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      sphereGeo.dispose();
      haloGeo.dispose();
      lineMaterial.dispose();
      pulseGeo.dispose();
      pulseMat.dispose();
      renderer.dispose();
    };
  }, [currentSection]);

  if (!webGLSupported) {
    // Graceful fallback for non-WebGL environments
    return (
      <div className={`relative flex items-center justify-center p-8 ${className}`}>
        <div className="w-56 h-72 rounded-full bg-gradient-to-b from-[#C72C41]/30 via-[#A91F36]/20 to-transparent blur-2xl absolute"></div>
        <div className="relative z-10 text-center space-y-3 p-6 rounded-2xl bg-[#321923]/60 border border-[#49303A]">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#C72C41]/20 border border-[#C72C41] flex items-center justify-center text-[#C72C41]">
            🩸
          </div>
          <span className="text-xs font-mono text-[#E8A0AA] uppercase font-bold block">
            HEMOCONNECT 3D ENGINE
          </span>
          <p className="text-[11px] text-[#C3AEB4] max-w-xs">
            Interactive 3D simulation active (hardware accelerated).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative w-full h-full overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block pointer-events-none" />

      {/* Intro sequence Skip Button (Discreet, 0-6s) */}
      {!introFinished && (
        <button
          onClick={() => {
            setIntroFinished(true);
            if (onSkipIntro) onSkipIntro();
          }}
          className="absolute bottom-4 right-6 text-[10px] font-mono tracking-widest text-[#9C858D] hover:text-[#FFF7F5] bg-[#24151D]/60 hover:bg-[#321923] border border-[#49303A]/50 px-3 py-1 rounded-full transition-all cursor-pointer backdrop-blur-sm z-20"
        >
          SKIP INTRO ➔
        </button>
      )}
    </div>
  );
}
