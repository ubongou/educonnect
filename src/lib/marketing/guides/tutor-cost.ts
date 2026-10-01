import type { Guide } from "./types";

export const tutorCostGuide: Guide = {
  slug: "how-much-does-a-tutor-cost",
  shortTitle: "How much does a tutor cost?",
  title: "How Much Does a Tutor Cost in the UK, US and Canada?",
  description:
    "Real 2026 tutoring rates in the UK, US and Canada, the hidden costs most parents miss, and how to work out what a tutor really costs per useful hour.",
  h1: "How much does a tutor cost in the UK, US and Canada?",
  intro:
    "Parents ask me this more than any other question, usually in a whisper, as if the answer might be rude. It isn't. Tutoring is a real expense and you deserve real numbers. Here is what families are paying in 2026, what the advertised hourly rate leaves out, and how I would compare one option against another.",
  published: "2026-10-01",
  sections: [
    {
      heading: "The going rates in 2026",
      blocks: [
        {
          type: "p",
          text: "Rates vary by country, city, subject and the tutor's experience, but the published figures cluster in fairly narrow bands. These are the ranges reported by tutoring platforms and rate surveys this year.",
        },
        {
          type: "table",
          caption: "Typical hourly rates for a private tutor, 2026",
          head: ["Where", "Primary", "Secondary", "Exam and test prep"],
          rows: [
            ["United Kingdom", "£20 to £40", "£30 to £55 (GCSE)", "£35 to £70 (A level)"],
            ["United States", "$35 to $60 on Wyzant", "$30 to $150 (algebra)", "Higher end of the range"],
            ["Canada", "C$30 to C$55 (K to 8)", "C$50 to C$100+", "C$70 to C$125+"],
          ],
        },
        {
          type: "p",
          text: "In the UK, most private tutors charge between £30 and £50 an hour, and London sits roughly 15 to 25% above the national average, at around £50 to £65. In the US, Wyzant puts its typical range at $35 to $60, with New York tutors charging more than tutors in Florida. In Canada, the common band is C$25 to C$80, with Toronto and Vancouver at the top.",
        },
      ],
    },
    {
      heading: "What the hourly rate leaves out",
      blocks: [
        {
          type: "p",
          text: "The number on the profile is rarely the number you pay. Before you compare two tutors, add these up.",
        },
        {
          type: "list",
          items: [
            "Platform fees. Some marketplaces charge parents a monthly subscription on top of the tutor's rate. Superprof's Student Pass, for example, is around £39 a month.",
            "Travel. Home tutors often build travel time into the rate, or charge it separately. Online lessons remove this entirely.",
            "Minimum blocks. Agencies often sell in blocks of 10 or more lessons, paid upfront, with strict rules on cancellations.",
            "Missed lesson rules. Ask what happens if your child is ill on the day. A 24 hour rule and a 48 hour rule cost very different amounts over a school year.",
            "Assessment fees. Some tutors charge for an initial assessment before lessons begin.",
          ],
        },
      ],
    },
    {
      heading: "The number I actually look at: cost per useful hour",
      blocks: [
        {
          type: "p",
          text: "A cheap hour that starts ten minutes late, has no plan and ends with no feedback is expensive. A more costly hour where the teacher knows exactly where your child is, teaches to that, and tells you what happened can be the better buy.",
        },
        {
          type: "p",
          text: "So when I help a parent compare, I ask four questions about every option:",
        },
        {
          type: "list",
          ordered: true,
          items: [
            "Will I hear what happened after every lesson, in writing?",
            "Is the teaching linked to what my child is doing in school? The Education Endowment Foundation finds tuition works best when it is explicitly linked to normal lessons.",
            "Can I see the lesson if I want to, through a recording?",
            "If the match is wrong, how quickly and how cheaply can I change teacher?",
          ],
        },
        {
          type: "p",
          text: "If the answer to all four is yes, the hourly rate becomes a fair comparison. If not, you are comparing prices for different things.",
        },
      ],
    },
    {
      heading: "Where online lessons with Nigerian teachers fit",
      blocks: [
        {
          type: "p",
          text: "Many Nigerian families abroad now look at online tutoring with teachers based in Nigeria. The appeal is obvious: teachers who share your family's expectations, at a price local tutors rarely match. The risk is also obvious: quality varies enormously, and some arrangements have no vetting, no reporting and nobody accountable when something goes wrong.",
        },
        {
          type: "p",
          text: "This is why we built Masani the way we did. Only the top 3% of teachers who apply are accepted. Every family gets a written report after every lesson, recorded lessons, and progress tracked skill by skill in a parent portal. Packages cost the following.",
        },
        {
          type: "table",
          caption: "Masani prices per session",
          head: ["Package", "UK", "US", "Canada"],
          rows: [
            ["8 sessions", "£11", "$15", "C$21"],
            ["24 sessions", "£10.08", "$13.75", "C$19.25"],
            ["48 sessions", "£9.63", "$13.13", "C$18.38"],
          ],
        },
        {
          type: "p",
          text: "You can pause or cancel with 48 hours' notice, unused sessions are always refunded, and your first 90 days are covered by our money back promise.",
        },
      ],
    },
    {
      heading: "How much tutoring does a child actually need?",
      blocks: [
        {
          type: "p",
          text: "Less than most parents fear, as long as it is regular. The Education Endowment Foundation's review of one to one tuition found an average of five months' additional progress, with the best results from short, regular sessions over a set period rather than occasional long ones.",
        },
        {
          type: "p",
          text: "In practice, I suggest two sessions a week for a term, then a review. If the gap is closing, you can often drop to one. If it is not, the reports should tell you why before you spend another pound.",
        },
      ],
    },
  ],
  faqs: [
    {
      question: "How much does a tutor cost per hour in the UK?",
      answer:
        "Most UK private tutors charge between £30 and £50 an hour in 2026. Primary tutoring is often £20 to £40, GCSE £30 to £55 and A level £35 to £70. London is around 15 to 25% higher.",
    },
    {
      question: "How much does a tutor cost per hour in Canada?",
      answer:
        "Typical rates run from C$25 to C$80 an hour. Elementary tutoring is often C$30 to C$55, high school C$50 to C$100 or more, and specialist test preparation C$70 to C$125 or more.",
    },
    {
      question: "Is online tutoring cheaper than in person?",
      answer:
        "Usually, because there is no travel. Canadian rate surveys put online tutoring roughly 10 to 20% below in person rates.",
    },
  ],
  sources: [
    { label: "TutorCruncher, Average tutoring rates UK 2026", url: "https://tutorcruncher.com/blog/average-tutoring-rates-uk" },
    { label: "Wyzant, How much does a tutor cost?", url: "https://blog.wyzant.com/how-much-does-tutoring-cost/" },
    { label: "Wise, Average tutoring rates in Canada", url: "https://blog.wise.live/average-tutoring-rates-in-canada/" },
    { label: "StudyGuru, Best online tutoring platforms UK (Superprof Student Pass)", url: "https://www.studyguru.co.uk/best-online-tutoring-platforms-uk" },
    { label: "Education Endowment Foundation, One to one tuition", url: "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/one-to-one-tuition" },
  ],
};
