/**
 * URL of a file in public/, relative to where the site is served
 * ("/" locally, "/<repo>/" on GitHub Pages — see vite.config.ts).
 * Vite already rewrites public paths in index.html and CSS; this is for
 * URLs built in TypeScript.
 */
export const publicUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
