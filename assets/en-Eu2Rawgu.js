import"./modulepreload-polyfill-B5Qt9EMX.js";import{r as e}from"./article-DWm3EiVx.js";const t=`---
title: "Temp Labs"
subtitle: "Disposable Design Tools for AI-Assisted Workflows"
author: "Ilona Bairam · Digital & Product Designer"
lang: en
---

<!-- Source of index.html. Lines like ::: name ::: mark live embeds. Translated from ru.md — keep the two in sync. -->

I was recently reading Maggie Appleton's piece on Programming Portals — small programmable areas inside graphical interfaces that let people control a system's behaviour directly.

At some point I caught myself thinking that I use something similar in my own work all the time. Except that instead of looking for these interfaces in existing software, I ask an AI agent to build them specifically for me.

I call them Temp Labs — temporary laboratories.

They are small apps, visual editors and builders that I make for a specific design task. Sometimes I need one for a few minutes; sometimes it grows into a fairly complex tool with dozens of settings.

Once the task is done, I usually delete them.

Until recently I didn't think of this as a separate way of working at all. It was simply convenient.

## When there are too many prompts

On one project I was working on the interface of an AI chat. I needed a visual effect for one of its elements: a translucent, almost weightless ring with a soft motion, like breathing.

I had a fairly clear picture of how it should look.

I described the idea to the agent, got a first implementation and started adjusting it.

The ring felt too dense. It needed to be thinner, a little more transparent, with a different distribution of colour. Then the hues turned out too bright, the glow too strong, and the motion itself didn't look quite the way I had imagined.

Every change needed a new message.

> "A bit thinner."
>
> "Now it's too transparent."
>
> "Lower the saturation, but keep the glow."

The agent changed the code, I looked at the result and tried to phrase the next note more precisely.

At some point it became obvious that it would be far easier to control these parameters myself.

I asked the agent to create a separate HTML page with a visual preview of the ring and controls for tuning it.

That's how the lab appeared.

Instead of describing yet another shade, I could simply change a value. Instead of explaining the character of the glow, I could set its intensity. I saw changes immediately, could compare variants and go back to earlier settings.

## Orb Lab

::: orb-lab :::

The complex optical effect is produced by a WebGL shader. The lab lets you switch between presets and import and export the configuration as JSON.

## A tool that grows along with the solution

Over time I started using this approach for other tasks too.

Sometimes I need a page builder where I can rearrange blocks, change the structure of sections and other parameters.

Sometimes — a separate environment for experimenting with a component, an animation or a visual effect.

Sometimes the lab contains a code editor, and sometimes it produces a structured prompt that can then be handed to an AI agent.

::: examples :::

The principle is always the same: I build a small tool around the task I'm working on right now.

I usually start by describing what I want to explore. The agent proposes an implementation of the lab, including its interface and set of parameters.

If what it offers is enough, I start working straight away. If something is missing, I ask it to add the controls I need, change the logic or extend the functionality.

So the tool evolves as it is being used. I don't have to know from the start which parameters will matter: sometimes it's only while experimenting that it becomes clear which settings are missing.

## What happens to the result

In my workflow the lab usually lives separately from the main project. That lets me experiment freely without touching the rest of the interface.

When I'm happy with the result, I use the resulting code, configuration or written instructions to keep working with the agent.

In the case of Orb Lab, the effect became a standalone JavaScript component with two main presets:

- **Button** — a glass interactive button with a coloured ring.
- **Glow** — a lighter light effect, without the glass body.

Both use the same WebGL shader with different settings.

::: component :::

For me this is a good example of the full cycle: from a visual experiment in a separate lab to code that can be used in the product.

When the work is done, the useful result remains. The lab itself can usually be deleted.

::: context :::

## Why I build my own tools more often now

Not long ago, the idea of building a separate app to tune a single visual effect would have looked rather wasteful.

You'd have to design an interface, write the code for the controls, wire them to the component's parameters, implement the preview and the export. Building such a tool would often take longer than solving the original task.

AI changes these economics considerably.

Now a small specialised environment can be produced from a description of the task and then refined while you use it.

Of course, not every lab works out on the first try. Sometimes the agent picks an unsuitable implementation, adds unnecessary features or misses important parameters. But fixing the tool itself has now become an ordinary part of the workflow.

Most professional applications are built for a large number of users and scenarios. So their interfaces are inevitably a compromise between functionality, complexity and ease of use.

A temporary lab doesn't have to account for any of that. It can be awkward for another person, contain very specific controls and require an understanding of a particular context.

Its only user is me. And for a specific task, that is enough.

## Software for one use

In 2020 Robin Sloan wrote the essay An App Can Be a Home-Cooked Meal — about small programs made for personal needs that don't have to become a commercial product.

Temp Labs live on an even shorter timescale. I can create a tool, use it for one working session and never come back to it. Their temporary nature frees them from many of the usual development requirements. Of course, if experimental code moves into the main product, the usual requirements for quality, performance and reliability apply to it.

And I'm not claiming to have invented a new technology. Temp Labs have quite a few predecessors: interactive playgrounds, visual parameter editors, computational notebooks, environments for experimenting with code.

## Where this approach helps

For myself, I currently see a few situations.

**When the result is easier to judge visually than to describe in words.**
Animation, glow, transparency, colour, geometry or the behaviour of an interactive component.

**When you need to explore a large number of parameter combinations.**
Switching variants in real time is more convenient than changing the code step by step through the agent.

**When a design decision needs to be structured for implementation.**
The lab produces JSON, CSS, HTML or a detailed specification for the agent.

**When existing tools don't quite fit the task.**
Instead of searching for the right editor or plugin, you can create a small specialised interface.

That said, I don't use Temp Labs for every change. If a task is easy to solve directly in the project or with a single request to the agent, a separate lab only complicates the process.

## Materials and links

**[Maggie Appleton — Programming Portals](https://maggieappleton.com/programming-portals)**
An exploration of programmable areas inside graphical interfaces. This is the piece that pushed me to think about Temp Labs.

**[Bret Victor — Learnable Programming](https://worrydream.com/LearnableProgramming/)**
On the principles of designing programmable environments in which the user can directly see the result of their actions.

**[Robin Sloan — An App Can Be a Home-Cooked Meal](https://www.robinsloan.com/notes/home-cooked-app/)**
An essay about small personal programs made for particular people and needs.

**[Robin Sloan — “Ask for what you want” is a key skill for the 21st century](https://www.robinsloan.com/lab/ask-for-what-you-want/)**
A follow-up to the 2020 essay (September 2026): building personal apps with the help of AI agents.

### Orb Lab case materials

- [Demo 0 — early shader editor](case/orb/demo-0-shader-editor.html): the earliest surviving specialised implementation.
- [Demo 1 — the lab](case/orb/demo-1-lab.html): the extended visual lab.
- [Demo 2 — the component](case/orb/demo-2-component-page.html): a standalone implementation of the effect with presets ([source](case/orb/demo-2-component.js)).
- [Demo 3 — the interface](case/orb/demo-3-interface.html): the interface prototype the component was made for.
- The project's [design tokens](case/orb/tokens.css).

*Note: the source files show several implementations of the solution, but on their own they don't establish the exact chronology of the work.*

---

**Do you use a similar approach? Let me know whether this piece was useful to you.**
`;e(t,"en");
