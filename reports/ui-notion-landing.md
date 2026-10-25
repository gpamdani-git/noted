# REA UI Specification Report: Notion.com Landing Page Analysis for Noted

**Target URL:** https://www.notion.com/  
**Evidence Artifact:** `reports/notion_homepage_desktop.png`  
**Extracted Data:** `reports/notion_deep_analysis.json` & `reports/notion-homepage-a11y.txt`  
**Target Identity:** Noted Marketing Landing Page & Web Experience

---

## 1. Executive Summary & Design System

The Notion marketing website is a masterclass in minimalist, high-contrast, type-driven interface design. It combines generous white space, crisp sans-serif typography (`Inter` / `-apple-system`), subtle monochrome borders (`rgba(0, 0, 0, 0.08)`), micro-interactions (soft box-shadow hover states, animated tab transitions), and rich bento-box feature showcases.

### Design Tokens
- **Backgrounds:**
  - Light mode: `#FFFFFF` (pure white canvas)
  - Bento card background: `#F9F8F7` / `#F7F6F3`
  - Dark mode: `#191919` / `#202020`
- **Text & Foreground:**
  - Primary text: `rgba(0, 0, 0, 0.95)` / `#121212` (dark mode: `rgba(255, 255, 255, 0.95)`)
  - Secondary text: `rgba(0, 0, 0, 0.60)` / `#5F5E5B` (dark mode: `rgba(255, 255, 255, 0.60)`)
  - Muted text: `rgba(0, 0, 0, 0.40)` / `#908E8B` (dark mode: `rgba(255, 255, 255, 0.40)`)
- **Borders & Dividers:**
  - Subtle divider: `1px solid rgba(0, 0, 0, 0.08)` (dark: `1px solid rgba(255, 255, 255, 0.1)`)
  - Card border: `1px solid rgba(0, 0, 0, 0.06)`
- **Typography:**
  - Font family: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
  - Hero H1: `96px` / `line-height: 100px` (mobile: `44px` / `50px`), letter-spacing: `-0.04em`
  - Section H2: `44px` / `line-height: 52px`, letter-spacing: `-0.025em`
  - Card Title H3: `24px` / `line-height: 32px`, font-weight: `600`
  - Body Text: `16px` / `line-height: 24px`
- **Buttons & CTAs:**
  - Primary button: Solid black `#050505` with white `#FFFFFF` text, `padding: 10px 18px`, `border-radius: 8px` (or pill `9999px`), `font-weight: 500`. Hover: `#262626`.
  - Secondary button: `#FFFFFF` with `1px solid rgba(0, 0, 0, 0.12)`, text `#000000`, hover background `#F5F5F5`.
  - Nav links: `font-size: 14px`, `font-weight: 500`, subtle text hover color `#000000`.

---

## 2. Section Breakdown & Components

### 2.1 Sticky Top Navigation Bar
- **Position:** `position: sticky; top: 0; z-index: 1000; backdrop-filter: blur(12px); background: rgba(255, 255, 255, 0.85);`
- **Height:** `64px` with max-width `1280px` container.
- **Left:** Noted Brand Logo (monochrome rounded `[N]` icon + "Noted" typography).
- **Center:** Navigation items:
  - `Product` (Features, Releases, Download)
  - `Resources` (Customer stories, Templates, Academy, Community)
  - `Pricing`
- **Right:**
  - `Request a demo` (secondary text link)
  - `Log in` (text link -> triggers Noted Login Modal)
  - `Get Noted free` (primary black button -> triggers login or launches workspace)

### 2.2 Hero Section
- **Headline:** "Where teams and agents **[Think / Create / Ship / Plan]** together."
  - Includes smooth dynamic rotating verb with highlight styling.
- **Subtitle:** "Capture context, find answers, and automate tasks with AI built for your team."
- **Dual CTA:**
  - Primary button: "Get Noted free" (with right arrow `→`)
  - Secondary button: "Request a demo" or "Launch Workspace"
- **Interactive Workspace Preview:**
  - Photorealistic mock of Noted with sidebar navigation, active document with clean typography, slash command menu, and inline AI assistant bubble.

### 2.3 Logo Marquee / Social Proof
- Heading: *"The most ambitious companies run on Noted."*
- Logos rendered with subtle opacity (`0.7` hovering to `1.0`):
  OpenAI, Figma, Cursor, Ramp, Vercel, Substack, Nvidia, Toyota, Discord, Clay, Lovable.

### 2.4 Bento Features Grid ("AI where your team works")
Three interactive tabbed cards:
1. **Bring everything into one system of record**
   - Docs, wikis, and project databases in one integrated canvas.
   - Interactive database view & document switch.
2. **Get answers, instantly—with citations**
   - Natural language search with source document chips.
   - Semantic Q&A simulator with instant responses.
3. **Keep work moving 24/7 with agents**
   - Autonomous background tasks, status updates, and triage workflows.

### 2.5 Use Cases Grid ("See what Noted can do")
5 modern cards with hover micro-animations:
- Triage product feedback →
- Resolve support tickets in Slack →
- Respond to security alerts faster →
- Automate weekly reporting →
- Create your own developer tools →

### 2.6 Customer Testimonials ("Trusted by teams that ship")
3 high-impact quote cards:
- **Cursor** (Michael Truell, Co-founder & CEO)
- **Faire** (Renee Solorzano, Sr. Director of Product Design)
- **Ramp** (Ben Levick, Head of Operations & Internal AI)

### 2.7 Global Traction & Metric Badges
- G2's #1 knowledge base for 3 consecutive years
- 100M+ users in over 50 countries
- Over 50% of YC companies
- 1.4M+ community members
- 62% of Fortune 100 use Noted

### 2.8 Final CTA Section
- Clean, centered callout with prominent headline "Get started today."
- Action buttons: "Get Noted free" + "Request a demo".

### 2.9 Comprehensive Footer
- Left: Noted Logo, Marshall McLuhan quote (*"We shape our tools, and thereafter our tools shape us."*), language picker, copyright.
- Right: 4 link columns (`Product`, `Resources`, `Company`, `Noted for`).

