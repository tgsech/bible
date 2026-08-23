import { Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./i18n/LanguageContext";
import { ThemeProvider } from "./theme/ThemeContext";
import { ReadModeProvider } from "./hooks/useReadMode";
import { EnvironmentProvider } from "./environment/EnvironmentContext";
import { SoundProvider } from "./audio/SoundContext";
import { Sidebar } from "./components/Sidebar";
import { LandingPage } from "./pages/LandingPage";
import { ReadPage } from "./pages/ReadPage";
import { AboutPage } from "./pages/AboutPage";
import { ProfilePage } from "./pages/ProfilePage";
import { AuthPage } from "./pages/AuthPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { PublicProfilePage } from "./pages/PublicProfilePage";
import { SettingsPage } from "./pages/SettingsPage";
import { LivWordersPage } from "./pages/LivWordersPage";
import { TeamDetailPage } from "./pages/TeamDetailPage";
import { MemoryToolPage } from "./pages/MemoryToolPage";
import { TutorialPage } from "./pages/TutorialPage";
import "./AppShell.css";

function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <EnvironmentProvider>
          <SoundProvider>
            <ReadModeProvider>
              <div className="appShell">
                <Sidebar />
                <main className="appMain">
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/read/:translationId/:bookId/:chapter" element={<ReadPage />} />
                    <Route path="/tutorial" element={<TutorialPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/leaderboard" element={<LeaderboardPage />} />
                    <Route path="/u/:username" element={<PublicProfilePage />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/directory" element={<LivWordersPage />} />
                    <Route path="/team/:id" element={<TeamDetailPage />} />
                    <Route path="/memory" element={<MemoryToolPage />} />
                  </Routes>
                </main>
              </div>
            </ReadModeProvider>
          </SoundProvider>
        </EnvironmentProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;
