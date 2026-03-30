# WeChat SEO & Algorithm Optimization

> WeChat Search (搜一搜) uses the Peoplerank algorithm — ranking based on user satisfaction,
> not traditional link metrics. Understanding this system is critical for long-term traffic.
> This file covers both search SEO and the recommendation algorithm that drives feed traffic.

---

## WeChat Recommendation Algorithm (2025)

The algorithm determines how far your article travels beyond your subscriber base.

### Signal Weights

| Signal | Weight | What It Measures |
|--------|--------|-----------------|
| Open Rate (CTR) | ~40% | Title + topic relevance |
| Interaction Rate (likes/saves/在看) | ~30% | Content quality + engagement design |
| Share Rate | ~20% | Shareability + emotional resonance |
| Complete Read Rate | ~10% | Content quality + pacing (but feeds into quality scoring at 30% weight) |

### Traffic Pool Mechanics

1. **Cold start:** New article enters pool of ~500-1,000 impressions
2. **Phase 1 (0-24h):** Needs **>8% CTR** to advance to larger pool
3. **Growth phase:** Must maintain **completion rate >55%** AND **interaction rate >3%**
4. **Re-evaluation:** System re-evaluates allocation **every 15 minutes**
5. **Social multiplier:** One quality share can cascade through ~6 levels of social spreading

**Key insight:** Complete read rate alone doesn't drive recommendations. The four signals that matter most for distribution: **share count, like count, 在看 count, comment count.** Completion rate is the means to these ends.

---

## Title Optimization

Title accounts for approximately **70% of article success**. Users decide within 3 seconds.

### Hard Constraints
- **Length:** 20-28 Chinese characters. Titles truncate in notification pushes and reshares around character 25.
- **Core keyword:** Must appear in the **first half** of the title (first 12-14 characters).

### 5 Title Strategies

**1. Number + Specificity:**
> "5年产品经理总结的3个反直觉认知" / "我面试了200个人之后发现的真相"
Data: Number-based titles show ~27% higher CTR than suspense-type titles.

**2. Information Gap:**
> "90%的人不知道的简历潜规则" / "被忽略的GPT用法，比写代码更值钱"
Creates curiosity through implied exclusivity.

**3. Counterintuitive:**
> "别再学Python了" / "真正决定收入的不是能力，是这件小事"
Challenges the reader's existing belief. High CTR but must deliver on the promise.

**4. Pain-Point Direct:**
> "为什么你的PPT总是被打回" / "月薪5000和50000的人，差距在周末"
Names the problem the reader is experiencing.

**5. Identity Trigger:**
> "30岁还在纠结要不要考研的人" / "给所有被领导PUA过的打工人"
Reader self-identifies and feels personally addressed.

### Title Craft Details

**Strategic punctuation in titles:**
- `!` — urgency/emphasis (use sparingly, max 1)
- `?` — curiosity/doubt (strong for engagement)
- `......` — unfinished thought, suspense
- `「」` — highlight a key term within the title
- `,` — create a two-part structure with contrast

**Always generate 3 title alternatives** with different strategies. Score each on:
1. Specificity (does it promise something concrete?)
2. Curiosity gap (does it make you NEED to know?)
3. Self-identification (does the target reader feel addressed?)

### Title Anti-Patterns
- Clickbait that doesn't match content → destroys trust, causes unfollows, tanks completion rate
- Generic titles without specificity: "采访了无数大学生" is weaker than "采访了3000个大学生"
- Burying the key point past the 25-character truncation mark
- Using "震惊！" / "必看！" → flagged by algorithm, feels cheap

---

## Digest (摘要) Optimization

- **Hard limit:** ≤54 Chinese characters (WeChat enforces 120 UTF-8 bytes)
- **Must contain:** Core keyword + a hook (curiosity gap or benefit promise)
- **Must NOT:** Repeat the title, use vague descriptions, or summarize the whole article
- **Best practice:** Tease a specific insight from the article that the title doesn't reveal

Example:
> Title: "5年产品经理总结的3个反直觉认知"
> Digest: "第二个我当年不信，结果踩了半年的坑才服气。" (24 chars, specific, creates curiosity)

---

## In-Article SEO

### Keyword Placement Strategy

| Position | Rule |
|----------|------|
| First 200 characters | Core keyword must appear at least once |
| Full article | Core keyword 3-5 times, naturally distributed (NOT clustered) |
| H2 subheadings | Include long-tail keyword variations in at least 1-2 subheadings |
| Image alt text | Include keyword where relevant |

