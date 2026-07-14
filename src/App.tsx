import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./theme/ThemeContext";
import { LandingPage } from "./pages/LandingPage";
import { ReadPage } from "./pages/ReadPage";
import { AboutPage } from "./pages/AboutPage";

function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/read/:translationId/:bookId/:chapter" element={<ReadPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
