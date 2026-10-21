// frontend/src/components/ThreeBloodDropHero.tsx
// Hyper-Realistic 3D WebGL Translucent Ruby Blood Drop & Interactive Network Constellation
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import gsap from "gsap";

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
  const introTlRef = useRef<gsap.core.Timeline | null>(null);

  const scrollRef = useRef(scrollProgress);
  const currentSectionRef = useRef(currentSection);

  useEffect(() => {
    scrollRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    currentSectionRef.current = currentSection;
  }, [currentSection]);

  useEffect(() => {
    // 1. Check WebGL availability
    const checkWebGL = () => {
      try {
        const canvas = document.createElement("canvas");
        return !!(
          window.WebGLRenderingContext &&
          (canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
        );
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

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // 2. Scene Setup with Deep Burgundy Fog
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x190D13, 0.07);

    // 3. Perspective Camera
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0, 8.2);

    // 4. WebGLRenderer with ACES Filmic Tone Mapping
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
      renderer.toneMappingExposure = 1.35;
    } catch {
      setWebGLSupported(false);
      return;
    }

    // 5. Studio Environment Map (PMREMGenerator + RoomEnvironment)
    // CRITICAL: MeshPhysicalMaterial transmission & clearcoat require environment reflections
    // to render convincing liquid glass depth, softbox highlights, and refractive volume!
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    const envTexture = pmremGenerator.fromScene(roomEnv).texture;
    scene.environment = envTexture;

    // 6. Root Hierarchy Groups
    const heroGroup = new THREE.Group();
    scene.add(heroGroup);

    // 7. Photorealistic Translucent Ruby Liquid/Glass Material (PBR)
    const dropMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#B8142E"),
      emissive: new THREE.Color("#380008"),
      emissiveIntensity: 0.35,
      roughness: 0.06,           // Mirror-gloss liquid surface
      metalness: 0.04,
      clearcoat: 1.0,            // Liquid exterior film
      clearcoatRoughness: 0.03,
      transmission: 0.84,        // High optical transmission
      ior: 1.40,                 // Refractive index of blood serum
      thickness: 2.6,            // Optical volume depth
      attenuationColor: new THREE.Color("#700010"), // Deep red core light absorption
      attenuationDistance: 1.3,
      specularIntensity: 1.4,
      specularColor: new THREE.Color("#FFF2F4"),
      transparent: true,
      opacity: 0.98
    });

    // 8. Construct High-Poly 3D Teardrop Spline Lathe Mesh
    const lathePoints: THREE.Vector2[] = [];
    const splineSegments = 96;
    for (let i = 0; i <= splineSegments; i++) {
      const t = i / splineSegments; // 0 (bottom) to 1 (top)
      const y = -1.35 + t * 2.75;
      let r = 0;
      if (t < 0.36) {
        // Spherical bulbous bottom
        const u = t / 0.36;
        r = Math.sin((u * Math.PI) / 2) * 1.08;
      } else {
        // Smooth organic inflection & cubic taper to top peak
        const u = (t - 0.36) / 0.64;
        r = 1.08 * Math.pow(1 - u, 1.38) * (1 - 0.22 * u);
      }
      lathePoints.push(new THREE.Vector2(Math.max(0, r), y));
    }

    const dropGeometry = new THREE.LatheGeometry(lathePoints, 96);
    dropGeometry.computeVertexNormals();

    const bloodDropMesh = new THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial>(dropGeometry, dropMaterial);
    bloodDropMesh.scale.set(1.6, 1.6, 1.6);
    heroGroup.add(bloodDropMesh);

    // 9. Attempt loading GLB model from /models/blood_drop.glb with fallback to procedural geometry
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      "/models/blood_drop.glb",
      (gltf) => {
        const loadedMesh = gltf.scene.getObjectByName("BloodDrop") || gltf.scene.getObjectByName("RealisticBloodDrop");
        if (loadedMesh && (loadedMesh as THREE.Mesh).isMesh) {
          const mesh = loadedMesh as THREE.Mesh;
          bloodDropMesh.geometry.dispose();
          bloodDropMesh.geometry = mesh.geometry.clone();
          bloodDropMesh.geometry.computeVertexNormals();
        }
      },
      undefined,
      () => {
        // High-poly procedural geometry is already active as seamless fallback
      }
    );

    // 10. Inner Bioluminescent Core (Lub-Dub Medical Heartbeat Pulse)
    const innerPoints: THREE.Vector2[] = lathePoints.map(p => new THREE.Vector2(p.x * 0.68, p.y * 0.68));
    const innerGeometry = new THREE.LatheGeometry(innerPoints, 48);
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#FF2244"),
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending
    });
    const innerCoreMesh = new THREE.Mesh(innerGeometry, innerMaterial);
    bloodDropMesh.add(innerCoreMesh);

    // 11. Orbital Radar Gyroscope Rings (Medical Logistics Telemetry)
    const orbitalGroup = new THREE.Group();
    heroGroup.add(orbitalGroup);

    const ringGeo1 = new THREE.TorusGeometry(2.1, 0.012, 16, 100);
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#E05263"),
      emissive: new THREE.Color("#E05263"),
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.35,
      roughness: 0.2
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI * 0.35;
    ring1.rotation.y = Math.PI * 0.2;
    orbitalGroup.add(ring1);

    const ringGeo2 = new THREE.TorusGeometry(2.35, 0.008, 16, 100);
    const ringMat2 = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#38BDF8"),
      emissive: new THREE.Color("#38BDF8"),
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.25,
      roughness: 0.2
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = -Math.PI * 0.25;
    ring2.rotation.z = Math.PI * 0.3;
    orbitalGroup.add(ring2);

    // 12. Mathematically Accurate 3D Erythrocytes (Biconcave Red Blood Cells)
    // Evans-Fung Parametric Equation for Human Erythrocytes
    const erythrocytePoints: THREE.Vector2[] = [];
    const N_ERY = 20;
    const ERY_R = 0.28;
    for (let i = 0; i <= N_ERY; i++) {
      const t = i / N_ERY;
      const r = t * ERY_R;
      const rNorm = Math.min(0.999, t);
      const D = 0.52 * ERY_R;
      const z = D * Math.sqrt(1 - rNorm * rNorm) * (0.15 + 1.85 * rNorm * rNorm - 1.65 * Math.pow(rNorm, 4));
      erythrocytePoints.push(new THREE.Vector2(r, Math.max(0.015, z)));
    }
    const fullEryProfile: THREE.Vector2[] = [];
    for (let i = 0; i <= N_ERY; i++) fullEryProfile.push(erythrocytePoints[i]);
    for (let i = N_ERY; i >= 0; i--) fullEryProfile.push(new THREE.Vector2(erythrocytePoints[i].x, -erythrocytePoints[i].y));

    const erythrocyteGeo = new THREE.LatheGeometry(fullEryProfile, 32);
    erythrocyteGeo.computeVertexNormals();

    const erythrocyteMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#C72C41"),
      roughness: 0.18,
      metalness: 0.08,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
      transparent: true,
      opacity: 0.85
    });

    const erythrocytes: {
      mesh: THREE.Mesh;
      basePos: THREE.Vector3;
      rotSpeed: THREE.Vector3;
      orbitSpeed: number;
      orbitRadius: number;
      phase: number;
    }[] = [];

    const eryCount = 8;
    for (let i = 0; i < eryCount; i++) {
      const eryMesh = new THREE.Mesh(erythrocyteGeo, erythrocyteMat);
      const angle = (i / eryCount) * Math.PI * 2;
      const radius = 2.4 + (i % 3) * 0.4;
      const zDepth = (Math.random() - 0.5) * 3.5;
      eryMesh.position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 2.2, zDepth);
      heroGroup.add(eryMesh);

      erythrocytes.push({
        mesh: eryMesh,
        basePos: eryMesh.position.clone(),
        rotSpeed: new THREE.Vector3((Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.025, (Math.random() - 0.5) * 0.015),
        orbitSpeed: 0.2 + Math.random() * 0.2,
        orbitRadius: radius,
        phase: angle
      });
    }

    // 13. Genuine 3D Constellation of Network Nodes (Donors, Hospitals, Emergency)
    interface NetworkNode {
      position: THREE.Vector3;
      mesh: THREE.Mesh;
      halo: THREE.Mesh;
      color: string;
      label: string;
      type: "donor" | "hospital" | "emergency" | "hub";
    }

    const nodeGroup = new THREE.Group();
    heroGroup.add(nodeGroup);

    const nodeData = [
      { pos: new THREE.Vector3(-2.8, 1.3, 0.7), color: "#22C55E", type: "donor", label: "Donor O+" },
      { pos: new THREE.Vector3(2.9, 1.5, -0.6), color: "#38BDF8", type: "hospital", label: "Apollo Hub" },
      { pos: new THREE.Vector3(-2.5, -1.6, 0.8), color: "#FF334F", type: "emergency", label: "Trauma ICU" },
      { pos: new THREE.Vector3(2.7, -1.3, 0.5), color: "#22C55E", type: "donor", label: "Donor O-" },
      { pos: new THREE.Vector3(0.2, 2.7, -0.7), color: "#E8A0AA", type: "hub", label: "Dijkstra Router" },
      { pos: new THREE.Vector3(-0.3, -2.7, -0.5), color: "#E05263", type: "donor", label: "Donor A+" }
    ];

    const networkNodes: NetworkNode[] = [];
    const sphereGeo = new THREE.SphereGeometry(0.12, 24, 24);
    const haloGeo = new THREE.SphereGeometry(0.24, 20, 20);

    nodeData.forEach(d => {
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(d.color),
        emissive: new THREE.Color(d.color),
        emissiveIntensity: 0.8,
        roughness: 0.15,
        metalness: 0.6
      });
      const haloMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(d.color),
        transparent: true,
        opacity: 0.28,
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

    // 14. 3D Connection Vectors & Traveling Data Photons
    const lineMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color("#C72C41"),
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });

    const lineGroup = new THREE.Group();
    heroGroup.add(lineGroup);

    const connections: [number, number][] = [
      [0, 4], [4, 1], [1, 3], [3, 5], [5, 2], [2, 0], [0, 3], [1, 2]
    ];

    connections.forEach(([from, to]) => {
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        networkNodes[from].position,
        networkNodes[to].position
      ]);
      const line = new THREE.Line(lineGeo, lineMaterial);
      lineGroup.add(line);
    });

    const pulseGeo = new THREE.SphereGeometry(0.05, 12, 12);
    const pulseMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#FFF7F5"),
      blending: THREE.AdditiveBlending
    });
    const pulses: { mesh: THREE.Mesh; from: THREE.Vector3; to: THREE.Vector3; progress: number; speed: number }[] = [];

    connections.forEach(([from, to], i) => {
      const pMesh = new THREE.Mesh(pulseGeo, pulseMat);
      heroGroup.add(pMesh);
      pulses.push({
        mesh: pMesh,
        from: networkNodes[from].position,
        to: networkNodes[to].position,
        progress: i / connections.length,
        speed: 0.007 + Math.random() * 0.004
      });
    });

    // 15. Ambient Particulate Dust in 3D Space
    const particleCount = 180;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 16;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 1.5;
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: new THREE.Color("#E8A0AA"),
      size: 0.05,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // 16. Studio Cinematic Lighting Rig (Phase 4)
    // Key Light
    const keyLight = new THREE.DirectionalLight(0xFFF7F5, 2.6);
    keyLight.position.set(5, 6, 5);
    scene.add(keyLight);

    // Deep Ruby Fill Light
    const fillLight = new THREE.PointLight(0xE05263, 2.5, 25);
    fillLight.position.set(-5, -2, 4);
    scene.add(fillLight);

    // Intense Razor Rim Light from behind (cuts silhouette from dark background)
    const rimLight = new THREE.SpotLight(0xFF334F, 5.0, 30, Math.PI / 4, 0.4);
    rimLight.position.set(0, 3, -5);
    rimLight.target = bloodDropMesh;
    scene.add(rimLight);

    // Top Softbox
    const topLight = new THREE.PointLight(0xFFF0F5, 1.8, 15);
    topLight.position.set(0, 5, 2);
    scene.add(topLight);

    // Ambient Hemisphere
    const hemisphereLight = new THREE.HemisphereLight(0x40101C, 0x190D13, 0.9);
    scene.add(hemisphereLight);

    // 17. Cinematic 0-6 Second GSAP Intro Timeline (Phase 5)
    if (!prefersReducedMotion) {
      const tl = gsap.timeline({
        onComplete: () => setIntroFinished(true)
      });
      introTlRef.current = tl;

      // Initial Staging
      camera.position.set(0, 0, 10.5);
      bloodDropMesh.scale.set(0.01, 0.01, 0.01);
      bloodDropMesh.rotation.y = -Math.PI;
      nodeGroup.scale.set(0.01, 0.01, 0.01);
      orbitalGroup.scale.set(0.01, 0.01, 0.01);
      lineMaterial.opacity = 0;
      keyLight.intensity = 0.2;
      rimLight.intensity = 0.2;

      // 0–1s: Reveal environment & soft lighting
      tl.to(particleMat, { opacity: 0.45, duration: 1.0, ease: "power2.out" }, 0);
      tl.to(camera.position, { z: 8.2, duration: 2.2, ease: "power2.out" }, 0);

      // 1–2s: Reveal 3D blood drop with lighting ramp
      tl.to(keyLight, { intensity: 2.6, duration: 1.5, ease: "power2.out" }, 0.8);
      tl.to(rimLight, { intensity: 5.0, duration: 1.5, ease: "power2.out" }, 0.8);
      tl.to(bloodDropMesh.scale, { x: 1.6, y: 1.6, z: 1.6, duration: 1.6, ease: "back.out(1.2)" }, 1.0);

      // 2–3s: Slow rotation revealing 3D curvature and reflections
      tl.to(bloodDropMesh.rotation, { y: 0, duration: 1.8, ease: "power2.inOut" }, 1.4);

      // 3–4s: Orbital rings & floating motion
      tl.to(orbitalGroup.scale, { x: 1, y: 1, z: 1, duration: 1.2, ease: "power2.out" }, 2.8);

      // 4–5s: Network nodes pop in with 3D depth
      tl.to(nodeGroup.scale, { x: 1, y: 1, z: 1, duration: 1.2, ease: "back.out(1.4)" }, 3.8);

      // 5–6s: Connective vectors fade in & pulses activate
      tl.to(lineMaterial, { opacity: 0.45, duration: 1.0, ease: "power2.out" }, 4.8);
    } else {
      setIntroFinished(true);
    }

    // 18. Mouse Pointer Movement & Parallax Tracking (Phase 6)
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseRef.current.targetX = x * 0.7;
      mouseRef.current.targetY = y * 0.5;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // 19. Resize Handler
    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // 20. Continuous Render Animation Loop (Phase 11: Optimized)
    let isDisposed = false;

    const animate = (currentTime: number) => {
      if (isDisposed) return;
      animFrameRef.current = requestAnimationFrame(animate);

      const time = currentTime * 0.001;

      // Mouse Lerp Damping
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      // Camera 3D Parallax Damping (Phase 6: Natural Camera Depth Parallax)
      const targetCamX = mouseRef.current.x * 0.9;
      const targetCamY = mouseRef.current.y * 0.6;
      camera.position.x += (targetCamX - camera.position.x) * 0.05;
      camera.position.y += (targetCamY - camera.position.y) * 0.05;

      // Harmonic Floating Oscillation
      const floatY = Math.sin(time * 1.5) * 0.16;
      const floatTiltX = Math.cos(time * 1.2) * 0.09;
      const floatTiltZ = Math.sin(time * 0.95) * 0.07;

      // Responsive Section Positions (Phase 7: Scroll Storytelling Choreography)
      const isMobile = window.innerWidth < 768;
      const activeSection = currentSectionRef.current;
      const scrollPos = scrollRef.current;
      let targetPosX = 1.6 - scrollPos * 0.3; // Center-right on desktop hero
      let targetPosY = 0.05;
      let targetScale = 1.6; // Majestic large scale
      let emergencyGlow = 0;

      if (isMobile) {
        targetPosX = 0;
        targetPosY = 1.35;
        targetScale = 0.95;
      } else if (activeSection === 1) {
        // Section 2: Intelligent Matching — moves to left side
        targetPosX = -1.8;
        targetPosY = 0.0;
        targetScale = 1.35;
      } else if (activeSection === 2) {
        // Section 3: GIS Radar Location — moves to right side
        targetPosX = 2.0;
        targetPosY = 0.25;
        targetScale = 1.25;
      } else if (activeSection === 3) {
        // Section 4: Emergency Response — dramatic ruby focus & expansion
        targetPosX = -1.65;
        targetPosY = 0.05;
        targetScale = 1.75;
        emergencyGlow = 1;
      } else if (activeSection === 4) {
        // Section 5: Community — elevated beacon
        targetPosX = 0.0;
        targetPosY = 2.1;
        targetScale = 0.9;
      }

      // Smooth Position & Scale Interpolation
      heroGroup.position.x += (targetPosX + mouseRef.current.x * 0.5 - heroGroup.position.x) * 0.06;
      heroGroup.position.y += (targetPosY + floatY + mouseRef.current.y * 0.4 - heroGroup.position.y) * 0.06;

      // 3D Object Rotation (reveals glossy reflections and curvature continuously)
      bloodDropMesh.rotation.y = time * 0.38 + mouseRef.current.x * 0.4;
      bloodDropMesh.rotation.x = floatTiltX + mouseRef.current.y * 0.25;
      bloodDropMesh.rotation.z = floatTiltZ;

      const currentDropScale = bloodDropMesh.scale.x;
      const interpolatedScale = currentDropScale + (targetScale - currentDropScale) * 0.06;
      bloodDropMesh.scale.set(interpolatedScale, interpolatedScale, interpolatedScale);

      // Lub-Dub Ventricular Heartbeat Pulse (Medical Rhythm)
      const heartRate = emergencyGlow ? 3.6 : 2.2;
      const beat1 = Math.pow(Math.sin(time * heartRate), 10) * 0.25;
      const beat2 = Math.pow(Math.sin(time * heartRate + 0.38), 10) * 0.15;
      const totalBeat = 1.0 + beat1 + beat2;
      innerCoreMesh.scale.set(totalBeat, totalBeat, totalBeat);
      innerMaterial.opacity = 0.28 + (beat1 + beat2) * 0.55;

      // Emergency Light Intensification
      if (emergencyGlow) {
        rimLight.color.setHex(0xFF1133);
        rimLight.intensity = 6.5 + Math.sin(time * 6) * 2.0;
      } else {
        rimLight.color.setHex(0xFF334F);
        rimLight.intensity = 5.0;
      }

      // Animate Orbital Gyroscope Rings
      orbitalGroup.rotation.y = time * 0.25;
      orbitalGroup.rotation.x = Math.sin(time * 0.2) * 0.15;

      // Animate Erythrocytes (Red Blood Cells Tumble in Genuine 3D Space)
      erythrocytes.forEach((ery, idx) => {
        const orbitAngle = time * ery.orbitSpeed + ery.phase;
        ery.mesh.position.x = Math.cos(orbitAngle) * ery.orbitRadius;
        ery.mesh.position.z = Math.sin(orbitAngle) * ery.orbitRadius + (idx % 2 === 0 ? 0.6 : -0.6);
        ery.mesh.position.y = ery.basePos.y + Math.sin(time * 1.5 + idx) * 0.3;
        ery.mesh.rotation.x += ery.rotSpeed.x;
        ery.mesh.rotation.y += ery.rotSpeed.y;
        ery.mesh.rotation.z += ery.rotSpeed.z;
      });

      // Animate Network Nodes & Pulsing Halos
      nodeGroup.rotation.y = time * 0.1;
      networkNodes.forEach((node, idx) => {
        const pulse = 1.0 + Math.sin(time * 2.8 + idx * 1.2) * 0.22;
        node.halo.scale.set(pulse, pulse, pulse);
      });

      // Animate Traveling Data Photons
      pulses.forEach(p => {
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;
        p.mesh.position.lerpVectors(p.from, p.to, p.progress);
        p.mesh.position.applyEuler(nodeGroup.rotation);
      });

      // Particulate Drift
      particleSystem.rotation.y = time * 0.02;

      camera.lookAt(heroGroup.position.x * 0.3, heroGroup.position.y * 0.3, 0);

      renderer.render(scene, camera);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    // 21. Cleanup (Phase 11: Comprehensive Disposal)
    return () => {
      isDisposed = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (introTlRef.current) introTlRef.current.kill();
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);

      dropGeometry.dispose();
      dropMaterial.dispose();
      innerGeometry.dispose();
      innerMaterial.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      erythrocyteGeo.dispose();
      erythrocyteMat.dispose();
      sphereGeo.dispose();
      haloGeo.dispose();
      lineMaterial.dispose();
      pulseGeo.dispose();
      pulseMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      pmremGenerator.dispose();
      roomEnv.dispose();
      renderer.dispose();
    };
  }, []);

  const handleSkipIntro = () => {
    if (introTlRef.current) {
      introTlRef.current.progress(1);
    }
    setIntroFinished(true);
    if (onSkipIntro) onSkipIntro();
  };

  if (!webGLSupported) {
    return (
      <div className={`relative flex items-center justify-center p-8 ${className}`}>
        <div className="w-64 h-80 rounded-full bg-gradient-to-b from-[#C72C41]/30 via-[#A91F36]/20 to-transparent blur-3xl absolute" />
        <div className="relative z-10 text-center space-y-3 p-6 rounded-2xl bg-[#321923]/80 border border-[#49303A] backdrop-blur-md">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#C72C41]/20 border border-[#C72C41] flex items-center justify-center text-[#C72C41] text-2xl">
            🩸
          </div>
          <span className="text-xs font-mono text-[#E8A0AA] uppercase font-bold block">
            HEMOCONNECT 3D ENGINE
          </span>
          <p className="text-[11px] text-[#C3AEB4] max-w-xs font-sans">
            Hardware acceleration active.
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
          onClick={handleSkipIntro}
          className="absolute bottom-5 right-6 text-[10px] font-mono tracking-widest text-[#9C858D] hover:text-[#FFF7F5] bg-[#24151D]/70 hover:bg-[#321923] border border-[#49303A]/60 px-3.5 py-1.5 rounded-full transition-all cursor-pointer backdrop-blur-md z-30 shadow-lg"
        >
          SKIP INTRO ➔
        </button>
      )}
    </div>
  );
}
