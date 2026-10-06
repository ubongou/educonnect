/**
 * Exam preparation pages. Same template and URL space as subject pages
 * (/tutoring/[slug]), listed under Exams. Linked to their row in EXAMS
 * (lib/marketing/exams.ts) by `pageSlug`, which is how every subject, country
 * and guide page finds them.
 *
 * Same rules as seoPages: no dashes, only general knowledge about the exam,
 * only claims Masani already makes elsewhere, no invented statistics.
 */
import type { SubjectPage } from "./seoPages";

const exam = (p: Omit<SubjectPage, "kind">): SubjectPage => ({ ...p, kind: "exam" });

export const examPages: SubjectPage[] = [
  // ----- United Kingdom ------------------------------------------------------
  exam({
    slug: "gcse",
    name: "GCSE",
    linkLabel: "GCSE tutoring",
    currency: "GBP",
    title: "Online GCSE Tutoring: Maths, English and Sciences",
    description:
      "One to one online GCSE tutoring with vetted Nigerian teachers. Maths, English, biology, chemistry, physics and more, following your child's exam board.",
    h1: "Online GCSE tutoring that turns effort into grades",
    intro:
      "One to one GCSE lessons with a vetted Nigerian teacher who follows your child's exam board and specification. We find the topics costing marks, close those gaps, and build the exam technique that turns understanding into grades.",
    whoFor: [
      "Students in Years 9 to 11 working towards GCSEs or IGCSEs",
      "Students aiming to move up a grade, from a 4 to a 6 or a 7 to a 9",
      "Students who revise hard but lose marks in the exam itself",
      "Students resitting GCSE maths or English",
    ],
    coversTitle: "What GCSE preparation covers",
    covers: [
      "Maths at foundation and higher tier",
      "English language and English literature",
      "Biology, chemistry and physics, as combined or separate sciences",
      "Other GCSE subjects on request, including computer science, French and Spanish",
      "Past papers and mark schemes from your child's exam board",
      "Exam technique, timing and revision planning",
    ],
    approach: [
      "We start with your child's exam board, their predicted grades and a diagnostic of the topics costing the most marks.",
      "Lessons work through those topics in order of impact, so every week moves the grade.",
      "Past paper questions are marked against the real mark scheme, so your child learns exactly what examiners reward.",
    ],
    faqs: [
      {
        question: "Which exam boards do you cover?",
        answer:
          "We follow your child's own exam board and specification, including AQA, Edexcel, OCR and WJEC Eduqas, and Cambridge and Edexcel for IGCSE.",
      },
      {
        question: "How are GCSEs graded?",
        answer:
          "GCSEs in England are graded 9 to 1, with 9 the highest. A 4 is a standard pass and a 5 a strong pass. Many sixth forms ask for a 6 or above in the subjects a student wants to take at A level.",
      },
      {
        question: "When should my child start GCSE tutoring?",
        answer:
          "Year 10 is ideal, because it leaves time to fix gaps before Year 11 revision begins. Starting in Year 11 can still make a real difference with a focused plan.",
      },
    ],
  }),
  exam({
    slug: "a-level",
    name: "A level",
    linkLabel: "A level tutoring",
    currency: "GBP",
    title: "Online A Level Tutoring: Maths, Sciences and More",
    description:
      "One to one online A level tutoring with vetted Nigerian teachers. Maths, further maths, biology, chemistry, physics and economics, for the grades universities ask for.",
    h1: "Online A level tutoring for the grades universities ask for",
    intro:
      "One to one A level lessons with a vetted Nigerian teacher who knows your child's exam board. A levels are a big step up from GCSE, and university offers depend on the grades, so we build deep understanding early and sharpen exam technique for the summer of Year 13.",
    whoFor: [
      "Students in Years 12 and 13 taking A levels",
      "Students finding the jump from GCSE harder than expected",
      "Students working towards a conditional university offer",
      "Students applying for competitive courses such as medicine, engineering or economics",
    ],
    coversTitle: "What A level preparation covers",
    covers: [
      "Maths and further maths, including pure, mechanics and statistics",
      "Biology, chemistry and physics, including required practicals",
      "Economics, English literature and computer science",
      "Extended answers, essays and data questions",
      "Past papers marked against your child's exam board",
      "Revision planning across two years of content",
    ],
    approach: [
      "We start with your child's exam board, their target grades and an honest look at which topics are secure and which are not.",
      "Hard topics are taught properly the first time, so Year 13 can focus on exam practice rather than catching up.",
      "Your child practises the longer, harder questions where A level marks are won or lost.",
    ],
    faqs: [
      {
        question: "How are A levels graded?",
        answer:
          "A levels are graded A star to E. Most students take three, and universities usually make offers based on predicted grades, confirmed by the final results in August.",
      },
      {
        question: "Which exam boards do you cover?",
        answer:
          "We follow your child's own exam board, including AQA, Edexcel, OCR and WJEC Eduqas, and Cambridge International A levels.",
      },
      {
        question: "Can you help my child get the grades for a university offer?",
        answer:
          "Yes. We plan backwards from the grades in your child's offer, focus on the topics and papers that will move those grades most, and report progress after every lesson.",
      },
    ],
  }),
  exam({
    slug: "ks2-sats",
    name: "KS2 SATs",
    linkLabel: "KS2 SATs tutoring",
    currency: "GBP",
    title: "KS2 SATs Tutoring Online for Year 6",
    description:
      "One to one online KS2 SATs tutoring with vetted Nigerian teachers. Reading, maths, and grammar, punctuation and spelling, for a confident Year 6.",
    h1: "Online KS2 SATs tutoring for a calm, confident Year 6",
    intro:
      "One to one preparation for the Key Stage 2 SATs taken in May of Year 6 in England. We build the reading, maths and grammar skills the tests check, practise with real past papers, and keep the pressure low so your child walks in confident.",
    whoFor: [
      "Children in Years 5 and 6 at school in England",
      "Children working towards the expected standard, or aiming for greater depth",
      "Children who know the content but rush or freeze in timed tests",
      "Children who arrived in the UK recently and need to catch up",
    ],
    coversTitle: "What SATs preparation covers",
    covers: [
      "Arithmetic: fast, accurate written methods",
      "Maths reasoning and multi step word problems",
      "Reading comprehension and inference",
      "Grammar, punctuation and spelling, including the terms the test uses",
      "Past papers under timed conditions",
      "Calm test habits: checking work and managing time",
    ],
    approach: [
      "We start with a past paper to see exactly where marks are being lost.",
      "Each weak area is taught as a clear method, then practised little and often.",
      "Timed practice comes later, once the methods are secure, so speed builds without stress.",
    ],
    faqs: [
      {
        question: "What do the KS2 SATs test?",
        answer:
          "Reading, maths (an arithmetic paper and two reasoning papers), and grammar, punctuation and spelling. Writing is assessed by your child's teacher rather than in a test.",
      },
      {
        question: "How are SATs scored?",
        answer:
          "Results are given as scaled scores from 80 to 120. A score of 100 or more means your child is working at the expected standard for the end of primary school.",
      },
      {
        question: "Do SATs results matter?",
        answer:
          "They do not affect which secondary school your child gets into, but they are passed on to the secondary school and can influence which sets or groups your child starts in.",
      },
    ],
  }),
  exam({
    slug: "common-entrance",
    name: "Common Entrance",
    linkLabel: "Common Entrance tutoring",
    currency: "GBP",
    title: "Common Entrance and ISEB Pre Test Tutoring Online",
    description:
      "One to one online tutoring for independent school entry: the ISEB Common Pre Test and 13+ Common Entrance, with vetted Nigerian teachers.",
    h1: "Online tutoring for independent school entrance",
    intro:
      "One to one preparation for the assessments independent senior schools use, from the ISEB Common Pre Test to 13+ Common Entrance. We plan around the schools you are applying to and their deadlines, and build the skills and confidence each stage needs.",
    whoFor: [
      "Children in Years 5 to 8 applying to independent senior schools",
      "Families applying to schools that use the ISEB Common Pre Test",
      "Children sitting 13+ Common Entrance after a pre test offer",
      "Families relocating to the UK and applying to independent schools",
    ],
    coversTitle: "What preparation covers",
    covers: [
      "Maths, from arithmetic to multi step problems",
      "English comprehension and writing",
      "Verbal and non verbal reasoning for the pre test",
      "Science for 13+ Common Entrance",
      "Practice in the format each school uses, including online tests",
      "Interview confidence and talking about their interests",
    ],
    approach: [
      "We start with the schools on your list, the tests they use and their dates, and work back from there.",
      "Reasoning question types are taught as methods first, because most children have never met them at school.",
      "Practice gradually moves to timed, exam style conditions, so the real thing feels familiar.",
    ],
    faqs: [
      {
        question: "What is the ISEB Common Pre Test?",
        answer:
          "An online, adaptive test many independent senior schools use to assess applicants, usually in Year 6 or 7. It covers English, maths, and verbal and non verbal reasoning.",
      },
      {
        question: "What is 13+ Common Entrance?",
        answer:
          "Exams taken in Year 8 for entry to independent senior schools at 13, usually after a place has been offered conditionally. Schools set their own pass marks.",
      },
      {
        question: "Can you help with school interviews too?",
        answer:
          "Yes. Teachers help your child practise talking about their interests, their reading and their reasons for choosing a school, so interviews feel like a conversation.",
      },
    ],
  }),
  exam({
    slug: "national-5-highers",
    name: "National 5 & Highers",
    linkLabel: "National 5 and Highers tutoring",
    currency: "GBP",
    title: "National 5 and Highers Tutoring Online in Scotland",
    description:
      "One to one online National 5, Higher and Advanced Higher tutoring with vetted Nigerian teachers. Maths, English and sciences, following SQA courses.",
    h1: "Online National 5 and Highers tutoring",
    intro:
      "One to one lessons for Scottish qualifications, with a vetted Nigerian teacher who follows SQA course specifications. We secure the topics that carry the most marks and practise with past papers, so your child is ready for the exam diet.",
    whoFor: [
      "Students in S3 to S6 at school in Scotland",
      "Students taking National 5s in S4 or Highers in S5",
      "Students working towards the Higher grades universities ask for",
      "Students taking Advanced Highers in S6",
    ],
    coversTitle: "What preparation covers",
    covers: [
      "Maths and applications of maths",
      "English, including critical reading and the folio",
      "Biology, chemistry and physics",
      "Assignments and coursework guidance",
      "SQA past papers and marking instructions",
      "Exam technique and revision planning for the exam diet",
    ],
    approach: [
      "We start with your child's courses, their prelim results and the topics costing the most marks.",
      "Lessons follow SQA course specifications, so everything taught is what the exam asks for.",
      "Past paper practice is marked against SQA marking instructions, so your child learns what earns credit.",
    ],
    faqs: [
      {
        question: "How are National 5s and Highers graded?",
        answer:
          "Both are graded A to D, with A the highest. Scottish universities usually make offers based on Higher grades achieved by the end of S5 or S6.",
      },
      {
        question: "My child moved from England. Can you help them adjust?",
        answer:
          "Yes. The Scottish system is organised differently from GCSEs and A levels. Our teachers help students fill any content gaps and get used to SQA question styles.",
      },
      {
        question: "Do you help with assignments and folios?",
        answer:
          "Teachers explain what each assignment or folio piece is assessed on and give feedback on planning and drafts, within SQA rules on how much help is allowed.",
      },
    ],
  }),

  // ----- United States -------------------------------------------------------
  exam({
    slug: "ssat-isee",
    name: "SSAT & ISEE",
    linkLabel: "SSAT and ISEE tutoring",
    currency: "USD",
    title: "SSAT and ISEE Tutoring Online for Private School Entry",
    description:
      "One to one online SSAT and ISEE tutoring with vetted Nigerian teachers. Verbal, reading, math and the writing sample, for private school admission in the US and Canada.",
    h1: "Online SSAT and ISEE tutoring for private school admission",
    intro:
      "One to one preparation for the SSAT and ISEE, the admission tests used by private and independent schools in the US and Canada. We find your child's weakest sections, teach the question types properly, and build the speed the tests demand.",
    whoFor: [
      "Students in Grades 3 to 11 applying to private or independent schools",
      "Students who are strong in school but new to standardized tests",
      "Students who need to raise one section, often verbal or quantitative",
      "Families applying to schools in the US or Canada",
    ],
    coversTitle: "What preparation covers",
    covers: [
      "Verbal reasoning: synonyms, analogies and sentence completion",
      "Reading comprehension",
      "Quantitative reasoning and math achievement",
      "The writing sample schools read alongside scores",
      "Full practice tests at your child's level",
      "Timing strategy and when to skip a question",
    ],
    approach: [
      "We start with a practice test to see which sections and question types need the most work.",
      "Vocabulary and verbal skills are built steadily over weeks, because they cannot be crammed.",
      "Timed sections are added as methods become secure, so pacing improves without panic.",
    ],
    faqs: [
      {
        question: "What is the difference between the SSAT and the ISEE?",
        answer:
          "Both test verbal skills, reading and math, and include a writing sample. They differ in format and scoring, and schools choose which they accept. We prepare your child for whichever their schools require.",
      },
      {
        question: "When should my child start preparing?",
        answer:
          "Three to six months before the test is typical. Earlier is better if vocabulary or reading needs building, because those take time.",
      },
      {
        question: "Do Canadian private schools use these tests?",
        answer:
          "Many do, especially the SSAT. Check each school's admissions page, and we will tailor preparation to the test they ask for.",
      },
    ],
  }),
  exam({
    slug: "ap-exams",
    name: "AP exams",
    linkLabel: "AP exam tutoring",
    currency: "USD",
    title: "AP Exam Tutoring Online: Calculus, Sciences and More",
    description:
      "One to one online AP tutoring with vetted Nigerian teachers. AP Calculus, Statistics, Biology, Chemistry, Physics and more, for scores that earn college credit.",
    h1: "Online AP tutoring for the scores that count",
    intro:
      "One to one lessons for Advanced Placement courses, with a vetted Nigerian teacher who knows the course framework and exam. AP classes move fast, so we keep your child on top of the content all year and prepare them for the free response questions that decide the score.",
    whoFor: [
      "High school students taking AP courses in the US or Canada",
      "Students who are falling behind the pace of an AP class",
      "Students aiming for a 4 or 5 to earn college credit",
      "Students self studying for an AP exam",
    ],
    coversTitle: "What AP preparation covers",
    covers: [
      "AP Calculus AB and BC, and AP Statistics",
      "AP Biology, AP Chemistry and AP Physics",
      "AP English Literature, AP Computer Science and AP Economics",
      "Free response questions and how they are scored",
      "Released exam questions and full practice exams",
      "A study plan through to the May exams",
    ],
    approach: [
      "We follow the official course framework, so lessons match what the exam tests.",
      "Each unit is secured before the class moves on, so gaps do not pile up before May.",
      "Your child practises free response answers against real scoring guidelines.",
    ],
    faqs: [
      {
        question: "How are AP exams scored?",
        answer:
          "AP exams are scored from 1 to 5 and taken in May. Many colleges give credit or advanced placement for a 3 or above, and selective colleges often look for a 4 or 5. Policies vary by college.",
      },
      {
        question: "Which AP courses do you teach?",
        answer:
          "Calculus AB and BC, Statistics, Biology, Chemistry, the Physics courses, English Literature, Computer Science and Economics, with others on request.",
      },
      {
        question: "Do Canadian students take AP exams?",
        answer:
          "Yes. Many Canadian high schools offer AP courses, and Canadian universities also recognise AP results.",
      },
    ],
  }),
  exam({
    slug: "shsat",
    name: "SHSAT",
    linkLabel: "SHSAT tutoring",
    currency: "USD",
    title: "SHSAT Tutoring Online for NYC Specialized High Schools",
    description:
      "One to one online SHSAT tutoring with vetted Nigerian teachers. English language arts and math for New York City's specialized high schools.",
    h1: "Online SHSAT tutoring for New York City",
    intro:
      "One to one preparation for the Specialized High Schools Admissions Test, used for admission to New York City's specialized high schools such as Stuyvesant, Bronx Science and Brooklyn Tech. We build the reading and math skills the test rewards and the speed to use them.",
    whoFor: [
      "Students in Grade 7 and 8 in New York City",
      "Grade 9 students applying for Grade 10 entry",
      "Strong students who want to make the most of a single test day",
      "Students who need to raise either their reading or their math score",
    ],
    coversTitle: "What SHSAT preparation covers",
    covers: [
      "Reading comprehension across fiction and nonfiction",
      "Revising and editing passages",
      "Math problem solving, including grid in questions",
      "Algebra, geometry and probability at the level tested",
      "Full length practice tests under timed conditions",
      "Pacing across a long test",
    ],
    approach: [
      "We start with a practice test to see where your child's score can grow fastest.",
      "Math topics beyond the school syllabus are taught early, so practice tests are not a shock.",
      "Full length timed tests build the stamina the real test day needs.",
    ],
    faqs: [
      {
        question: "When is the SHSAT taken?",
        answer:
          "Usually in the fall of Grade 8 for Grade 9 entry, with a smaller number of Grade 9 students testing for Grade 10. Check the New York City Department of Education for current dates.",
      },
      {
        question: "What does the SHSAT test?",
        answer:
          "English language arts, including reading comprehension and revising and editing, and math. Admission is based on the score and the schools a student ranks.",
      },
      {
        question: "When should my child start preparing?",
        answer:
          "Many families start in Grade 7, which leaves time to build math and reading skills before practising under test conditions in the summer.",
      },
    ],
  }),
  exam({
    slug: "gifted-and-talented",
    name: "Gifted & talented tests",
    linkLabel: "Gifted and talented test preparation",
    currency: "USD",
    title: "Gifted and Talented Test Prep Online: CogAT, NNAT, OLSAT",
    description:
      "One to one online preparation for gifted and talented tests such as the CogAT, NNAT and OLSAT, with vetted Nigerian teachers. Gentle, age appropriate reasoning practice.",
    h1: "Gentle, online preparation for gifted and talented tests",
    intro:
      "One to one lessons that help young children feel at ease with the reasoning puzzles used in gifted and talented assessments. We keep it playful and age appropriate, so your child understands what to do and can show what they are capable of.",
    whoFor: [
      "Children from Kindergarten to Grade 5",
      "Children being assessed for a gifted and talented program",
      "Bright children who have never seen reasoning style questions",
      "Families in the US and Canada, where requirements vary by district",
    ],
    coversTitle: "What preparation covers",
    covers: [
      "Verbal reasoning: analogies, classification and sentence completion",
      "Quantitative reasoning: number patterns and puzzles",
      "Non verbal reasoning: shapes, matrices and spatial puzzles",
      "Listening carefully and following instructions",
      "Familiarity with the test format, at a gentle pace",
      "Thinking skills that help in school too",
    ],
    approach: [
      "Lessons are short and game like, because young children learn best when they are enjoying it.",
      "Each puzzle type is explained and practised until your child recognises it and knows how to start.",
      "We build thinking skills, not memorised answers, which also help in class long after the test.",
    ],
    faqs: [
      {
        question: "Which tests do you prepare children for?",
        answer:
          "Reasoning tests commonly used for gifted and talented programs, including the CogAT, NNAT and OLSAT. Requirements vary by district and school, so check yours first.",
      },
      {
        question: "Isn't preparing young children for these tests too much pressure?",
        answer:
          "It should never feel like pressure. Our lessons are short and playful, and the aim is simply that your child is not meeting a new kind of puzzle for the first time on test day.",
      },
      {
        question: "How early should we start?",
        answer:
          "A few weeks to a few months before the assessment is enough for most children. Little and often works best at this age.",
      },
    ],
  }),

  // ----- Canada --------------------------------------------------------------
  exam({
    slug: "eqao-osslt",
    name: "EQAO & OSSLT",
    linkLabel: "EQAO and OSSLT tutoring",
    currency: "CAD",
    title: "EQAO and OSSLT Tutoring Online in Ontario",
    description:
      "One to one online tutoring for Ontario's EQAO assessments and the OSSLT literacy test, with vetted Nigerian teachers. Reading, writing and math.",
    h1: "Online EQAO and OSSLT tutoring for Ontario students",
    intro:
      "One to one lessons for Ontario's provincial assessments: EQAO in Grades 3, 6 and 9, and the Ontario Secondary School Literacy Test in Grade 10. We follow the Ontario curriculum, build the reading, writing and math skills the tests check, and practise the online format.",
    whoFor: [
      "Ontario students in Grades 3, 6 and 9 preparing for EQAO",
      "Grade 10 students preparing for the OSSLT",
      "Students who arrived in Ontario recently and need to catch up",
      "Students who understand the work but struggle with written answers",
    ],
    coversTitle: "What preparation covers",
    covers: [
      "Reading comprehension across different kinds of text",
      "Writing: paragraphs, news reports and opinion pieces",
      "Math in line with the Ontario curriculum",
      "Multiple choice and open response questions",
      "Practice in the online test format",
      "Confidence and timing on test day",
    ],
    approach: [
      "We follow the Ontario curriculum, so preparation supports what your child is learning in class.",
      "Written answers are practised with clear feedback on what earns marks.",
      "Practice mirrors the online format, so the real assessment feels familiar.",
    ],
    faqs: [
      {
        question: "What are EQAO assessments?",
        answer:
          "Provincial assessments in Ontario: reading, writing and math in Grades 3 and 6, and math in Grade 9. They show how students are doing against the Ontario curriculum.",
      },
      {
        question: "What is the OSSLT and why does it matter?",
        answer:
          "The Ontario Secondary School Literacy Test, usually taken in Grade 10, checks reading and writing. Passing it, or the alternative literacy course, is a requirement for the Ontario Secondary School Diploma.",
      },
      {
        question: "My child is new to Canada. Can you help?",
        answer:
          "Yes. Many of our families are newcomers. We find the gaps between your child's previous schooling and the Ontario curriculum and close them quickly.",
      },
    ],
  }),
  exam({
    slug: "alberta-pats-diplomas",
    name: "Alberta PATs & Diploma exams",
    linkLabel: "Alberta PAT and Diploma exam tutoring",
    currency: "CAD",
    title: "Alberta PAT and Diploma Exam Tutoring Online",
    description:
      "One to one online tutoring for Alberta's Provincial Achievement Tests and Grade 12 Diploma exams, with vetted Nigerian teachers. Math, English and sciences.",
    h1: "Online tutoring for Alberta PATs and Diploma exams",
    intro:
      "One to one lessons for Alberta's provincial assessments, with a vetted Nigerian teacher who follows the Alberta Programs of Study. From Provincial Achievement Tests in Grades 6 and 9 to Grade 12 Diploma exams, we secure the course content and practise the exam format.",
    whoFor: [
      "Alberta students in Grades 6 and 9 preparing for PATs",
      "Grade 12 students preparing for Diploma exams",
      "Students who need strong Diploma results for university admission",
      "Students who moved to Alberta and need to adjust to the curriculum",
    ],
    coversTitle: "What preparation covers",
    covers: [
      "Math, including Math 30 courses",
      "English language arts, including English 30",
      "Science, Biology 30, Chemistry 30 and Physics 30",
      "Written response and essay questions",
      "Released exam questions and practice exams",
      "Revision planning before each exam session",
    ],
    approach: [
      "We follow the Alberta Programs of Study, so lessons match the course and the exam.",
      "Topics that carry the most marks are secured first.",
      "Practice with released questions shows your child exactly how the exams are written.",
    ],
    faqs: [
      {
        question: "How much do Diploma exams count?",
        answer:
          "Diploma exams make up 30 percent of the final mark in Grade 12 courses such as Math 30, English 30, Biology 30, Chemistry 30 and Physics 30. Those marks are often what universities look at.",
      },
      {
        question: "What are PATs?",
        answer:
          "Provincial Achievement Tests taken in Grades 6 and 9 in subjects including English, math and science. They show how students are doing against the Alberta curriculum.",
      },
      {
        question: "Can you help my child before a Diploma exam in a hurry?",
        answer:
          "Yes. A focused plan in the weeks before the exam can make a real difference. More time is better, but we work with the time you have.",
      },
    ],
  }),

  // ----- International -------------------------------------------------------
  exam({
    slug: "ib",
    name: "IB",
    linkLabel: "IB tutoring",
    currency: "USD",
    title: "Online IB Tutoring: Diploma, MYP and PYP",
    description:
      "One to one online IB tutoring with vetted Nigerian teachers. Diploma Programme HL and SL subjects, internal assessments and the Middle Years Programme.",
    h1: "Online IB tutoring for the Diploma and Middle Years",
    intro:
      "One to one lessons for International Baccalaureate students, with a vetted Nigerian teacher who knows the IB subject guides and assessment criteria. We keep your child on top of a demanding programme and prepare them for internal assessments and final exams.",
    whoFor: [
      "Students in the IB Diploma Programme, at higher or standard level",
      "Students in the Middle Years Programme",
      "Students juggling coursework, internal assessments and exams",
      "Students at international schools anywhere in the world",
    ],
    coversTitle: "What IB preparation covers",
    covers: [
      "Maths: Analysis and Approaches, and Applications and Interpretation",
      "Biology, chemistry and physics",
      "English, economics, French and Spanish",
      "Internal assessments: planning, structure and feedback",
      "Past papers marked against IB criteria",
      "Time management across the two year Diploma",
    ],
    approach: [
      "We follow the IB subject guide and assessment criteria for each course.",
      "Internal assessments get structured support on planning and drafts, within IB rules.",
      "Exam practice uses past papers and markschemes, so your child learns how IB examiners think.",
    ],
    faqs: [
      {
        question: "How is the IB Diploma scored?",
        answer:
          "Students take six subjects, usually three at higher level and three at standard level, each graded 1 to 7. Theory of Knowledge and the Extended Essay add up to 3 more points, for a maximum of 45.",
      },
      {
        question: "Do you help with internal assessments?",
        answer:
          "Yes. Teachers help with choosing a focus, planning and structure, and give feedback on drafts, within the IB's rules on authenticity.",
      },
      {
        question: "Do you teach the Middle Years and Primary Years Programmes?",
        answer:
          "Yes. We support MYP students in maths, sciences and English, and PYP children through our primary subjects, in line with their school's programme.",
      },
    ],
  }),
];
