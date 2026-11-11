# Design system for the Bhavya Sampada build

Source: Claude Design project "Datta - Website" (project id 82f92ea3-22e9-4917-a2e0-119983f218d9), a Saras website system built from the Saras homepage v5 prototype (2 Nov 2026). Read-only use: nothing was written back to the project.

## Decisions for this site
- Use the system's tokens, layout rules and components for structure and feel.
- Do NOT use Saras logos, customer logos, people photos, product shots, Daton/iQ marks or any Saras copy.
- Roobert is a trial-licensed font. Display type uses Poppins 500 with the system's tracking unless a full licence exists.
- Keep the system's rules: no emoji, no exclamation marks, sentence-case headings, concrete numbers.

## Colour (tokens/colors.css)
- Ink `#0B0B14`, muted `#535768`, soft `#7A7F90`, line `#E4E4EF`, page `#F6F6F6`, paper `#FFFFFF`, inset surface `#F4F4F8`
- Accent, Saras indigo `#3F3DE2` (hover `#3331C8`, pressed `#2B29B0`); tints `#ECEDFF`, `#EEEEFC`; on dark `#8F8BF5`, `#B4B2FF`
- Hero plum sky: `#151026` to `#24215C` to `#433F9E` to `#9B98D4` to white. Keep hero text in the dark band.
- Dark chapter: `#1E1E1E` bg, `#242424` panel, `#2C2C2C` card, hairline `#FFFFFF14`, text `#F2F2F2`, muted `#A6A9B6`. Indigo is the only colour there.

## Type (tokens/typography.css)
- Display 72/74, H1 56/60, H2 48/52 (40/42 small), H3 28/34, H4 20/26, lead 19/30, body-L 17/27, body 15/24, small 13/18, micro 12/16
- Tracking: display -0.035em, headings -0.03em, H3 -0.025em, eyebrow +0.08em uppercase
- Weights: 400 body, 500 headings and labels, 600 sparingly

## Spacing and shape (tokens/spacing.css)
- Scale 4, 8, 12, 16, 24, 32, 40, 56, 80, 96, 160, 200
- Page max 1440, gutter 80, content 1280, section gap 160 (200 for dark chapters), nav height 80
- Radii: 6 nav button, 8 buttons, 10 to 14 tiles, 16 panels, 24 hero stage, pill for tabs
- Buttons 52px tall (48, 44, 36 smaller). Shadows are soft and indigo-tinted: `#3F3DE214`.

## Components in the system (components/*)
Sections: SectionHeader, StatStrip, CustomerGrid, StoryCard, ComparisonBars, TeamCard, PricingPlan, PodcastBanner, CtaBand
Core: Button, Chip, EmailCapture. Content: AskBubble, AnswerCard, FaqItem. Motion: LogoMarquee, Reveal. Navigation: Nav. Windows: SlackWindow, TerminalWindow.

Map for Bhavya Sampada:
- Nav, Button, SectionHeader, StatStrip, CtaBand, FaqItem, TeamCard, StoryCard (client stories), EmailCapture (consultation form)
- Skip: AskBubble, AnswerCard, SlackWindow, TerminalWindow, LogoMarquee, PodcastBanner, PricingPlan (not relevant yet; revisit if you publish fees)

## Motion
- Ease standard `cubic-bezier(.4,0,.2,1)`, entrance `cubic-bezier(.2,.8,.2,1)` with a 10px rise and fade
- Only animate transform and opacity. Respect prefers-reduced-motion.
- Do not hide content behind scroll-triggered reveals. The current live site shows blank bands while sections load.

## Hover, press, focus
- Primary darkens on hover, pressed scales .98. Cards lift 2px with a stronger shadow. Focus ring 3 to 4px indigo, always visible.
