"use client";

import { useState, useRef, useEffect } from "react";

export default function HelpDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-neutral-300 transition hover:bg-neutral-800 hover:text-white"
      >
        <span>Help</span>
        <span
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-neutral-800 bg-neutral-900 shadow-xl backdrop-blur-sm animate-fade-in">
          <div className="p-2">
            <a
              href="mailto:support@monesave.com?subject=Pick One Meal Support"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-neutral-300 transition hover:bg-neutral-800 hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              <span className="text-lg">✉️</span>
              <div>
                <div className="font-medium">Contact Support</div>
                <div className="text-xs text-neutral-500">
                  support@monesave.com
                </div>
              </div>
            </a>
            <a
              href="/#faq"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-neutral-300 transition hover:bg-neutral-800 hover:text-white"
              onClick={(e) => {
                e.preventDefault();
                setIsOpen(false);
                const faqElement = document.getElementById("faq");
                if (faqElement) {
                  faqElement.scrollIntoView({ behavior: "smooth" });
                } else {
                  window.location.href = "/#faq";
                }
              }}
            >
              <span className="text-lg">❓</span>
              <div>
                <div className="font-medium">View FAQ</div>
                <div className="text-xs text-neutral-500">
                  Common questions
                </div>
              </div>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

