# Topic Selection & Evaluation

> Topic selection is where articles are won or lost.
> A great article on a mediocre topic will be outperformed by a decent article on a great topic.
> The most common waste of effort: writing 2000 polished words about something nobody needed to read today.

---

## The One Rule

**A topic is worth writing about if and only if you can answer this:** "What will this article give the reader that they cannot get from the top 3 search results?"

If the answer is "better writing" — that's not enough. If the answer is "a perspective, data point, or insight they've never encountered" — proceed.

---

## Evaluation Model: 5 Dimensions

### 1. Heat (权重 20%)

How much attention is this topic getting RIGHT NOW?

| Score | Signal |
|-------|--------|
| 9-10 | National trending. Weibo/Douyin top 10. Everyone from your mom to your boss is talking about it. |
| 7-8 | Cross-platform buzz. Trending on 2+ platforms. Your industry's WeChat groups are blowing up. |
| 5-6 | Industry hot topic. Your vertical is buzzing, general public doesn't care yet. |
| 3-4 | Evergreen. Consistent search volume but no urgency. |
| 1-2 | Niche. Only a specific sub-community cares. Could still work if you ARE that community's voice. |

**Timing decay:** Trending >24h → lose 2 points. >72h → don't write it unless you have something nobody else said.

### 2. Audience Fit (权重 25%)

How well does this match the client's readers?

| Score | Signal |
|-------|--------|
| 9-10 | Bullseye. Core topic the audience actively searches for. They'd click instantly. |
| 7-8 | Adjacent. Natural extension they didn't know they wanted, but will. |
| 5-6 | Needs framing. Connection exists, but you have to build the bridge. |
| 3-4 | Stretch. Barely relevant. Would feel random in the feed. |
| 1-2 | Irrelevant. No meaningful connection. |

### 3. Angle Value (权重 25%)

Can you say something that hasn't been said a hundred times?

| Score | Signal |
|-------|--------|
| 9-10 | Exclusive. Unique data, personal experience, or insider perspective. Nobody else can write THIS article. |
| 7-8 | Differentiated. You can go deeper or challenge the mainstream narrative with evidence. |
| 5-6 | Fresh packaging. Not unique, but includes new data or a better frame. |
| 3-4 | Saturated. Dozens of similar articles already published. Hard to stand out. |
| 1-2 | Pure repetition. Nothing new to add. Don't write it. |

### 4. Engagement Potential (权重 15%)

Will this drive shares, comments, and 在看?

| Score | Signal |
|-------|--------|
| 9-10 | Polarizing. People NEED to share their opinion. Natural debate fuel. |
| 7-8 | Identity-touching. Readers feel personally addressed. High forward rate ("这说的不就是你吗"). |
| 5-6 | Useful. Readers learn something, bookmark it, but may not share. |
| 3-4 | Passive. Read-and-forget content. |
| 1-2 | No emotional hook. Pure information with zero personal relevance. |

### 5. Insight Potential (权重 15%)

How deep can you take this? Is there a genuine insight hiding here?

| Score | Signal |
|-------|--------|
| 9-10 | There's an uncomfortable truth nobody is naming. An obvious insight everyone is missing. You can feel it. |
| 7-8 | Multiple layers to explore. First-principles decomposition yields surprising conclusions. |
| 5-6 | At least one non-obvious angle exists if you dig for it. |
| 3-4 | What you see is what you get. Surface-level topic. |
| 1-2 | No depth to find. The topic is exactly what it appears to be. |

---

## Scoring Formula

```
Final Score = (Heat × 0.20) + (Fit × 0.25) + (Angle × 0.25) + (Engagement × 0.15) + (Insight × 0.15)
```

**Modifiers:**

- Overlaps with `history.yaml` last 7 days → **-2** + flag "近期已覆盖"
- SEO score from `seo_keywords.py` ≥ 7 → **+0.5**
- Matches high-performing framework from stats → note in recommendation
- Knowledge base has relevant material → **+1** + flag "有知识库支撑"

---

## Output: 10 Topics

Each topic must include:

| Field | Requirement |
|-------|------------|
| Draft title | 20-28 Chinese characters, using a specific title strategy (seo-rules.md) |
| Final score | 0-10, show weighted calculation |
| Dimension breakdown | Heat / Fit / Angle / Engagement / Insight |
| CTR prediction | High / Medium / Low |
| SEO score | From `seo_keywords.py` or marked "estimated" |
| Recommended framework | One of the 6 frameworks + one-line reasoning |
| Dedup flag | vs. `history.yaml` last 7 days |
| Atomic Insight draft | 1-2 sentences: what's the core insight this article could deliver? **This is the most important field.** |

