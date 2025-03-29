function init() {
  // Get all section buttons and sections
  const sectionButtons = Array.from(
    document.querySelectorAll(".proposal__section")
  );
  const sections = sectionButtons.map((sb) =>
    document.querySelector(sb.dataset.section)
  );

  // Add click event listeners to section buttons
  sectionButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      const section = sections[index];
      if (section) {
        // Scroll the section to be centered in the viewport
        section.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  });

  // Helper function to check if page is scrolled to bottom
  function isScrolledToBottom() {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    // Consider "bottom" when within 20px of actual bottom
    return windowHeight + scrollTop >= documentHeight - 20;
  }

  // Helper function to check if an element is in the center of viewport
  function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    const windowHeight =
      window.innerHeight || document.documentElement.clientHeight;

    // Get the vertical center point of the viewport
    const viewportCenter = windowHeight / 2;

    // Get the element's center point relative to viewport
    const elementCenter = rect.top + rect.height / 2;

    // Define a tolerance range for considering an element "centered" (100px above or below center)
    const tolerance = 100;

    // Check if element's center is within the tolerance range of viewport center
    return Math.abs(elementCenter - viewportCenter) <= tolerance;
  }

  // Update active section on scroll
  function updateActiveSection() {
    let activeIndex = -1;

    // Check if scrolled to bottom - if yes, activate last section
    if (isScrolledToBottom()) {
      activeIndex = sections.length - 1;
    } else {
      // Find the section closest to center
      let minDistance = Infinity;

      sections.forEach((section, index) => {
        if (section) {
          const rect = section.getBoundingClientRect();
          const windowHeight =
            window.innerHeight || document.documentElement.clientHeight;
          const viewportCenter = windowHeight / 2;
          const elementCenter = rect.top + rect.height / 2;
          const distance = Math.abs(elementCenter - viewportCenter);

          if (distance < minDistance) {
            minDistance = distance;
            activeIndex = index;
          }
        }
      });
    }

    // Update active class on buttons
    sectionButtons.forEach((button, index) => {
      if (index === activeIndex) {
        button.classList.add("proposal__section-active");
      } else {
        button.classList.remove("proposal__section-active");
      }
    });
  }

  // Add scroll event listener with debounce
  let scrollTimeout;
  window.addEventListener(
    "scroll",
    () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      scrollTimeout = setTimeout(updateActiveSection, 50);
    },
    { passive: true }
  );

  // Initial update
  updateActiveSection();
}

if (window.innerWidth > 1024) init();
