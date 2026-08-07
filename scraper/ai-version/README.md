# Bonus Stage B — the AI rematch (not filled in here)

This folder is where your AI-generated version goes if you do the bonus
stage. It's intentionally empty in this build.

The assignment is explicit that the value of this stage is in **you**
writing the prompt from memory, without looking at the brief, and then
judging what comes back:

> "Write the prompt yourself. This is the real exercise... An AI's
> output is exactly as good as your specification — and you could only
> judge it because you built the thing yourself first."

Having the hand-built pipeline (in `../src/`) written *for* you and then
also generating the "AI version" for you would defeat the point of the
comparison — you wouldn't be able to honestly answer "what did my prompt
forget to say?" So this stage is left for you:

1. Without re-reading the assignment, write a prompt describing what you
   built: target + 3-page scope, the 8 raw fields, the clean schema,
   caching, delay, user-agent, timeout, the validation rule, the
   no-duplicates rule, what happens on a broken page, the run report,
   and your language.
2. Generate a version from that prompt into this folder (or a separate
   branch).
3. Run it against the same checkpoints as `../src/`.
4. Write the "AI vs me" section in the main README: what it did better,
   what it got wrong or skipped, what your prompt forgot to say.
5. One rematch: improve the prompt, regenerate once, note what changed.
