# Mello Melt

Static website implemented from Figma file `9enOj9y27yXUSD4O3lznRl`.

The desktop design is 1440 × 8202.92578125. The mobile layout is 375 × 9589; the mobile frame's children extend beyond its original declared canvas height.

Run `npm ci` to install dependencies, then `npm run build` to regenerate `dist`. Run `npm run dev` to preview at http://127.0.0.1:4173.

The HTML, CSS, and interactions are in `src/`. Original image and SVG assets and the DynaPuff, Onest, Pacifico, and Plus Jakarta Sans fonts are stored locally in `public/assets/`. The build combines them into `dist/`.

Navigation, mobile menu, flavor selection, scoop configuration, pricing, and FAQs are interactive. Ordering is a frontend demonstration and does not submit a purchase. No payment service, social destinations, or customer account backend was provided in the design.

The feature strip loops continuously using Framer Motion's lightweight DOM animation API and respects reduced-motion preferences.

The build uses Sharp to generate responsive WebP images from the untouched original PNGs. Cached conversions are kept in ignored `.cache/images/`. Each layout uses media-qualified picture sources, so the hidden layout does not fetch its image assets. Hero images load eagerly with a matching preload; other images load lazily. Transparent gelato artwork keeps its alpha channel. Dynamic flavor selection updates the optimized picture source as well.
