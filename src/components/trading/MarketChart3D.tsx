
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
    
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    containerRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0x2a5a9f, 2.4, 160);
    pointLight.position.set(0, 18, 18);
    scene.add(pointLight);

    const fillLight = new THREE.PointLight(0xffffff, 0.8, 120);
    fillLight.position.set(0, 6, 30);
    scene.add(fillLight);

    const chartWidth = Math.max(24, data.length * 0.95);
    const grid = new THREE.GridHelper(
      chartWidth * 1.4,
      Math.max(30, Math.floor(data.length * 0.6)),
      0x2a5a9f,
      0x1a1a1a
    );
    grid.position.y = -8;
    scene.add(grid);

    const minPrice = Math.min(...data.map(d => d.low));
    const maxPrice = Math.max(...data.map(d => d.high));
    const range = Math.max(0.01, maxPrice - minPrice);
    const centerPrice = (minPrice + maxPrice) / 2;
    const scaleY = 18 / range;
    const xOffset = (data.length - 1) / 2;
    const chartHeight = range * scaleY;

    const candleGroup = new THREE.Group();
    const closePoints: THREE.Vector3[] = [];
    data.forEach((bar, i) => {
      const isBullish = bar.close >= bar.open;
      const color = isBullish ? 0x39ff14 : 0xff6600;
      const x = i - xOffset;
      const closeY = (bar.close - centerPrice) * scaleY;
      
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
      body.position.set(
        x,
        (((bar.open + bar.close) / 2) - centerPrice) * scaleY,
        0
      );
      candleGroup.add(body);

      const wickHeight = Math.max(0.1, (bar.high - bar.low) * scaleY);
      const wickGeometry = new THREE.CylinderGeometry(0.05, 0.05, wickHeight, 8);
      const wickMaterial = new THREE.MeshBasicMaterial({ color });
      const wick = new THREE.Mesh(wickGeometry, wickMaterial);
      wick.position.set(
        x,
        (((bar.high + bar.low) / 2) - centerPrice) * scaleY,
        0
      );
      candleGroup.add(wick);
      closePoints.push(new THREE.Vector3(x, closeY, 0.45));
    });
    scene.add(candleGroup);

    const fov = THREE.MathUtils.degToRad(camera.fov);
    const fitHeightDistance = chartHeight / (2 * Math.tan(fov / 2));
    const fitWidthDistance = (chartWidth / Math.max(camera.aspect, 0.75)) / (2 * Math.tan(fov / 2));
    const cameraDistance = Math.max(26, fitHeightDistance * 1.5, fitWidthDistance * 1.35);

    camera.position.set(0, Math.max(4, chartHeight * 0.12), cameraDistance);
    camera.lookAt(0, 0, 0);

    const trendGeometry = new THREE.BufferGeometry().setFromPoints(closePoints);
    const trendLine = new THREE.Line(
      trendGeometry,
      new THREE.LineBasicMaterial({
        color: 0x2a5a9f,
        transparent: true,
        opacity: 0.45,
      })
    );
    scene.add(trendLine);

    const latestBar = data[data.length - 1];
    const latestX = data.length - 1 - xOffset;
    const latestCloseY = (latestBar.close - centerPrice) * scaleY;
    const markerGeometry = new THREE.SphereGeometry(0.35, 18, 18);
    const markerMaterial = new THREE.MeshPhongMaterial({
      color: latestBar.close >= latestBar.open ? 0x39ff14 : 0xff6600,
      emissive: 0xffffff,
      emissiveIntensity: 0.35,
    });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.set(latestX, latestCloseY, 0.9);
    scene.add(marker);

    const guideGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(latestX, -chartHeight * 0.65, 0),
      new THREE.Vector3(latestX, latestCloseY + 1.4, 0),
    ]);
    const guideLine = new THREE.Line(
      guideGeometry,
      new THREE.LineDashedMaterial({
        color: 0xffffff,
        dashSize: 0.4,
        gapSize: 0.2,
        transparent: true,
        opacity: 0.35,
      })
    );
    guideLine.computeLineDistances();
    scene.add(guideLine);

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
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