### Keyword Density Rules
- Natural integration only. If a keyword feels forced, rephrase the sentence.
- WeChat search prefers **keyword consistency** — don't swap synonyms. Pick one term and use it throughout.
- Long-tail keywords improve search ranking exposure by ~70% vs. broad terms.

### Keyword Research Methods
1. **WeChat Index** (微信指数) — volume data for trending terms
2. **WeChat search autocomplete** — type partial queries, note suggestions (= long-tail gold)
3. **Competitor analysis** — what keywords do high-performing articles in your vertical use?
4. **Reader comments/DMs** — the exact words your audience uses to describe their problems
5. **5118 / Aizhan** — cross-platform keyword research for broader context

---

## WeChat Search (搜一搜) SEO

### Peoplerank Algorithm — 3 Weight Categories

**Account Authority (40%):**
- Verified accounts rank higher than personal accounts
- Follower count is "the most core factor determining account weight"
- Account age + name consistency boost authority
- Original content rate: high originality + high repost rates = authority signal
- Publishing frequency: daily/consistent publishers rank higher
- **Vertical specialization:** Accounts focused on one topic get categorized faster by the algorithm

**Content Quality (30%):**
- Title: core keyword in first 15 characters, 1-2 keyword mentions max
- Body: 3-5 natural keyword placements, grammatically correct, fresh information
- Structure: proper headings create natural keyword distribution
- Formatting: clean layout (three-color rule, proper spacing, no watermarks)
- Originality: original articles receive **3x more recommendation weight** than reprints
- Engagement signals: comments and 在看 signal quality

**User Behavior (30%):**
- Reading duration: longer natural reading time = positive signal
- Completion rate: higher = better ranking
- Social signals: likes, shares, 在看, rewards all impact ranking
- Comment interaction: author-reader exchanges boost weight

### Tag Strategy
- 5 tags per article: 2 industry + 2 trending keywords + 1 long-tail
- Specific tags outperform broad ones
- Consistent tagging pattern increases long-tail traffic by ~30%
- Tags must align with title and body keywords

---

## Completion Rate Optimization

Target: **>55%** to advance in traffic pools. Ideal: **>65%**.

### Structural Techniques

| Technique | Impact |
|-----------|--------|
| Line break every 3-5 sentences | Creates visual breathing room |
| Bold key information | Creates scannable "anchor points" readers commit to reaching |
| Section subheadings every 400-600 words | Creates "chapters" reader commits to completing |
| Mid-article interactive question | Activates reader thinking, increases engagement |
| Visual element every 600 characters | Breaks text monotony (chart, quote block, image) |
| Never exceed 7-10 text lines without a break | Prevents "wall of text" abandonment |

### Content Techniques
- Front-load value: the reader should learn something useful in the first 300 words
- Every 3-4 paragraphs, insert a hook (question, data surprise, scene shift, "but here's the thing...")
- Vary paragraph length (see writing-guide.md rhythm section)
- Tease upcoming content: "但最让我意外的不是这个，而是接下来发生的事"

---

## End-of-Article Optimization

This section directly impacts shares, 在看, and comments — the three highest-weighted algorithm signals.

### Footer Design Checklist
1. **Engagement trigger:** A specific question tied to article content (not generic "你怎么看?")
2. **Internal links:** 3 top-performing previous articles (boosts account session time)
3. **CTA:** Emphasize what the READER gets from following/sharing (not what you want)
4. **Reminder:** Prompt for 在看/分享/关注 — but tie it to value, not obligation

### Best Publishing Times
| Slot | Best For |
|------|----------|
| 8:00-9:00 AM | News, timely content, morning commute readers |
| 12:00-1:00 PM | Lunch break. Light reads, listicles, tools |
| 9:00-11:00 PM | Prime time. Deep reads, opinion pieces, stories. Highest engagement. |

**Counter-intuitive:** The 5-8 PM slot has the most competition. Average open rate is actually LOWER despite high traffic. Less crowded time slots can outperform.

---

## Gotchas

**"Keyword stuffing reflex":** If the keyword appears more than 5 times in 2000 words, you're stuffing. The algorithm detects this and it reads terribly. 3-5 natural occurrences is the sweet spot.

**"The generic tag trap":** Tags like "科技" or "生活" are nearly useless. "AI产品经理" or "远程办公效率" are 10x more effective for search discovery.

**"Optimizing for search, forgetting humans":** SEO is a multiplier, not a foundation. A perfectly optimized boring article still fails. Write for humans first, optimize for search second.

**"Ignoring the social engine":** In 2025, friend recommendations exceed subscription feeds as the primary traffic source. One account showed 45.9% of reads from social recommendations. Your article must be SHARE-WORTHY, not just search-friendly.
