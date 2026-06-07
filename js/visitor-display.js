// Live Visitor Counter Display
(function initVisitorDisplay() {
  const SUPABASE_URL = "https://tilbhgcncnwibnfgebkg.supabase.co";
  const SUPABASE_KEY = "sb_publishable_yCaOt8Z9sl-JEQC5wZ6_sQ_jZi610z1";
  const UPDATE_INTERVAL = 30000;
  const CACHE_KEY = "visitor-count-cache";
  let hasAnimated = false;

  function displayCount(count, isLive = true) {
    const element = document.getElementById("visitor-count-number");
    if (element) {
      element.textContent = Number(count).toLocaleString();
      if (!isLive) {
        element.style.opacity = "0.6";
        element.title = "Last known count (service temporarily unavailable)";
      } else {
        element.style.opacity = "1";
        element.title = "";
      }
    }
  }

  function updateVisitorCount() {
    fetch(
      `${SUPABASE_URL}/rest/v1/visits?select=total_count&apikey=${SUPABASE_KEY}`,
      { signal: AbortSignal.timeout(5000) }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data && data[0]) {
          const count = data[0].total_count;
          localStorage.setItem(CACHE_KEY, count);
          displayCount(count, true);
        }
      })
      .catch((err) => {
        console.debug("Visitor count unavailable:", err);
        const cachedCount = localStorage.getItem(CACHE_KEY);
        if (cachedCount) {
          displayCount(cachedCount, false);
        } else {
          displayCount(0, false);
        }
      });
  }

  function triggerGlowAnimation() {
    if (!hasAnimated) {
      const counter = document.querySelector(".visitor-counter");
      if (counter) {
        counter.classList.add("loaded");
        hasAnimated = true;
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", updateVisitorCount);
  } else {
    updateVisitorCount();
  }
  setInterval(updateVisitorCount, UPDATE_INTERVAL);

  if ("IntersectionObserver" in window) {
    const counter = document.querySelector(".visitor-counter");
    if (counter) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) triggerGlowAnimation();
          });
        },
        { threshold: 0.5 }
      );
      observer.observe(counter);
    }
  }
})();
