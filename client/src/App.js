import React from "react";
import ThreePage from "./Page/ThreePage";
import Landing from "./Page/Landing";
import { Route } from "react-router-dom";
const App = () => {
  return (
    <div>
      <Route path="/" render={() => <Landing />} exact />
      <Route path="/game" render={() => <ThreePage />} />
    </div>
  );
};

export default App;
