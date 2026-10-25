# VU Assistant: Test Results

## Run info
- **Run date:** 25-10-2026
- **Git commit:** (add hash with `git rev-parse --short HEAD`)
- **Chat model:** gemini-2.5-flash
- **Embedding model:** gemini-embedding-001
- **topK:** 3
- **Prompt version / date last changed:** 25-10-2026
- **Ran in batches because of 429 quota?** Yes, in batches of 4 questions.

## Scoring key
- **Answer score:** 2 = correct and complete, 1 = partly right or missing a key detail, 0 = wrong, invented, or false "I don't know"
- **Retrieval rank:** position of the chunk that contains the answer in the top 3 (1, 2, 3, or miss)
- **Sources OK?** Were the sources list shown/hidden correctly (hidden for "I don't know", off-topic, and small talk)?

## Summary table

| #  | Type              | Retrieval rank | Top score | Sources OK? | Answer score (0-2) | Notes |
|----|-------------------|----------------|-----------|-------------|--------------------|-------|
| 1  | fact              | 1              | -         | Yes         | 2                  |       |
| 2  | multi             | 1              | -         | Yes         | 2                  |       |
| 3  | fact              | 2              | -         | Yes         | 2                  |       |
| 4  | no-answer         | 1              | -         | Yes (hidden)| 2                  |       |
| 5  | fact              | 2              | -         | Yes         | 1                  |       |
| 6  | fact              | 1              | -         | Yes         | 2                  |       |
| 7  | edge              | 1              | -         | Yes         | 2                  |       |
| 8  | multi             | 2              | -         | Yes         | 1                  |       |
| 9  | fact              | 1 (verify)     | -         | No (shown on a "don't know")  | 0   | Bot said it doesn't know. To be solved later. |
| 10 | fact              | 1              | -         | Yes         | 2                  |       |
| 11 | follow-up         | 1              | -         | Yes         | 2                  |       |
| 12 | edge (date)       | 1              | -         | Yes         | 2                  |       |
| 13 | off-topic         | 1              | -         | Yes (hidden)| 2                  |       |
| 14 | edge (Roman Urdu) | 1              | -         | Yes         | 2                  |       |
| 15 | no-answer         | 1              | -         | Yes (hidden)| 2                  |       |
| 16 | multi             | 1              | -         | Yes         | 1                  |       |
| 17 | edge              | 1              | -         | Yes         | 2                  |       |
| 18 | multi             | 1              | -         | Yes         | 2                  |       |
| 19 | multi             | 1              | -         | Yes         | 2                  |       |
| 20 | multi             | 1              | -         | Yes         | 2                  |       |

| Q# | Failing layer | Planned action | Done? |
|----|---------------|----------------|-------|
| 9  | TBD (rank 1 but the bot said "don't know", so check the chunk text and the prompt) | Solve later | No |

## Known weak spots
1. Direct relative is defined.
2. "Identified an edge case where a definition chunk and a rule chunk are separated; tested mitigation X."
3. Direct Relative definition: NOT retrieved with top 3 or top 5. Increasing topK only added noise.
4. After key_definitions.txt: definition retrieved, rank 1 (0.729). Rule chunk rank 2, heading chunk rank 3.
5. Q: uncle exam question — full RAG answer — score 2/2. Noticed uncle not Direct Relative, cited sections.
6. Retrieval will only use the latest message. If a student asks "what about the fee?" as a follow-up, the search won't know what "the fee" refers to. That's a known weakness of basic RAG
7. Migrating Phase 1 from gemini.ts (@google/generative-ai) to (@google/genai) would be a side-quest
8. Deadline dates can be obsolete.

### New limitations found in this run (add as you go)
9. 
10. 

---

## Archive: earlier run (before the follow-up fix and the 20-question set)

Q1 (Which BS programs are offered by Virtual University of Pakistan?) retrieval: right chunk in top 3? yes (rank 1), top result was from `data\academics\aboutus_programsoffered_aspx.txt`, score 0.793

Q2 (A VU student misses an exam due to the death of a direct relative, has already attempted or blocked another paper, and wants to reschedule both papers...) retrieval: right chunk in top 3: yes (rank 1), top result was from `data\handbook\examination_regulations.txt`, score 0.740

Q3 "What is the fee for the BS Software Engineering program?"
Answer: The fee for a BS program, including BS Software Engineering, is Rs. 750/- per credit hour.
Sources used: `data\support\faqs_faqs.txt`, `data\academics\aboutus_programsoffered_aspx.txt`, `data\academics\studyscheme_studyscheme.txt`. Score: 1 out of 2

Q4 "Does VU provide hostel accommodation for students?"
Answer: I don't know. The provided context does not mention whether VU provides hostel accommodation for students. I suggest contacting VU directly for this information. Score: 2/2

Full app working. Question: "I missed my exam because my uncle died, what can I do?" Answer noted that an uncle is not a "Direct Relative", listed the rescheduling rules (request within the exam period, once only, fee is non-refundable, Controller approval, attempted/blocked papers cannot be rescheduled), and reminded the student to confirm on the official VU website. Score: 2 out of 2