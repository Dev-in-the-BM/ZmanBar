# AI Rules for this Application

This document outlines the technical stack and guidelines for developing this GNOME Shell extension.

## Tech Stack Description

1.  **GNOME Shell Extension**: The application is developed as a GNOME Shell extension, integrating directly with the GNOME desktop environment.
2.  **Language**: JavaScript (ESM syntax for modules) is the primary programming language.
3.  **Runtime Environment**: GJS (GNOME JavaScript) provides the runtime, offering JavaScript bindings to GTK and other GNOME libraries.
4.  **UI Toolkit**: `St` (part of GJS) is used for creating and managing UI elements within the GNOME Shell panel.
5.  **Core GNOME Shell Modules**: Utilizes built-in GNOME Shell modules like `Main` and `PanelMenu` for extension functionality.
6.  **Date Handling**: All Jewish date calculations will exclusively use the manually adapted external JavaScript libraries (e.g., `jewish-date` and its dependencies). These libraries must be pure JavaScript and GJS-compatible. The previously existing custom date conversion logic is no longer to be used.
7.  **Styling**: Standard CSS is used for visual presentation, defined in `stylesheet.css`.
8.  **No External UI Frameworks**: The project does not use web-based UI frameworks such as React, Vue, or Angular.
9.  **No External Component Libraries**: There are no external component libraries like shadcn/ui or Radix UI.
10. **No TypeScript**: The codebase for the extension itself is written entirely in plain JavaScript. While external libraries might originate from TypeScript, their integrated form must be plain JavaScript.

## Library Usage Rules

*   **Core GNOME Shell Modules**: For all core extension functionalities and UI elements, exclusively use the built-in GNOME Shell modules: `gi://St`, `resource:///org/gnome/shell/ui/main.js`, `resource:///org/gnome/shell/ui/panelMenu.js`, and `resource:///org/gnome/shell/extensions/extension.js`.
*   **Date Calculations**: All Jewish date-related logic must come from the *manually adapted* external JavaScript libraries (e.g., `jewish-date`, `gematriya`). The previously existing `HebrewDateConverter` object or similar custom date conversion implementations in `extension.js` are to be disregarded and replaced. Any external library must be stripped of non-GJS dependencies and APIs, and its core logic integrated as pure JavaScript files within the `_lib` directory.
*   **UI Components**: Create all user interface elements using `St` widgets (e.g., `St.Label`, `PanelMenu.Button`). Do not introduce or attempt to integrate external UI component libraries or frameworks.
*   **Styling**: Apply all visual styling using standard CSS within `stylesheet.css`. Avoid introducing CSS frameworks like Tailwind CSS.
*   **No Package Manager Dependencies**: This environment does not typically use `npm` or `yarn` for runtime dependencies in the same manner as web applications. External JavaScript files, including adapted libraries, must be included directly and manually bundled or adapted as per GNOME Shell extension best practices, ensuring no runtime reliance on package managers.
*   **Language Consistency**: Maintain the codebase in plain JavaScript. While external libraries may originate from TypeScript, their final, integrated form within the extension must be plain JavaScript. Do not introduce TypeScript directly into the extension's development.
*   **Framework Exclusion**: Do not introduce any web-based UI frameworks (e.g., React, Vue, Angular).