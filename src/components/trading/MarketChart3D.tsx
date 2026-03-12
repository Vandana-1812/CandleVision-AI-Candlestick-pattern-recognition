"use client"

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OHLC } from '@/lib/market-data';

interface MarketChart3DProps {
  data: OHLC[];
}

export const MarketChart3D: React.FC<MarketChart3DProps> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (!containerRef.current || !data.length) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0x2a5a9f, 2, 100);
    pointLight.position.set(0, 10, 10);
    scene.add(pointLight);

    // Grid helper
    const grid = new THREE.GridHelper(100, 50, 0x2a5a9f, 0x1a1a1a);
    grid.position.y = -5;
    scene.add(grid);

    // Data Scaling
    const minPrice = Math.min(...data.map(d => d.low));
    const maxPrice = Math.max(...data.map(d => d.high));
    const range = maxPrice - minPrice;
    const scaleY = 15 / range;

    // Create Candles
    const candleGroup = new THREE.Group();
    data.forEach((bar, i) => {
      const isBullish = bar.close >= bar.open;
      const color = isBullish ? 0x39ff14 : 0xff6600;
      
      // Body
      const bodyHeight = Math.max(0.01, Math.abs(bar.close - bar.open) * scaleY);
      const bodyGeometry = new THREE.BoxGeometry(0.6, bodyHeight, 0.6);
      const bodyMaterial = new THREE.MeshPhongMaterial({ 
        color, 
        transparent: true, 
        opacity: 0.8,
        emissive: color,
        emissiveIntensity: 0.2
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.set(i - data.length / 2, (bar.open + bar.close) / 2 * scaleY - minPrice * scaleY, 0);
      candleGroup.add(body);

      // Wick
      const wickHeight = (bar.high - bar.low) * scaleY;
      const wickGeometry = new THREE.CylinderGeometry(0.05, 0.05, wickHeight, 8);
      const wickMaterial = new THREE.MeshBasicMaterial({ color });
      const wick = new THREE.Mesh(wickGeometry, wickMaterial);
      wick.position.set(i - data.length / 2, (bar.high + bar.low) / 2 * scaleY - minPrice * scaleY, 0);
      candleGroup.add(wick);
    });
    scene.add(candleGroup);

    camera.position.z = 30;
    camera.position.y = 10;
    camera.lookAt(0, 0, 0);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      candleGroup.rotation.y += 0.001;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [data]);

  return <div ref={containerRef} className="w-full h-full rounded-xl overflow-hidden" />;
};