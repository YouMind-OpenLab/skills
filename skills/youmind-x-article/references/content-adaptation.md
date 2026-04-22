# X (Twitter) Content Adaptation Guide

## Character Limits

### Single Tweet
- **Hard limit**: 280 characters
- **URLs**: Always count as 23 characters, regardless of actual length
- **Media**: Images/videos don't count toward character limit
- **Mentions**: @username counts toward limit
- **Hashtags**: #tag counts toward limit (use 1-2 max)

### Thread (Tweet Chain)
- Each tweet in the chain: 280 characters (including optional numbering)
- No hard limit on thread length (but 5-15 tweets is ideal)
- Numbering format: "1/N" at end of each tweet — optional but recommended for scanability
- Publishing is a native X reply-chain: the skill passes the previous tweet's `postId` as `replyToPostId` on each subsequent call, so X renders the sequence as a proper thread.

## Single Tweet Best Practices

1. **Lead with the hook** -- first words determine engagement
2. **One idea per tweet** -- clarity beats comprehensiveness
3. **Strong opinion or insight** -- vague tweets get ignored
4. **1-2 hashtags max** -- more than 2 looks spammy
5. **No link in tweet body** -- reply with link for better reach
6. **Use line breaks** -- improves readability

## Thread Writing Strategy

### Structure
1. **Tweet 1 (Hook)**: Must stand alone. Bold claim, surprising stat, or provocative question. This tweet gets shared individually.
2. **Tweets 2-N (Body)**: Each adds one point. Each should be valuable standalone. Use transition words sparingly.
3. **Last tweet (CTA)**: Summary + call to action. "Follow for more" or specific ask.

### Splitting Algorithm
1. Split on paragraph boundaries (double newline)
2. If a paragraph exceeds 280 chars, split on sentence boundaries
3. Each tweet includes numbering: "1/N"
4. Numbering reduces available chars by ~5-6
5. Never split mid-sentence
6. Each tweet should make sense if read in isolation

### Thread Tips
- Start a new tweet for each new idea or example
- Use emoji at the start of tweets for visual scanning
- Include a "save/bookmark this" reminder in the middle
- End with engagement hook ("What would you add?")

## Markdown Stripping

X does not support Markdown in tweets. Content adapter strips:
- `#` headers -> plain text
- `**bold**` -> plain text
- `*italic*` -> plain text
- `` `code` `` -> plain text
- `[text](url)` -> text url
- Code blocks -> removed
- Images -> removed
- Horizontal rules -> removed

## Hashtag Strategy

- **1-2 hashtags per tweet** -- X algorithm preference
- Place at the end of the tweet
- Mix broad and niche tags
- Check trending hashtags for timing
- Don't use hashtags in thread body tweets (only first or last)

## Engagement Optimization

1. **Post timing**: 8-10 AM, 12-1 PM, 5-6 PM local time
2. **Reply to comments** within first hour
3. **Tweet sequence > single tweet** for complex topics (5x more engagement historically; numbered sequences still read well even without native reply chains)
4. **Images boost engagement** by ~150% — reference `https://cdn.gooo.ai/...` URLs only
