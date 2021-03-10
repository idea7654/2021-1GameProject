import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
const Setting = () => {
  const ref = useRef();
  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
    });
    const model = new THREE.Object3D();
    scene.background = new THREE.Color("#FFFFFF"); //배경색 지정
    renderer.setSize(window.innerWidth, window.innerHeight);
    // document.body.appendChild( renderer.domElement );
    // use ref as a mount point of the Three.js scene instead of the document.body
    ref.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableKeys = false;
    controls.enableZoom = false;
    controls.rotateSpeed = 0.3;
    camera.position.x = 10;
    camera.position.y = 10;
    camera.position.z = 0;
    controls.update();

    const color = 0xffffff;
    const intensity = 2;

    {
      const light = new THREE.DirectionalLight(color, intensity);
      light.position.set(1, 1, 1);
      scene.add(light);

      const light2 = new THREE.DirectionalLight(color, intensity);
      light2.position.set(-1, -1, -1);
      scene.add(light2);

      const light3 = new THREE.DirectionalLight(color, intensity);
      light3.position.set(20, 0, 0);
      scene.add(light3);

      const light4 = new THREE.DirectionalLight(color, intensity);
      light4.position.set(0, 20, 0);
      scene.add(light4);

      const light5 = new THREE.DirectionalLight(color, intensity);
      light5.position.set(0, 0, 20);
      scene.add(light5);
    }

    const load = function () {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
    };

    const resizeRendererToDisplaySize = function (renderer) {
      const canvas = renderer.domElement;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const needResize = canvas.width !== width || canvas.height !== height;
      if (needResize) {
        renderer.setSize(width, height, false);
      }
      return needResize;
    };

    const animate = function () {
      if (resizeRendererToDisplaySize(renderer)) {
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
      }
      requestAnimationFrame(animate);

      renderer.render(scene, camera);
    };
    load();
    animate();
  }, []);
  return <div ref={ref}></div>;
};

export default Setting;
