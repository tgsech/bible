import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { authClient } from "../lib/authClient";
import { useLanguage } from "../i18n/LanguageContext";
import "./AuthPage.css";

export function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Once true we show the "check your inbox" message instead of the form
  // again — regardless of whether the email actually exists, so this page
  // can't be used to enumerate registered addresses.
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (authError) {
      setError(authError.message ?? t("auth.genericError"));
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <div id="mainBody" className="authPage">
        <h1 className="authTitle">{t("auth.brand")}</h1>
        <p className="authSuccess">{t("auth.resetLinkSent", { email })}</p>
        <Link to="/auth">{t("auth.backToSignIn")}</Link>
      </div>
    );
  }

  return (
    <div id="mainBody" className="authPage">
      <h1 className="authTitle">{t("auth.brand")}</h1>
      <h2>{t("auth.forgotPasswordTitle")}</h2>
      <p>{t("auth.forgotPasswordIntro")}</p>

      <form className="authForm" onSubmit={handleSubmit}>
        <label className="authField">
          <span>{t("auth.email")}</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>

        {error && <p className="authError">{error}</p>}

        <button type="submit" className="authSubmit" disabled={loading}>
          {loading ? t("auth.pleaseWait") : t("auth.sendResetLink")}
        </button>
      </form>

      <Link to="/auth">{t("auth.backToSignIn")}</Link>
    </div>
  );
}
