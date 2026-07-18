"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as THREE from "three";
import { ArrowLeft, Globe, Clock, Activity, ShieldCheck } from "lucide-react";

interface CityLabel {
  name: string;
  x: number;
  y: number;
  visible: boolean;
}

function Globe3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cityLabels, setCityLabels] = useState<CityLabel[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 350;
    const height = containerRef.current.clientHeight || 280;

    // Create scene, camera, renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 8.5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2));
    
    // Clear the container first to avoid duplicate canvases in dev HMR
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(renderer.domElement);

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const radius = 3.2;

    // 1. Dark base sphere to obscure back-facing meshes
    const baseGeo = new THREE.SphereGeometry(radius * 0.98, 32, 32);
    const baseMat = new THREE.MeshBasicMaterial({
      color: 0x05080f,
      transparent: true,
      opacity: 0.85,
    });
    const baseSphere = new THREE.Mesh(baseGeo, baseMat);
    globeGroup.add(baseSphere);

    // 2. Holographic wireframe mesh
    const wireGeo = new THREE.SphereGeometry(radius, 18, 18);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const wireSphere = new THREE.Mesh(wireGeo, wireMat);
    globeGroup.add(wireSphere);

    // 3. Equatorial & Meridian grid rings
    const ringMat = new THREE.LineBasicMaterial({
      color: 0xb026ff, // magenta
      transparent: true,
      opacity: 0.3,
    });

    const equatorGeo = new THREE.BufferGeometry();
    const equatorPoints = [];
    for (let i = 0; i <= 64; i++) {
      const theta = (i / 64) * Math.PI * 2;
      equatorPoints.push(new THREE.Vector3(radius * Math.cos(theta), 0, radius * Math.sin(theta)));
    }
    equatorGeo.setFromPoints(equatorPoints);
    const equatorLine = new THREE.Line(equatorGeo, ringMat);
    globeGroup.add(equatorLine);

    const meridianGeo = new THREE.BufferGeometry();
    const meridianPoints = [];
    for (let i = 0; i <= 64; i++) {
      const theta = (i / 64) * Math.PI * 2;
      meridianPoints.push(new THREE.Vector3(radius * Math.cos(theta), radius * Math.sin(theta), 0));
    }
    meridianGeo.setFromPoints(meridianPoints);
    const meridianLine = new THREE.Line(meridianGeo, ringMat);
    globeGroup.add(meridianLine);

    // 4. Cities and coordinates conversion helper
    const cities = [
      { name: "Sydney", lat: -33.8688, lon: 151.2093, color: 0x00f0ff }, // cyan
      { name: "Tokyo", lat: 35.6762, lon: 139.6503, color: 0xb026ff }, // magenta
      { name: "London", lat: 51.5074, lon: -0.1278, color: 0x10b981 }, // emerald
      { name: "New York", lat: 40.7128, lon: -74.0060, color: 0xf59e0b }, // amber
    ];

    const latLngToVector3 = (lat: number, lon: number, r: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -(r * Math.sin(phi) * Math.sin(theta)),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.cos(theta)
      );
    };

    const markerMeshes: Record<string, THREE.Mesh> = {};

    cities.forEach((city) => {
      const pos = latLngToVector3(city.lat, city.lon, radius);

      // Core marker point
      const markerGeo = new THREE.SphereGeometry(0.12, 12, 12);
      const markerMat = new THREE.MeshBasicMaterial({
        color: city.color,
      });
      const markerMesh = new THREE.Mesh(markerGeo, markerMat);
      markerMesh.position.copy(pos);
      globeGroup.add(markerMesh);
      markerMeshes[city.name] = markerMesh;

      // Pulse ring outward from center
      const outerRingGeo = new THREE.RingGeometry(0.16, 0.26, 16);
      const outerRingMat = new THREE.MeshBasicMaterial({
        color: city.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65,
      });
      const outerRingMesh = new THREE.Mesh(outerRingGeo, outerRingMat);
      outerRingMesh.position.copy(pos);
      outerRingMesh.lookAt(new THREE.Vector3(0, 0, 0));
      
      const dir = pos.clone().normalize();
      outerRingMesh.position.addScaledVector(dir, 0.02);

      globeGroup.add(outerRingMesh);
    });

    // Interaction vars
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let lastInteractionTime = 0;

    // Initial globe rotation orientation (start rotated slightly so cities are visible)
    globeGroup.rotation.y = -1.2;
    globeGroup.rotation.x = 0.2;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
      lastInteractionTime = Date.now();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaMove = {
        x: e.clientX - previousMousePosition.x,
        y: e.clientY - previousMousePosition.y,
      };
      
      globeGroup.rotation.y += deltaMove.x * 0.007;
      globeGroup.rotation.x += deltaMove.y * 0.007;
      
      // Clamp X rotation to avoid pole-flipping
      globeGroup.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, globeGroup.rotation.x));

      previousMousePosition = { x: e.clientX, y: e.clientY };
      lastInteractionTime = Date.now();
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        lastInteractionTime = Date.now();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaMove = {
        x: e.touches[0].clientX - previousMousePosition.x,
        y: e.touches[0].clientY - previousMousePosition.y,
      };

      globeGroup.rotation.y += deltaMove.x * 0.007;
      globeGroup.rotation.x += deltaMove.y * 0.007;
      globeGroup.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, globeGroup.rotation.x));

      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      lastInteractionTime = Date.now();
    };

    const handleTouchEnd = () => {
      isDragging = false;
    };

    const container = containerRef.current;
    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Auto rotation if inactive
      if (!isDragging && Date.now() - lastInteractionTime > 4000) {
        globeGroup.rotation.y += 0.0025;
      }

      renderer.render(scene, camera);

      // Update projected HTML city labels
      const projected: CityLabel[] = [];
      cities.forEach((city) => {
        const marker = markerMeshes[city.name];
        if (marker) {
          const worldPos = new THREE.Vector3();
          marker.getWorldPosition(worldPos);

          // Dot product with camera look direction to determine if on front side
          const toCamera = camera.position.clone().normalize();
          const dot = worldPos.clone().normalize().dot(toCamera);
          const isVisible = dot > 0.05;

          const tempV = worldPos.clone();
          tempV.project(camera);

          const x = (tempV.x * 0.5 + 0.5) * width;
          const y = (-tempV.y * 0.5 + 0.5) * height;

          projected.push({
            name: city.name,
            x,
            y,
            visible: isVisible,
          });
        }
      });
      setCityLabels(projected);
    };

    animate();

    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (container) {
        container.removeEventListener("mousedown", handleMouseDown);
        container.removeEventListener("touchstart", handleTouchStart);
        try {
          container.removeChild(renderer.domElement);
        } catch (e) {
          // ignore
        }
      }
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);

      // Dispose webgl context resources
      scene.clear();
      renderer.dispose();
      baseGeo.dispose();
      baseMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      ringMat.dispose();
      equatorGeo.dispose();
      meridianGeo.dispose();
    };
  }, []);

  return (
    <div className="relative h-[280px] w-full bg-slate-950/60 border border-cyan-400/20 chamfer overflow-hidden select-none">
      <div className="absolute top-[4px] left-[4px] w-2 h-2 border-t border-l border-cyan-400/60" />
      <div className="absolute bottom-[4px] right-[4px] w-2 h-2 border-b border-r border-cyan-400/60" />

      <div className="absolute top-2 left-2 text-[8px] font-mono text-cyan-400/40 uppercase tracking-widest">
        GRID.ORBITAL_STATION // LIVE_COORD
      </div>
      <div className="absolute bottom-2 right-2 text-[8px] font-mono text-cyan-400/40 uppercase tracking-widest">
        DRAG PROTOCOL ACTIVE
      </div>

      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {cityLabels.map((label) => {
        if (!label.visible) return null;
        
        let markerColor = "border-cyan-400/40 text-cyan-300";
        if (label.name === "Tokyo") markerColor = "border-purple-400/40 text-purple-300";
        else if (label.name === "London") markerColor = "border-emerald-400/40 text-emerald-300";
        else if (label.name === "New York") markerColor = "border-amber-400/40 text-amber-300";

        return (
          <div
            key={label.name}
            className={`absolute pointer-events-none -translate-x-1/2 -translate-y-full font-mono text-[9px] font-bold bg-slate-950/90 border px-1.5 py-0.5 rounded shadow-[0_0_8px_rgba(0,0,0,0.8)] transition-all duration-100 ${markerColor}`}
            style={{
              left: `${label.x}px`,
              top: `${label.y - 6}px`,
            }}
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1 animate-pulse" />
            {label.name.toUpperCase()}
          </div>
        );
      })}
    </div>
  );
}

