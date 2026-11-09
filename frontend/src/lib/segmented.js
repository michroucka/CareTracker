/**
 * Classes of a segmented control (‹ value ›) built from ghost buttons, such as the month picker.
 * The group carries the focus ring like a standalone field (outside its rounded corners); the focused
 * segment only gets a tint, since a ring inside a segment would sit across the group's corners.
 */
export const SEGMENTED_GROUP = "inline-flex h-10 items-stretch overflow-hidden rounded-md border bg-card shadow-xs transition-[border-color,box-shadow] duration-base ease-out has-[:focus-visible]:border-ring has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50 dark:bg-input/30";

export const SEGMENT = "h-full rounded-none active:scale-100 focus-visible:border-border focus-visible:bg-accent focus-visible:ring-0";
