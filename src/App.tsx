import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./theme/ThemeContext";
import { LandingPage } from "./pages/LandingPage";
import { ReadPage } from "./pages/ReadPage";
import { AboutPage } from "./pages/AboutPage";
import { ProfilePage } from "./pages/ProfilePage";
import { AuthPage } from "./pages/AuthPage";
import { LeaderboardPage } from "./pages/LeaderboardPage";

function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/read/:translationId/:bookId/:chapter" element={<ReadPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/auth" element={<AuthPage />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
