import React, { createRef, useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import io from "socket.io-client";
const Setting = () => {
  const ref = useRef();
  const socket = io.connect("http://localhost:5000");
  const canvasRef = useRef(null);
  let compassAngle = 0;
  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const cameraSecond = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
    });
    // scene.background = new THREE.Color("#FFFFFF"); //배경색 지정
    scene.background = new THREE.Color("#000000");
    renderer.setSize(window.innerWidth, window.innerHeight);
    ref.current.appendChild(renderer.domElement);

    // const controls = new OrbitControls(camera, renderer.domElement);
    // controls.enableKeys = false;
    // controls.rotateSpeed = 0.3;
    // camera.position.x = 5;
    // camera.position.y = 3;
    // camera.position.z = 0;
    // camera.rotation.set(-1, 1.35, 1);
    // controls.update();
    // camera.rotation.set(0, Math.PI, 0);
    // const color = 0xffffff;
    // const intensity = 2;
    let user = null;
    let walls = [];
    let players = [];
    let exit = null;
    // let collisionFlag = false;

    let key = {
      r_left: 0,
      r_right: 0,
      r_up: 0,
      r_down: 0,
    };

    // const pointLight = new THREE.DirectionalLight(0xffffff, 3);
    //camera.add(pointLight);
    //scene.add(camera);

    function load() {
      user = new Player();
      user.draw();
      sendPlayerData();
      const gridHelper = new THREE.GridHelper(50, 10);
      scene.add(gridHelper);

      initMap();
      initNavi();
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

    function initNavi() {
      const map = new THREE.TextureLoader().load("../../public/arrow.png");
      const material2 = new THREE.SpriteMaterial({ map: map, color: 0xffffff });
      const sprite = new THREE.Sprite(material2);
      sprite.position.set(0, 1, -7);
      user.sphere.add(sprite);
    }

    function animate() {
      if (resizeRendererToDisplaySize(renderer)) {
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
      }
      requestAnimationFrame(animate);
      user.update();
      walls.forEach((data) => {
        data.collision();
      });

      renderer.render(scene, camera);

      renderer.setViewport(
        0,
        0,
        Math.floor(window.innerWidth / 2),
        window.innerHeight
      );
      renderer.setScissor(
        0,
        0,
        Math.floor(window.innerWidth / 2),
        window.innerHeight
      );
      renderer.setScissorTest(true);
      renderer.setClearColor(new THREE.Color(1, 1, 1));
      camera.aspect = Math.floor(window.innerWidth / 2) / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);

      const left = Math.floor(window.innerWidth / 2);
      renderer.setViewport(
        left,
        0,
        Math.floor(window.innerWidth / 2),
        window.innerHeight
      );
      renderer.setScissor(
        left,
        0,
        Math.floor(window.innerWidth / 2),
        window.innerHeight
      );
      renderer.setScissorTest(true);
      renderer.setClearColor(new THREE.Color(1, 1, 1));
      cameraSecond.aspect =
        Math.floor(window.innerWidth / 2) / window.innerHeight;
      cameraSecond.updateProjectionMatrix();
      renderer.render(scene, cameraSecond);
      if (exit && user) {
        // console.log(exit.position, user.sphere.position);
        compassAngle =
          (Math.atan2(
            user.sphere.position.z - exit.position.z,
            user.sphere.position.x - exit.position.x
          ) *
            180) /
          Math.PI;
      }
    }

    function makeWall(x, z, vector) {
      this.x = x;
      this.z = z;
      this.vector = vector;

      this.collision = function () {
        const { position } = user.sphere;
        // const index = players.findIndex((i) => i.id === user.id);
        // const { position } = players[index].sphere;
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
      const geometry = new THREE.SphereGeometry(1, 32, 32);
      const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
      exit = new THREE.Mesh(geometry, material);
      exit.position.set(22.5, 10, -22.5);
      scene.add(exit);
    }
    //-25, 25 ~ 25, -25?

    // function collisionFunc(){
    //   socket.
    // }
    function Player() {
      this.id = null;
      this.sphere = null;
      this.xSpeed = 0;
      this.zSpeed = 0;
      this.radius = 1;
      this.degree = 0;
      this.camera = camera;
      this.draw = function () {
        const geometry = new THREE.SphereGeometry(this.radius, 32, 32);
        const material = new THREE.MeshBasicMaterial({ color: "#3903fc" });
        this.sphere = new THREE.Mesh(geometry, material);
        this.sphere.position.set(22.5, this.radius, 22.5);
        const light = new THREE.SpotLight(0xffffff, 3);
        light.position.set(this.sphere.position.x, 10, this.sphere.position.z);
        light.angle = (90 * Math.PI) / 180;
        light.distance = 100;
        light.target = this.sphere;
        this.sphere.add(light);
        camera.rotation.y = Math.PI / 2;
        cameraSecond.rotation.y = Math.PI / 2;
        this.sphere.add(camera);
        scene.add(this.sphere);
      }; //this.radius, this.sphere.position

      this.update = function () {
        if (key.r_right) {
          this.degree += (2 / 180) * Math.PI;
          this.sphere.rotation.y -= (4 * Math.PI) / 360;
        }
        if (key.r_left) {
          this.degree -= (2 / 180) * Math.PI;
          this.sphere.rotation.y += (4 * Math.PI) / 360;
        }
        if (key.r_up) {
          this.sphere.position.x -= 0.1 * Math.cos(this.degree);
          this.sphere.position.z -= 0.1 * Math.sin(this.degree);
        }
        if (key.r_down) {
          this.sphere.position.x += 0.1 * Math.cos(this.degree);
          this.sphere.position.z += 0.1 * Math.sin(this.degree);
        }
        socket.emit("playerMove", {
          id: socket.id,
          x: this.sphere.position.x,
          z: this.sphere.position.z,
          rotation: this.sphere.rotation,
        });
      };
    }

    async function draw_players() {
      const playerIndex = await players.findIndex((i) => i.id === socket.id);
      if (playerIndex != -1) {
        await players.splice(playerIndex, 1);
      }
      await players.forEach((data, index) => {
        const geometry = new THREE.SphereGeometry(1, 32, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(data.x, 1, data.z);
        sphere.name = data.id;
        sphere.add(cameraSecond);
        scene.add(sphere);
      });
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

    function sendPlayerData() {
      socket.emit("sendPlayerData", {
        x: user.sphere.position.x,
        z: user.sphere.position.z,
      });
    }

    socket.on("getOtherPlayer", async (data) => {
      // const playerIndex = await data.players.findIndex(
      //   (i) => i.id === data.socketId
      // );
      // if (playerIndex != -1) {
      //   await data.players.splice(playerIndex, 1);
      // }
      // const afterArr = await data.players.filter(
      //   (val) => !players.includes(val)
      // );
      data.players.forEach((element, index) => {
        const playerIndex = players.findIndex((i) => i.id === element.id);
        if (playerIndex != -1) {
          data.players.splice(index, 1);
        }
      });
      await console.log(data.players);

      players = await data.players;

      await draw_players();
    });

    // socket.on("requestPlayerData", (data) => {
    //   socket.emit("getPlayerData", {
    //     id: socket.id,
    //     //x: user.sphere.position.x,
    //     //z: user.sphere.position.z,
    //     x: user.x,
    //     z: user.z,
    //   });
    //   user.id = socket.id;
    // });

    // socket.on("sendPlayersData", (data) => {
    //   players = data;
    //   draw_players();
    //   animate();
    // });

    // socket.on("playerMove", (data) => {
    //   // const playerIndex = players.findIndex((i) => i.id === data.id);
    //   // players.splice(playerIndex, 1, data);
    //   move_players(data.id, data.x, data.z);
    // });
    socket.on("playerMove", (data) => {
      const object = scene.getObjectByName(data.id);
      if (object) {
        object.position.x = data.x;
        object.position.z = data.z;
        object.rotation.y = data.rotation._y;
      }
    });
    //animate();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const myImage = "../../public/arrow.png";
    const img = new Image();
    setInterval(drawCompass, 1000);
    function drawCompass() {
      img.onload = function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(img.width / 2, img.height / 2);
        ctx.rotate(((compassAngle - 90) * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();
      };
      img.src = myImage;
    }
  }, []);
  return (
    <div>
      <div ref={ref}>
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            width: "100",
            height: "100",
            backgroundColor: "white",
          }}
          width="100"
          height="100"
        ></canvas>
      </div>
    </div>
  );
};

export default Setting;
