import type { Guide } from "./types";

export const onlineTutoringWorthItGuide: Guide = {
  slug: "is-online-tutoring-worth-it",
  shortTitle: "Is online tutoring worth it?",
  title: "Is Online Tutoring Worth It? What the Evidence Says",
  description:
    "An honest look at the research on one to one and online tutoring, including a trial where online tuition did not work, and the five things that decide whether it works for your child.",
  h1: "Is online tutoring worth it? An honest answer, with the evidence",
  intro:
    "I run an online tutoring service, so you might expect me to say yes and move on. The truthful answer is that it depends, and the research is surprisingly clear on what it depends on. Here is the evidence, including the part that does not flatter companies like mine.",
  published: "2026-10-01",
  sections: [
    {
      heading: "What the research says about one to one tuition",
      blocks: [
        {
          type: "p",
          text: "The Education Endowment Foundation in England reviews the evidence on what helps children learn. Its summary of one to one tuition finds an average of five months' additional progress, rated as moderate impact for moderate cost, on moderate evidence.",
        },
        {
          type: "table",
          caption: "Average additional progress from one to one tuition",
          head: ["Group", "Additional progress"],
          rows: [
            ["All pupils, on average", "+5 months"],
            ["Primary school pupils", "+6 months"],
            ["Secondary school pupils", "+4 months"],
            ["Reading and writing", "+6 months"],
            ["Maths", "+2 months"],
          ],
        },
        {
          type: "p",
          text: "The same review found that tuition works best in short, regular sessions over a set period, when it is explicitly linked to what the child is learning in class, and when it is delivered by experienced, trained teachers rather than volunteers.",
        },
      ],
    },
    {
      heading: "The trial where online tutoring did not work",
      blocks: [
        {
          type: "p",
          text: "This is the part I want every parent to read. The Education Endowment Foundation tested an affordable online maths tuition programme with around 600 Year 6 pupils in 64 schools. Tutors overseas taught weekly one to one sessions over 27 weeks.",
        },
        {
          type: "p",
          text: "The result was about one month of extra progress, which was not statistically significant. In plain terms, there was no clear evidence it helped Key Stage 2 maths results compared with normal teaching.",
        },
        {
          type: "p",
          text: "That does not prove online tutoring fails. It shows that online tutoring delivered cheaply, at scale, with tutors who are not connected to the child's school or family, may not be enough on its own. The format is not the problem. The design is.",
        },
      ],
    },
    {
      heading: "The five things that decide whether it works",
      blocks: [
        {
          type: "list",
          ordered: true,
          items: [
            "The same teacher every time. A child opens up to a teacher who knows them. A rota of strangers resets the relationship every week.",
            "A real teacher. The evidence favours experienced, trained teachers over volunteers. Ask how tutors are selected and what share of applicants are accepted.",
            "A link to school. Tuition works best when it connects to what the child is doing in class. The tutor should ask what your child is studying and see their school work.",
            "Regularity. Short, regular sessions beat occasional long ones. Two sessions a week is a good starting point for most children.",
            "Feedback to parents. If you never hear what happened in a lesson, you cannot tell whether it is working. Insist on a written report after every session.",
          ],
        },
      ],
    },
    {
      heading: "Online or in person?",
      blocks: [
        {
          type: "p",
          text: "When those five things are in place, the screen matters less than people think. Online lessons have real advantages for families abroad: no travel, lessons that fit around your time zone, recordings you can watch back, and access to teachers you would never find locally. They also have real limits. Very young children find long screen sessions hard, and a poor internet connection undermines everything.",
        },
        {
          type: "p",
          text: "My honest advice: choose based on the teacher and the structure first, the format second.",
        },
      ],
    },
    {
      heading: "How we designed Masani around this evidence",
      blocks: [
        {
          type: "p",
          text: "Every child at Masani is matched with one teacher. Only the top 3% of teachers who apply are accepted. Teachers write a report after every lesson, lessons are recorded, and progress is tracked skill by skill in a parent portal, so you can judge for yourself whether it is working. And if it is not, your first 90 days are covered by our money back promise.",
        },
      ],
    },
  ],
  faqs: [
    {
      question: "Is online tutoring as effective as in person?",
      answer:
        "It can be, when the essentials are in place: the same experienced teacher each time, regular sessions, a link to school work and feedback to parents. Evidence also shows low cost online tuition without these can have little measurable effect.",
    },
    {
      question: "How much progress does tutoring make?",
      answer:
        "The Education Endowment Foundation finds one to one tuition adds about five months' progress on average, more in primary school and in reading than in secondary school and maths.",
    },
  ],
  sources: [
    { label: "Education Endowment Foundation, One to one tuition", url: "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/one-to-one-tuition" },
    { label: "Education Endowment Foundation, Affordable Maths Tuition trial", url: "https://educationendowmentfoundation.org.uk/projects-and-evaluation/projects/affordable-maths-tuition" },
  ],
};
