import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import io from "socket.io-client";
const Setting = () => {
  const ref = useRef();
  const socket = io.connect("http://localhost:5000");
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
    //scene.background = new THREE.Color("#FFFFFF"); //배경색 지정
    scene.background = new THREE.Color("#000000");
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
    let walls = [];
    let players = [];

    let key = {
      r_left: 0,
      r_right: 0,
      r_up: 0,
      r_down: 0,
    };

    const pointLight = new THREE.DirectionalLight(0xffffff, 3);
    //camera.add(pointLight);
    //scene.add(camera);

    function load() {
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

      //sendPlayerData();
      user.update();
      controlMove();
      walls.forEach((data) => {
        data.collision();
      });

      renderer.render(scene, camera);
    }

    function makeWall(x, z, vector) {
      this.x = x;
      this.z = z;
      this.vector = vector;

      this.collision = function () {
        const { position } = user.sphere;

        if (
          this.vector.x - this.x / 2 < position.x && //- user.radius
          this.vector.x + this.x / 2 > position.x //+ user.radius
        ) {
          if (this.vector.z > position.z + user.radius) {
            if (this.vector.z - this.z / 2 < position.z + user.radius) {
              position.z = this.vector.z - this.z / 2 - user.radius;
            } //오른쪽 벽
          } else {
            if (position.z - user.radius < this.vector.z + this.z / 2) {
              position.z = this.vector.z + this.z / 2 + user.radius;
            } //왼쪽 벽
          }
        }

        if (
          this.vector.z + this.z / 2 > position.z && //+ user.radius
          this.vector.z - this.z / 2 < position.z // - user.radius
        ) {
          if (this.vector.x > position.x + user.radius) {
            if (this.vector.x - this.x / 2 < position.x + user.radius) {
              position.x = this.vector.x - this.x / 2 - user.radius;
            }
          } else {
            if (this.vector.x + this.x / 2 > position.x - user.radius) {
              position.x = this.vector.x + this.x / 2 + user.radius;
            }
          }
        }
      };
      const wallGeometry = new THREE.BoxGeometry(x, 10, z);
      const material = new THREE.MeshPhongMaterial({ color: 0x000000 });
      const mesh = new THREE.Mesh(wallGeometry, material);
      mesh.position.set(vector.x, 5, vector.z);
      scene.add(mesh);
    }

    function initMap() {
      const a = new makeWall(50, 1, { x: 0, z: 25 });
      const b = new makeWall(1, 50, { x: -25, z: 0 });
      const c = new makeWall(1, 45, { x: 25, z: -2.5 });
      const d = new makeWall(45, 1, { x: -2.5, z: -25 });
      const e = new makeWall(20, 1, { x: 10, z: 20 });
      const f = new makeWall(1, 40, { x: -5, z: 0 });
      const g = new makeWall(45, 1, { x: -2.5, z: 15 });
      walls.push(a, b, c, d, e, f, g);
    }
    //-25, 25 ~ 25, -25?
    function Player() {
      this.id = null;
      this.sphere = null;
      this.xSpeed = 0;
      this.zSpeed = 0;
      this.radius = 1;
      this.draw = function () {
        const geometry = new THREE.SphereGeometry(this.radius, 32, 32);
        const material = new THREE.MeshBasicMaterial({ color: "#3903fc" });
        this.sphere = new THREE.Mesh(geometry, material);
        this.sphere.position.set(22.5, this.radius, 22.5);
        pointLight.position.set(
          this.sphere.position.x,
          this.sphere.position.y,
          this.sphere.position.z
        );
        this.sphere.add(pointLight);
        scene.add(this.sphere);
      }; //this.radius, this.sphere.position

      this.update = function () {
        this.sphere.position.x += this.xSpeed;
        this.sphere.position.z += this.zSpeed;
      };

      this.dir = function (x, z) {
        this.xSpeed = x / 5;
        this.zSpeed = z / 5;
      };
    }

    function draw_players() {}

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

    // function sendPlayerData() {
    //   socket.emit("sendPlayerData", {
    //     id: socket.id,
    //     x: user.sphere.position.x,
    //     z: user.sphere.position.z,
    //   });
    // }

    socket.on("requestPlayerData", (data) => {
      socket.emit("getPlayerData", {
        id: socket.id,
        x: user.sphere.position.x,
        z: user.sphere.position.z,
      });
      user.id = socket.id;
    });

    socket.on("sendPlayersData", (data) => {
      console.log(data);
    });
    //animate();
  }, []);
  return <div ref={ref}></div>;
};

export default Setting;
