# Profile border frames — image generator prompts

For the borders too detailed to draw well in code (heads, faces). The
picture is the frame only; the app adds the motion on top (glowing
eyes, fire, sparks, a light sweep), so don't paint those effects in.

Paste **STYLE** first, then one subject. Make the set in one sitting
(same model, same seed if it has one) so the frames match each other.

## Spec (every frame)

- **1024 × 1024 PNG, transparent background.**
- **The hole:** a perfect empty circle in the exact centre, **540 px
  across** (the player's picture shows through it). Fully transparent
  inside. A little of the art (teeth, fangs, petals) may cross into the
  hole's edge, no more than ~40 px in.
- The art may reach the image's edges, but nothing important in the
  outer 20 px.
- Front view, symmetrical unless the subject says otherwise.
- No text, no background, no drop shadow onto a floor.

## STYLE (put in front of every prompt)

> Premium mobile game avatar frame, polished 2D game art with a vector
> feel: clean shapes, smooth rich gradients, glossy highlights lit from
> the top left, a thin dark outline round every shape, saturated warm
> colours with gold trim. Same look as a high-end collectible profile
> frame in a mobile strategy game. Not photorealistic, not anime, not
> flat clip-art. Transparent background, the frame centred, an empty
> perfectly circular hole in the middle 53% of the image. No text, no
> letters, no watermark.

## Frames

- **lion-dance.png** — A Chinese lion dance head seen from the front,
  with its mouth wide open: the empty circle in the middle **is its
  mouth**. Red and gold head, big round eyes with white lids above the
  mouth, a golden horn and a small round mirror on the forehead, thick
  white furry brows, a rounded gold nose sitting on the top edge of the
  mouth, a ring of small white teeth round the mouth's rim, pink-gold
  cheeks, and a fluffy mane of red, white and gold tufts framing the
  whole head, with a white beard under the lower jaw. Festive and
  proud, not cute.

- **dragon-head.png** — A fierce Chinese-style dragon head seen from
  the front with its jaws wide open: the empty circle in the middle
  **is its open mouth**. Crimson and dark red scales with gold edging,
  two long ivory horns sweeping up and back, narrow slanted eyes above
  the mouth on each side (paint the eyes dark — the app makes them
  glow), a ridged snout with two nostrils on the top edge of the
  mouth, two long ivory fangs from above and two from below crossing
  the mouth's rim, rows of smaller teeth, golden whiskers flowing out
  to the sides, a spiked dark-red frill round the sides of the head and
  a short spiked beard below. Majestic and dangerous.

## Second layer (optional, makes the effects sit better)

If the generator can do it, also make each frame's **eyes alone** on a
transparent 1024 × 1024 canvas, in exactly the same place
(`lion-dance-eyes.png`, `dragon-head-eyes.png`). The app blinks and
lights these separately. Without them it glows the eyes from its own
idea of where they are.
