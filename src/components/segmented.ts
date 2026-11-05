import "../styles/components/segmented.css";

export interface SegmentedControl<T extends string> {
  el: HTMLElement;
  set(value: T): void;
}

/** Small pill switch, e.g. Light | Dark. */
export function segmented<T extends string>(
  label: string,
  options: { value: T; label: string }[],
  value: T,
  onChange: (value: T) => void,
): SegmentedControl<T> {
  const el = document.createElement("div");
  el.className = "segmented";
  el.setAttribute("role", "group");
  el.setAttribute("aria-label", label);

  const buttons = options.map((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "segmented__option text-body-large";
    button.textContent = option.label;
    button.dataset.value = option.value;
    button.addEventListener("click", () => {
      if (button.getAttribute("aria-pressed") === "true") return;
      set(option.value);
      onChange(option.value);
    });
    el.append(button);
    return button;
  });

  function set(next: T) {
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.value === next)));
  }

  set(value);
  return { el, set };
}
