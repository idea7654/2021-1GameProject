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
    scene.background = new THREE.Color("#FFFFFF"); //배경색 지정
    renderer.setSize(window.innerWidth, window.innerHeight);
    ref.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableKeys = false;
    //controls.enableZoom = false;
    controls.rotateSpeed = 0.3;
    camera.position.x = 10;
    camera.position.y = 10;
    camera.position.z = 0;
    controls.update();

    const color = 0xffffff;
    const intensity = 2;
    let user = null;

    let key = {
      r_left: 0,
      r_right: 0,
      r_up: 0,
      r_down: 0,
    };

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

    function load() {
      //   const geometry = new THREE.BoxGeometry(1, 1, 1);
      //   const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
      //   const mesh = new THREE.Mesh(geometry, material);
      //   mesh.position.set(0, 0.5, 0);
      //   scene.add(mesh);
      user = new Player();
      user.draw();
      const gridHelper = new THREE.GridHelper(50, 10);
      scene.add(gridHelper);

      initMap();

      animate();
    }

    function resizeRendererToDisplaySize(renderer) {
      const canvas = renderer.domElement;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const needResize = canvas.width !== width || canvas.height !== height;
      if (needResize) {
        renderer.setSize(width, height, false);
      }
      return needResize;
    }

    function controlMove() {
      if (key.r_left && key.r_up) {
        user.dir(-1, 1);
      } else if (key.r_left && key.r_down) {
        user.dir(1, 1);
      } else if (key.r_right && key.r_up) {
        user.dir(-1, -1);
      } else if (key.r_right && key.r_down) {
        user.dir(1, -1);
      } else {
        if (key.r_left) {
          user.dir(0, 1);
        }
        if (key.r_right) {
          user.dir(0, -1);
        }
        if (key.r_up) {
          user.dir(-1, 0);
        }
        if (key.r_down) {
          user.dir(1, 0);
        }
      }
    }

    function animate() {
      if (resizeRendererToDisplaySize(renderer)) {
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
      }
      requestAnimationFrame(animate);

      user.update();
      controlMove();

      renderer.render(scene, camera);
    }

    function makeWall(x, z, vector) {
      const wallGeometry = new THREE.BoxGeometry(x, 10, z);
      const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const mesh = new THREE.Mesh(wallGeometry, material);
      mesh.position.set(vector.x, 5, vector.z);
      scene.add(mesh);
    }

    function initMap() {
      makeWall(50, 1, { x: 0, z: 25 });
      makeWall(1, 50, { x: -25, z: 0 });
      makeWall(1, 45, { x: 25, z: -2.5 });
    }
    //-25, 25 ~ 25, -25?
    function Player() {
      this.sphere = null;
      //this.y = 0.5;
      this.xSpeed = 0;
      this.zSpeed = 0;
      this.radius = 1;
      this.draw = function () {
        const geometry = new THREE.SphereGeometry(this.radius, 32, 32);
        const material = new THREE.MeshBasicMaterial({ color: "#3903fc" });
        this.sphere = new THREE.Mesh(geometry, material);
        this.sphere.position.set(0, this.radius, 0);
        scene.add(this.sphere);
      };

      this.update = function () {
        this.sphere.position.x += this.xSpeed;
        this.sphere.position.z += this.zSpeed;
      };

      this.dir = function (x, z) {
        this.xSpeed = x / 5;
        this.zSpeed = z / 5;
      };
    }

    function set_key() {
      if (event.keyCode === 37) {
        key.r_left = 1;
      }
      if (event.keyCode === 39) {
        key.r_right = 1;
      }
      if (event.keyCode === 38) {
        key.r_up = 1;
      }
      if (event.keyCode === 40) {
        key.r_down = 1;
      }
    }

    function up_key() {
      if (event.keyCode === 37) {
        key.r_left = 0;
      }
      if (event.keyCode === 39) {
        key.r_right = 0;
      }
      if (event.keyCode === 38) {
        key.r_up = 0;
      }
      if (event.keyCode === 40) {
        key.r_down = 0;
      }
    }

    document.onkeydown = set_key;
    document.onkeyup = up_key;

    load();
    //animate();
  }, []);
  return <div ref={ref}></div>;
};

export default Setting;
