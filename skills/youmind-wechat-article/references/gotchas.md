# Gotchas — Common Failure Patterns

These are content-quality anti-patterns observed across real WeChat article dispatches. Each one has a name so you can call it out by pattern instead of re-deriving the problem every time.

## "The AI Essay"

**Symptom:** The article reads like a well-organized explainer piece — correct, comprehensive, boring. Every section is in the right place but the whole thing feels like it was written by an information-retrieval system, not a person.

**Fix:** Re-read `references/writing-guide.md` §voice architecture and §pre-writing framework. The article needs a PERSON behind it — opinions, specifics, lived experience, skin in the game. Then run the full 4-level de-AI protocol before publishing.

**Detection:** If you can substitute any random sentence with a ChatGPT response and nobody would notice, you've written an AI essay.

## "The Generic Hot Take"

**Symptom:** Writing about a trending topic without adding any insight beyond what is already in the top 10 Google/Baidu results. The article is a summary of other summaries.

**Fix:** Before drafting, force yourself to identify your unique angle in ONE sentence. If you cannot, pick a different topic or a different angle on the same topic. "Here's what everyone is missing" or "Here's what I saw that nobody else noticed" — that's the test.

**Detection:** Search the platform for similar titles. If 5+ top-result articles make the same claims, yours needs a sharper angle.

## "The Word-Count Pad"

**Symptom:** Hitting 2,000 字 by being verbose instead of being deep. Sentences expand to fill time. Every concept gets three examples where one would do.

**Fix:** Every paragraph must survive the test: "If I delete this, does the article lose something specific?" If not, delete it. Depth is not length — it's specificity.

**Detection:** Your friend reads a 2000-字 draft and can summarize it in three sentences without losing meaning → you padded.

## "The Pretty But Empty Article"

**Symptom:** Beautiful formatting, high-quality cover image, nice theme colors — zero substance. The styling is doing the heavy lifting that the writing should.

**Fix:** Visual quality cannot compensate for thin content. Get the writing right first. Style is the wrapper, not the product.

**Detection:** Strip the theme and re-read the plain markdown. If it's boring without styling, it's boring with styling.

## "The Blacklist Miss"

**Symptom:** Article contains words or topics explicitly forbidden in `clients/{client}/style.yaml` blacklist. Often happens on word-level (e.g., 营销词 like "赋能" / "抓手") slipping through despite the client's list.

**Fix:** Final scan of the article text against `style.yaml` blacklist BEFORE publishing. This should be automated — but in practice, do a manual `grep -i` pass too.

**Detection:** Literally: `grep -if blacklist.txt article.md`. If anything returns, fix before publish.

## "The Broken Pipeline Halt"

**Symptom:** Stopping the entire dispatch flow because one step failed. E.g., image generation failed → user gets no article at all, instead of getting an article with a placeholder note about missing cover.

**Fix:** NEVER halt the pipeline on a single-step failure. Use the fallback chain in `references/resilience.md`. If the fallback also fails, skip and NOTE — never halt.

**Detection:** Any dispatch run that ends with < all steps attempted and no clear skip notes → halt anti-pattern.
