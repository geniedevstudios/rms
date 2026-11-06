import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Check, ChevronDown } from "lucide-react";
import "./select-menu.styles.css";
import { measureSelectPosition, revealSelectOption } from "../../../../rms-admin/shared/select-position";

export type SelectOption = {
  value: string;
  label: string;
};

type SelectMenuProps = {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  name?: string;
  required?: boolean;
  label?: string;
  id?: string;
  variant?: "toolbar" | "filter" | "field";
  autoComplete?: string;
};

const openEvent = "rms-select-open";

export function SelectMenu({
  options,
  value,
  defaultValue = "",
  onChange,
  placeholder = "Select",
  name,
  required,
  label,
  id,
  variant = "field",
  autoComplete,
}: SelectMenuProps) {
  const uid = useId();
  const buttonId = id ?? `${uid}-button`;
  const listId = `${uid}-list`;
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState(defaultValue);
  const [active, setActive] = useState(0);
  const [placement, setPlacement] = useState({ above: false, maxHeight: 280 });
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selected = value !== undefined ? value : internal;
  const current = options.find((option) => option.value === selected);
  const display = current?.label ?? placeholder;

  const commit = (next: string) => {
    if (value === undefined) setInternal(next);
    onChange?.(next);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const reveal = () => {
    const index = Math.max(
      0,
      options.findIndex((option) => option.value === selected),
    );
    setActive(index);
    setOpen(true);
    window.dispatchEvent(new CustomEvent(openEvent, { detail: uid }));
  };

  useEffect(() => {
    const closeOthers = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== uid) setOpen(false);
    };
    window.addEventListener(openEvent, closeOthers);
    return () => window.removeEventListener(openEvent, closeOthers);
  }, [uid]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current || !listRef.current) return;
    const button = buttonRef.current;
    const list = listRef.current;
    const position = () => {
      const next = measureSelectPosition(button, list);
      setPlacement(current => current.above === next.above && current.maxHeight === next.maxHeight ? current : next);
    };
    position();
    list.focus({ preventScroll: true });
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    window.visualViewport?.addEventListener("resize", position);
    window.visualViewport?.addEventListener("scroll", position);
    const observer = new ResizeObserver(position);
    observer.observe(button);
    observer.observe(list);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
      window.visualViewport?.removeEventListener("resize", position);
      window.visualViewport?.removeEventListener("scroll", position);
    };
  }, [open, options.length]);

  useEffect(() => {
    if (!open) return;
    const option = listRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    if (option && listRef.current) revealSelectOption(listRef.current, option);
  }, [open, active]);

  const onButtonKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      if (open && (event.key === "Enter" || event.key === " ")) setOpen(false);
      else reveal();
    }
    if (event.key === "Escape") setOpen(false);
  };

  const onListKey = (event: KeyboardEvent<HTMLUListElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(options.length - 1, index + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(0, index - 1));
    } else if (event.key === "Home") {
      event.preventDefault();
      setActive(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActive(options.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const option = options[active];
      if (option) commit(option.value);
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      buttonRef.current?.focus();
    } else if (event.key === "Tab") {
      setOpen(false);
    } else if (event.key.length === 1) {
      const start = (active + 1) % options.length;
      const ordered = [...options.slice(start), ...options.slice(0, start)];
      const match = ordered.find((option) =>
        option.label.toLowerCase().startsWith(event.key.toLowerCase()),
      );
      if (match) setActive(options.indexOf(match));
    }
  };

  return (
    <div
      ref={rootRef}
      className={`select-menu is-${variant}${open ? " is-open" : ""}${placement.above ? " is-above" : ""}`}
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        id={buttonId}
        type="button"
        className="select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-required={required || undefined}
        aria-label={label ? `${label}, ${display}` : undefined}
        onClick={() => (open ? setOpen(false) : reveal())}
        onKeyDown={onButtonKey}
      >
        <span className={current ? undefined : "is-placeholder"}>{display}</span>
        <ChevronDown size={variant === "toolbar" ? 13 : 14} />
      </button>
      <ul
        ref={listRef}
        id={listId}
        role="listbox"
        tabIndex={-1}
        aria-label={label}
        aria-activedescendant={open ? `${uid}-option-${active}` : undefined}
        hidden={!open}
        style={open ? { maxHeight: placement.maxHeight } : undefined}
        onKeyDown={onListKey}
        onPointerDown={(event) => event.stopPropagation()}
      >
        {options.map((option, index) => {
          const isSelected = option.value === selected;
          return (
            <li key={option.value} role="presentation">
              <button
                type="button"
                role="option"
                id={`${uid}-option-${index}`}
                tabIndex={-1}
                aria-selected={isSelected}
                data-active={index === active}
                onMouseEnter={() => setActive(index)}
                onClick={() => commit(option.value)}
              >
                <span>{option.label}</span>
                {isSelected && <Check size={13} />}
              </button>
            </li>
          );
        })}
      </ul>
      {name && (
        <input
          className="select-value"
          name={name}
          value={selected}
          required={required}
          autoComplete={autoComplete}
          tabIndex={-1}
          aria-hidden="true"
          onChange={() => {}}
        />
      )}
    </div>
  );
}
