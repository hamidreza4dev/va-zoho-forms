/**
 * Utility functions
 */
const getAllProperties = (object) => {
  const properties = new Set();
  do {
    for (const key of Reflect.ownKeys(object)) {
      properties.add([object, key]);
    }
  } while (
    (object = Reflect.getPrototypeOf(object)) &&
    object !== Object.prototype
  );
  return properties;
};
function autoBind(self, { include, exclude } = {}) {
  const filter = (key) => {
    const match = (pattern) =>
      typeof pattern === "string" ? key === pattern : pattern.test(key);
    if (include) {
      return include.some(match);
    }
    if (exclude) {
      return !exclude.some(match);
    }
    return true;
  };
  for (const [object, key] of getAllProperties(self.constructor.prototype)) {
    if (key === "constructor" || !filter(key)) {
      continue;
    }
    const descriptor = Reflect.getOwnPropertyDescriptor(object, key);
    if (descriptor && typeof descriptor.value === "function") {
      self[key] = self[key].bind(self);
    }
  }
  return self;
}

/**
 * Accordion
 */
const AccordionClassNames = {
  Active: "accordion-active",
  JsToggle: "js-accordion-toggle",
  Header: "accordion__header",
  Content: "accordion__content",
  Item: "accordion__item",
  Active: "accordion__item--active",
};

class Accordion {
  constructor({ wrapper } = {}) {
    /** @type {HTMLElement} */
    this.wrapper = wrapper;
    if (!this.wrapper) {
      console.error("Wrapper element is required");
      return;
    }

    if (this.wrapper.Components?.Accordion) {
      console.error("Accordion already initialized");
      return;
    }
    this.wrapper.Components = { Accordion: this };

    autoBind(this);

    // init
    this.init();
  }

  init() {
    this.normalize();
    this.bindEvents();
  }

  normalize() {
    // Add js-toggle class to all headers
    this.wrapper
      .querySelectorAll(`.${AccordionClassNames.Header}`)
      .forEach((header) => {
        header.classList.add(AccordionClassNames.JsToggle);
      });
  }

  bindEvents() {
    this.wrapper
      .querySelectorAll(`.${AccordionClassNames.JsToggle}`)
      .forEach((header) => {
        const item = header.closest(`.${AccordionClassNames.Item}`);
        if (item && item.classList.contains(AccordionClassNames.Active)) {
          item.classList.remove(AccordionClassNames.Active);
          this.open(item);
        }

        header.addEventListener("click", (e) => {
          e.preventDefault();
          const item = header.closest(`.${AccordionClassNames.Item}`);
          this.toggle(item);
        });
      });
  }

  toggle(item) {
    const isActive = item.classList.contains(AccordionClassNames.Active);

    // If accordion is not set to allow multiple open items
    if (!this.wrapper.hasAttribute("data-multiple")) {
      // Close all other items
      this.wrapper
        .querySelectorAll(`.${AccordionClassNames.Item}`)
        .forEach((otherItem) => {
          if (otherItem !== item) {
            this.close(otherItem);
          }
        });
    }

    // Toggle current item
    if (isActive) {
      this.close(item);
    } else {
      this.open(item);
    }
  }

  open(item) {
    if (item.classList.contains(AccordionClassNames.Active)) return;

    const content = item.querySelector(`.${AccordionClassNames.Content}`);
    if (!content) return;

    // Set initial height for animation
    content.style.height = "0px";

    // Add active class
    item.classList.add(AccordionClassNames.Active);

    // Animate to full height
    requestAnimationFrame(() => {
      content.style.height = `${content.scrollHeight}px`;
    });
  }

  close(item) {
    if (!item.classList.contains(AccordionClassNames.Active)) return;

    const content = item.querySelector(`.${AccordionClassNames.Content}`);
    if (!content) return;

    // Animate to zero height
    content.style.height = "0px";

    // Remove active class after animation
    content.addEventListener(
      "transitionend",
      () => {
        item.classList.remove(AccordionClassNames.Active);
      },
      { once: true }
    );
  }
}

