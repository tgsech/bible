import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authClient, useSession } from "../lib/authClient";
import "./AuthPage.css";

type Mode = "signin" | "signup";

export function AuthPage() {
  const navigate = useNavigate();
  const { data: session, isPending: sessionPending } = useSession();

  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } =
      mode === "signup"
        ? await authClient.signUp.email({ email, password, name })
        : await authClient.signIn.email({ email, password });

    setLoading(false);

    if (authError) {
      setError(authError.message ?? "Something went wrong. Please try again.");
      return;
    }

    navigate("/");
  };

  const handleGoogle = async () => {
    setError(null);
    // Redirects to Google, then back to "/" on success — nothing else to
    // do here on the client side.
    await authClient.signIn.social({ provider: "google", callbackURL: "/" });
  };

  if (sessionPending) {
    return (
      <div id="mainBody" className="authPage">
        <p>Loading…</p>
      </div>
    );
  }

  if (session) {
    return (
      <div id="mainBody" className="authPage">
        <Link to="/" className="backHomeLink">
          ← Home
        </Link>
        <p>You're already signed in as {session.user.name}.</p>
        <Link to="/">← Back home</Link>
      </div>
    );
  }

  return (
    <div id="mainBody" className="authPage">
      <Link to="/" className="backHomeLink">
        ← Home
      </Link>

      <h1 className="authTitle">LivingWords</h1>

      <div className="authTabs">
        <button
          type="button"
          className={`authTab${mode === "signin" ? " authTab--active" : ""}`}
          onClick={() => switchMode("signin")}
        >
          Sign in
        </button>
        <button
          type="button"
          className={`authTab${mode === "signup" ? " authTab--active" : ""}`}
          onClick={() => switchMode("signup")}
        >
          Sign up
        </button>
      </div>

      <form className="authForm" onSubmit={handleSubmit}>
        {mode === "signup" && (
          <label className="authField">
            <span>Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </label>
        )}

        <label className="authField">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label className="authField">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            minLength={8}
            required
          />
        </label>

        {error && <p className="authError">{error}</p>}

        <button type="submit" className="authSubmit" disabled={loading}>
          {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>

      <div className="authDivider">
        <span>or</span>
      </div>

      <button type="button" className="authGoogleButton" onClick={handleGoogle}>
        Continue with Google
      </button>
    </div>
  );
}
