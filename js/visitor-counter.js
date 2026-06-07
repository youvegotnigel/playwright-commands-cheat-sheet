// Visitor Counter - Increment once per tab session
(function initVisitorCounter() {
  const SUPABASE_FUNCTION_URL =
    "https://tilbhgcncnwibnfgebkg.supabase.co/functions/v1/increment-visitor";
  const SESSION_KEY = "visitor-counted-session";

  function incrementCounter() {
    try {
      // Skip automated browsers (Playwright/CI, Selenium, most bots set
      // navigator.webdriver) so test runs and crawlers don't inflate the count.
      if (navigator.webdriver) return;

      // Only count once per tab session — refreshes reuse sessionStorage,
      // so they don't re-increment; a new tab/session counts again.
      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, "1");

      fetch(SUPABASE_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization":
            "Bearer sb_publishable_yCaOt8Z9sl-JEQC5wZ6_sQ_jZi610z1",
        },
        body: JSON.stringify({}),
      }).catch((err) => {
        console.debug("Visitor counter unavailable:", err);
      });
    } catch (err) {
      console.debug("Visitor counter error:", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", incrementCounter);
  } else {
    incrementCounter();
  }
})();
