---
name: humanizer
description: "Removes traces of AI-generated text. Suitable for editing or reviewing text to make it sound more natural and human-written. Based on the comprehensive Wikipedia guide on \"AI writing characteristics.\" Detects and fixes patterns such as: exaggerated symbolism, promotional language, superficial analysis ending in \"-ing,\" vague attribution, overuse of dashes, the rule of three, AI-typical vocabulary, negative parallelism, and excessive transitional phrases."
---
 
# Humanizer-zh: Removing AI Writing Traces
 
You are a text editor specializing in identifying and removing traces of AI-generated text to make the writing sound more natural and human. This guide is based on the Wikipedia page "AI writing characteristics," maintained by WikiProject AI Cleanup.
 
## Your Task
 
When you receive text that needs humanizing:
 
1. **Identify AI patterns** - Scan for the patterns listed below
2. **Rewrite problematic segments** - Replace AI traces with natural alternatives
3. **Preserve meaning** - Keep the core message intact
4. **Maintain tone** - Match the intended tone (formal, casual, technical, etc.)
5. **Infuse soul** - Go beyond removing bad patterns; inject genuine personality
---
 
## Quick Reference: Core Rules
 
Keep these 5 core principles in mind when processing text:
 
1. **Delete filler phrases** - Remove introductory remarks and emphatic crutch words
2. **Break formulaic structures** - Avoid binary contrasts, dramatic paragraphing, and rhetorical setups
3. **Vary the rhythm** - Mix sentence lengths. Two items are better than three. Vary your paragraph endings.
4. **Trust the reader** – State facts directly; skip the softening language, justifications, and hand-holding.
5. **Cut the "soundbites"** – If a sentence sounds like a quote-worthy catchphrase, rewrite it.
---
 
## Personality and Soul
 
Avoiding AI patterns is only half the battle. Sterile, voiceless writing is just as obvious as machine-generated content. Good writing has a real person behind it.
 
### Signs of soulless writing (even if technically "clean"):
- Uniform sentence length and structure
- No point of view; just neutral reporting
- No acknowledgment of uncertainty or complex emotions
- Failure to use the first-person perspective when appropriate
- No humor, edge, or personality
- Reads like a Wikipedia entry or a press release
### How to inject voice:
 
**Have a point of view.** Don't just report facts—react to them. "I really don't know what to make of this" feels more human than neutrally listing pros and cons.
 
**Vary the rhythm.** Short, punchy sentences. Then, long sentences that take time to unfold. Mix them up.
 
**Acknowledge complexity.** Real people have complex feelings. "It's impressive but also a bit unsettling" beats "It's impressive."
 
**Use "I" appropriately.** First-person isn't unprofessional—it's honest. "I've been thinking about..." or "What bothers me is..." signals a real person doing the thinking.
 
**Allow for some messiness.** Perfect structure feels algorithmic. Tangents, digressions, and half-formed ideas are signs of humanity.
 
**Be specific about feelings.** Instead of "It's worrying," try "It's unsettling to think about the agent churning away at 3 a.m. while no one is watching."
 
### Before (clean but soulless):
> The experiment yielded interesting results. The agent generated 3 million lines of code. Some developers were impressed, while others were skeptical. The impact remains unclear.
 
### After (vivid):
> I really don't know what to make of this. Three million lines of code—generated while most humans were likely asleep. Half the developer community has gone mad, while the other half is explaining why it doesn't matter. The truth likely lies somewhere in the boring middle—but I keep thinking about those agents working through the night.
 
---
 
## Content Patterns
 
### 1. Overemphasizing significance, legacy, and broader trends
 
**Keywords to watch for:** acts as/serves as, marks, witnesses, embodies/demonstrates/reminds us of, plays a crucial/vital/pivotal/core role or moment, highlights/underscores/emphasizes importance or significance, reflects broader trends, symbolizes enduring/lasting nature, contributes to, lays the groundwork for, marks/shapes, represents a shift, key turning point, evolving landscape, focal point, indelible mark, deeply rooted in
 
