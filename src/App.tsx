import { Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./i18n/LanguageContext";
import { ThemeProvider } from "./theme/ThemeContext";
import { ReadModeProvider } from "./hooks/useReadMode";
import { Sidebar } from "./components/Sidebar";
import { LandingPage } from "./pages/LandingPage";
import { ReadPage } from "./pages/ReadPage";
import { AboutPage } from "./pages/AboutPage";
import { ProfilePage } from "./pages/ProfilePage";
import { AuthPage } from "./pages/AuthPage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { PublicProfilePage } from "./pages/PublicProfilePage";
import { SettingsPage } from "./pages/SettingsPage";
import { LivWordersPage } from "./pages/LivWordersPage";
import { MemoryToolPage } from "./pages/MemoryToolPage";
import "./AppShell.css";

function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <ReadModeProvider>
          <div className="appShell">
            <Sidebar />
            <main className="appMain">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/read/:translationId/:bookId/:chapter" element={<ReadPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/u/:username" element={<PublicProfilePage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/directory" element={<LivWordersPage />} />
                <Route path="/memory" element={<MemoryToolPage />} />
              </Routes>
            </main>
          </div>
        </ReadModeProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;