/**
 * Tabs
 */
const TabClassNames = {
  Active: "tab--active",
  JsToggle: "js-tab-toggle",
  Nav: "tabs__nav",
  NavItem: "tabs__nav-item",
  Content: "tabs__content",
  Panel: "tabs__panel",
};

const TabEvents = {
  BeforeShow: "tabs:beforeShow",
  AfterShow: "tabs:afterShow",
  BeforeHide: "tabs:beforeHide",
  AfterHide: "tabs:afterHide",
};

class Tabs {
  constructor({ wrapper } = {}) {
    /** @type {HTMLElement} */
    this.wrapper = wrapper;
    if (!this.wrapper) {
      console.error("Wrapper element is required");
      return;
    }

    if (this.wrapper.Components?.Tabs) {
      console.error("Tabs already initialized");
      return;
    }
    this.wrapper.Components = { Tabs: this };

    // init
    this.init();
  }

  init() {
    this.normalize();
    this.bindEvents();
  }

  normalize() {
    // Add js-toggle class to all nav items
    this.wrapper
      .querySelectorAll(`.${TabClassNames.NavItem}`)
      .forEach((navItem) => {
        navItem.classList.add(TabClassNames.JsToggle);
      });

    // Ensure first tab is active if none are
    const hasActiveTab = Array.from(
      this.wrapper.querySelectorAll(`.${TabClassNames.NavItem}`)
    ).some((tab) => tab.classList.contains(TabClassNames.Active));

    if (!hasActiveTab) {
      const firstTab = this.wrapper.querySelector(`.${TabClassNames.NavItem}`);
      if (firstTab) {
        this.activate(firstTab);
      }
    }
  }

  bindEvents() {
    this.wrapper
      .querySelectorAll(`.${TabClassNames.JsToggle}`)
      .forEach((navItem) => {
        navItem.addEventListener("click", (e) => {
          e.preventDefault();
          this.activate(navItem);
        });
      });
  }

  dispatchTabEvent(eventName, detail) {
    const event = new CustomEvent(eventName, {
      bubbles: true,
      cancelable: true,
      detail,
    });
    return this.wrapper.dispatchEvent(event);
  }

  activate(navItem) {
    // Get currently active tab and panel
    const currentTab = this.wrapper.querySelector(
      `.${TabClassNames.NavItem}.${TabClassNames.Active}`
    );
    const currentPanel = currentTab
      ? this.getAssociatedPanel(currentTab)
      : null;

    // Get new panel to be activated
    const newPanel = this.getAssociatedPanel(navItem);

    if (currentTab === navItem) return; // Don't do anything if clicking the same tab

    // Dispatch before hide events
    if (currentTab && currentPanel) {
      const beforeHideEvent = this.dispatchTabEvent(TabEvents.BeforeHide, {
        tab: currentTab,
        panel: currentPanel,
      });

      // If event was prevented, don't proceed with the tab switch
      if (!beforeHideEvent) return;
    }

    // Dispatch before show events
    if (newPanel) {
      const beforeShowEvent = this.dispatchTabEvent(TabEvents.BeforeShow, {
        tab: navItem,
        panel: newPanel,
      });

      // If event was prevented, don't proceed with the tab switch
      if (!beforeShowEvent) return;
    }

    // Deactivate current tab and panel
    if (currentTab && currentPanel) {
      currentTab.classList.remove(TabClassNames.Active);
      currentPanel.classList.remove(TabClassNames.Active);

      // Dispatch after hide event
      this.dispatchTabEvent(TabEvents.AfterHide, {
        tab: currentTab,
        panel: currentPanel,
      });
    }

    // Activate new tab and panel
    navItem.classList.add(TabClassNames.Active);
    if (newPanel) {
      newPanel.classList.add(TabClassNames.Active);

      // Dispatch after show event
      this.dispatchTabEvent(TabEvents.AfterShow, {
        tab: navItem,
        panel: newPanel,
      });
    }
  }