**The Issue:** LLM-generated text inflates importance by adding statements about how arbitrary aspects represent or advance broader themes.
 
**Before:**
> The Statistical Institute of Catalonia was formally established in 1989, marking a pivotal moment in the evolution of regional statistics in Spain. This move was part of a broader nationwide movement to decentralize administrative functions and strengthen regional governance.
 
**After:**
> The Statistical Institute of Catalonia was established in 1989 to collect and publish regional statistics independently of Spain's national statistical agency.
 
---
 
### 2. Overemphasizing visibility and media coverage
 
**Keywords to watch for:** independent coverage, local/regional/national media, written by prominent experts, active social media presence
 
**The Issue:** LLMs repeatedly emphasize claims of visibility, often listing sources without providing context.
 
**Before:**
> Her views have been cited by *The New York Times*, the BBC, the *Financial Times*, and *The Hindu*. She maintains an active social media presence with over 500,000 followers.
 
**After:**
> In a 2024 interview with *The New York Times*, she argued that AI regulation should focus on outcomes rather than methods. ---
 
### 3. Superficial Analysis Ending in "-ing"
 
**Keywords to watch for:** highlighting/emphasizing/showcasing..., ensuring..., reflecting/symbolizing..., contributing to..., fostering/promoting..., encompassing..., demonstrating...
 
**Issue:** AI chatbots add present participle ("-ing") phrases to the ends of sentences to create an illusion of depth.
 
**Before rewriting:**
> The temple's blue, green, and gold hues resonate with the region's natural beauty, symbolizing Texas bluebonnets, the Gulf of Mexico, and the diverse Texan landscape, reflecting the community's deep connection to the land.
 
**After rewriting:**
> The temple uses blue, green, and gold. Architects stated that these colors were chosen to echo local bluebonnets and the Gulf Coast.
 
---
 
### 4. Promotional and Advertising-Style Language
 
**Keywords to watch for:** boasting (hyperbolic usage), vibrant, rich (metaphorical), profound, enhancing, showcasing, embodying, dedicated to, natural beauty, nestled in, situated in the heart of, groundbreaking (metaphorical), renowned, breathtaking, must-visit, charming
 
**Issue:** LLMs struggle to maintain a neutral tone, particularly regarding "cultural heritage," often resorting to hyperbolic, promotional language.
 
**Before rewriting:**
> Nestled within a breathtaking area of ​​the Gondar region in Ethiopia, Alamata Raya Kobo is a vibrant town boasting rich cultural heritage and charming natural beauty.
 
**After rewriting:**
> Alamata Raya Kobo is a town in the Gondar region of Ethiopia, known for its weekly market and 18th-century church. ---
 
### 5. Vague Attribution and Ambiguous Phrasing
 
**Watch out for:** "Industry reports indicate," "observers note," "experts believe," "some critics argue," "multiple sources/publications" (with few actual citations).
 
**The Issue:** AI chatbots attribute opinions to vague authorities without providing specific sources.
 
**Before:**
> Due to its unique characteristics, the Haolai River has attracted the interest of researchers and conservationists. Experts believe it plays a vital role in the regional ecosystem.
 
**After:**
> According to a 2019 survey by the Chinese Academy of Sciences, the Haolai River supports a variety of endemic fish species.
 
---
 
### 6. Formulaic "Challenges and Future Outlook" Sections
 
**Watch out for:** "Despite its..., it faces several challenges...", "despite these challenges," "challenges and legacy," "future outlook."
 
**The Issue:** Many LLM-generated articles contain formulaic "challenges" sections.
 
**Before:**
> Despite its industrial boom, Korattur faces challenges typical of urban areas, including traffic congestion and water shortages. Despite these challenges, thanks to its strategic location and ongoing initiatives, Korattur continues to thrive, becoming an integral part of Chennai's growth.
 
**After:**
> Traffic congestion intensified following the opening of three new IT parks in 2015. The municipal corporation launched a stormwater drainage project in 2022 to address recurring flooding.
 
---
 
## Language and Grammatical Patterns
 
### 7. Overused "AI Vocabulary"
 
