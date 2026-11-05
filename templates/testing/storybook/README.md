# Storybook testing convention

Canonical UI comes from theme.tools themes/assets and ui.theme.tools web components. Store new reusable UI there and release it through the established workflow; applications consume packages and never copy component specifications or fixtures.

Storybook must catalog primitives, widgets, sections, complete pages, and representative full sites. Stories use real exported interfaces, explicit independent resettable fixtures, production providers, meaningful states, roles/labels, interactions, accessibility assertions, supported themes/motion/locales, responsive/container transitions, and loading/error recovery.

Use addon-vitest for canonical component/story execution. For remote Chromium, build an immutable Storybook and reuse its stories plus shared assertions in Playwright only after verifying the adapter. Map shared changes to representative consumer page/full-site stories and authorized downstream applications.
