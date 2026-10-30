# VU Assistant: Test Results

## Latest run: partial recheck

- **Run date:** 2026-10-30
- **Chat model:** gemini-2.5-flash
- **Embedding model:** gemini-embedding-001
- **topK:** 3
- **Result:** Questions 1–12 were attempted. Questions 7–8 received temporary provider 503 errors; the daily Gemini generation quota was exhausted during Q13. Questions 13–20 therefore remain untested in this run. Do not treat this as a complete regression pass.
- **Prompt change after run:** Added an instruction to use relevant context even when the source wording differs. This change still needs a fresh model evaluation.

| # | Outcome | Source behavior | Notes |
|---|---|---|---|
| 1 | Pass | Sources shown | Program list answered. |
| 2 | Pass | Sources shown | Rescheduling conditions answered. |
| 3 | Pass | Sources shown | BS fee answered as Rs. 750 per credit hour. |
| 4 | Pass | Sources hidden | Hostel question correctly admitted no answer. |
| 5 | Pass | Sources shown | Admissions contact answered. |
| 6 | Pass | Sources shown | Midterm and final explained. |
| 7 | Not scored | N/A | Provider returned 503 (high demand). |
| 8 | Not scored | N/A | Provider returned 503 (high demand). |
| 9 | Fail | Sources hidden | Model said it did not know, despite the retrieved handbook text containing a 2.00/4.00 minimum CGPA and other degree criteria. Prompt was strengthened afterward; rerun required. |
| 10 | Pass after expectation correction | Sources shown | Listed CS, Data Science, and IT. The question asks for programs other than Software Engineering, so that program is not required in the expected answer. |
| 11 | Pass | Sources shown | BS fee and MS follow-up fee answered. |
| 12 | Pass | Sources shown | Fall 2026 deadline correctly treated as passed on the run date. |
| 13–20 | Not run | N/A | Gemini daily generation quota was exhausted at Q13. |

This run found one unresolved answer-quality issue (Q9) and one incorrect test expectation (Q10, now corrected in `tests/questions.md`). The full 20-question set must be rerun after the quota resets to confirm the prompt change and complete the evaluation.

## Scoring key

- **Pass:** response met the expected answer for the case.
- **Fail:** response was wrong or falsely said the answer was unavailable.
- **Not scored:** provider error or case not run; this is not an application pass or failure.
- **Sources hidden:** required for no-answer and off-topic cases.

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
