import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    outDir: 'dist',
    // Emit chapter artwork as FILES, never base64 in the entry chunk.
    //
    // Vite's default inlines any asset under 4 KB. Browser Wars is the first chapter
    // with real image assets (16-colour GIFs, badges, an icon sprite), and every one
    // of them is under that limit — inlining them cost +8.5 KB gzip on the entry
    // chunk, which is paid on FIRST PAINT by every visitor including those who never
    // reach chapter 3. As files they are fetched by the browser only when the chapter
    // actually renders. See "Bundle shape (don't regress this)" in docs/AI_CONTEXT.md.
    assetsInlineLimit: 0,
  },
  server: {
    port: 3000,
  },
  assetsInclude: ['**/*.frag', '**/*.vert'],
});
