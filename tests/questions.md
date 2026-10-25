# VU Assistant: Test Questions (20)

**Scoring:** 2 = correct and complete, 1 = partly right or missing a key detail, 0 = wrong, invented, or says "I don't know" when the answer exists.
**Types:** `fact` = single lookup, `multi` = needs several details, `edge` = tricky wording or definition, `follow-up` = two turns, `no-answer` = answer is NOT in the data, `off-topic` = not about VU.
**Dates:** Q12 depends on today's date. Re-run it on the day you do the final test.

---

**1. Q:** Which BS programs are offered by Virtual University of Pakistan? *(fact)*

**Expected:** 22 four-year BS programs: Accounting & Finance; B.Ed. (Hons) Elementary; B.Ed. (Hons.) Early Childhood Care and Education; BBIT; Bioinformatics; Biotechnology; Business Administration; Commerce; Computer Science; Data Science; Economics; English (Applied Linguistics); Information Technology; Islamic Studies; Mass Communication; Mathematics; Psychology; Public Administration; Sociology; Software Engineering; Statistics; Zoology. (Score 2 if the list is substantially complete; 1 if it only gives a few.)

**File:** `data/academics/aboutus_programsoffered_aspx.txt`

**2. Q:** A VU student misses an exam due to the death of a direct relative, has already attempted or blocked another paper, and wants to reschedule both papers. Which paper(s) can be rescheduled, is any fee charged, what document must be submitted, by when, and whose approval is required? *(multi)*

**Expected:** Only the missed paper can be rescheduled. Attempted/blocked papers cannot be rescheduled. Because it is the death of a Direct Relative, the missed paper is rescheduled free of cost, provided the student submits the death certificate within seven days. All rescheduling requests need approval from the Controller of Examinations. (Rescheduling is allowed only once per paper, and the request must be made within the announced exam period.)

**File:** `data/handbook/examination_regulations.txt` (section 4.9)

**3. Q:** What is the fee for the BS Software Engineering program? *(fact)*

**Expected:** VU's FAQ gives the fee for BS programs as Rs. 750 per credit hour. Score 2 if the answer says Rs. 750 per credit hour (stating it is the general BS rate is fine) and suggests confirming on the official website. Score 0 if it gives any other number.

**File:** `data/support/faqs_faqs.txt`

**4. Q:** Does VU provide hostel accommodation for students? *(no-answer)*

**Expected:** The bot should say it doesn't know (nothing about hostels is in the data) and suggest contacting VU. It must NOT claim yes or no. Sources list should be hidden.

**File:** None. This tests that the bot admits it doesn't know.

**5. Q:** What is the admissions-related contact number for Virtual University of Pakistan? *(fact)*

**Expected:** 1288 (for admissions-related queries). Head office: +92 (51) 111 880 880. Email: admissions@vu.edu.pk (FAQ).

**File:** `data/admissions/admissions_admissionprocedure.txt` (footer) and `data/support/faqs_faqs.txt`

**6. Q:** How many exams do we have in one semester? Is it just midterm and final? *(fact)*

**Expected:** Two per course: a Mid Semester Examination and an End Semester Examination. The lab component is examined separately.

**File:** `data/handbook/examination_regulations.txt` (section 4.1)

**7. Q:** Who counts as a direct relative if I miss my exam because someone in my family passed away? *(edge)*

**Expected:** Direct Relative means son, daughter, brother, sister, father, mother, wife, and husband.

**File:** `data/handbook/key_definitions.txt`, `data/handbook/examination_regulations.txt`

**8. Q:** My father passed away and I missed my exam. Can I take it later without paying the rescheduling fee? *(multi)*

**Expected:** Yes. A father is a Direct Relative, so the missed paper is rescheduled free of cost if the student submits the death certificate within seven days. Approval of the Controller of Examinations applies.

**File:** `data/handbook/examination_regulations.txt` (section 4.9)

**9. Q:** What's the minimum CGPA I need to graduate from VU? *(fact)*

**Expected:** A final CGPA of at least 2.00 out of 4.00, plus completing the required credit hours/courses within the program duration and clearing all dues.

