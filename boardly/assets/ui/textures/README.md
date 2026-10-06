# Surface textures

Tileable overlays used by `src/components/ui/Texture.tsx`.

| File | Used on |
|---|---|
| `painted.png` / `painted@2x.png` | panels, cards, buttons, tab bar — soft cloudy mottling modelled on the painted yellow panel |
| `felt.png` / `felt@2x.png` | blue panels (e.g. Your Tables) — woven cloth |

Each file is a transparent PNG that holds only light and dark marks, so
it works over any fill colour. To replace one, keep the file names, make
the image tile seamlessly, and export 256×256 px (`.png`) and
512×512 px (`@2x.png`).
