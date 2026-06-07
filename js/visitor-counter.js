// Visitor Counter - Increment on page load
(function initVisitorCounter() {
  const SUPABASE_FUNCTION_URL =
    "https://tilbhgcncnwibnfgebkg.supabase.co/functions/v1/increment-visitor";

  function incrementCounter() {
    try {
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
