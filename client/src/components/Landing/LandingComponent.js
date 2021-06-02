import React, { useState, useEffect } from "react";
import { withRouter } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
const LandingComponent = ({ history }) => {
  const [InviteCode, setInviteCode] = useState(null);
  const [InputValue, setInputValue] = useState("");
  const socket = io.connect("localhost:5000");
  function onGameStart() {
    history.push("/game");
  }

  function handleCreate() {
    // axios.get("http://localhost:5000/api/createRoom").then((res) => {
    //   setInviteCode(res.data);
    // });
    socket.emit("makeRoom");
  }

  function onChange(e) {
    setInputValue(e.target.value);
  }

  function enterRoom() {
    // const body = {
    //   InputValue,
    // };
    // axios.post("http://localhost:5000/api/enterRoom", body).then((res) => {});
    socket.emit("enterRoom", InputValue);
  }

  useEffect(() => {
    socket.on("makeRoom", (data) => {
      setInviteCode(data);
    });

    socket.on("successRoom", () => {
      history.push("/game");
    });

    socket.on("inviteError", () => {
      alert("초대 번호가 잘못되었습니다");
    });
  }, [socket]);
  return (
    <div className="flex justify-center h-screen items-center w-screen flex-col">
      <div
        className="border border-double border-8 w-1/2 text-center text-xl pt-6 pb-6"
        onClick={handleCreate}
      >
        방 만들기
      </div>
      {InviteCode ? <div className="pt-6">{InviteCode}</div> : ""}
      <div>
        <input
          className="my-6"
          type="text"
          placeholder="초대 번호"
          value={InputValue}
          onChange={onChange}
        />
        <button
          onClick={enterRoom}
          className="ml-3 bg-pink-500 text-white active:bg-pink-600 font-bold uppercase text-xs px-4 py-4 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 mb-1"
        >
          입력
        </button>
      </div>

      <button
        className="bg-pink-500 text-white active:bg-pink-600 font-bold uppercase text-xs px-4 py-4 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 mb-1 hidden"
        onClick={onGameStart}
      >
        Game Start
      </button>
    </div>
  );
};

export default withRouter(LandingComponent);
