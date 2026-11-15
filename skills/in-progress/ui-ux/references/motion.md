# Motion

Nuxt UI animates its own components. These rules govern motion you add.

- Add motion only when it explains a change: where something came from or went, what
  changed state, or what the user's action did. Motion with no such job stays out.
- Actions repeated many times a day, and anything triggered from the keyboard, get no
  animation; repeated motion turns into a delay.
- Keep UI motion short: about 100 ms for small feedback, 200 to 300 ms for a panel or
  modal.
- Start motion from its trigger, and keep it interruptible. Input works while motion
  plays, and an element animating out takes no input.
- Keep motion subtle enough that it never pulls attention from the task.
- Under `prefers-reduced-motion`, replace movement with fades and keep colour and opacity
  changes that aid understanding. Loading spinners keep turning, gently. Nuxt UI's
  overlays already do this; apply it to your own motion.
