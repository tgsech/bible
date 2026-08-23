import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { authClient } from "../lib/authClient";
import { useLanguage } from "../i18n/LanguageContext";
import "./AuthPage.css";

export function ResetPasswordPage() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  // Better Auth's sendResetPassword URL appends ?token=... - if it's
  // missing entirely the link was mangled or hand-typed, so treat that the
  // same as an invalid/expired token rather than letting the form submit
  // with no token and produce a confusing server error.
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setLoading(true);

    const { error: authError } = await authClient.resetPassword({
      newPassword: password,
      token,
    });

    setLoading(false);

    if (authError) {
      setError(authError.message ?? t("auth.genericError"));
      return;
    }

    setSuccess(true);
  };

  if (!token) {
    return (
      <div id="mainBody" className="authPage">
        <h1 className="authTitle">{t("auth.brand")}</h1>
        <p className="authError">{t("auth.resetPasswordInvalidToken")}</p>
        <Link to="/forgot-password">{t("auth.forgotPassword")}</Link>
      </div>
    );
  }

  if (success) {
    return (
      <div id="mainBody" className="authPage">
        <h1 className="authTitle">{t("auth.brand")}</h1>
        <p className="authSuccess">{t("auth.resetPasswordSuccess")}</p>
        <Link to="/auth">{t("auth.backToSignIn")}</Link>
      </div>
    );
  }

  return (
    <div id="mainBody" className="authPage">
      <h1 className="authTitle">{t("auth.brand")}</h1>
      <h2>{t("auth.resetPasswordTitle")}</h2>
      <p>{t("auth.resetPasswordIntro")}</p>

      <form className="authForm" onSubmit={handleSubmit}>
        <label className="authField">
          <span>{t("auth.newPassword")}</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>

        {error && <p className="authError">{error}</p>}

        <button type="submit" className="authSubmit" disabled={loading}>
          {loading ? t("auth.pleaseWait") : t("auth.resetPasswordSubmit")}
        </button>
      </form>
    </div>
  );
}
