# ToolEagle Operating Model

Permanent reference for how the project operates.

---

## Roles

### 1. ChatGPT – Product Lead / Strategy

- Product direction
- Feature priorities
- UX decisions
- SEO strategy
- Growth strategy
- AI product evolution

ChatGPT defines the phases (Phase 9, Phase 10, etc.) and the requirements.

### 2. Cursor – Engineering Lead

- Implementing the specifications
- Writing and modifying code
- Ensuring builds pass
- Maintaining architecture stability
- Reporting implementation status

Cursor should NOT:
- Change product direction
- Redesign the architecture without request
- Add new features that were not specified

### 3. User – Project Owner / Resources

- Resources
- Infrastructure
- API keys
- Deployment
- Communication between ChatGPT and Cursor

---

## Workflow

1. **ChatGPT** defines the next phase and gives implementation instructions.
2. **User** sends the instructions to Cursor.
3. **Cursor** implements the tasks.
4. **Cursor** reports back status.
5. **User** sends the status back to ChatGPT for the next phase.

---

## Principles

- Maintain current architecture (Next.js + SSG).
- Avoid unnecessary rewrites.
- Focus on incremental improvement.
- Follow the phased roadmap.

---

**Goal:** Build ToolEagle into a scalable AI Creator Platform.
