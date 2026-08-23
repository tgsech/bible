import { useEffect, useState } from "react";
import { authClient } from "../lib/authClient";
import { useLanguage } from "../i18n/LanguageContext";
import "./AccountTab.css";

export function AccountTab() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [googleLinked, setGoogleLinked] = useState(false);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    authClient
      .listAccounts()
      .then(({ data }) => {
        if (cancelled) return;
        // Better Auth's listAccounts() returns one row per linked
        // provider (email/password shows up as providerId "credential",
        // Google as "google") - we only care whether "google" is present.
        const accounts = data ?? [];
        setGoogleLinked(accounts.some((a) => a.providerId === "google"));
      })
      .catch(() => {
        // Not fatal - the button below just stays in its "not linked"
        // state, which is the safe default (worst case the user clicks
        // it and Google says "already linked").
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLinkGoogle = async () => {
    setError(null);
    setLinking(true);
    // callbackURL absolute for the same reason as the sign-in page's
    // Google button: the OAuth redirect happens on the backend origin,
    // so a relative path would resolve against the wrong domain.
    const { error: linkError } = await authClient.linkSocial({
      provider: "google",
      callbackURL: `${window.location.origin}/profile?tab=account`,
    });
    setLinking(false);
    if (linkError) {
      setError(linkError.message ?? t("profile.accountLinkGoogleError"));
    }
    // On success, Better Auth redirects the browser to Google, so there's
    // no further state to set here - the page reloads via callbackURL.
  };

  return (
    <section className="profileSection">
      <h2>{t("profile.accountSignInMethods")}</h2>

      {loading ? (
        <p className="settingsHint">{t("profile.accountLoading")}</p>
      ) : (
        <>
          <p className="settingsHint">
            {googleLinked ? t("profile.accountGoogleLinked") : t("profile.accountGoogleNotLinked")}
          </p>

          {error && <p className="settingsError">{error}</p>}

          {!googleLinked && (
            <button
              type="button"
              className="accountLinkGoogleButton"
              onClick={handleLinkGoogle}
              disabled={linking}
            >
              {linking ? t("auth.pleaseWait") : t("profile.accountLinkGoogle")}
            </button>
          )}
        </>
      )}
    </section>
  );
}
