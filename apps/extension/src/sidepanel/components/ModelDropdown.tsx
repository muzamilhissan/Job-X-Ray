import { useEffect, useId, useRef, useState } from "react";

export type ModelId = "gemini";

export interface ModelOption {
  id: ModelId;
  label: string;
  hint?: string;
}

interface ModelDropdownProps {
  value: ModelId;
  options: ModelOption[];
  onChange: (id: ModelId) => void;
  label?: string;
}

export function ModelDropdown({
  value,
  options,
  onChange,
  label = "Model",
}: ModelDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.id === value) ?? options[0];

  useEffect(() => {
    if (!open) return;

    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="field" ref={rootRef}>
      <span className="field-label" id={`${listId}-label`}>
        {label}
      </span>
      <div className={`dd ${open ? "open" : ""}`}>
        <button
          type="button"
          className="dd-trigger"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={`${listId}-label`}
          aria-controls={listId}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="dd-value">{selected?.label}</span>
          <span className="dd-chevron" aria-hidden>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2.5 4.5L6 8l3.5-3.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>

        {open && (
          <ul
            id={listId}
            className="dd-menu"
            role="listbox"
            aria-labelledby={`${listId}-label`}
          >
            {options.map((opt) => {
              const isActive = opt.id === value;
              return (
                <li key={opt.id} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    className={`dd-option ${isActive ? "active" : ""}`}
                    onClick={() => {
                      onChange(opt.id);
                      setOpen(false);
                    }}
                  >
                    <span className="dd-option-main">
                      <span className="dd-option-label">{opt.label}</span>
                      {opt.hint && <span className="dd-option-hint">{opt.hint}</span>}
                    </span>
                    {isActive && (
                      <span className="dd-check" aria-hidden>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path
                            d="M2.5 7.2L5.6 10.2L11.5 3.8"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
