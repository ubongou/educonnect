import type { Guide } from "./types";

export const satPrepGuide: Guide = {
  slug: "sat-prep-by-grade",
  shortTitle: "SAT prep by grade",
  title: "SAT Prep by Grade: When Should Your Child Start?",
  description:
    "A grade by grade SAT plan from Grade 8 to Grade 12, how the digital SAT and PSATs work, which colleges require scores again, and what families outside the US need to know.",
  h1: "SAT prep by grade: when should your child start?",
  intro:
    "Search for SAT prep and you will find plans for 7th graders, 8th graders and every grade after. Most of that is too much, too early. Some of it is too little, too late. Here is how I would pace it, grade by grade, for a child who wants strong options without spending four years doing practice tests.",
  published: "2026-10-01",
  sections: [
    {
      heading: "First, how the SAT works now",
      blocks: [
        {
          type: "list",
          items: [
            "The SAT is digital. It takes 2 hours and 14 minutes, plus a short break.",
            "It has two sections, Reading and Writing, and Math. Each section has two modules.",
            "It is adaptive by section. How a student does in the first module decides whether the second module is harder or easier.",
            "Each section is scored from 200 to 800, for a total of 400 to 1600.",
            "A graphing calculator is built in for the whole Math section.",
          ],
        },
        {
          type: "p",
          text: "Before the SAT itself come the PSATs: PSAT 8/9 for Grades 8 and 9, PSAT 10 in the spring of Grade 10, and the PSAT/NMSQT in October of Grade 11. Only the Grade 11 PSAT/NMSQT counts towards National Merit scholarship recognition.",
        },
      ],
    },
    {
      heading: "Do colleges still want SAT scores?",
      blocks: [
        {
          type: "p",
          text: "During the pandemic most colleges went test optional. Since then, a growing group of selective colleges has brought testing back. MIT reinstated its requirement in 2022, and Dartmouth and Brown in 2024. Harvard, Cornell, Penn, Caltech and Stanford now require scores too, and Yale accepts SAT, ACT, AP or IB results. Policies change often, so check each college's admissions page for your child's entry year.",
        },
        {
          type: "p",
          text: "My view: if your child is aiming for selective US colleges, plan to take the SAT. A strong score can only help, and a growing number of colleges require one.",
        },
      ],
    },
    {
      heading: "The plan, grade by grade",
      blocks: [
        {
          type: "table",
          caption: "A paced SAT plan",
          head: ["Grade", "Focus", "What not to do"],
          rows: [
            ["Grade 8", "Build foundations. Fluent arithmetic, fractions, ratios, and a confident start to algebra. Read widely every day.", "Practice SATs. They measure foundations, so build those first."],
            ["Grade 9", "Take the PSAT 8/9 if offered, for information only. Strengthen algebra and reading stamina.", "Treat the score as a verdict."],
            ["Grade 10", "Take the PSAT 10. Use it to find the two or three skill gaps that matter most. Short, regular practice on those.", "Book an expensive course before you know the gaps."],
            ["Grade 11, autumn", "Take the PSAT/NMSQT in October. Begin structured preparation: one full practice test a month, reviewed carefully.", "Leave it all to the spring."],
            ["Grade 11, spring", "Sit the first SAT. Most students do best with a first attempt in the spring of junior year.", "Sit it without timed practice under real conditions."],
            ["Grade 12, autumn", "Retake once if needed, focused on the weaker section, before early application deadlines.", "Take it four or five times."],
          ],
        },
      ],
    },
    {
      heading: "Where students lose the most marks",
      blocks: [
        {
          type: "list",
          items: [
            "Algebra that was never fully secure. Linear equations, systems and functions appear throughout the Math section.",
            "Reading questions that ask what a short passage implies, not what it states.",
            "Grammar rules around punctuation, especially commas, semicolons and colons.",
            "Pacing. Students who rush the first module may be routed to an easier second module, which caps their score.",
          ],
        },
      ],
    },
    {
      heading: "For families outside the US",
      blocks: [
        {
          type: "p",
          text: "Many of our families in the UK, Canada and Nigeria have children considering US universities. The SAT is offered at test centres around the world, including in Lagos and Abuja, on international test dates. Register early, because popular centres fill up.",
        },
        {
          type: "p",
          text: "If your child is in a British or Nigerian curriculum school, the maths may be ordered differently from the US sequence. A diagnostic test early in Grade 10, or its equivalent, will show which topics need teaching rather than practising.",
        },
      ],
    },
    {
      heading: "How Masani helps",
      blocks: [
        {
          type: "p",
          text: "Our SAT and ACT preparation is one to one, with the same teacher each time, and a written report after every session so you can see which skills are moving. We start with the gaps, not with endless practice tests.",
        },
      ],
    },
  ],
  faqs: [
    {
      question: "When should my child start SAT prep?",
      answer:
        "Build foundations in Grades 8 to 10, use the PSATs to find gaps, start structured preparation in the autumn of Grade 11, and sit the first SAT in the spring of Grade 11.",
    },
    {
      question: "Can you take the SAT in Nigeria?",
      answer: "Yes. The SAT is offered at international test centres, including in Lagos and Abuja.",
    },
    {
      question: "How long is the digital SAT?",
      answer: "2 hours and 14 minutes, plus a short break, with scores from 400 to 1600.",
    },
  ],
  sources: [
    { label: "Test Innovators, Guide to the digital SAT", url: "https://testinnovators.com/blog/digital-sat-guide/" },
    { label: "Test Innovators, The digital PSAT/NMSQT", url: "https://testinnovators.com/blog/what-you-need-to-know-about-digital-psat-nmsqt/" },
    { label: "Principia Education, Which colleges require the SAT or ACT in 2026", url: "https://www.principiaeducation.com/blog/which-colleges-require-the-sat-or-act-in-2026-the-new-test-optional-reality" },
    { label: "Start-Rite Schools Abuja, SAT test centre", url: "https://startriteschools.com.ng/2026/05/12/sat-test-centre-at-start-rite-schools-abuja/" },
  ],
};
