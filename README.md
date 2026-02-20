# Algority

**Technical interviews are broken.** Most developers spend hundreds of hours memorizing optimal solutions to "Hard" problems without ever understanding *why* those solutions work. When the problem changes by 10%, they fail.

Algority is a Socratic coding coach designed to fix this. It doesn't give you the answer. It guides you to the insight.

---

## The Philosophy: Patterns over Solutions

Algority simulations are split into three high-pressure mental phases:

1.  **Neural Understanding**: We verify you actually understand the constraints, inputs, and edge cases before you write a single line of code.
2.  **Solution Building**: A step-by-step architectural breakdown. We test your reasoning on data structure choices and algorithmic trade-offs (e.g., Why a HashMap vs. a Sorted Array?).
3.  **Algorithm Tracing**: You trace pseudocode, identify logic bugs, and complete optimized implementations without the safety net of a "Reveal Solution" button.

## The Stack

Modern, low-latency, and distributed.

-   **Frontend**: Next.js 15 (App Router) + React 19 + Framer Motion.
-   **Neural Engine**: High-speed LLM orchestration via OpenRouter (Dual-call Qwen/Trinity).
-   **Execution**: Multi-tenant code execution via Judge0.
-   **State & Auth**: Supabase SSR for resilient session management.
-   **Latency Optimization**: Redis (Upstash) for predictive question caching.
-   **Observability**: LangSmith tracing for coaching quality evaluation.

## Getting Started

1.  **Clone the Archive**
    ```bash
    git clone https://github.com/Rajpragur/algority.git
    cd algority
    ```

2.  **Infrastructure Keys**
    Copy `.env.example` to `.env` and populate your Supabase, OpenRouter, and Upstash credentials.

3.  **Boot the System**
    ```bash
    npm install
    npm run dev
    ```

## Development Mission

Algority was built by [Raj Pratap Singh Gurjar](https://rajpragur.in/) to bridge the gap between "knowing" an algorithm and *inventing* one. The goal is to simulate a senior engineer sitting next to you, nudging you toward the optimal solution through targeted questioning.

---
*Built for the next generation of engineers who value depth over surface-level stats.*
