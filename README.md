# Skyrim Follower Archive 🗡️🌌

Welcome to the **Skyrim Follower Archive**, an interactive database and relationship visualizer designed to help you curate your perfect Skyrim companion loadout. This tool indexes top-tier custom-voiced followers, analyzing their characteristics, compatibility, and complex cross-mod dialogue interactions (**crosstalk**).

---

## 🚀 Key Features & How to Use the Site

### 1. Unified Search & Multi-Layered Filtering
The header banner provides controls to narrow down your roster seamlessly:
*   **Universal Keyword Search**: Match names, classes, or roles on the fly.
*   **Demographics Filters**: Filter companions instantly by **Gender** and **Race**.
*   **Mod Filter**: Display only followers originating from a specific Mod or Pack.
*   **Exclude Mods / Packs (Multi-Select)**: Prevent conflicting mods or characters you do not use from cluttering your view. Simply select one or more mods from the dropdown to hide them from the roster. Remove individuals easily via the active red badges.
*   **Banter Filter**: Find followers that talk to a specific companion, or preview any follower who features custom dialogue interactions.

---

### 2. Interactive Profile Inspector
Clicking on any companion card in the roster reveals their detailed archive sheet:
*   **Core Metadata**: Race, Gender, Role, and their source Mod.
*   **Feature Tags**: Highlights outstanding features like custom quests, mount systems, dynamic horse riding, or custom outfits.
*   **Nexus Link**: Instant link to download the mod directly from Nexus Mods.

---

### 3. Dynamic Partnership & Crosstalk Interaction Web
Located at the bottom of the page, the **Dialogue Interaction Web** visualizes the complex network of relationships:
*   **1st-Degree (Direct Crosstalk)**: Main connected nodes showing followers who have built-in banter lines with your selected companion.
*   **2nd-Degree (Deep Web Branches)**: Toggle **Deep Web Branches** to render secondary branches. This visualizes who your companion's friends also talk to, creating a visual path of potential party dynamics!
*   **Hover Inspection**: Hover your cursor over any node or sub-branch in the SVG orbit map to load rich, real-time stats into the inspector preview. You can immediately see if a relationship requires a **compatibility patch** or if it is natively integrated. 
*   **Refocusing**: Click any available icon node on the map to immediately pivot the database and focus on that follower's archive sheet and unique dialogue tree.

---

## 🛠️ Build and Development

This is a modern React application built using **TypeScript**, **Tailwind CSS**, and **Framer Motion (`motion/react`)**.

### Running the App
To run the development server:
```bash
npm run dev
```

To build and compile static assets for production:
```bash
npm run build
```
