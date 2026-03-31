# Reddit Writing Craft Guide

> The gap between AI-generated Reddit content and posts that get upvoted
> is not grammar or structure — it's authenticity.
> Reddit users can smell marketing from a mile away.

---

## The Core Problem

AI writes like a press release: polished, balanced, comprehensive. Reddit rewards the opposite: raw opinions, personal stories, specific experiences, and genuine curiosity.

A post that starts with "In today's rapidly evolving landscape..." will get downvoted to oblivion. A post that starts with "I just spent 3 weeks migrating our codebase to Rust and here's what nobody tells you" will hit the front page.

## Voice Architecture

### Level 1: Conversational Authenticity

- Write like you're explaining something to a smart friend at a bar
- Use contractions (don't, can't, won't)
- Start sentences with "And", "But", "So", "Look,"
- Include hedging ("honestly", "I think", "in my experience", "YMMV")
- Admit uncertainty — "I might be wrong here, but..."

### Level 2: Specific Over Generic

Every claim needs a concrete anchor:
- BAD: "AI tools are getting better at coding"
- GOOD: "Claude wrote a working Redis caching layer for our FastAPI app in 20 minutes. It even handled the edge case where the cache key contains special characters. I would've spent 2 hours on that."

### Level 3: Community Awareness

Match the subreddit's culture:
- **r/programming:** Technical depth, code examples, honest tradeoffs
- **r/technology:** Broader implications, consumer impact, future predictions
- **r/MachineLearning:** Paper references, benchmarks, technical accuracy
- **r/startups:** Revenue numbers, growth metrics, lessons from failure
- **r/ExperiencedDevs:** War stories, career advice, nuanced opinions

### Level 4: Anti-Marketing Filter

Remove EVERY instance of:
- "Unlock", "leverage", "empower", "streamline", "revolutionize"
- "Game-changing", "cutting-edge", "next-generation"
- "In conclusion", "To summarize", "As we can see"
- "It's important to note that", "It's worth mentioning"
- Exclamation marks (use sparingly, max 1 per post)
- Generic CTAs ("Check out", "Don't miss", "Subscribe to")

## Reddit-Specific Formatting

### TL;DR
Required for posts >500 words. Place at the TOP (controversial but effective for engagement) or BOTTOM (traditional).

```
**TL;DR:** One-sentence summary of the key takeaway.
```

### Headers
Use `##` for major sections. Don't overuse — Reddit posts shouldn't feel like documentation.

### Code Blocks
Use proper fenced code blocks with language tags. Reddit renders them well.

### Lists
Use sparingly. A wall of bullet points = lazy writing. Narrative paragraphs with strategic lists work better.

### Edit Notes
If updating after publication, add edit notes:
```
**Edit:** Fixed the code example, thanks u/username for catching the bug.
**Edit 2:** Since this blew up, I want to clarify...
```

## Engagement Triggers

End posts with an engagement hook:
- "What's your experience with X?"
- "Am I wrong about this? Genuinely curious."
- "Has anyone found a better approach?"
- "What would you add to this list?"

## Bilingual Notes / 双语备注

For Chinese-language posts (rare on Reddit, but some subs like r/China, r/ChineseLanguage):
- Keep the conversational, authentic voice in Chinese too
- Avoid 公文体 (bureaucratic Chinese) — write like you're chatting on 即刻 or V2EX
- Use Chinese internet slang where appropriate: 摸鱼、卷、润、整活
- Still include English technical terms where natural (most Chinese dev communities mix languages)
