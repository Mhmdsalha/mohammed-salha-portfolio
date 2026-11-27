"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { FOCUS_RING } from "@/components/ui/focus";
import { CloseIcon, MenuIcon } from "@/components/ui/Icon";

// Mobile menu sheet (P4-1, D-032), shown below 900px where the header hides its links (SPEC V-11).
// A native modal <dialog>: the browser makes the page behind inert and closes it on Esc; Tab is
// looped inside it here. On every close (Esc, the close button, a link, the backdrop, widening
// the window) focus returns to the menu button, or to the logo when the button is gone at
// desktop width (R14). Copy comes from the server as props (no NextIntlClientProvider).

type MenuLink = { href: string; label: string };

type MobileMenuProps = {
  links: MenuLink[];
  copy: {
    open: string;
    close: string;
    title: string;
    cv: string;
    cvLabel: string;
    switchLocale: string;
    switchLocaleLabel: string;
  };
  cvHref: string;
  switchHref: string;
  switchLang: string;
};

/** Width at which the header shows its own links; the sheet is not needed from here on. */
const DESKTOP_QUERY = "(min-width: 900px)";

export function MobileMenu({ links, copy, cvHref, switchHref, switchLang }: MobileMenuProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const returnFocus = () => {
      const button = buttonRef.current;
      // Past 900px the button is display:none and cannot take focus (A7 review): use the logo.
      const target =
        button && button.getClientRects().length > 0
          ? button
          : document.querySelector<HTMLElement>("[data-header-home]");
      target?.focus({ preventScroll: true });
    };
    dialog.addEventListener("close", returnFocus);

    // Widening the window past the breakpoint closes the sheet, so it never covers the desktop nav.
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const closeOnDesktop = () => {
      if (desktop.matches && dialog.open) dialog.close();
    };
    desktop.addEventListener("change", closeOnDesktop);

    return () => {
      dialog.removeEventListener("close", returnFocus);
      desktop.removeEventListener("change", closeOnDesktop);
    };
  }, []);

  const close = () => dialogRef.current?.close();

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-haspopup="dialog"
        aria-label={copy.open}
        className={`inline-flex size-11 items-center justify-center rounded-full border border-ink text-ink hover:bg-ink hover:text-paper motion-safe:transition-colors motion-safe:duration-300 min-[900px]:hidden ${FOCUS_RING}`}
      >
        <MenuIcon className="size-5" />
      </button>

      <dialog
        ref={dialogRef}
        data-menu-sheet
        aria-labelledby={titleId}
        // A click on the dialog box itself (not its content) is a click on the backdrop.
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        // A modal dialog makes the page inert, but Tab past its last control still leaves for the
        // browser's own UI. Loop focus between the first and last controls instead (R14).
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")
          );
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (!first || !last) return;
          const active = document.activeElement;
          if (event.shiftKey && (active === first || active === event.currentTarget)) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && active === last) {
            event.preventDefault();
            first.focus();
          }
        }}
        className="fixed inset-y-0 start-auto end-0 m-0 h-dvh max-h-none w-[min(88vw,22rem)] max-w-none bg-paper p-0 text-ink backdrop:bg-ink/45 open:flex"
      >
        <div className="flex w-full flex-col gap-8 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 id={titleId} className="font-display text-lg font-black">
              {copy.title}
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label={copy.close}
              className={`inline-flex size-11 items-center justify-center rounded-full border border-ink ${FOCUS_RING}`}
            >
              <CloseIcon className="size-5" />
            </button>
          </div>

          {/* Unnamed: the dialog's own name ("Menu") already says what it is (A7 review). */}
          <nav>
            <ul className="flex flex-col">
              {links.map((link) => (
                <li key={link.href} className="border-b border-line">
                  <a
                    href={link.href}
                    onClick={close}
                    className={`flex min-h-14 items-center font-display text-2xl font-bold ${FOCUS_RING}`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-auto flex flex-wrap items-center gap-3">
            <Button
              href={switchHref}
              variant="ghost"
              size="sm"
              hrefLang={switchLang}
              lang={switchLang}
              className="min-w-11"
            >
              {copy.switchLocale}
              <span className="sr-only">{copy.switchLocaleLabel}</span>
            </Button>
            <Button
              href={cvHref}
              variant="ink"
              size="sm"
              icon="download"
              download
              aria-label={copy.cvLabel}
            >
              {copy.cv}
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
