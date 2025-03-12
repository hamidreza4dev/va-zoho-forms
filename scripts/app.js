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
                if (
                    item &&
                    item.classList.contains(AccordionClassNames.Active)
                ) {
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

export class Dialog {
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
            .querySelectorAll(
                `.${DialogClassNames.Bilbilak}, .${DialogClassNames.X}`
            )
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
            activeDialogs.filter((d) => !this.wrapper.isEqualNode(d)).length ===
            0
        ) {
            lockScroll(false);
        }

        this.wrapper.setAttribute("closing", "");
        this.wrapper.addEventListener("animationend", this.animateClose, {
            once: true,
        });
    }
}

// Init
window.App = {
    Dialog,
    Accordion,
};