  getAssociatedPanel(navItem) {
    const targetId = navItem.getAttribute("data-tab-target");
    return targetId ? this.wrapper.querySelector(`#${targetId}`) : null;
  }
}

/**
 * Dialog
 */
const DialogClassNames = {
  Active: "dialog-active",
  JsClose: "js-dialog-close",
  Bilbilak: "dialog__bilbilak",
  Wrapper: "dialog",
  Container: "dialog__container",
  X: "dialog__x",
};

function lockScroll(lock) {
  if (lock) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = null;
  }
}

class Dialog {
  constructor({ wrapper } = {}) {
    /** @type {HTMLElement} */
    this.wrapper = wrapper;
    if (!this.wrapper) {
      console.error("Wrapper element is required");
      return;
    }

    this.container = this.wrapper.querySelector(
      `.${DialogClassNames.Container}`
    );
    if (!this.container) {
      console.error("Container element is required");
      return;
    }

    if (this.wrapper.Components?.Dialog) {
      console.error("Dialog already initialized");
      return;
    }
    this.wrapper.Components = { Dialog: this };

    autoBind(this);

    // init
    this.init();
  }

  init() {
    this.normalize();
    this.bindEvents();
  }

  normalize() {
    this.wrapper.insertAdjacentHTML(
      "afterbegin",
      `<div class="dialog__spacer ${DialogClassNames.JsClose}"></div>`
    );

    this.wrapper
      .querySelectorAll(`.${DialogClassNames.Bilbilak}, .${DialogClassNames.X}`)
      .forEach((el) => {
        el.classList.add(DialogClassNames.JsClose);
      });
  }

  bindEvents() {
    document.addEventListener(
      "keydown",
      (e) => e.key === "Escape" && this.close()
    );

    this.wrapper.addEventListener("click", this.close);

    this.container.addEventListener("click", (e) => e.stopPropagation());

    this.wrapper
      .querySelectorAll(`.${DialogClassNames.JsClose}`)
      .forEach((btn) => btn.addEventListener("click", this.close));

    if (this.wrapper.id) {
      document
        .querySelectorAll(`[data-trigger-dialog="${this.wrapper.id}"]`)
        .forEach((btn) => btn.addEventListener("click", this.open));
    }
  }

  get isOpen() {
    return this.wrapper.classList.contains(DialogClassNames.Active);
  }

  open() {
    if (this.isOpen) return;
    lockScroll(true);
    this.wrapper.classList.add(DialogClassNames.Active);
  }

  animateClose() {
    this.wrapper.removeAttribute("closing");
    this.wrapper.classList.remove(DialogClassNames.Active);
  }

  close() {
    if (!this.isOpen) return;
    const activeDialogs = Array.from(
      document.querySelectorAll(`.${DialogClassNames.Active}`)
    );
    if (
      activeDialogs.filter((d) => !this.wrapper.isEqualNode(d)).length === 0
    ) {
      lockScroll(false);
    }

    this.wrapper.setAttribute("closing", "");
    this.wrapper.addEventListener("animationend", this.animateClose, {
      once: true,
    });
  }
}

// helpers

/**
 * Extracts youtube id
 * @param {string} url
 * @returns
 */
function matchYoutubeUrl(url) {
  var p =
    /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
  const match = url.match(p);
  return match ? match[1] : undefined;
}

/**
 * Pauses a video element
 * @param {HTMLElement} element
 */
function pauseVideo(element) {
  if (!element) return;

  if ("player" in element) {
    element.player.pause();
  }

  if (element.tagName === "IFRAME" && matchYoutubeUrl(element.src)) {
    element.contentWindow.postMessage(
      '{"event":"command","func":"pauseVideo","args":""}',
      "*"
    );
  }

  if ("pause" in element) {
    element.pause();
  }
}

// Init
window.App = {
  Tabs,
  Dialog,
  Accordion,
};
