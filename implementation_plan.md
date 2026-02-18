# Implementation Plan: Website Redesign & Performance Optimization

## Objective
Modernize the website design to achieve a premium, dynamic look while ensuring high performance and SEO optimization.

## 1. Design Overhaul (Aesthetics & UI)
- **Color Palette**: Refine the color scheme.
  - Primary: `#FFFFFF` (Text/Accents)
  - Secondary: `#000000` (Backgrounds)
  - Accent: `#3B82F6` (Bright Blue for Engineering/Tech vibe) -> Adjust to a more vibrant electric blue or gradient.
  - Glassmorphism: Enhance `rgba(255, 255, 255, 0.1)` backgrounds with `backdrop-filter: blur(12px)`.
- **Typography**:
  - Headers: `Playfair Display` (Keep for elegance) or switch to a modern geometric sans like `Outfit` or `Space Grotesk` for a more "Engineering" feel? *Decision: Keep Playfair for the "Personal/Artistic" side, use Inter for "Engineering" side.*
  - Body: `Inter` (Good for readability).
- **Layout**:
  - Increase whitespace (padding/margins).
  - Use CSS Grid for more complex layouts (e.g., Research section).
- **Visual Effects**:
  - Add subtle gradients to text and buttons.
  - Enhance the "Hero" section with a more dynamic entrance animation.
  - Improve the "Glass" effect on cards (Research, Education).

## 2. Performance Optimization
- **Images**: Ensure all images are optimized (WebP format if possible, lazy loading).
- **CSS/JS**: Minify where possible (manual clean-up).
- **Loading**: The current loading screen is good, but ensure it doesn't block content for too long.

## 3. Code Refactoring
- **CSS Variables**: Consolidate all colors and spacing into root variables.
- **Semantic HTML**: Verify `<main>`, `<section>`, `<article>` usage.
- **Accessibility**: Check ARIA labels and contrast ratios.

## 4. Specific Section Improvements
- **Hero**: Make the text pop more against the background.
- **About**: Improve the text readability on the background image.
- **Research**: Card design can be more "premium" (hover lift effects, glowing borders).
- **Education**: Clean up the timeline view.
- **Contact**: Make the form look more inviting.

## Execution Steps
1.  **Update CSS Variables & Base Styles**: Set the foundation.
2.  **Refine Hero Section**: Typography and animations.
3.  **Enhance Cards (Research/Projects)**: Glassmorphism and hover effects.
4.  **Polish Navigation**: Smooth transitions and mobile menu.
5.  **Final Review**: Check responsiveness and accessibility.
