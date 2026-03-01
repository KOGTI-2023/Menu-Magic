# TODO & Future Enhancements

## Features

- [ ] **User Authentication:** Allow users to create accounts to save and manage their generated menus.
- [ ] **Database Integration:** Store processed menus, user preferences, and custom themes in a database (e.g., Firebase Firestore, PostgreSQL).
- [ ] **More Export Formats:** Support exporting to Word (.docx), plain HTML/CSS zip, or direct integration with POS systems.
- [ ] **Advanced Image Editing:** Allow users to crop, rotate, or manually adjust brightness/contrast of the uploaded PDF pages before AI processing.
- [ ] **Multi-Language Support:** Add the ability to automatically translate menus into different languages using Gemini 3.1 Pro Preview.
- [ ] **Custom Fonts:** Allow users to upload their own custom fonts for the menu preview and PDF export.

## Technical Debt & Optimizations

- [ ] **Web Worker for PDF Processing:** Move the `pdfjs-dist` conversion logic to a Web Worker to prevent blocking the main thread during heavy PDF processing.
- [ ] **Streaming AI Responses:** Implement streaming for the Gemini API responses to show real-time progress of the text extraction and design updates.
- [x] **next/image Migration:** Migrated `<img>` tags to `next/image` in `app/page.tsx` for optimized image loading.
- [ ] **Unit and E2E Testing:** Add comprehensive tests using Jest and Cypress/Playwright to ensure reliability of the core extraction and rendering logic.
- [ ] **Accessibility (a11y):** Improve keyboard navigation, ARIA labels, and screen reader support across the entire application.

## UI / UX

- [ ] **Drag & Drop Reordering:** Implement a visual drag-and-drop interface for reordering categories and menu items in the preview.
- [ ] **Theme Builder:** Create a visual theme builder where users can pick colors, fonts, and spacing without relying solely on the AI assistant.
- [x] **Mobile Optimization:** Further refine the mobile experience, especially for the complex "Before/After" slider and the inline editing features.
- [x] **Responsive Layout:** Improved the initial upload screen to be more compact and fit within the viewport without scrolling.
