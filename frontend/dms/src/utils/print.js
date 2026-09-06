function sanitizePrintTitle(value, fallback = "Prime Rides") {
    return String(value || fallback)
        .trim()
        .replace(/[<>:"/\\|?*]+/g, "")
        .replace(/\s+/g, " ");
}

export function printDocument({
    title,
    documentNumber,
}) {
    const previousTitle = document.title;

    const safeTitle = sanitizePrintTitle(title);
    const safeNumber = sanitizePrintTitle(
        documentNumber,
        "",
    );

    document.title = safeNumber
        ? `${safeTitle}-${safeNumber}`
        : safeTitle;

    const restoreTitle = () => {
        document.title = previousTitle;
        window.removeEventListener(
            "afterprint",
            restoreTitle,
        );
    };

    window.addEventListener(
        "afterprint",
        restoreTitle,
    );

    window.print();
}