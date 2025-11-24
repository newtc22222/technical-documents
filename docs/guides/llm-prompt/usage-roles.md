# Guide to Methods and Processes for Using LLMs Effectively

This document presents basic steps and advanced techniques for working with large language models (LLMs) efficiently — so you get better outputs and save time.

---

## 1. Mindset & Approach

Before you start, shift how you interact with the model. Instead of treating an LLM like a search engine, treat it as a **smart assistant**.

* **Think “role-based”**: Assign the LLM a specific role. For example: “Act as a DevOps engineer” or “You are a marketing expert.” That focuses the model and yields more relevant answers.
* **Provide context**: Always give enough background and constraints so the model understands the task.
* **Break big tasks into smaller steps**: If a request is complex, split it into subtasks and iterate.

---

## 2. The 4-Step Optimal Prompting Process

A simple, repeatable process to get higher-quality answers from an LLM.

### Step 1 — Role

Specify the role you want the LLM to play.
**Example:** “Act as an experienced Python developer.”

### Step 2 — Goal

State the goal you want to achieve.
**Example:** “My goal is to create a function that reads a CSV and cleans the data.”

### Step 3 — Context

Give detailed data and context.
**Example:** “The CSV has 5 columns: `ID`, `Name`, `Email`, `Birthdate`, `Phone`. `Email` and `Phone` may contain missing or invalid values.”

### Step 4 — Output Format

Tell the model how you want the response formatted.
**Example:** “Reply with a single Python function. Include comments explaining each step.”

### Combined example prompt

> Act as an experienced Python developer. My goal is to create a function that reads a CSV and cleans the data. The CSV has 5 columns: `ID`, `Name`, `Email`, `Birthdate`, `Phone`. `Email` and `Phone` may contain missing or invalid values. Answer with a Python code snippet. Include comments explaining each step. The final deliverable should be a single function.

---

## 3. Advanced Techniques

Use these techniques to maximize model usefulness.

* **Prompt Chaining** — build multi-step conversations. After the model replies, refine the task or add new requirements and continue the chain.
  *Example flow:*

  1. You: “Write a Python function to connect to MySQL.”
  2. LLM: provides code.
  3. You: “Nice — now add a connection health-check before executing queries.”

* **Few-shot Prompting (Examples)** — show a few input→output examples so the model learns the desired format and tone.
  *Example:* show sample input user stories and corresponding user-story outputs, then provide a new input and ask for the same output style.

* **Reflection (Self-review)** — ask the model to evaluate its answer before finalizing.
  *Example:* “Provide a solution, then self-review and suggest if a better approach exists and why.”

---

## 4. Verification & Evaluation

* **Don’t trust blindly** — always validate LLM answers (especially code, configs, or security-related content).
* **Compare alternatives** — ask the model for multiple approaches and compare trade-offs (complexity, cost, performance, maintainability).
