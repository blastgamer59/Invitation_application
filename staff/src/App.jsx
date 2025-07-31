import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import StaffPanel from "./components/StaffPanel";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<StaffPanel />} />
      </Routes>
    </Router>
  );
};

export default App;
