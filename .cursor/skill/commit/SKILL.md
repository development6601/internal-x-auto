---
name: commit
description: Generates a conventional commit message and directly executes the git commit. By default, commits only staged changes and never stages or includes untracked files unless explicitly requested.
---

# Commit Skill

Use this skill to 
- (1) generate a conventional commit message that follows the project’s rules, 
- (2) automatically perform a git commit using terminal commands, and 
- (3) always append an AI co-author trailer.

## Commit Scope Rules (Git Behaviour)

* **Default behaviour (no special wording):**

  * **Only commit already-staged changes.**
  * Do **not** run `git add` on any files.
  * Do **not** include untracked files or unstaged modifications.
  * Use `git commit` with the generated message, relying solely on what is in the index.

* **When the user explicitly wants everything committed** (e.g. says “all changes”, “commit everything”, “include untracked files”, or similar clear wording):

  * Stage all relevant changes first (tracked + untracked) using a safe command such as:

    * `git add -A` (preferred) or `git add .` from the repo root.
  * Then run `git commit` with the generated message.

* **Never stage or commit untracked changes** unless the user clearly indicates “all changes” or equivalent.

* If the user’s wording is ambiguous, **ask a quick clarification** (e.g. “Do you want only staged changes, or all changes including untracked?”) before staging anything.

## How to Use This Skill

When you (the assistant) are asked to help with commits:

1. **Summarize the change set** (from diff, description, or tests) in plain language.
2. **Generate a commit message** using the exact rules in [reference.md](reference.md) (conventional subject line: format, types, scope, word limit).
3. **Append co-author trailer (MANDATORY)** as defined in the section below.
4. **Confirm the scope**:

   * If the user did **not** say “all changes” (or similar), commit **only staged changes**.
   * If the user **did** clearly say “all changes”, stage everything and then commit.
5. **Execute git commands via terminal**:

   * Default: `git commit -m "<message>"`
   * With all changes: `git add -A && git commit -m "<message>"`
6. Report back the final commit message and what was committed.

You **must** follow [reference.md](reference.md) exactly for the commit **subject line** (the co-author trailer is added separately per this skill, not inside the subject rules in reference).

---

# AI Co-Author Trailer (MANDATORY)

Every commit **must include at least one `Co-authored-by` trailer**.

## Format

```

Co-authored-by: <name> <email>

```

## Rules

* Must always be appended at the **end of the commit message**.
* Email MUST represent the provider identity (GitHub bot identity).
* Email MUST be fixed per provider (never dynamic).
* Model/version ONLY affects the display name, NOT the email.
* Multiple agents → multiple trailers allowed.

---

## Email Rules (STRICT)

* Claude (Anthropic): noreply@anthropic.com
* OpenAI (Codex / GPT): noreply@openai.com
* Cursor: cursoragent@cursor.com

### 🚨 Enforcement (CRITICAL - MUST FOLLOW)

* NEVER use `noreply@cursor.com` ❌
* NEVER guess or derive email patterns
* ALWAYS use EXACT emails defined above
* If agent = Cursor → MUST be:
```

Co-authored-by: Cursor [cursoragent@cursor.com](mailto:cursoragent@cursor.com)

```
* If email does not match the above list → it is INVALID and must be corrected before commit

---

## Name Rules

* Prefer **model-specific naming when available (highest priority)**:

* Claude Sonnet 4.5
* Claude Opus 4.6
* Claude Haiku 4.7

* If model is unknown → fallback to provider/tool name:

* Claude
* Codex
* Cursor

---

## Supported Agent Priority

When identifying the co-author, use this strict priority:

1. Claude (Sonnet / Opus / Haiku)
2. OpenAI (Codex / GPT)
3. Cursor
4. Others (fallback to provider name with correct email if known)

---

## Examples

```

Co-authored-by: Claude Sonnet 4.5 [noreply@anthropic.com](mailto:noreply@anthropic.com)
Co-authored-by: Claude Opus 4.6 [noreply@anthropic.com](mailto:noreply@anthropic.com)
Co-authored-by: Claude Haiku 4.7 [noreply@anthropic.com](mailto:noreply@anthropic.com)

Co-authored-by: Codex [noreply@openai.com](mailto:noreply@openai.com)

Co-authored-by: Cursor [cursoragent@cursor.com](mailto:cursoragent@cursor.com)

```

---

## Example Final Commit

```

feat(api): add retry logic for rate limit handling

Co-authored-by: Claude Sonnet 4.5 [noreply@anthropic.com](mailto:noreply@anthropic.com)

```

---

## Commit message subject line

Full rules (format, types, scope, examples, word count): [reference.md](reference.md). The subject line must satisfy reference; **Co-authored-by** is always appended after as a trailer (see above), not as part of the subject line rules in reference.