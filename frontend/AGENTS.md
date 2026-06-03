<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
# Formatting Rules - STOP USING PRETTIER

We have specific formatting requirements that align with our **Bootstrap-based custom design system**. Prettier’s default rules conflict with our aesthetic and layout preferences, especially regarding:  
- **CSS/SCSS styling:** We prefer inline Bootstrap classes and specific spacing conventions.  
- **Component structure:** We have a consistent file organization pattern.  
- **Global standards:** All code must follow the Bootstrap 5 aesthetic.  

**Formatting Requirements:**  
1. **No Prettier:** Do not use Prettier for formatting.  
2. **Bootstrap 5 Standards:** All code must adhere to the visual and structural standards of Bootstrap 5.  
3. **Component Structure:** Maintain the established folder and file structure within `src/components` and `src/app`.  
4. **Inline Styles:** Prefer Bootstrap utility classes and inline styles for layout and styling elements.  
5. **Custom CSS:** All custom CSS/SCSS must align with the Bootstrap design system and should be placed in appropriate files as per existing patterns.  
6. **Code Style:** Maintain clean, readable code that emphasizes the Bootstrap-centric aesthetic of the application.  
<!-- END:nextjs-agent-rules -->
