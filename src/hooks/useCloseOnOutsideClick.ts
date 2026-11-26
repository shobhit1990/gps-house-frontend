import { useEffect, type RefObject } from "react";

/** Closes a native `<details>` when clicking outside or pressing Escape. */
export function useCloseDetailsOnOutsideClick(ref: RefObject<HTMLDetailsElement | null>) {
	useEffect(() => {
		const onPointer = (event: MouseEvent) => {
			const details = ref.current;
			if (!details?.open) return;
			if (!details.contains(event.target as Node)) details.open = false;
		};
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape" && ref.current?.open) {
				ref.current.open = false;
			}
		};
		document.addEventListener("mousedown", onPointer);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onPointer);
			document.removeEventListener("keydown", onKey);
		};
	}, [ref]);
}

/** Calls `onClose` when clicking outside `ref` or pressing Escape, while `active` is true. */
export function useCloseOnOutsideClick(
	ref: RefObject<HTMLElement | null>,
	active: boolean,
	onClose: () => void,
) {
	useEffect(() => {
		if (!active) return;
		const onPointer = (event: MouseEvent) => {
			if (!ref.current?.contains(event.target as Node)) onClose();
		};
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};
		document.addEventListener("mousedown", onPointer);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onPointer);
			document.removeEventListener("keydown", onKey);
		};
	}, [active, onClose, ref]);
}
