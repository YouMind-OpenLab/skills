# Conversion Architecture

> House playbook for article-to-handoff design.
> Use it when the piece has a real next step into service, private domain, group, mini-program, or transaction flow.

---

## Core Rule

Each article must have exactly one `primary_conversion_goal`.

Allowed examples:

- `save`
- `comment`
- `next_read`
- `follow`
- `mini_program`
- `wecom_add`
- `customer_group`
- `manual_service`
- `transaction`

Optional secondary goal: at most one.

If you cannot name the primary goal, the article is operationally unfinished.

---

## Required Planning Fields

Before writing, define these fields:

- `primary_conversion_goal`
- `landing_type`
- `handoff_owner`
- `cta_location`

Recommended extra fields for matrix work:

- `topic_cluster`
- `persona`
- `stage`
- `channel`
- `destination`

### Field definitions

| Field | Meaning | Typical values |
|------|---------|----------------|
| `primary_conversion_goal` | The one main action after reading | `follow`, `mini_program`, `wecom_add`, `customer_group` |
| `landing_type` | Where the user lands next | `read_more`, `mini_program`, `wecom_add`, `customer_group`, `manual_service` |
| `handoff_owner` | Who or what receives the reader next | `公众号客服`, `企业微信成员`, `群运营`, `小程序表单` |
| `cta_location` | Where the CTA lives | `header`, `body_mid`, `footer`, `read_original`, `menu` |

---

## Native Pathways First

Prefer native WeChat ecosystem paths before custom hacks.

Priority order:

1. `阅读原文` to a real landing page
2. mini-program
3. custom menu
4. customer service / service message
5. WeCom add-contact or welcome-flow
6. customer group entry

Do not treat the article body as a place to cram every jump.

---

## Content Types and Matching CTAs

### Content-type article

Goal:

- save
- next read
- follow

Best CTA:

- read the next piece in the series
- save this checklist
- follow for the next installment

### Lead-gen article

Goal:

- add WeCom
- open landing page
- get the resource

Best CTA:

- read original for the worksheet
- add WeCom for the template / consultation

### Group-entry article

Goal:

- join customer group

Best CTA:

- join the study / practice / customer group after reading

### Transaction article

Goal:

- open product or mini-program

Best CTA:

- see product details
- start trial / reserve / buy in mini-program

---

## CTA Constraints

- one main CTA only
- one secondary CTA at most
- CTA must match the article's promise
- CTA must reduce friction, not just request action
- private-domain pieces should prefer "what to do next" over "share this"

Examples:

- bad: `关注、转发、点赞、加群、点原文都别忘了`
- good: `如果你正要搭这个流程，阅读原文里是完整模板`
- good: `这篇先收藏。下一篇我把表格和提示词拆开讲`

---

## Compliance Red Flags

Never output CTA copy that implies:

- share to unlock
- share for rewards
- share to get materials
- vague裂变 rules
- group-based pull-people rewards
- flashing or misleading share prompts
- "转发到朋友圈才能……"
- "集赞后领取……"

Also avoid:

- stuffing external scripts or generic external embeds into article bodies
- treating group-send as unlimited reach
- assuming publish rights exist for unverified or unsupported account types

---

## Measurement Defaults

If the piece is conversion-oriented, output instrumentation suggestions for at least:

- article read
- `阅读原文` click
- add WeCom
- join group
- conversion completed

Review rule:

- do not judge success by reads alone when the article's real job is handoff

---

## Selected Sources

- https://developers.weixin.qq.com/doc/subscription/guide/
- https://developers.weixin.qq.com/doc/subscription/guide/product/publish.html
- https://developers.weixin.qq.com/doc/subscription/guide/product/menu/intro.html
- https://work.weixin.qq.com/api/doc/90000/90135/92137
- https://www.cac.gov.cn/2016-02/18/c_1118077888.htm

Full bibliography: `references/research/professionalization-sources.md`
