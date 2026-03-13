
"use client"

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OHLC } from '@/lib/market-data';

interface MarketChart3DProps {
  data: OHLC[];
}

export const MarketChart3D: React.FC<MarketChart3DProps> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;

    // Clean up existing renderer if it exists
    if (rendererRef.current) {
      if (containerRef.current.contains(rendererRef.current.domElement)) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current.dispose();
    }

    const scene = new THREE.Scene();
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    containerRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0x2a5a9f, 2, 100);
    pointLight.position.set(0, 10, 10);
    scene.add(pointLight);

    const grid = new THREE.GridHelper(100, 50, 0x2a5a9f, 0x1a1a1a);
    grid.position.y = -5;
    scene.add(grid);

    const minPrice = Math.min(...data.map(d => d.low));
    const maxPrice = Math.max(...data.map(d => d.high));
    const range = Math.max(0.01, maxPrice - minPrice);
    const scaleY = 15 / range;

    const candleGroup = new THREE.Group();
    data.forEach((bar, i) => {
      const isBullish = bar.close >= bar.open;
      const color = isBullish ? 0x39ff14 : 0xff6600;
      
      const bodyHeight = Math.max(0.05, Math.abs(bar.close - bar.open) * scaleY);
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

      const wickHeight = Math.max(0.1, (bar.high - bar.low) * scaleY);
      const wickGeometry = new THREE.CylinderGeometry(0.05, 0.05, wickHeight, 8);
      const wickMaterial = new THREE.MeshBasicMaterial({ color });
      const wick = new THREE.Mesh(wickGeometry, wickMaterial);
      wick.position.set(i - data.length / 2, (bar.high + bar.low) / 2 * scaleY - minPrice * scaleY, 0);
      candleGroup.add(wick);
    });
    scene.add(candleGroup);

    camera.position.z = 35;
    camera.position.y = 10;
    camera.lookAt(0, 5, 0);

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      candleGroup.rotation.y += 0.002;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      if (containerRef.current && renderer.domElement) {
        if (containerRef.current.contains(renderer.domElement)) {
          containerRef.current.removeChild(renderer.domElement);
        }
      }
      renderer.dispose();
      scene.clear();
    };
  }, [data]);

  return <div ref={containerRef} className="w-full h-full rounded-xl overflow-hidden bg-background/20" />;
};
