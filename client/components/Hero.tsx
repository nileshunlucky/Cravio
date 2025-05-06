'use client';

import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';

const Hero = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    // Initialize GSAP plugins
    gsap.registerPlugin(ScrollTrigger);
    

    if (!canvasRef.current) return;

    // Three.js setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });

    // Set renderer size and pixel ratio based on device
    const updateSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const isMobileView = window.innerWidth < 768;
        
        // Size for both mobile and desktop
        const size = isMobileView ? Math.min(containerWidth * 0.9, 450) : Math.min(containerWidth * 0.6, 650);
        
        renderer.setSize(size, size);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        camera.aspect = 1; // Keep aspect ratio 1:1 for the sphere
        camera.updateProjectionMatrix();
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);

    // Configure renderer for better quality
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputEncoding = THREE.sRGBEncoding;

    // Create bloom/glow effect composer
    const bloomPass = () => {
      // Simulate bloom effect with emissive materials since we're not using EffectComposer
      // This is a workaround for performance
      scene.background = new THREE.Color(0x000000);
      scene.fog = new THREE.FogExp2(0x000000, 0.001);
    };
    bloomPass();

    // Create the camera sphere object with improved materials
    const createCameraSphere = () => {
      const group = new THREE.Group();
      
      // Main sphere
      const geometry = new THREE.SphereGeometry(1.2, 64, 64);
      const material = new THREE.MeshStandardMaterial({
        color: 0x111111,
        metalness: 0.9,
        roughness: 0.1,
        envMapIntensity: 1.5
      });
      const sphere = new THREE.Mesh(geometry, material);
      group.add(sphere);
      
      // Lens element with improved detail
      const lensGeometry = new THREE.CylinderGeometry(0.7, 0.7, 0.4, 64);
      const lensMaterial = new THREE.MeshStandardMaterial({
        color: 0x111111,
        metalness: 1.0,
        roughness: 0.05,
      });
      const lens = new THREE.Mesh(lensGeometry, lensMaterial);
      lens.rotation.x = Math.PI / 2;
      lens.position.z = 1.2;
      group.add(lens);
      
      // Lens glass with glow
      const glassGeometry = new THREE.CircleGeometry(0.6, 64);
      const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x000066,
        metalness: 0.1,
        roughness: 0.1,
        transmission: 0.9,
        reflectivity: 0.2,
        emissive: 0x0033aa,
        emissiveIntensity: 0.5,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1
      });
      const glass = new THREE.Mesh(glassGeometry, glassMaterial);
      glass.position.z = 1.45;
      glass.rotation.x = Math.PI / 2;
      group.add(glass);
      
      // Outer ring (silver)
      const outerRingGeometry = new THREE.TorusGeometry(1.3, 0.08, 32, 100);
      const outerRingMaterial = new THREE.MeshStandardMaterial({
        color: 0x777777,
        metalness: 1.0,
        roughness: 0.05,
      });
      const outerRing = new THREE.Mesh(outerRingGeometry, outerRingMaterial);
      outerRing.rotation.x = Math.PI / 2;
      group.add(outerRing);
      
      // Red accent ring with glow
      const accentRingGeometry = new THREE.TorusGeometry(1.45, 0.05, 32, 100);
      const accentRingMaterial = new THREE.MeshStandardMaterial({
        color: 0xff3300,
        metalness: 0.7,
        roughness: 0.2,
        emissive: 0xff2200,
        emissiveIntensity: 2.0,
      });
      const accentRing = new THREE.Mesh(accentRingGeometry, accentRingMaterial);
      accentRing.rotation.x = Math.PI / 2;
      accentRing.position.z = 0.1;
      group.add(accentRing);
      
      // Additional details - buttons and dials
      const addDetailElements = (group: THREE.Group) => {
        // Small button/dial
        const dialGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 32);
        const dialMaterial = new THREE.MeshStandardMaterial({
          color: 0x333333,
          metalness: 0.9,
          roughness: 0.1,
        });
        
        // Add several dials around the top
        for (let i = 0; i < 5; i++) {
          const dial = new THREE.Mesh(dialGeometry, dialMaterial);
          const angle = (i / 5) * Math.PI * 2;
          dial.position.set(
            Math.cos(angle) * 1.35,
            Math.sin(angle) * 1.35,
            0.3
          );
          dial.rotation.x = Math.PI / 2;
          group.add(dial);
        }

        // Add small red accent light
        const accentLightGeometry = new THREE.SphereGeometry(0.05, 16, 16);
        const accentLightMaterial = new THREE.MeshStandardMaterial({
          color: 0xff0000,
          emissive: 0xff0000,
          emissiveIntensity: 3.0
        });
        const accentLight = new THREE.Mesh(accentLightGeometry, accentLightMaterial);
        accentLight.position.set(1.1, 0.8, 0.7);
        group.add(accentLight);
      };
      
      addDetailElements(group);

      // Add some floating particle effects around the camera
      const addParticles = () => {
        const particlesCount = 100;
        const positions = new Float32Array(particlesCount * 3);
        
        for (let i = 0; i < particlesCount; i++) {
          const i3 = i * 3;
          positions[i3] = (Math.random() - 0.5) * 7;
          positions[i3 + 1] = (Math.random() - 0.5) * 7;
          positions[i3 + 2] = (Math.random() - 0.5) * 7;
        }
        
        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
          color: 0xff3300,
          size: 0.02,
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        group.add(particles);
      };
      
      addParticles();
      
      return group;
    };

    // Create and add camera sphere to the scene
    const cameraSphere = createCameraSphere();
    scene.add(cameraSphere);
    modelRef.current = cameraSphere;
    
    // Position elements
    camera.position.z = 4.5;
    
    // Add better lighting setup
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);
    
    // Main key light
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(2, 2, 5);
    scene.add(mainLight);
    
    // Red accent light with more intensity
    const redLight = new THREE.PointLight(0xff3300, 4, 10, 2);
    redLight.position.set(2, -1, -1);
    scene.add(redLight);
    
    // Blue rim light
    const blueLight = new THREE.PointLight(0x0033ff, 2, 10, 2);
    blueLight.position.set(-2, 1, 1);
    scene.add(blueLight);

    // Premium Volumetric light effect (simulated)
    const createVolumetricLight = () => {
      const volumetricLightMaterial = new THREE.MeshBasicMaterial({
        color: 0xff3300,
        transparent: true,
        opacity: 0.03,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });
      
      const volumetricLightGeometry = new THREE.ConeGeometry(3, 7, 32, 1, true);
      const volumetricLight = new THREE.Mesh(volumetricLightGeometry, volumetricLightMaterial);
      volumetricLight.position.set(5, -2, -3);
      volumetricLight.rotation.x = Math.PI / 4;
      volumetricLight.rotation.z = -Math.PI / 4;
      scene.add(volumetricLight);
      
      return volumetricLight;
    };
    
    const volumetricLight = createVolumetricLight();

    // Animation loop with improved animations
    const clock = new THREE.Clock();
    
    const animate = () => {
      requestAnimationFrame(animate);
      
      const elapsedTime = clock.getElapsedTime();
      
      if (modelRef.current) {
        // Smooth floating movement
        modelRef.current.position.y = Math.sin(elapsedTime * 0.5) * 0.1;
        
        // Gentle rotation
        modelRef.current.rotation.y = elapsedTime * 0.2;
        modelRef.current.rotation.z = Math.sin(elapsedTime * 0.3) * 0.05;
        
        // Pulse the red accent ring
        const accentRing = modelRef.current.children[4] as THREE.Mesh;
        if (accentRing && accentRing.material instanceof THREE.MeshStandardMaterial) {
          accentRing.material.emissiveIntensity = 1.5 + Math.sin(elapsedTime * 2) * 0.5;
        }
        
        // Animate lights
        redLight.intensity = 3 + Math.sin(elapsedTime * 1.5) * 1;
        blueLight.intensity = 1.5 + Math.cos(elapsedTime * 2) * 0.5;
        
        // Rotate lights around for dynamic lighting effects
        redLight.position.x = Math.sin(elapsedTime * 0.3) * 3;
        redLight.position.z = Math.cos(elapsedTime * 0.3) * 3;
        
        blueLight.position.x = Math.sin(elapsedTime * 0.4 + Math.PI) * 3;
        blueLight.position.z = Math.cos(elapsedTime * 0.4 + Math.PI) * 3;
      }
      
      // Animate volumetric light
      if (volumetricLight) {
        volumetricLight.rotation.z = -Math.PI / 4 + Math.sin(elapsedTime * 0.2) * 0.1;
        if (!Array.isArray(volumetricLight.material)) {
          volumetricLight.material.opacity = 0.03 + Math.sin(elapsedTime) * 0.01;
        }
      }
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', updateSize);
      
      if (modelRef.current) {
        scene.remove(modelRef.current);
      }
      
      // Clean up all Three.js resources
      renderer.dispose();
      scene.clear();
    };
  }, []);

  return (
    <div 
      className="w-full bg-black text-white relative overflow-hidden" 
      ref={containerRef}
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center justify-between py-16 lg:py-28 min-h-[80vh] lg:min-h-screen">
          {/* Text content section */}
          <div className="w-full lg:w-1/2 z-10 mb-12 lg:mb-0 text-center lg:text-left">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-8 tracking-tight">
              <span className="block hero-text bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Transform</span>
              <span className="block hero-text bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Videos into</span>
              <span className="block hero-text bg-gradient-to-r from-white via-white to-red-300 bg-clip-text text-transparent">Shorts</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-md mx-auto lg:mx-0 hero-subtext">
              Powerful tools backed by AI to turn long videos into engaging shorts.
            </p>
            <Link href="/admin/dashboard"><div className="hero-cta relative inline-block">
              <div className="pulse-ring absolute inset-0 border-2 border-red-500 rounded-md opacity-70"></div>
              <Button className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white text-xl px-10 py-7 rounded-md font-medium transition-all duration-300 shadow-lg hover:shadow-red-500/30">
                Get Started
              </Button>
            </div></Link>
          </div>
          
          {/* 3D Camera visualization */}
          <div className="w-full lg:w-1/2 flex justify-center lg:justify-end relative">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-radial from-red-500/10 to-transparent rounded-full blur-2xl transform scale-110 opacity-40"></div>
              <canvas 
                ref={canvasRef} 
                className="relative z-10 transform lg:translate-x-0"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Ambient background effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-red-500/5 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-blue-500/5 rounded-full filter blur-3xl"></div>
      </div>
    </div>
  );
};

export default Hero;