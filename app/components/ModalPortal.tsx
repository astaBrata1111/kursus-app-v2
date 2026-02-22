"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Renders children into document.body via a React Portal.
 * This escapes any overflow / stacking-context from parent components
 * (e.g. AppShell's overflow-y:auto on <main>), so modals always cover
 * the full viewport including the sidebar.
 */
export default function ModalPortal({ children }: { children: ReactNode }) {
    const elRef = useRef<HTMLDivElement | null>(null);

    if (!elRef.current && typeof document !== "undefined") {
        elRef.current = document.createElement("div");
    }

    useEffect(() => {
        const el = elRef.current;
        if (!el) return;
        document.body.appendChild(el);
        return () => { document.body.removeChild(el); };
    }, []);

    if (!elRef.current) return null;
    return createPortal(children, elRef.current);
}
