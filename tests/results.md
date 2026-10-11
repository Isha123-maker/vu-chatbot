Q1(Which BS programs are offered by Virtual University of Pakistan?) retrieval: right chunk in top 3? yes (rank 1) — top result was from <data\academics\aboutus_programsoffered_aspx.txt> score 0.793
Q2(A VU student misses an exam due to the death of a direct relative, has already attempted or blocked another paper, and wants to reschedule both papers. Explain which paper(s) can be rescheduled, whether any fee is charged, what document must be submitted, the submission deadline, and whose approval is required?) retrieval: right chunk in top 3: yes (rank 1) - top result was from file <data\handbook\examination_regulations.txt>  score 0.740
“Known weak spots"
1. Direct reative is defined.
2. “Identified an edge case where a definition chunk and a rule chunk are separated; tested mitigation X.”
3. Direct Relative definition: NOT retrieved with top 3 or top 5. Increasing topK only added noise.
4. After key_definitions.txt: definition retrieved, rank 1 (0.729). Rule chunk rank 2, heading chunk rank 3.
5. Q: uncle exam question — full RAG answer — score 2/2. Noticed uncle not Direct Relative, cited sections.

Q3"What is the fee for the BS Software Engineering program?"

=== ANSWER ===

The fee for a BS program, including BS Software Engineering, is Rs. 750/- per credit hour.

=== SOURCES USED ===
- data\support\faqs_faqs.txt
- data\academics\aboutus_programsoffered_aspx.txt
- data\academics\studyscheme_studyscheme.txt      score 1 out of 2

Q4 Does VU provide hostel accommodation for students?"

=== ANSWER ===

I don't know. The provided context does not mention whether VU provides hostel accommodation for students. I suggest contacting VU directly for this information.
  score 2/2