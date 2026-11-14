import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CalculatedPoint, SiteConfig } from '../types';
import { createEarthTexture, createLunarSurfaceTexture } from '../services/lunarTexture';
import { useLanguage } from '../i18n/LanguageContext';
import {
  Compass,
  Eye,
  Maximize2,
  Minimize2,
  Sun,
  Globe,
  ExternalLink,
} from 'lucide-react';

interface LunarVirtual3DViewProps {
  sites: SiteConfig[];
  selectedSiteId: string;
  onSelectSite: (siteId: string) => void;
  activePoint: CalculatedPoint | null;
}

type CameraPreset = 'orbit' | 'site' | 'surface' | 'sun' | 'earth';

export const LunarVirtual3DView: React.FC<LunarVirtual3DViewProps> = ({
  sites,
  selectedSiteId,
  onSelectSite,
  activePoint,
}) => {
  const { language } = useLanguage();
  const mountRef = useRef<HTMLDivElement | null>(null);

  // UI States
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('orbit');
  const [elevationExaggeration, setElevationExaggeration] = useState<number>(2.5);
  const [enableShadows, setEnableShadows] = useState<boolean>(true);
  const [showBeams, setShowBeams] = useState<boolean>(true);
  const [showCompass, setShowCompass] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // References to dynamic Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const sunMeshRef = useRef<THREE.Mesh | null>(null);
  const earthMeshRef = useRef<THREE.Mesh | null>(null);
  const sunBeamRef = useRef<THREE.Line | null>(null);
  const earthBeamRef = useRef<THREE.Line | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const siteMarkersRef = useRef<THREE.Group | null>(null);
  const compassRingRef = useRef<THREE.Mesh | null>(null);

  const activeSite = sites.find((s) => s.id === selectedSiteId) || sites[0];

  // Map lunar lat/lon (-90° to -84°S) to 3D world space (XZ plane, Y up)
  // Base polar radius = 100 units (represents ~180 km radius from South Pole)
  const projectCoordsToWorld = useCallback((lat: number, lon: number, radiusScale: number = 100) => {
    // Distance from pole in degrees [0, 6 deg]
    const degFromPole = Math.max(0, -lat - 84.0); // -90 -> 6, -84 -> 0
    const normalizedRadius = (1 - degFromPole / 6.0) * radiusScale;

    // East-positive longitude: 0° is +Z (Earth-facing meridian), 90° is +X, 180° is -Z, 270° is -X
    const lonRad = (lon * Math.PI) / 180.0;
    const x = Math.sin(lonRad) * normalizedRadius;
    const z = Math.cos(lonRad) * normalizedRadius;
    return { x, z, r: normalizedRadius };
  }, []);

  // Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 480;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05070f);
    scene.fog = new THREE.FogExp2(0x05070f, 0.0012);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 3000);
    camera.position.set(0, 160, 190);
    cameraRef.current = camera;

    // 3. Renderer with soft shadows
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = enableShadows;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.08; // Allow viewing slightly below horizon
    controls.minDistance = 5;
    controls.maxDistance = 600;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // 5. Ambient starfield light + subtle earthshine
    const ambientLight = new THREE.AmbientLight(0x222a3d, 0.4);
    scene.add(ambientLight);

    // Deep space starry backdrop
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 1200;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 900 + Math.random() * 200;
      starPos[i] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i + 1] = r * Math.cos(phi);
      starPos[i + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starsMat = new THREE.PointsMaterial({ color: 0xdde5ff, size: 1.5, sizeAttenuation: false });
    const starField = new THREE.Points(starsGeo, starsMat);
    scene.add(starField);

    // 6. Detailed 3D Lunar South Polar Terrain Mesh
    const terrainRadius = 110;
    const terrainGeo = new THREE.CylinderGeometry(terrainRadius, terrainRadius * 1.02, 12, 128, 64);
    const posAttr = terrainGeo.attributes.position;

    // Displace vertices to sculpt south-polar craters & ridges
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      const vz = posAttr.getZ(i);

      if (vy > 0) {
        // Top surface: compute elevation from crater profiles
        const distFromCenter = Math.sqrt(vx * vx + vz * vz);
        let heightMod = 0;

        // Shackleton crater at center (0, 0)
        const dShackleton = distFromCenter;
        if (dShackleton < 10) {
          // deep bowl
          heightMod -= Math.cos((dShackleton / 10) * (Math.PI / 2)) * 6.0;
        } else if (dShackleton < 14) {
          // raised rim
          heightMod += Math.sin(((dShackleton - 10) / 4) * Math.PI) * 1.8;
        }

        // Connecting Ridge (elevated bridge toward -Z / de Gerlache)
        const dRidge = Math.sqrt(Math.pow(vx - 7, 2) + Math.pow(vz + 18, 2));
        if (dRidge < 12) {
          heightMod += Math.cos((dRidge / 12) * (Math.PI / 2)) * 2.5;
        }

        // Malapert Mountain Massif (+Z / 0°E, ~35km out)
        const dMalapert = Math.sqrt(Math.pow(vx + 4, 2) + Math.pow(vz - 48, 2));
        if (dMalapert < 20) {
          heightMod += Math.cos((dMalapert / 20) * (Math.PI / 2)) * 7.5; // High 5km massif peak
        }

        // de Gerlache Crater
        const dGerlache = Math.sqrt(Math.pow(vx - 22, 2) + Math.pow(vz + 32, 2));
        if (dGerlache < 16) {
          heightMod -= Math.cos((dGerlache / 16) * (Math.PI / 2)) * 5.2;
        } else if (dGerlache < 20) {
          heightMod += Math.sin(((dGerlache - 16) / 4) * Math.PI) * 1.5;
        }

        // Add micro-roughness
        const micro = Math.sin(vx * 0.4) * Math.cos(vz * 0.4) * 0.4;
        posAttr.setY(i, vy + (heightMod + micro) * (elevationExaggeration / 2.0));
      }
    }
    terrainGeo.computeVertexNormals();

    const lunarTex = createLunarSurfaceTexture(1024);
    const terrainMat = new THREE.MeshStandardMaterial({
      map: lunarTex,
      roughness: 0.88,
      metalness: 0.05,
      flatShading: false,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    terrainMesh.castShadow = true;
    terrainMesh.position.y = -6;
    scene.add(terrainMesh);
    terrainMeshRef.current = terrainMesh;

    // 7. Sun (Directional Light with dynamic shadow + Visual Sphere)
    const sunLight = new THREE.DirectionalLight(0xfff7e6, 3.2);
    sunLight.castShadow = enableShadows;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 600;
    sunLight.shadow.camera.left = -120;
    sunLight.shadow.camera.right = 120;
    sunLight.shadow.camera.top = 120;
    sunLight.shadow.camera.bottom = -120;
    sunLight.shadow.bias = -0.0004;
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    const sunGeo = new THREE.SphereGeometry(6, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffea75 });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    scene.add(sunMesh);
    sunMeshRef.current = sunMesh;

    // Sun directional beam line
    const sunBeamGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
    ]);
    const sunBeamMat = new THREE.LineBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.65,
      linewidth: 2,
    });
    const sunBeam = new THREE.Line(sunBeamGeo, sunBeamMat);
    scene.add(sunBeam);
    sunBeamRef.current = sunBeam;

    // 8. Earth (Textured 3D Sphere + Atmosphere Glow)
    const earthGeo = new THREE.SphereGeometry(7.5, 32, 32);
    const earthTex = createEarthTexture(512);
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTex,
      roughness: 0.6,
      metalness: 0.1,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earthMesh);
    earthMeshRef.current = earthMesh;

    // Earth directional beam line
    const earthBeamGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
    ]);
    const earthBeamMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65,
      linewidth: 2,
    });
    const earthBeam = new THREE.Line(earthBeamGeo, earthBeamMat);
    scene.add(earthBeam);
    earthBeamRef.current = earthBeam;

    // 9. Polar Azimuth Compass Ring
    const compassGeo = new THREE.RingGeometry(112, 114, 64);
    const compassMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
    });
    const compassRing = new THREE.Mesh(compassGeo, compassMat);
    compassRing.rotation.x = Math.PI / 2;
    compassRing.position.y = 0.5;
    scene.add(compassRing);
    compassRingRef.current = compassRing;

    // 10. Candidate Site Markers Group
    const siteGroup = new THREE.Group();
    scene.add(siteGroup);
    siteMarkersRef.current = siteGroup;

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();

      // Slow axial rotation for Earth
      if (earthMeshRef.current) {
        earthMeshRef.current.rotation.y += 0.003;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 480;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      terrainGeo.dispose();
      sunGeo.dispose();
      earthGeo.dispose();
      starsGeo.dispose();
    };
  }, [elevationExaggeration, enableShadows]);

  // Update Dynamic Sun, Earth, and Markers when activePoint or sites change
  useEffect(() => {
    if (!sceneRef.current || !activePoint) return;

    // 1. Position Sun in 3D Space
    // Azimuth: 0° is North (-Z in local topo), 90° East (+X), 180° South (+Z), 270° West (-X)
    const sunAzRad = (activePoint.sunAzimuth * Math.PI) / 180.0;
    const sunElRad = (activePoint.sunElevation * Math.PI) / 180.0;
    const sunDist = 260;

    const sunX = Math.sin(sunAzRad) * Math.cos(sunElRad) * sunDist;
    const sunY = Math.max(-20, Math.sin(sunElRad) * sunDist);
    const sunZ = Math.cos(sunAzRad) * Math.cos(sunElRad) * sunDist;

    if (sunLightRef.current && sunMeshRef.current) {
      sunLightRef.current.position.set(sunX, sunY, sunZ);
      sunLightRef.current.target.position.set(0, 0, 0);
      sunMeshRef.current.position.set(sunX, sunY, sunZ);

      // Dim sun light if below terrain / 0° horizon
      const isSunlit = activePoint.sunlitState === 'visible';
      sunLightRef.current.intensity = isSunlit ? 3.2 : 0.4;
    }

    // 2. Position Earth in 3D Space
    const earthAzRad = (activePoint.earthAzimuth * Math.PI) / 180.0;
    const earthElRad = (activePoint.earthElevation * Math.PI) / 180.0;
    const earthDist = 240;

    const earthX = Math.sin(earthAzRad) * Math.cos(earthElRad) * earthDist;
    const earthY = Math.max(-20, Math.sin(earthElRad) * earthDist);
    const earthZ = Math.cos(earthAzRad) * Math.cos(earthElRad) * earthDist;

    if (earthMeshRef.current) {
      earthMeshRef.current.position.set(earthX, earthY, earthZ);
    }

    // 3. Update Celestial Beams
    if (sunBeamRef.current && earthBeamRef.current) {
      sunBeamRef.current.visible = showBeams;
      earthBeamRef.current.visible = showBeams;

      const pPos = projectCoordsToWorld(activeSite.latitude, activeSite.longitude);
      const groundPos = new THREE.Vector3(pPos.x, 2, pPos.z);

      const sunPts = [groundPos, new THREE.Vector3(sunX, sunY, sunZ)];
      sunBeamRef.current.geometry.setFromPoints(sunPts);

      const earthPts = [groundPos, new THREE.Vector3(earthX, earthY, earthZ)];
      earthBeamRef.current.geometry.setFromPoints(earthPts);
    }

    if (compassRingRef.current) {
      compassRingRef.current.visible = showCompass;
    }

    // 4. Update 3D Candidate Site Markers
    if (siteMarkersRef.current) {
      // Clear previous markers
      while (siteMarkersRef.current.children.length > 0) {
        siteMarkersRef.current.remove(siteMarkersRef.current.children[0]);
      }

      sites.forEach((s) => {
        const isSelected = s.id === selectedSiteId;
        const coords = projectCoordsToWorld(s.latitude, s.longitude);

        const markerGroup = new THREE.Group();
        markerGroup.position.set(coords.x, 0.5, coords.z);

        // Ground landing ring
        const ringGeo = new THREE.RingGeometry(isSelected ? 3.5 : 2.5, isSelected ? 4.5 : 3.0, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(s.color),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: isSelected ? 0.9 : 0.5,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        markerGroup.add(ringMesh);

        // Vertical beacon laser pillar
        const pillarHeight = isSelected ? 30 : 15;
        const pillarGeo = new THREE.CylinderGeometry(0.3, 0.3, pillarHeight, 16);
        const pillarMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(s.color),
          transparent: true,
          opacity: isSelected ? 0.75 : 0.4,
        });
        const pillarMesh = new THREE.Mesh(pillarGeo, pillarMat);
        pillarMesh.position.y = pillarHeight / 2;
        markerGroup.add(pillarMesh);

        // Glowing apex beacon light
        const beaconGeo = new THREE.SphereGeometry(isSelected ? 1.4 : 0.9, 16, 16);
        const beaconMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
        beaconMesh.position.y = pillarHeight;
        markerGroup.add(beaconMesh);

        siteMarkersRef.current?.add(markerGroup);
      });
    }
  }, [activePoint, sites, selectedSiteId, showBeams, projectCoordsToWorld, activeSite]);

  // Handle Camera Presets
  const applyCameraPreset = (preset: CameraPreset) => {
    setCameraPreset(preset);
    if (!controlsRef.current || !cameraRef.current || !activePoint) return;

    const coords = projectCoordsToWorld(activeSite.latitude, activeSite.longitude);
    const siteVec = new THREE.Vector3(coords.x, 2, coords.z);

    if (preset === 'orbit') {
      // High-altitude south polar overview
      cameraRef.current.position.set(0, 160, 190);
      controlsRef.current.target.set(0, 0, 0);
    } else if (preset === 'site') {
      // Zoomed in onto candidate landing site
      cameraRef.current.position.set(coords.x + 25, 20, coords.z + 30);
      controlsRef.current.target.copy(siteVec);
    } else if (preset === 'surface') {
      // First-person lander POV looking out toward horizon
      cameraRef.current.position.set(coords.x, 2.5, coords.z);
      // Look toward Sun
      const sunAzRad = (activePoint.sunAzimuth * Math.PI) / 180.0;
      const targetX = coords.x + Math.sin(sunAzRad) * 60;
      const targetZ = coords.z + Math.cos(sunAzRad) * 60;
      controlsRef.current.target.set(targetX, 4, targetZ);
    } else if (preset === 'sun') {
      // Look straight at Sun from active site
      cameraRef.current.position.set(coords.x, 4, coords.z);
      if (sunMeshRef.current) {
        controlsRef.current.target.copy(sunMeshRef.current.position);
      }
    } else if (preset === 'earth') {
      // Look straight at Earth from active site
      cameraRef.current.position.set(coords.x, 4, coords.z);
      if (earthMeshRef.current) {
        controlsRef.current.target.copy(earthMeshRef.current.position);
      }
    }
    controlsRef.current.update();
  };

  const quickmapUrl = `https://quickmap.lroc.asu.edu/?extent=${activeSite.longitude - 2},${activeSite.latitude - 1},${activeSite.longitude + 2},${activeSite.latitude + 1}&proj=11`;
  const moonTrekUrl = `https://trek.nasa.gov/moon/#v=0.1&x=${activeSite.longitude}&y=${activeSite.latitude}&z=7&p=urn%3Aogc%3Adef%3Acrs%3AEPSG%3A%3A104903`;

  return (
    <div
      className={`relative bg-[#070B14] border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 shadow-2xl border-cyan-500/60' : 'h-[500px]'
      }`}
    >
      {/* 1. Header Toolbar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex flex-wrap items-center justify-between px-3 py-2 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 text-xs">
        <div className="flex items-center space-x-2">
          <Compass className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-slate-100 uppercase tracking-wider font-mono">
            {language === 'vi' ? 'Không Gian 3D Ảo Cực Nam Mặt Trăng' : 'Lunar South Pole 3D Virtual Space'}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-mono">
            WebGL Three.js & LOLA
          </span>
        </div>

        {/* Camera Preset Buttons */}
        <div className="flex items-center space-x-1 font-sans text-[11px]">
          <button
            type="button"
            onClick={() => applyCameraPreset('orbit')}
            className={`px-2 py-1 rounded transition ${
              cameraPreset === 'orbit'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {language === 'vi' ? 'Quỹ Đạo' : 'Polar Orbit'}
          </button>
          <button
            type="button"
            onClick={() => applyCameraPreset('site')}
            className={`px-2 py-1 rounded transition ${
              cameraPreset === 'site'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {language === 'vi' ? 'Cận Cảnh' : 'Site Focus'}
          </button>
          <button
            type="button"
            onClick={() => applyCameraPreset('surface')}
            className={`px-2 py-1 rounded transition ${
              cameraPreset === 'surface'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Eye className="w-3 h-3 inline mr-1" />
            POV
          </button>
          <button
            type="button"
            onClick={() => applyCameraPreset('sun')}
            className={`px-2 py-1 rounded transition ${
              cameraPreset === 'sun'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-amber-300 hover:bg-slate-800'
            }`}
          >
            <Sun className="w-3 h-3 inline mr-1" />
            {language === 'vi' ? 'M.Trời' : 'Sun'}
          </button>
          <button
            type="button"
            onClick={() => applyCameraPreset('earth')}
            className={`px-2 py-1 rounded transition ${
              cameraPreset === 'earth'
                ? 'bg-blue-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-blue-300 hover:bg-slate-800'
            }`}
          >
            <Globe className="w-3 h-3 inline mr-1" />
            {language === 'vi' ? 'T.Đất' : 'Earth'}
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 ml-1 transition"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* 3. Live 3D Overlay Telemetry HUD */}
      {activePoint && (
        <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-slate-950/85 backdrop-blur-md border border-slate-800 text-slate-200 shadow-xl flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 text-amber-400">
              <Sun className="w-3.5 h-3.5" />
              <span>
                Az {activePoint.sunAzimuth.toFixed(1)}° | El {activePoint.sunElevation.toFixed(2)}°
              </span>
            </div>
            <div className="w-px h-3 bg-slate-700" />
            <div className="flex items-center space-x-1.5 text-blue-400">
              <Globe className="w-3.5 h-3.5" />
              <span>
                Az {activePoint.earthAzimuth.toFixed(1)}° | El {activePoint.earthElevation.toFixed(2)}°
              </span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 px-2 flex items-center gap-2">
            <span>NASA JPL Horizons Target 10 & 399 | LRO LOLA DEM</span>
          </div>
        </div>
      )}

      {/* 4. Settings Drawer / Toggle Controls */}
      <div className="absolute top-12 right-3 z-10 flex flex-col gap-1.5 text-[11px] font-sans">
        <div className="px-2.5 py-2 rounded-lg bg-slate-950/85 backdrop-blur-md border border-slate-800 shadow-xl flex flex-col gap-2">
          <label className="flex items-center justify-between gap-2 cursor-pointer text-slate-300 hover:text-white">
            <span>{language === 'vi' ? 'Tia Sáng Vector' : 'Light Beams'}</span>
            <input
              type="checkbox"
              checked={showBeams}
              onChange={(e) => setShowBeams(e.target.checked)}
              className="accent-cyan-400"
            />
          </label>
          <label className="flex items-center justify-between gap-2 cursor-pointer text-slate-300 hover:text-white">
            <span>{language === 'vi' ? 'Bóng Đổ Động' : 'Shadows'}</span>
            <input
              type="checkbox"
              checked={enableShadows}
              onChange={(e) => setEnableShadows(e.target.checked)}
              className="accent-cyan-400"
            />
          </label>
          <label className="flex items-center justify-between gap-2 cursor-pointer text-slate-300 hover:text-white">
            <span>{language === 'vi' ? 'Vòng Phương Vị' : 'Compass Ring'}</span>
            <input
              type="checkbox"
              checked={showCompass}
              onChange={(e) => setShowCompass(e.target.checked)}
              className="accent-cyan-400"
            />
          </label>
          <div className="pt-1 border-t border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-1">
              {language === 'vi' ? 'Khuếch đại độ cao' : 'Exaggeration'}: {elevationExaggeration}x
            </span>
            <input
              type="range"
              min="1.0"
              max="5.0"
              step="0.5"
              value={elevationExaggeration}
              onChange={(e) => setElevationExaggeration(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 h-1 cursor-pointer"
            />
          </div>
        </div>

        {/* Candidate Site Quick Selectors */}
        <div className="flex items-center gap-1 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-lg border border-slate-800 shadow-xl justify-end">
          {sites.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectSite(s.id)}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition flex items-center space-x-1 ${
                s.id === selectedSiteId
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
              <span>{s.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* External NASA GIS Links */}
        <div className="flex gap-1 justify-end">
          <a
            href={quickmapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-cyan-400 text-[10px] flex items-center gap-1 transition"
            title="Open in LROC QuickMap"
          >
            <span>QuickMap</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <a
            href={moonTrekUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-cyan-400 text-[10px] flex items-center gap-1 transition"
            title="Open in NASA Moon Trek"
          >
            <span>Moon Trek</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
