# Long-Running Tasks

## Problem

YouMind API calls that involve processing (transcript extraction, image generation, document parsing, etc.) require polling and can take 10-60+ seconds. During this time, the user's main session is blocked — they can't do anything else.

## Solution: Subagent Pattern

When a task involves polling or is expected to take more than a few seconds, **always suggest running it in the background** so the main session stays responsive.

### When to Suggest Background Processing

- Any step that involves polling (checking status in a loop)
- Batch operations (multiple items to process)
- Any task the agent estimates will take > 10 seconds

### What to Tell the User

After saving the material to YouMind and providing the link, tell the user (in their language):

> "This may take 10-20 seconds. Would you like me to run this in the background so you can keep chatting? I'll notify you when it's done."

Or, if the agent platform supports subagents (OpenClaw, Claude Code, etc.), the agent should:
1. Proactively spawn a subagent for the polling + extraction work
2. Immediately return control to the user
3. The subagent notifies the user when results are ready

### Progressive Results

Never make the user wait for the entire batch to finish. Deliver results as they become available:

1. **Immediately after saving**: Show the YouMind material link (user can already view the video in YouMind)
2. **As each transcript completes**: Output that transcript right away
3. **After all done**: Show the summary table

### Implementation Note for Skill Authors

In your SKILL.md workflow, structure the steps so that:
- The "save to YouMind" step returns a link immediately
- The "poll for result" step is clearly separated and marked as the long-running part
- The agent can naturally split these into "respond now" and "background work"
