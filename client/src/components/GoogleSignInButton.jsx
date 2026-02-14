import { useEffect, useRef, useState } from "react";

export default function GoogleSignInButton({ onCredential, disabled }) {
  const containerRef = useRef(null);
  const [error, setError] = useState("");
  const [buttonWidth, setButtonWidth] = useState(320);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    const updateWidth = () => {
      const viewport = window.innerWidth || 320;
      const next = Math.max(220, Math.min(360, viewport - 96));
      setButtonWidth(next);
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  useEffect(() => {
    if (!clientId) {
      setError("Google sign-in is not configured.");
      return;
    }

    let cancelled = false;
    let tries = 0;
    const maxTries = 30;

    const renderGoogleButton = () => {
      if (cancelled) {
        return;
      }

      if (!window.google?.accounts?.id || !containerRef.current) {
        tries += 1;
        if (tries < maxTries) {
          setTimeout(renderGoogleButton, 200);
        } else {
          setError("Unable to load Google sign-in.");
        }
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          if (!response?.credential || disabled) {
            return;
          }
          try {
            setError("");
            await onCredential(response.credential);
          } catch (err) {
            setError(err.message || "Google sign-in failed");
          }
        },
      });

      containerRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(containerRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "continue_with",
        width: buttonWidth,
      });
    };

    renderGoogleButton();

    return () => {
      cancelled = true;
    };
  }, [buttonWidth, clientId, disabled, onCredential]);

  return (
    <div className="mt-3 grid justify-items-center gap-2">
      <div ref={containerRef} className={`w-full ${disabled ? "pointer-events-none opacity-60" : ""}`} />
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