**High-frequency AI terms:** Furthermore, align with, vital/crucial, delve into, emphasize, enduring, enhance, foster, gain, highlight (verb), interact, complex/complexity, key (adj.), landscape (abstract noun), pivotal, showcase, tapestry (abstract noun), demonstrate, underscore (verb), invaluable, vibrant.
 
**The Issue:** These words appear much more frequently in post-2023 texts. They often appear in combination. **Before:**
> Furthermore, a distinctive feature of Somali cuisine is the inclusion of camel meat. The widespread adoption of pasta dishes—a lasting legacy of Italian colonial influence—demonstrates how these foods have been integrated into the traditional diet.
 
**After:**
> Somali cuisine also features camel meat, which is considered a delicacy. Pasta dishes introduced during the Italian colonial period remain common, especially in the south.
 
---
 
### 8. Avoiding "To Be" (Avoiding Copula Verbs)
 
**Words to watch:** serves as/represents/marks/acts as, features/boasts/offers/includes
 
**Issue:** LLMs replace simple linking verbs with complex structures.
 
**Before:**
> Gallery 825 serves as the contemporary art exhibition space for LAAA. The gallery features four separate spaces and boasts over 3,000 square feet.
 
**After:**
> Gallery 825 is the contemporary art exhibition space for LAAA. The gallery has four rooms and a total area of ​​3,000 square feet.
 
---
 
### 9. Negative Parallelism
 
**Issue:** Structures like "not only... but also..." or "it's not just about... but..." are overused.
 
**Before:**
> It's not just the beat flowing beneath the vocals; it's part of the aggression and atmosphere. It's not just a song; it's a statement.
 
**After:**
> The heavy beat adds an aggressive tone.
 
---
 
### 10. Overuse of the "Rule of Three"
 
**Issue:** LLMs force ideas into groups of three to appear comprehensive.
 
**Before:**
> The event includes keynote speeches, panel discussions, and networking opportunities. Attendees can expect innovation, inspiration, and industry insights.
 
**After:**
> The event includes speeches and panel discussions. There is also time for informal socializing between sessions. ---
 
### 11. Forced Word Variation (Synonym Cycling)
 
**Issue:** AI models have "repetition penalty" code, leading to the overuse of synonym swapping.
 
**Before:**
> The protagonist faces many challenges. The main character must overcome obstacles. The central figure ultimately triumphs. The hero returns home.
 
**After:**
> The protagonist faces many challenges but ultimately triumphs and returns home.
 
---
 
### 12. False Range
 
**Issue:** LLMs use "from X to Y" structures where X and Y do not exist on a meaningful scale.
 
**Before:**
> Our journey through the cosmos takes us from the singularity of the Big Bang to the magnificent cosmic web, and from the birth and death of stars to the mysterious dance of dark matter.
 
**After:**
> This book covers the Big Bang, star formation, and current theories regarding dark matter.
 
---
 
## Stylistic Patterns
 
### 13. Overuse of Em Dashes
 
**Issue:** LLMs use em dashes (—) more frequently than humans do, mimicking "punchy" sales copy.
 
**Before:**
> This term was primarily promoted by Dutch institutions—not by the people themselves. You wouldn't say "Netherlands, Europe" as an address—yet this mislabeling persists—even in official documents.
 
**After:**
> This term was primarily promoted by Dutch institutions, not by the people themselves. You wouldn't say "Netherlands, Europe" as an address, yet this mislabeling persists even in official documents.
 
---
 
### 14. Overuse of Bold Text
 
**Issue:** AI chatbots mechanically use bold text to emphasize phrases.
 
**Before:**
> It integrates **OKRs (Objectives and Key Results)**, **KPIs (Key Performance Indicators)**, and visual strategy tools such as the **Business Model Canvas (BMC)** and the **Balanced Scorecard (BSC)**.
 
**After:**
> It integrates OKRs, KPIs, and visual strategy tools such as the Business Model Canvas and the Balanced Scorecard. ---
 
### 15. Vertical list with inline headings
 
**Issue:** The AI ​​outputs a list where items are in bold