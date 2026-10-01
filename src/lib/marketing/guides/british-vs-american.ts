import type { Guide } from "./types";

export const britishVsAmericanGuide: Guide = {
  slug: "british-vs-american-curriculum",
  shortTitle: "British vs American curriculum",
  title: "British vs American Curriculum: What Changes for Your Child",
  description:
    "How the British and American school systems differ in structure, exams, grading and maths, what that means for a child moving between them, and how Nigerian schooling fits in.",
  h1: "British vs American curriculum: what actually changes for your child",
  intro:
    "Nigerian education grew out of the British system, so many of our families find the UK familiar and the US confusing. Then a job moves you to Houston, or a cousin recommends an American international school in Lagos, and suddenly you need to understand both. These are the differences that matter in practice.",
  published: "2026-10-01",
  sections: [
    {
      heading: "The two systems side by side",
      blocks: [
        {
          type: "table",
          caption: "British (England) and American systems compared",
          head: ["", "British (England)", "American"],
          rows: [
            ["Years", "Reception, then Years 1 to 13", "Kindergarten, then Grades 1 to 12"],
            ["Start of formal school", "Reception at 4 to 5", "Kindergarten at 5 to 6"],
            ["Age cut off", "1 September, nationally", "Set by each state, often 1 September"],
            ["Primary to secondary", "Year 7, at 11", "Middle school around Grade 6, high school at Grade 9"],
            ["Key exams", "SATs at 11, GCSEs at 16, A levels at 18", "State tests, then SAT or ACT, plus AP courses"],
            ["What universities look at", "Predicted and final A level grades", "Four year GPA, test scores where required, activities and essays"],
            ["Breadth", "Narrows at 14 (GCSE options) and again at 16 (usually three A levels)", "Stays broad through Grade 12"],
            ["Grading", "GCSEs 9 to 1, A levels A* to E", "Letter grades and a GPA, usually out of 4.0"],
          ],
        },
      ],
    },
    {
      heading: "The difference that catches families out: when grades start to count",
      blocks: [
        {
          type: "p",
          text: "In England, what matters most for university is the A level result at 18, plus GCSEs at 16. A difficult year at 13 can be recovered from.",
        },
        {
          type: "p",
          text: "In the US, every grade from Grade 9 goes into the GPA that colleges see. A poor freshman year follows a student into their applications. If your child moves to the US at 13 or 14, the first year of high school is not a settling in year. It counts.",
        },
      ],
    },
    {
      heading: "Maths is ordered differently",
      blocks: [
        {
          type: "p",
          text: "This is the subject where moves cause the most trouble.",
        },
        {
          type: "list",
          items: [
            "The US teaches maths in courses: Algebra I, Geometry, Algebra II, Precalculus, Calculus. Many students take Algebra I around Grade 8 or 9.",
            "England teaches maths as one subject every year, with algebra, geometry and statistics woven together and revisited.",
            "A child moving from England to the US may have seen most Algebra I content but be missing a full year of formal geometry proofs.",
            "A child moving from the US to England may find GCSE questions mix topics in a single problem, which feels unfamiliar even when each topic is known.",
            "Children from Nigeria often have strong arithmetic and algebraic manipulation, and benefit from practice explaining their reasoning in words, which both systems now expect.",
          ],
        },
      ],
    },
    {
      heading: "English and writing",
      blocks: [
        {
          type: "p",
          text: "British schools assess grammar terminology explicitly in primary school and analyse set texts closely at GCSE. American schools put heavy weight on essay structure, argument and research writing across subjects. Both reward wide reading. Spelling also changes, colour to color, and teachers will expect the local version.",
        },
      ],
    },
    {
      heading: "Moving between systems: a short checklist",
      blocks: [
        {
          type: "list",
          ordered: true,
          items: [
            "Place by age first, then check the maths sequence. Ask the new school exactly which maths course or set your child will join and what it assumes.",
            "Bring work, not just reports. A few exercise books show teachers the level far better than a grade.",
            "If moving to the US at 13 or older, plan the high school course sequence early, because it shapes the GPA and college options.",
            "If moving to England at 13 or 14, check GCSE option deadlines in Year 9 so your child does not miss the choice.",
            "Close specific gaps quickly, before they knock confidence.",
          ],
        },
        {
          type: "p",
          text: "Masani teachers work across the UK, US, Canadian, Nigerian and international curricula, so a child can keep the same teacher through a move and close the gaps between systems with someone who already knows them.",
        },
      ],
    },
  ],
  faqs: [
    {
      question: "Is the British curriculum harder than the American curriculum?",
      answer:
        "Neither is simply harder. The British system specialises earlier and puts most weight on exams at 16 and 18. The American system stays broader for longer and counts every grade from Grade 9 in the GPA.",
    },
    {
      question: "What grade is Year 7 in the US?",
      answer: "Year 7 in England usually lines up with Grade 6 in the US, as both are for children aged 11 to 12.",
    },
  ],
  sources: [
    { label: "GOV.UK, The national curriculum", url: "https://www.gov.uk/national-curriculum" },
    { label: "College Board, AP courses and SAT", url: "https://www.collegeboard.org/" },
  ],
};
