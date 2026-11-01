import type { Guide } from "./types";

export const usSchoolSystemGuide: Guide = {
  slug: "us-school-system-explained-for-nigerian-parents",
  shortTitle: "The US school system explained",
  title: "The US School System Explained for Nigerian Parents",
  description:
    "US grades K to 12 with ages and the Nigerian class at each age, how placement works, what credits, GPA, AP and state tests mean, and when the PSAT, SAT and ACT come.",
  h1: "The US school system explained for Nigerian parents",
  intro:
    "If you grew up with Primary 6, JSS and SSS, the American system can look strange. Grade 5 is still primary school. There is no single national exam like WAEC. And the rules change when you cross a state line. Here is the whole system on one page, mapped against the Nigerian classes you already know.",
  published: "2026-11-01",
  sections: [
    {
      heading: "There is no single US system",
      blocks: [
        {
          type: "p",
          text: "Each state sets its own rules, and local school districts run the schools. That means the age your child starts school, the tests they sit and what they need to graduate all depend on where you live. The shape is the same everywhere, though. Kindergarten, then Grades 1 to 12, usually finished by age 18.",
        },
        {
          type: "p",
          text: "Kindergarten entry is set by age. Texas, California, Florida, Georgia and Illinois, among others, take children who turn 5 on or before 1 September. Some states, including New York and New Jersey, leave the cut off date to each district. So the first question to ask any new school is simple. What is your cut off date?",
        },
      ],
    },
    {
      heading: "Grades, ages and the Nigerian equivalent",
      blocks: [
        {
          type: "table",
          caption: "US grades by age, assuming a 1 September cut off, with the Nigerian class a child of the same age is usually in",
          head: ["US grade", "Age during the year", "School", "Usual Nigerian class at that age"],
          rows: [
            ["Kindergarten", "5 to 6", "Elementary", "Nursery or Primary 1"],
            ["Grade 1", "6 to 7", "Elementary", "Primary 1 or 2"],
            ["Grade 2", "7 to 8", "Elementary", "Primary 2 or 3"],
            ["Grade 3", "8 to 9", "Elementary", "Primary 3 or 4"],
            ["Grade 4", "9 to 10", "Elementary", "Primary 4 or 5"],
            ["Grade 5", "10 to 11", "Elementary", "Primary 5, Primary 6 or JSS1"],
            ["Grade 6", "11 to 12", "Middle", "Primary 6 or JSS1"],
            ["Grade 7", "12 to 13", "Middle", "JSS1 or JSS2"],
            ["Grade 8", "13 to 14", "Middle", "JSS2 or JSS3"],
            ["Grade 9", "14 to 15", "High school, freshman year", "JSS3 or SS1"],
            ["Grade 10", "15 to 16", "High school, sophomore year", "SS1 or SS2"],
            ["Grade 11", "16 to 17", "High school, junior year", "SS2 or SS3"],
            ["Grade 12", "17 to 18", "High school, senior year", "SS3"],
          ],
        },
        {
          type: "p",
          text: "Many districts split elementary, middle and high school this way, but not all. Some have junior high schools or schools that run from kindergarten to Grade 8. The Nigerian column is a guide by age, because Nigerian schools vary in when children start and whether they skip Primary 6.",
        },
        {
          type: "p",
          text: "This matters more than parents expect. In Nigeria the minimum age for JSS1 is 10, and many children skip Primary 6. A 10 year old in JSS1 in Lagos may be placed in Grade 5 in Houston, which is still elementary school. It is not a demotion. Districts place children using age and school records, so bring every report card and transcript you have, and ask how placement works in that district.",
        },
      ],
    },
    {
      heading: "High school: credits, GPA and the transcript",
      blocks: [
        {
          type: "p",
          text: "This is where the US differs most from SSS. There is no WAEC at the end. Instead, your child earns credits course by course from Grade 9, and every final grade goes on a transcript that colleges will read.",
        },
        {
          type: "p",
          text: "Texas is a good example. Its Foundation High School Program needs 22 credits, including 4 in English, 3 in maths, 3 in science and 3 in social studies. Adding an endorsement, a focus area such as STEM, takes it to 26. For students arriving in high school, districts often decide the grade by credits already earned, and some use credit by examination to check earlier work.",
        },
        {
          type: "p",
          text: "GPA, or grade point average, turns those grades into one number. On the usual 4.0 scale an A is 4, a B is 3 and a C is 2. Many districts give extra weight to harder courses. In Saint Paul, Minnesota, for example, an A in an honors class counts as 5.0. Grade 9 counts towards the cumulative GPA, so there is no warm up year. Colleges look hardest at Grade 11, because that is usually the last full year on the transcript when applications go in.",
        },
      ],
    },
    {
      heading: "Honors, AP and IB",
      blocks: [
        {
          type: "list",
          items: [
            "Honors courses are harder versions of regular classes, set by the school or district. They often carry extra GPA weight.",
            "AP, or Advanced Placement, courses are college level classes run by the College Board. Exams are held over two weeks in May and scored from 1 to 5. Many colleges give credit for a 3 or above, but each college sets its own rule.",
            "The IB Diploma Programme is for students aged 16 to 19 in schools authorised to teach it. Students study six subject groups plus a core of theory of knowledge, an extended essay and a creativity, activity and service project.",
          ],
        },
        {
          type: "p",
          text: "Colleges want to see that a student has challenged themselves, not only that their grades are high. A sensible mix of honors and AP is usually better than piling on every hard course at once.",
        },
      ],
    },
    {
      heading: "State tests and college admissions tests",
      blocks: [
        {
          type: "p",
          text: "Every state gives its own tests. In Texas it is STAAR: reading and maths every year from Grade 3 to Grade 8, science in Grades 5 and 8, and social studies in Grade 8. In high school, students take end of course exams in Algebra I, English I, English II, Biology and US History, and must pass all five to graduate. In New York, students take Regents exams at the end of high school courses. The state is phasing out the rule that students must pass them to earn a diploma, with changes planned from 2027, but the exams themselves are staying. Check with your school for your child's year.",
        },
        {
          type: "table",
          caption: "The college admissions tests, and when they usually come",
          head: ["Grade", "Test", "What to know"],
          rows: [
            ["Grades 8 and 9", "PSAT 8/9", "A first look at the skills the SAT measures. Useful for spotting gaps."],
            ["Grade 10, spring", "PSAT 10", "Good practice. It does not count for National Merit."],
            ["Grade 11, October", "PSAT/NMSQT", "The only PSAT that counts for National Merit scholarship recognition."],
            ["Grades 11 and 12", "SAT or ACT", "Admissions tests. College policies vary, so check each one. The ACT runs seven national dates a year, from September to July."],
          ],
        },
      ],
    },
    {
      heading: "Gifted programs, report cards and what to expect",
      blocks: [
        {
          type: "p",
          text: "Gifted programs vary by state and district. In Texas, every kindergarten child is automatically considered for gifted and talented services, districts must offer assessment at least once a school year, and parents can refer their own child. If you think your child should be tested, ask the school for the referral form and the testing dates.",
        },
        {
          type: "list",
          items: [
            "Report cards come at the end of each grading period, often every six or nine weeks. Many schools also send a progress report halfway through.",
            "Most districts have an online portal where you can see daily grades, missing work and attendance. Check it weekly, not only at report card time.",
            "Many schools hold parent teacher conferences after the first grading period. You can also ask for a meeting at any time.",
            "Homework varies a lot by school and teacher. Ask what is expected each night, and how late work is graded.",
            "Grades are often built from many small assignments, not one big exam. A few missing pieces of work can pull a grade down fast.",
          ],
        },
      ],
    },
    {
      heading: "Keeping your child on track",
      blocks: [
        {
          type: "p",
          text: "The first year after a move is when gaps open quietly. A child who was top of the class in Abuja may find the maths ordered differently, the reading questions unfamiliar, or the constant small grades confusing, and lose confidence before anyone notices. In high school, every one of those grades is already on the transcript.",
        },
        {
          type: "p",
          text: "At Masani, our teachers follow the US curriculum as well as the Nigerian one, so we can bridge the two, one to one and scheduled in your own time zone. Every family gets a written report after every lesson, so you can see exactly what your child is learning and where they need help.",
        },
      ],
    },
  ],
  faqs: [
    {
      question: "What grade will my child be in when we move to the US?",
      answer:
        "Usually by age, using your state or district's cut off date, which is often 1 September. For high school, districts also look at the credits your child has already earned, so bring every transcript and report card.",
    },
    {
      question: "What is the US equivalent of JSS1?",
      answer:
        "By age, JSS1 usually lines up with Grade 6 or Grade 7. A child who skipped Primary 6 and started JSS1 at 10 may be placed in Grade 5.",
    },
    {
      question: "Is there a WAEC style exam at the end of US high school?",
      answer:
        "No. Students graduate by earning credits and passing any tests their state requires, and colleges look at the transcript, GPA, and often SAT or ACT scores.",
    },
  ],
  sources: [
    { label: "NCES, State kindergarten entrance age requirements", url: "https://nces.ed.gov/programs/statereform/tab5_3.asp" },
    { label: "Texas Education Agency, Texas Assessment Program FAQs", url: "https://tea.texas.gov/data-reports/student-assessment-overview/texas-assessment-program-faqs.pdf" },
    { label: "Texas Education Agency, Graduation Toolkit", url: "https://tea.texas.gov/about-tea/news-and-multimedia/brochures/tea-graduation-toolkit-2025.pdf" },
    { label: "NYSED, Graduation Measures FAQ", url: "https://www.nysed.gov/grad-measures/frequently-asked-questions-related-new-york-state-graduation-measures-initiative" },
    { label: "College Board, About AP scores", url: "https://apstudents.collegeboard.org/about-ap-scores" },
    { label: "College Board, PSAT/NMSQT, PSAT 10 and PSAT 8/9 compared", url: "https://satsuite.collegeboard.org/help-center/how-psat-nmsqt-different-psat-10-and-psat-8-9" },
  ],
};
