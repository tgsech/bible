import { Suspense, lazy, useEffect, type ComponentType } from "react";
import { Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./i18n/LanguageContext";
import { ThemeProvider } from "./theme/ThemeContext";
import { ReadModeProvider } from "./hooks/useReadMode";
import { EnvironmentProvider } from "./environment/EnvironmentContext";
import { SoundProvider } from "./audio/SoundContext";
import { Sidebar } from "./components/Sidebar";
import { LandingPage } from "./pages/LandingPage";
import "./AppShell.css";

// Every page except the landing page is its own chunk, fetched the first
// time its route is visited, so a phone opening the site doesn't download
// and parse the code for all fifteen pages up front. Pages use named
// exports, hence the small adapter around React.lazy.
function lazyPage<K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) {
  return lazy(() => load().then((m) => ({ default: m[name] })));
}

const ReadPage = lazyPage(() => import("./pages/ReadPage"), "ReadPage");
const AboutPage = lazyPage(() => import("./pages/AboutPage"), "AboutPage");
const ProfilePage = lazyPage(() => import("./pages/ProfilePage"), "ProfilePage");
const AuthPage = lazyPage(() => import("./pages/AuthPage"), "AuthPage");
const ForgotPasswordPage = lazyPage(() => import("./pages/ForgotPasswordPage"), "ForgotPasswordPage");
const ResetPasswordPage = lazyPage(() => import("./pages/ResetPasswordPage"), "ResetPasswordPage");
const LeaderboardPage = lazyPage(() => import("./pages/LeaderboardPage"), "LeaderboardPage");
const PublicProfilePage = lazyPage(() => import("./pages/PublicProfilePage"), "PublicProfilePage");
const SettingsPage = lazyPage(() => import("./pages/SettingsPage"), "SettingsPage");
const LivWordersPage = lazyPage(() => import("./pages/LivWordersPage"), "LivWordersPage");
const TeamDetailPage = lazyPage(() => import("./pages/TeamDetailPage"), "TeamDetailPage");
const MemoryToolPage = lazyPage(() => import("./pages/MemoryToolPage"), "MemoryToolPage");
const RainGame = lazyPage(() => import("./pages/memory/RainGame"), "RainGame");
const OrderGame = lazyPage(() => import("./pages/memory/OrderGame"), "OrderGame");
const VanishMode = lazyPage(() => import("./pages/memory/StudyModes"), "VanishMode");
const LettersMode = lazyPage(() => import("./pages/memory/StudyModes"), "LettersMode");
const FlashcardMode = lazyPage(() => import("./pages/memory/FlashcardMode"), "FlashcardMode");
const TestMode = lazyPage(() => import("./pages/memory/TestMode"), "TestMode");
const TutorialPage = lazyPage(() => import("./pages/TutorialPage"), "TutorialPage");

// The two places people go next from the landing page. Fetching their
// chunks once the browser is idle makes that first tap feel instant.
function usePrefetchMainPages() {
  useEffect(() => {
    const prefetch = () => {
      void import("./pages/ReadPage");
      void import("./pages/MemoryToolPage");
    };
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(prefetch, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(prefetch, 2500);
    return () => clearTimeout(id);
  }, []);
}

function App() {
  usePrefetchMainPages();
  return (
    <LanguageProvider>
      <ThemeProvider>
        <EnvironmentProvider>
          <SoundProvider>
            <ReadModeProvider>
              <div className="appShell">
                <Sidebar />
                <main className="appMain">
                  <Suspense fallback={null}>
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
                    <Route path="/memory/rain" element={<RainGame />} />
                    <Route path="/memory/order" element={<OrderGame />} />
                    <Route path="/memory/vanish" element={<VanishMode />} />
                    <Route path="/memory/letters" element={<LettersMode />} />
                    <Route path="/memory/cards" element={<FlashcardMode />} />
                    <Route path="/memory/test" element={<TestMode />} />
                  </Routes>
                  </Suspense>
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