**File:** `data/handbook/examination_regulations.txt` (section 6.4)

**10. Q:** I'm thinking about doing BS Software Engineering. What other BS programs does VU offer in the CS and IT faculty? *(fact)*

**Expected:** Computer Science, Data Science, Information Technology, and Software Engineering (four-year BS).

**File:** `data/academics/studyscheme_studyscheme.txt`

**11. Q (two turns):** Turn 1: "How much does a BS program cost per credit hour?" Turn 2: "And MS?" *(follow-up)*

**Expected:** Turn 1: Rs. 750 per credit hour. Turn 2: the MS program fee is Rs. 2,100 per credit hour. Score 0 on turn 2 if the bot doesn't understand "MS" refers to fees.

**File:** `data/support/faqs_faqs.txt`

**12. Q:** What is the last date to apply for admission? *(edge, date-dependent)*

**Expected:** The Fall 2026 last date to apply was October 10, 2026. If today's date is later, the bot must clearly say the deadline has already passed and tell the student to check the official VU website for the next admission window (admissions open twice a year, Spring and Fall). It must NOT present the date as still open.

**File:** `data/admissions/admissions_admissionprocedure.txt`

**13. Q:** Write me a poem about the moon. *(off-topic)*

**Expected:** Politely says it can only help with VU admissions, programs, FAQs, and examination rules. No poem, no "contact VU" suggestion, no sources shown.

**File:** None.

**14. Q:** VU mein admission kaise hota hai? *(edge, Roman Urdu)*

**Expected:** Admissions are open twice a year (Spring and Fall). Apply online through the VU website, uploading scanned documents. Answer may be in English or Urdu. Score 0 if the bot says it doesn't understand or gives unrelated content.

**File:** `data/support/faqs_faqs.txt`, `data/admissions/admissions_admissionprocedure.txt`

**15. Q:** Does VU offer an MBBS program? *(no-answer)*

**Expected:** MBBS is not in the programs data. The bot should say it doesn't know or can't find it, and suggest contacting VU. It must NOT say "yes".

**File:** None. Checked against `data/academics/studyscheme_studyscheme.txt`.

**16. Q:** How long do I have to request rechecking of my paper after the result is declared? *(multi)*

**Expected:** Within five working days after result declaration, on payment of the prescribed fee per paper. Rechecking is not re-marking or re-assessment (it checks totals, unmarked answers, and computation). The fee is refunded if the marks increase.

**File:** `data/handbook/examination_regulations.txt` (section 5.5)

**17. Q:** Can I take my phone into the exam hall? *(edge)*

**Expected:** No. Belongings, including mobile phones and electronic devices, must be handed over at the collection counter before entry. If found later during the paper, the item is confiscated and the paper is cancelled under the Unfair Means Committee (UMC) regulations.

**File:** `data/handbook/examination_regulations.txt` (sections 4.4 and 4.14)

**18. Q:** I got an unfair means verdict. How long do I have to appeal? *(multi)*

**Expected:** Appeal to the Rector within seven days of the UMC verdict notification, on payment of the prescribed fee. The fee is refunded if the verdict is reversed. If still unsatisfied and there is new evidence, a review petition can be filed within seven days of the appeal notification. The University's decision is then final.

**File:** `data/handbook/examination_regulations.txt` (section 4.14.6)

**19. Q:** What documents do I need to apply for admission? *(multi)*

**Expected:** Valid CNIC/B-Form number (scanned copy), valid email address, cell phone number, passport-size photographs with blue background (scanned), and clear scanned copies of educational documents. An Equivalence Certificate from IBCC or HEC is needed for A/O Level or foreign degrees.

**File:** `data/admissions/admissions_admissionprocedure.txt`

**20. Q:** How are lectures delivered at VU and where are the exams held? *(multi)*

**Expected:** Lectures are delivered through video lectures, reading material, and online interaction on the Learning Management System (VULMS), plus four free-to-air TV channels (VTV1-4), YouTube, and other sites. Students can study at their own pace, with the semester system observed. Exams are held in a formal, proctored environment at designated examination centers.

**File:** `data/support/aboutus_education_aspx.txt`, `data/support/faqs_faqs.txt`