export default function SesiPage() {
  const [mounted, setMounted] = useState(false);
  const [clockTime, setClockTime] = useState("");
  const [marketStatuses, setMarketStatuses] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMounted(true);

    const updateClock = () => {
      const formatted = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(new Date());
      setClockTime(`${formatted} WIB`);
    };

    const updateStatuses = () => {
      const d = new Date();
      const utcHours = d.getUTCHours();
      const utcMinutes = d.getUTCMinutes();
      const decimalTime = utcHours + utcMinutes / 60;

      // Sydney session: 22:00 to 07:00 UTC
      // Tokyo session: 00:00 to 09:00 UTC
      // London session: 08:00 to 17:00 UTC
      // New York session: 13:00 to 22:00 UTC
      setMarketStatuses({
        Sydney: decimalTime >= 22 || decimalTime < 7,
        Tokyo: decimalTime >= 0 && decimalTime < 9,
        London: decimalTime >= 8 && decimalTime < 17,
        "New York": decimalTime >= 13 && decimalTime < 22,
      });
    };

    updateClock();
    updateStatuses();

    const clockInterval = setInterval(updateClock, 1000);
    const statusInterval = setInterval(updateStatuses, 30000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(statusInterval);
    };
  }, []);

  const MARKETS = [
    { city: "Sydney", code: "SYD", utcRange: "22:00 - 07:00 UTC", color: "border-cyan-400/20 text-cyan-300" },
    { city: "Tokyo", code: "TYO", utcRange: "00:00 - 09:00 UTC", color: "border-purple-400/20 text-purple-300" },
    { city: "London", code: "LDN", utcRange: "08:00 - 17:00 UTC", color: "border-emerald-400/20 text-emerald-300" },
    { city: "New York", code: "NYC", utcRange: "13:00 - 22:00 UTC", color: "border-amber-400/20 text-amber-300" },
  ];

  return (
    <div className="space-y-6">
      {/* Navigation Line */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-[10px] uppercase font-mono tracking-wider text-slate-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft size={12} /> [ KEMBALI ]
        </Link>
        <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono">
          [ SESSION_MONITOR ]
        </span>
      </div>

      {/* 1. Large prominent WIB clock display at the top */}
      <div className="chamfer p-5 bg-[#0b0f18]/60 border border-cyan-400/20 relative text-center">
        <div className="absolute top-[4px] left-[4px] w-3 h-3 border-t border-l border-cyan-400/60" />
        <div className="absolute bottom-[4px] right-[4px] w-3 h-3 border-b border-r border-cyan-400/60" />

        <span className="flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono mb-2">
          <Clock size={12} className="text-cyan-400 animate-pulse" /> [ JAKARTA STANDARD TIME ]
        </span>
        
        {mounted ? (
          <h1 className="text-3xl font-mono font-bold text-cyan-300 text-glow-cyan tracking-wide">
            {clockTime}
          </h1>
        ) : (
          <h1 className="text-3xl font-mono font-bold text-cyan-300/40 tracking-wide">
            --:--:-- WIB
          </h1>
        )}
      </div>

      {/* 2. 3D interactive WebGL globe with city markers */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-[10.5px] tracking-[0.3em] text-cyan-300/70 font-semibold uppercase font-mono">
            [ GEOLOCALIZATION PROTOCOL ]
          </span>
          <div className="flex-1 h-px bg-cyan-400/20" />
        </div>

        {!mounted ? (
          <div className="h-[280px] w-full bg-slate-950/60 border border-cyan-400/20 chamfer flex flex-col items-center justify-center font-mono text-cyan-400/70 text-[11px] tracking-wider">
            <div className="w-6 h-6 border-2 border-t-cyan-300 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-3"></div>
            [ INITIALIZING VECTOR MAPS ]
          </div>
        ) : (
          <Globe3D />
        )}
      </div>

      {/* 3. Market status cards below */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-[10.5px] tracking-[0.3em] text-cyan-300/70 font-semibold uppercase font-mono">
            [ SESSION LIVE OVERVIEW ]
          </span>
          <div className="flex-1 h-px bg-cyan-400/20" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {MARKETS.map((m) => {
            const isOpen = marketStatuses[m.city];
            return (
              <div
                key={m.city}
                className={`chamfer-sm p-3 bg-slate-950/50 border transition-all duration-200 relative ${
                  isOpen ? "border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.05)]" : "border-slate-800/40"
                }`}
              >
                {/* Subtle signal glow indicator */}
                <span
                  className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${
                    isOpen ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-slate-600"
                  }`}
                />

                <span className="text-[8px] font-mono text-slate-500 tracking-wider block mb-0.5">
                  SESSION // {m.code}
                </span>
                
                <h3 className="font-display font-bold text-white text-sm">
                  {m.city}
                </h3>
                
                <p className="text-[9px] text-slate-400 font-mono mt-0.5 mb-2">
                  {m.utcRange}
                </p>

                <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-dashed border-white/5">
                  <span className="text-[9px] font-mono text-slate-500">STATUS</span>
                  <span className={`text-[10px] font-mono font-bold tracking-widest ${
                    isOpen ? "text-emerald-400" : "text-slate-500"
                  }`}>
                    {isOpen ? "[ BUKA ]" : "[ TUTUP ]"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
