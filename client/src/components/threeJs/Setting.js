import React, { createRef, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import io from "socket.io-client";
import { withRouter } from "react-router-dom";
const Setting = ({ history }) => {
  const ref = useRef();
  const socket = io.connect("https://922012a9fc5c.ngrok.io");
  const canvasRef = useRef(null);
  let compassAngle = 0;
  let alertFlag = true;
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
    //camera.position.set(0, 20, 0);
    let user = null;
    let walls = [];
    let players = [];
    let obstacles = [];
    let exit = null;
    // let collisionFlag = false;
    let moveWall = null;
    let otherPlayer = null;

    let key = {
      r_left: 0,
      r_right: 0,
      r_up: 0,
      r_down: 0,
    };
    let timer = 0;
    let timerTxt = null;

    //const pointLight = new THREE.DirectionalLight(0xffffff, 3);
    //camera.add(pointLight);
    //scene.add(camera);
    const light = new THREE.AmbientLight(0x404040); // soft white light
    scene.add(light);

    function load() {
      user = new Player();
      user.draw();
      sendPlayerData();
      //const gridHelper = new THREE.GridHelper(50, 10);
      //scene.add(gridHelper);

      initFloor();
      initMap();
      initNavi();
      initObstacle();
      initHole();
      initCooperation();
      timer = Date.now() + 60000;

      timerTxt = document.createElement("div");
      timerTxt.style.position = "absolute";
      timerTxt.style.left = "40%";
      timerTxt.style.bottom = "90%";
      timerTxt.style.color = "white";
      document.body.appendChild(timerTxt);
      animate();
    }

    function initHole() {
      const material = new THREE.MeshPhongMaterial({
        color: 0xffffff,
      });
      const geometry = new THREE.BoxGeometry(5, 5, 5);
      const mesh = new THREE.Mesh(geometry, material);

      mesh.position.set(15, -2.48, -15);
      scene.add(mesh);
    }

    function initCooperation() {
      const wallGeometry = new THREE.BoxGeometry(2, 1, 2);
      const material = new THREE.MeshPhongMaterial({
        color: 0x333333,
      });
      const mesh = new THREE.Mesh(wallGeometry, material);
      mesh.position.set(-3, -0.4, -8);

      scene.add(mesh);
    }

    function initFloor() {
      const textureLoader = new THREE.TextureLoader();
      const floorMaterial = new THREE.MeshPhongMaterial({
        //color: 0x333333,
        map: textureLoader.load("../../public/floor.jpg"),
      });
      const floorGeometry = new THREE.BoxGeometry(51, 1, 51);
      const floor = new THREE.Mesh(floorGeometry, floorMaterial);
      floor.position.set(0, -0.5, 0);
      scene.add(floor);
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
      obstacles.forEach((data) => {
        data.collision();
        data.move();
      });

      if (
        user.sphere.position.x > 10 &&
        user.sphere.position.x < 15 &&
        user.sphere.position.z > 10 &&
        user.sphere.position.z < 15
      ) {
        if (user.sphere.position.y < 5) {
          user.sphere.position.y += 0.1;
        }
      } else {
        if (user.sphere.position.y > 1) {
          user.sphere.position.y -= 0.1;
        }
      } //공중뜨기

      if (
        user.sphere.position.x > 12.5 &&
        user.sphere.position.x < 17.5 &&
        user.sphere.position.z > -17.5 &&
        user.sphere.position.z < -12.5
      ) {
        if (user.sphere.position.y > -5) {
          user.sphere.position.y -= 1;
        } else {
          user.sphere.position.x = Math.random() * 40 - 20;
          user.sphere.position.z = Math.random() * 40 - 20;
          user.sphere.position.y = 20;
        }
      }
      if (otherPlayer) {
        const object = scene.getObjectByName(otherPlayer.id);
        if (
          user.sphere.position.x > -4 &&
          user.sphere.position.x < -2 &&
          user.sphere.position.z > -9 &&
          user.sphere.position.z < -7
        ) {
          //발판밟으면 벽 움직이게
          moveWall.direction = "-x";
          moveWall.move();
          moveWall.collision();
        } else if (
          object.position.x > -4 &&
          object.position.x < -2 &&
          object.position.z > -9 &&
          object.position.z < -7
        ) {
          moveWall.direction = "-x";
          moveWall.move();
          moveWall.collision();
        } else {
          moveWall.direction = "+x";
          moveWall.move();
          moveWall.collision();
        }
      }

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
            Math.PI +
          (user.sphere.rotation.y * 180) / Math.PI;
      }
      //console.log(Date.now() - timer);
      //setTime(Date.now() - timer);
      //timerTxt = document.createElement("div");
      timerTxt.innerHTML = `${(timer - Date.now()) / 1000} 초`;
      if (timer - Date.now() < 0 && alertFlag) {
        alert("게임 오버");
        history.push("/");
        alertFlag = false;
      }
    }

    function makeWall(x, z, vector) {
      this.x = x;
      this.z = z;
      this.vector = vector;
      this.mesh = null;
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
      const map = new THREE.TextureLoader().load(
        "../../public/wallTexture.jpeg"
      );
      const material = new THREE.MeshPhongMaterial({
        //color: 0x000000,
        map: map,
      });
      this.mesh = new THREE.Mesh(wallGeometry, material);
      this.mesh.position.set(vector.x, 5, vector.z);
      scene.add(this.mesh);
    }

    function makeObstacle(x, y, z, vector, nickname) {
      this.x = x;
      this.y = y;
      this.z = z;
      this.vector = vector;
      this.object = null;
      this.direction = "+x";
      this.collision = function () {
        const { position } = user.sphere;
        //const { object } = this;
        if (
          this.object.position.x - this.x / 2 < position.x && //- user.radius
          this.object.position.x + this.x / 2 > position.x //+ user.radius
        ) {
          if (this.object.position.z > position.z + user.radius) {
            if (
              this.object.position.z - this.z / 2 <
              position.z + user.radius
            ) {
              position.z = this.object.position.z - this.z / 2 - user.radius;
            } //오른쪽 벽
          } else {
            if (
              position.z - user.radius <
              this.object.position.z + this.z / 2
            ) {
              position.z = this.object.position.z + this.z / 2 + user.radius;
            } //왼쪽 벽
          }
        }
        if (
          this.object.position.z + this.z / 2 > position.z && //+ user.radius
          this.object.position.z - this.z / 2 < position.z // - user.radius
        ) {
          if (this.object.position.x > position.x + user.radius) {
            if (
              this.object.position.x - this.x / 2 <
              position.x + user.radius
            ) {
              position.x = this.object.position.x - this.x / 2 - user.radius;
            }
          } else {
            if (
              this.object.position.x + this.x / 2 >
              position.x - user.radius
            ) {
              position.x = this.object.position.x + this.x / 2 + user.radius;
            }
          }
        }
      };
      this.move = function () {
        if (this.direction == "+x") {
          if (this.object.position.x < 21) {
            this.object.position.x += 0.05;
          }
          if (this.object.position.x > 20) {
            this.direction = "-x";
          }
        }
        if (this.direction == "-x") {
          if (this.object.position.x > 5) {
            this.object.position.x -= 0.05;
          }
          if (this.object.position.x < 5.5) {
            this.direction = "+x";
          }
        }
      };
      const wallGeometry = new THREE.BoxGeometry(x, y, z);
      const map = new THREE.TextureLoader().load("../../public/obstacle.jpeg");
      const material = new THREE.MeshPhongMaterial({ map: map });
      this.object = new THREE.Mesh(wallGeometry, material);
      this.object.position.set(vector.x, y / 2, vector.z);
      this.object.name = nickname;
      scene.add(this.object);
    }

    function initMap() {
      const a = new makeWall(50, 1, { x: 0, z: 25 });
      const b = new makeWall(1, 50, { x: -25, z: 0 });
      const c = new makeWall(1, 45, { x: 25, z: -2.5 });
      const d = new makeWall(45, 1, { x: -2.5, z: -25 });
      const e = new makeWall(20, 1, { x: 10, z: 20 });
      const f = new makeWall(1, 40, { x: -5, z: 0 });
      const g = new makeWall(45, 1, { x: -2.5, z: 15 });
      const h = new makeWall(1, 10, { x: 10, z: 15 });
      const i = new makeWall(20, 1, { x: 0, z: -10 });
      const j = new makeWall(20, 1, { x: 5, z: 0 });
      const k = new makeWall(1, 20, { x: -15, z: -10 });
      const l = new makeWall(10, 1, { x: -25, z: -10 });

      walls.push(a, b, c, d, e, f, g, h, i, j, k);
      const geometry = new THREE.SphereGeometry(1, 32, 32);
      const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
      exit = new THREE.Mesh(geometry, material);
      exit.position.set(22.5, 10, -22.5);
      scene.add(exit);
    }

    function initObstacle() {
      const a = new makeObstacle(5, 5, 5, { x: 10, z: 5 }, "first");
      moveWall = new makeObstacle(10, 10, 1, { x: 25, z: -25 }, "moveWall");
      obstacles.push(a);
      //walls.push(a);
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
          y: this.sphere.position.y,
          z: this.sphere.position.z,
          rotation: this.sphere.rotation,
        });
      };
    }

    async function draw_players() {
      const playerIndex = await players.findIndex((i) => i.id === socket.id);
      if (playerIndex != -1) {
        await players.splice(playerIndex, 1);
        otherPlayer = await players[0];
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
        y: user.sphere.position.y,
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

    socket.on("playerMove", (data) => {
      const object = scene.getObjectByName(data.id);
      if (object) {
        object.position.x = data.x;
        object.position.y = data.y;
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

export default withRouter(Setting);
