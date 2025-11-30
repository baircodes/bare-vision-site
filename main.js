/* main.js 
   Optimized for 60fps rendering using RequestAnimationFrame (rAF) and Layout Caching.
*/

// Utility: Clamp
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

document.addEventListener('DOMContentLoaded', () => {

  /* -------------------------------------------
     1. PERFORMANCE STATE MANAGEMENT
     Cache values to avoid reading the DOM inside scroll loops
  ------------------------------------------- */
  const state = {
    scrollY: window.scrollY,
    docHeight: document.documentElement.scrollHeight - window.innerHeight,
    ticking: false // Flag to prevent stacking animation frames
  };

  // Update cached dimensions only on resize, not scroll
  window.addEventListener('resize', () => {
    state.docHeight = document.documentElement.scrollHeight - window.innerHeight;
  }, { passive: true });


  /* -------------------------------------------
     2. HERO SHIMMER (One-time Intro)
  ------------------------------------------- */
  const titleEl = document.querySelector('.hero .title');
  const titleText = document.querySelector('.title .title-text');

  if (titleEl && titleText) {
    // 1. Trigger fade in
    requestAnimationFrame(() => titleEl.classList.add('visible'));

    // 2. Trigger Shimmer
    setTimeout(() => {
      titleText.style.backgroundPosition = '120% 0';
      
      // 3. Trigger Float
      setTimeout(() => titleText.classList.add('floaty'), 1600);
    }, 400); 
  }


  /* -------------------------------------------
     3. PAGE LOADER (Promise-based)
  ------------------------------------------- */
  const pageLoader = document.getElementById('page-loader');
  const bgImgs = Array.from(document.querySelectorAll('#bg-layer .bg-image'));

  const removeLoader = () => {
    if (!pageLoader || pageLoader.classList.contains('hidden')) return;
    pageLoader.classList.add('hidden');
    setTimeout(() => pageLoader.remove(), 900);
  };

  if (bgImgs.length === 0) {
    removeLoader();
  } else {
    // Create a promise for each image
    const promises = bgImgs.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve; // Resolve on error too so we don't hang
      });
    });

    // Race: Images loading VS 1.5s timeout safety net
    Promise.race([
      Promise.all(promises),
      new Promise(resolve => setTimeout(resolve, 1500))
    ]).then(removeLoader);
  }


  /* -------------------------------------------
     4. SCROLL BLENDING (The Engine)
     Optimized with the "Tick" pattern
  ------------------------------------------- */
  const sunrise = document.querySelector('.bg-sunrise');
  const sunset = document.querySelector('.bg-sunset'); // Ensure this exists in HTML
  const bgOverlay = document.querySelector('.bg-overlay');

  const updateVisuals = () => {
    // Safety check
    if (state.docHeight <= 0) {
      state.ticking = false;
      return;
    }

    const progress = state.scrollY / state.docHeight;
    const gamma = Math.pow(clamp(progress, 0, 1), 1.1);

    // Batch DOM writes
    if (sunrise && sunset) {
      sunrise.style.opacity = (1 - gamma).toFixed(3);
      sunset.style.opacity = gamma.toFixed(3);
      
      // Parallax
      sunrise.style.transform = `translate3d(0, ${-(gamma * 8)}px, 0)`; // translate3d forces GPU acceleration
      sunset.style.transform = `translate3d(0, ${-(gamma * 12)}px, 0)`;
    }

    if (bgOverlay) {
      bgOverlay.style.opacity = 0.08 + (gamma * 0.18);
    }

    state.ticking = false;
  };

  const onScroll = () => {
    state.scrollY = window.scrollY;
    if (!state.ticking) {
      window.requestAnimationFrame(updateVisuals);
      state.ticking = true;
    }
  };

  // Passive listener improves scroll performance
  if (sunrise && sunset) {
    window.addEventListener('scroll', onScroll, { passive: true });
    updateVisuals(); // Run once on init
  }


  /* -------------------------------------------
     5. INTERSECTION OBSERVER
  ------------------------------------------- */
  const revealTargets = document.querySelectorAll('[data-animate]');
  
  if (revealTargets.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { 
      rootMargin: '0px 0px -10% 0px', 
      threshold: 0.1 
    });

    revealTargets.forEach(target => observer.observe(target));
  }


  /* -------------------------------------------
     6. MOUSE FOLLOWER (Throttled)
  ------------------------------------------- */
  const orbs = document.querySelectorAll('.orb');
  if (window.matchMedia('(pointer:fine)').matches && orbs.length > 0) {
    
    let mouseTicking = false;

    const moveOrbs = (e) => {
      orbs.forEach(btn => {
        const rect = btn.getBoundingClientRect();
        // Only calculate if near the button to save CPU
        // (Optional optimization: check distance)
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        btn.style.setProperty('--mx', `${x}px`);
        btn.style.setProperty('--my', `${y}px`);
      });
      mouseTicking = false;
    };

    document.addEventListener('mousemove', (e) => {
      if (!mouseTicking) {
        window.requestAnimationFrame(() => moveOrbs(e));
        mouseTicking = true;
      }
    }, { passive: true });
  }

});
