import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

// Renders at document.body to escape overflow:hidden parents.
// Accepts a contentRef so the parent can track clicks inside the portal.
const PortalDropdown = ({ anchorRef, contentRef, open, children }) => {
  const [style, setStyle] = useState({});
  const dropdownRef = useRef(null);

  const updatePosition = useCallback(() => {
    if (!anchorRef.current) return;

    const anchorRect = anchorRef.current.getBoundingClientRect();
    const dropdownWidth = dropdownRef.current?.offsetWidth || 224;
    const viewportWidth = window.innerWidth;
    const viewportPadding = 8;
    const left = Math.min(
      Math.max(anchorRect.right - dropdownWidth, viewportPadding),
      Math.max(viewportPadding, viewportWidth - dropdownWidth - viewportPadding),
    );

    setStyle({
      position: "fixed",
      top: anchorRect.bottom + 6,
      left,
      zIndex: 9999,
    });
  }, [anchorRef]);

  useEffect(() => {
    if (!open) return undefined;

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  if (!open) return null;
  return ReactDOM.createPortal(
    <div
      style={style}
      ref={(node) => {
        dropdownRef.current = node;
        if (typeof contentRef === "function") contentRef(node);
        else if (contentRef) contentRef.current = node;
      }}
    >
      {children}
    </div>,
    document.body,
  );
};

export default PortalDropdown;
