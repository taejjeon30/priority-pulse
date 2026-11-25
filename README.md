# PriorityPulse

PriorityPulse is an interactive traffic signal optimization and emergency-vehicle corridor simulation platform. It models intersection queues, stochastic traffic demand, and dynamic green-wave preemption to reduce emergency response times while minimizing disruption to surrounding traffic.

## Features
- **Interactive Corridor Map:** Visualize intersections, traffic queues, and emergency vehicle routing on a real street network (including a preloaded Lake Forest corridor).
- **Signal Preemption & Green Wave:** Compare baseline fixed-time signals against adaptive priority signal control.
- **Experiment Lab & Analytics:** Run Monte Carlo trials, inspect queue forecasts, and export results.
- **Scenario Library:** Save, duplicate, and replay custom network configurations directly in the browser.

## Tech Stack
- React + Vite
- Tailwind CSS & Radix UI
- React-Leaflet & Recharts

## How to Run Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/priority-pulse.git
   cd priority-pulse
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open the local URL shown in your terminal (usually `http://localhost:5173`).
