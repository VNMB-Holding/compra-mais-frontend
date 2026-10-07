import React from "react";

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

const ICON_ALIASES: Record<string, string> = {
  cog: "settings-01",
  settings: "settings-01",
  trash: "trash-01",
  delete: "trash-01",
  edit: "edit-01",
  pencil: "pencil-01",
  search: "search-md",
  copy: "copy-01",
  tag: "tag-01",
  plus: "plus",
  check: "check",
  "check-circle": "check-circle",
  "alert-triangle": "alert-triangle",
  "shopping-cart": "shopping-cart-01",
  "file-text": "file-02",
  file: "file-01",
  eye: "eye",
  "eye-off": "eye-off",
  "chevron-up": "chevron-up",
  "chevron-down": "chevron-down",
  "chevron-left": "chevron-left",
  "chevron-right": "chevron-right",
  close: "x-close",
  x: "x-close",
  user: "user-01",
  users: "users-01",
  calendar: "calendar",
  filter: "filter-lines",
  download: "download-01",
  upload: "upload-01",
  bell: "bell-01",
  mail: "mail-01",
  lock: "lock-01",
  building: "building-01",
};

export default function Icon({ name, size = 20, className = "", onClick, style = {} }: IconProps) {
  const resolvedName = ICON_ALIASES[name] || name;
  return (
    <span
      className={className}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        backgroundColor: "currentColor",
        maskImage: `url(/icons/${resolvedName}.svg)`,
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskImage: `url(/icons/${resolvedName}.svg)`,
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        ...style,
      }}
    />
  );
}