---

## Topic Sharpening — From Generic to Magnetic

Most topics START generic. The work is sharpening them until they cut.

### The Sharpening Process

**Step 1: State the generic version**
> "AI对职场的影响"

**Step 2: Add specificity — WHO exactly?**
> "AI对30岁以上中层管理者的影响"

**Step 3: Add tension — what's the UNCOMFORTABLE truth?**
> "AI不会先干掉基层员工，会先干掉中层管理者——因为中层的核心价值是信息传递和协调，而这正是AI最擅长的"

**Step 4: Add urgency — WHY NOW?**
> "上周某大厂裁撤了一整个中层管理岗序列，理由是'AI已经能做周报汇总和跨部门对齐了'"

**Step 5: Draft the Atomic Insight**
> "你以为AI在替代执行层，其实它在替代协调层。月薪5万的人比月薪5千的人更危险。"

That's a topic worth 2000 words. The original "AI对职场的影响" is not.

### More Sharpening Examples

| Generic (DON'T write this) | Sharp (DO write this) |
|---|---|
| 如何提高工作效率 | 为什么你越努力越低效——以及真正高效的人从不告诉你的一件事 |
| AI的未来趋势 | AI不会取代你的工作，但会取代你工作中你最引以为傲的那部分 |
| 年轻人的焦虑 | 25岁焦虑是因为选择太多。35岁焦虑是因为发现选择已经做完了 |
| 职场沟通技巧 | 为什么你说了100次"辛苦了"，团队还是觉得你冷漠 |
| 副业赚钱 | 你的副业不是在帮你赚钱，是在帮你逃避主业的真实问题 |
| 读书的好处 | 我去年读了60本书，然后意识到——我记住的不到5本的内容 |
| 如何管理时间 | 你不是缺时间管理，你是缺"不做"的勇气 |
| 创业心得 | 创业第三年我才明白：最大的成本不是钱，是你用来犹豫的那些月份 |

---

## Topic Generation Strategies

### The Content Gap Lens
"What is everyone talking about that nobody is explaining well?"

20 articles on a trending topic, all surface-level summaries? There's a gap for a deep-dive, contrarian take, or first-principles analysis. The gap isn't "this topic isn't covered" — it's "this topic is covered badly."

### The Audience Pain Lens
"What problem is my target audience wrestling with THIS WEEK?"

Cross-reference trends with the client's audience. A general AI topic becomes specific gold when framed as "AI正在吃掉[specific audience]的午餐，但大多数人还没意识到."

### The Information Asymmetry Lens
"What do I know that most readers don't?"

Industry data, personal experience, insider access, knowledge base materials. This produces the highest-performing articles but requires genuine information advantage. If you don't have one, the article will be shallow no matter how well-written.

### The Emotional Resonance Lens
"What topic would make the reader forward this with the message '说的就是我'?"

Topics that touch identity, life transitions, career anxiety, generational tensions. Evergreen but always fresh when made specific to a current moment.

### The Dinner Party Lens
"If you brought up this topic at dinner with smart friends, would the conversation get heated?"

If yes — there's natural debate energy. The article practically writes itself because people NEED to have an opinion. If the dinner table would nod politely and change the subject, the topic is too bland.

### The Uncomfortable Truth Lens
"What is everyone in this space pretending not to see?"

Every industry has elephants in the room. Name them. These articles get shared not because they're "good content" but because readers feel relieved that someone finally said it out loud.

---

## Sorting Rules

1. Sort by final score, descending
2. Tie-breaker 1: Higher Insight Potential wins (depth > surface)
3. Tie-breaker 2: Higher SEO score wins
4. Topics flagged "近期已覆盖" go to bottom regardless of score

---

## Gotchas

**"The highest-heat trap":** The hottest topic isn't the best pick if 1000 articles are already published. A 7-heat topic with 9-angle beats a 10-heat topic with 3-angle every time.

**"The relevance stretch":** If you need more than one sentence to explain why a topic fits the audience, it probably doesn't. Score honestly.

**"The evergreen excuse":** "This is an evergreen topic" is NOT a reason to write it TODAY. What's the trigger? What makes NOW the time? No trigger = save it for a slow news day.

**"The insight-free topic":** If you can't draft an Atomic Insight in 30 seconds, the topic probably doesn't have one. Move on to the next candidate.

**"The safe pick":** Defaulting to the easiest topic instead of the most interesting one. Interesting-but-harder beats safe-but-boring. Every time. Readers can sense when a writer is coasting.

**"Topic selection by committee":** In auto mode, pick the top scorer and move. Second-guessing the model wastes time and introduces bias.
