/**
 * Copy for the search landing pages: one per subject (/tutoring/[slug]) and
 * one per country we serve (/online-tutoring/[slug]).
 *
 * Written for the parent who searches, or asks an AI assistant, something like
 * "Nigerian maths tutor for my son in London". Every claim here must be one we
 * already make elsewhere on the site (vetting, reports, recordings, pricing,
 * pause and teacher-change terms) or general knowledge about the exam or
 * curriculum. No invented statistics.
 *
 * House style: no dashes in customer-facing copy.
 */

export type Faq = { question: string; answer: string };

export type SubjectPage = {
  slug: string;
  /** Short name used in breadcrumbs and headings. */
  name: string;
  /** How other pages link to this one. */
  linkLabel: string;
  /** <title> without the " | Masani" suffix. */
  title: string;
  description: string;
  h1: string;
  intro: string;
  whoFor: string[];
  coversTitle: string;
  covers: string[];
  approach: string[];
  faqs: Faq[];
  /** Currency for prices on the page. Defaults to USD; UK-only exams use GBP. */
  currency?: "GBP" | "USD" | "CAD";
};

export type CountryPage = {
  slug: string;
  country: string;
  /** schema.org areaServed. */
  areaServed: string;
  currency: "GBP" | "USD" | "CAD";
  title: string;
  description: string;
  h1: string;
  intro: string;
  curriculumTitle: string;
  curriculum: string[];
  whyTitle: string;
  why: string[];
  /** Which testimonials to show, matched against their `where`. */
  testimonialMatch: RegExp;
  faqs: Faq[];
};

// -----------------------------------------------------------------------------
// Shared across every landing page
// -----------------------------------------------------------------------------

export const everyFamilyGets = [
  {
    title: "A teacher from the top 3%",
    body: "We accept around three in every hundred teachers who apply, then match one to your child. You never have to browse profiles.",
  },
  {
    title: "A written report after every lesson",
    body: "What was covered, how your child did, and what comes next, in your inbox and parent portal after each session.",
  },
  {
    title: "Every lesson recorded",
    body: "Your child can rewatch any class before a test, and you can see exactly how lessons are taught.",
  },
  {
    title: "Progress tracked skill by skill",
    body: "The online parent portal shows how each skill is moving over time, not just a mark at the end of term.",
  },
  {
    title: "Lessons in your time zone",
    body: "Sessions run across UK, US, Canada and Australia hours, and every time shows in your own local time.",
  },
  {
    title: "Flexible terms",
    body: "Pause or cancel with 48 hours' notice, and change teacher at no extra cost if the fit is not right.",
  },
];

export const howItWorks = [
  {
    title: "Book a free session",
    body: "Fifteen minutes with one of our education experts about your child, at a time that suits you.",
  },
  {
    title: "Get a personalised plan",
    body: "Within 24 hours we send a written plan: your child's strengths, the gaps worth closing first, and what to do about each.",
  },
  {
    title: "Meet the right teacher",
    body: "If Masani fits, we match your child with a teacher chosen for their subject, level and personality.",
  },
  {
    title: "Learn and track progress",
    body: "One to one online lessons, a report after each one, and progress you can see in the parent portal.",
  },
];

// -----------------------------------------------------------------------------
// Subjects
// -----------------------------------------------------------------------------

export const subjectPages: SubjectPage[] = [
  {
    slug: "maths",
    name: "Maths",
    linkLabel: "Maths tutoring",
    title: "Online Maths Tutor for Nigerian Families Abroad",
    description:
      "One to one online maths tutoring with vetted Nigerian teachers. Primary to secondary, UK, US, Nigerian and international curricula. Book a free session.",
    h1: "Online maths tutoring that builds real confidence",
    intro:
      "Private, one to one maths lessons with a carefully vetted Nigerian teacher who follows your child's school curriculum, wherever your family lives. We fill the gaps first, then build the fluency and confidence that make maths feel possible again.",
    whoFor: [
      "Children who have fallen behind or lost confidence in maths",
      "Students who work hard but do not see the results",
      "Strong students ready to be stretched beyond the classroom",
      "Children preparing for SATs, 11+, GCSE, state tests or a change of school",
    ],
    coversTitle: "What we cover",
    covers: [
      "Number, place value and times tables",
      "Fractions, decimals, percentages and ratio",
      "Algebra, from first equations to quadratics",
      "Geometry, measurement and trigonometry",
      "Statistics, probability and data handling",
      "Problem solving and exam technique",
    ],
    approach: [
      "We start by finding exactly where the gaps are, because most maths struggles trace back to one or two missed foundations.",
      "Your child explains their thinking out loud, so the teacher fixes misunderstandings instead of just marking answers.",
      "Practice is set at the level just above comfortable, which is where confidence and progress both grow.",
    ],
    faqs: [
      {
        question: "Which maths curriculum does the tutor follow?",
        answer:
          "Your child's own. Our teachers work across the UK National Curriculum, US Common Core and state standards, Canadian provincial curricula, the Nigerian curriculum and international programmes, from primary through secondary school.",
      },
      {
        question: "My child is anxious about maths. Can one to one lessons help?",
        answer:
          "Yes, and it is one of the most common reasons parents come to us. With one teacher and no classmates watching, children ask the questions they would never ask in class. We rebuild the basics first so early wins come quickly.",
      },
      {
        question: "How often should my child have maths lessons?",
        answer:
          "Most families choose two sessions a week. Our packages of 8, 24 and 48 sessions are designed around that pace, and we will suggest what fits your child in the free planning session.",
      },
      {
        question: "Can you help with maths exams?",
        answer:
          "Yes. We prepare children for exams including the UK Key Stage 2 SATs, 11+ entrance exams and GCSE, and US state tests, the SAT and the ACT, using past papers and targeted practice.",
      },
    ],
  },
  {
    slug: "english",
    name: "English",
    linkLabel: "English tutoring",
    title: "Online English Tutor for Nigerian Families Abroad",
    description:
      "One to one online English tutoring: reading, writing, grammar and comprehension with vetted Nigerian teachers. UK, US and international curricula.",
    h1: "Online English tutoring for confident readers and writers",
    intro:
      "Private English lessons with a vetted Nigerian teacher, built around your child's school curriculum and the skills they need most: reading with understanding, writing with structure, and speaking with confidence.",
    whoFor: [
      "Children who read slowly or struggle to understand what they read",
      "Students whose ideas are good but whose writing does not show it",
      "Children preparing for English exams or entrance tests",
      "Confident readers ready for more challenging books and analysis",
    ],
    coversTitle: "What we cover",
    covers: [
      "Phonics, fluency and reading comprehension",
      "Grammar, punctuation and spelling",
      "Vocabulary and word knowledge",
      "Narrative, persuasive and descriptive writing",
      "Essay structure and literary analysis",
      "Exam technique for English papers",
    ],
    approach: [
      "Lessons balance reading and writing, because each makes the other stronger.",
      "Your child gets specific feedback on their own writing, line by line, not generic comments.",
      "Books and texts are chosen for your child's level and interests, so reading becomes something they want to do.",
    ],
    faqs: [
      {
        question: "Is English tutoring useful if my child speaks English fluently?",
        answer:
          "Very often, yes. Fluent speakers can still find written English hard: structuring an essay, analysing a text or writing under exam conditions. Those skills are taught, and one to one lessons teach them quickly.",
      },
      {
        question: "Which English curriculum do you follow?",
        answer:
          "Your child's. Our teachers work with the UK National Curriculum, US Common Core, Canadian provincial curricula, the Nigerian curriculum and international programmes.",
      },
      {
        question: "Can you prepare my child for English exams?",
        answer:
          "Yes, including the UK Key Stage 2 SATs, 11+ English papers and GCSE English, and US reading and writing assessments, including the SAT and ACT.",
      },
      {
        question: "How will I know my child is improving?",
        answer:
          "You get a written report after every lesson, every class is recorded, and the parent portal tracks each skill over time, so you can see progress in reading and writing separately.",
      },
    ],
  },
  {
    slug: "science",
    name: "Science",
    linkLabel: "Science tutoring",
    title: "Online Science Tutor: Biology, Chemistry and Physics",
    description:
      "One to one online science tutoring with vetted Nigerian teachers. Biology, chemistry and physics from primary to secondary school, following your child's curriculum.",
    h1: "Online science tutoring that makes sense of the world",
    intro:
      "One to one science lessons with a vetted Nigerian teacher, covering biology, chemistry and physics at your child's level and in line with their school curriculum. We focus on understanding the ideas, not memorising facts the night before a test.",
    whoFor: [
      "Children who find science confusing or hard to remember",
      "Students moving from general science to separate sciences",
      "Children preparing for science exams and tests",
      "Curious students who want to go further than the syllabus",
    ],
    coversTitle: "What we cover",
    covers: [
      "Biology: cells, the human body, ecosystems and genetics",
      "Chemistry: atoms, reactions, the periodic table and equations",
      "Physics: forces, energy, electricity and waves",
      "Scientific method, experiments and data",
      "Maths skills for science",
      "Exam technique and extended answers",
    ],
    approach: [
      "Ideas are explained with everyday examples before the technical terms, so they stick.",
      "Your child practises explaining concepts back, which is exactly what exam questions ask for.",
      "We connect topics across biology, chemistry and physics so science feels like one subject, not a list of facts.",
    ],
    faqs: [
      {
        question: "Do you teach biology, chemistry and physics separately?",
        answer:
          "Yes. We teach combined science for younger students and separate sciences for older ones, matched to what your child's school follows.",
      },
      {
        question: "Can online lessons work for a practical subject like science?",
        answer:
          "Yes. Most of what is tested is understanding, explanation and working with data, which online lessons handle well. Teachers use diagrams, simulations and household examples to make ideas concrete.",
      },
      {
        question: "Which curricula do your science teachers cover?",
        answer:
          "The UK National Curriculum, US state standards, Canadian provincial curricula, the Nigerian curriculum and international programmes, from primary through secondary school.",
      },
    ],
  },
  {
    slug: "11-plus",
    name: "11+ Prep",
    linkLabel: "11+ preparation",
    currency: "GBP",
    title: "11+ Tutoring Online for Grammar and Independent Schools",
    description:
      "One to one online 11+ tutoring with vetted Nigerian teachers: maths, English, verbal and non verbal reasoning. Personalised plan and past paper practice.",
    h1: "Online 11+ tutoring, planned around your child",
    intro:
      "Structured, one to one preparation for the 11+ entrance exams used by grammar schools and many independent schools in the UK. We find your child's weakest areas early, build a plan to the exam date, and practise under real exam conditions.",
    whoFor: [
      "Children in Years 4 to 6 aiming for grammar or independent schools",
      "Families who want a clear plan to the exam date",
      "Children who know the content but struggle with speed or exam nerves",
    ],
    coversTitle: "What 11+ preparation covers",
    covers: [
      "Maths, including multi step problem solving",
      "English comprehension, vocabulary and creative writing",
      "Verbal reasoning question types",
      "Non verbal reasoning and spatial skills",
      "Timed practice and full mock papers",
      "Exam technique and managing nerves",
    ],
    approach: [
      "We begin with an assessment and a written plan that works back from your child's exam date.",
      "Each question type is taught as a method first, then practised until it becomes quick and automatic.",
      "Timed papers are added gradually so speed builds without panic.",
    ],
    faqs: [
      {
        question: "When should my child start 11+ preparation?",
        answer:
          "Many families start in Year 4 or early Year 5, about 12 to 18 months before the exam, which leaves time to build skills without cramming. Starting later can still work with a focused plan.",
      },
      {
        question: "Do you cover both GL and CEM style exams?",
        answer:
          "We prepare children for the question types used across the major 11+ formats, including verbal and non verbal reasoning, and tailor practice to the schools you are applying to.",
      },
      {
        question: "Can you prepare my child for 11+ if we are moving to the UK?",
        answer:
          "Yes. Many of our families are relocating or planning a move. We teach online, so preparation can start before you arrive and continue without a break.",
      },
    ],
  },
  {
    slug: "sat-act",
    name: "SAT & ACT Prep",
    linkLabel: "SAT and ACT prep",
    title: "SAT and ACT Prep Online: One to One Tutoring",
    description:
      "One to one online SAT and ACT preparation with vetted teachers. Maths, reading and writing, practice tests and a personalised study plan.",
    h1: "Online SAT and ACT preparation, one to one",
    intro:
      "Focused, one to one preparation for the SAT and ACT college admissions tests. We diagnose where your child is losing points, then target those areas with teaching, practice and full timed tests.",
    whoFor: [
      "High school students applying to US colleges",
      "Students aiming to raise an existing score",
      "Students choosing between the SAT and the ACT",
    ],
    coversTitle: "What we cover",
    covers: [
      "SAT Math and ACT Math, including algebra and data analysis",
      "SAT Reading and Writing and ACT English and Reading",
      "ACT Science reasoning",
      "Strategy for each question type",
      "Pacing and full length timed practice tests",
      "A study plan to your test date",
    ],
    approach: [
      "A diagnostic practice test shows exactly where points are being lost.",
      "Lessons target the highest value gaps first, so score gains come early.",
      "Regular timed tests track progress and build stamina for test day.",
    ],
    faqs: [
      {
        question: "Should my child take the SAT or the ACT?",
        answer:
          "Most US colleges accept either. A diagnostic test in each often shows a clear preference, and we will recommend one based on your child's results and target schools.",
      },
      {
        question: "How long does SAT or ACT preparation take?",
        answer:
          "Most students benefit from two to four months of regular sessions before their test date. Our 24 and 48 session packages fit that timeline at two sessions a week.",
      },
      {
        question: "Can students outside the US prepare with you?",
        answer:
          "Yes. Lessons are online and scheduled in your local time, so students in the UK, Canada, Nigeria and elsewhere can prepare for US admissions tests with us.",
      },
    ],
  },
  {
    slug: "reading-and-creative-writing",
    name: "Reading & Creative Writing",
    linkLabel: "Reading and creative writing",
    title: "Online Reading and Creative Writing Tutor for Children",
    description:
      "One to one online reading and creative writing lessons for children. Build a love of books, stronger vocabulary and confident, imaginative writing.",
    h1: "Online reading and creative writing lessons",
    intro:
      "One to one lessons that help children read more, understand more and write with imagination and control. Ideal for younger readers building fluency and older children who want their stories and essays to stand out.",
    whoFor: [
      "Reluctant readers who need the right books and encouragement",
      "Children with good ideas who struggle to get them onto the page",
      "Keen writers ready for feedback and a bigger challenge",
      "Children preparing for creative writing in 11+ and school exams",
    ],
    coversTitle: "What we cover",
    covers: [
      "Reading fluency and comprehension",
      "Vocabulary building",
      "Story planning, structure and pace",
      "Character, setting and description",
      "Editing and improving a draft",
      "Writing for exams and competitions",
    ],
    approach: [
      "Reading is chosen for your child's level and interests, so it feels like a pleasure, not homework.",
      "Children write in every lesson and get specific, encouraging feedback on their own work.",
      "Drafts are improved step by step, which teaches the editing habits strong writers rely on.",
    ],
    faqs: [
      {
        question: "What age are reading and creative writing lessons for?",
        answer:
          "Primary and early secondary school children. Lessons are pitched at your child's level, from building reading fluency to polishing advanced stories and essays.",
      },
      {
        question: "Will this help with school English results?",
        answer:
          "Yes. Reading comprehension and extended writing appear throughout school English assessments and entrance exams, including the 11+.",
      },
    ],
  },
  {
    slug: "public-speaking",
    name: "Public Speaking",
    linkLabel: "Public speaking lessons",
    title: "Public Speaking Lessons Online for Children and Teens",
    description:
      "One to one online public speaking lessons for children and teenagers. Build confidence, structure and presence for class, interviews and competitions.",
    h1: "Online public speaking lessons for confident children",
    intro:
      "One to one coaching that helps children and teenagers speak clearly and confidently, whether that is answering in class, presenting a project, interviewing for a school place or competing in debate.",
    whoFor: [
      "Quiet children who know the answer but do not speak up",
      "Students preparing for presentations or school interviews",
      "Teenagers interested in debate and competitions",
    ],
    coversTitle: "What we cover",
    covers: [
      "Structuring a talk with a clear beginning, middle and end",
      "Voice, pace and body language",
      "Managing nerves",
      "Persuasive speaking and debate",
      "Interview practice",
      "Thinking on your feet",
    ],
    approach: [
      "Every lesson includes speaking practice, with gentle and specific feedback.",
      "Recorded lessons let your child watch themselves improve over time.",
      "Skills are practised with topics your child cares about, which makes confidence grow faster.",
    ],
    faqs: [
      {
        question: "Can public speaking really be taught online?",
        answer:
          "Yes. Presenting on camera is a real skill in itself, and one to one online lessons give your child a patient audience, focused feedback and recordings to learn from.",
      },
      {
        question: "Can you help prepare for school interviews?",
        answer:
          "Yes. We run practice interviews with feedback on answers, structure and confidence, for school and scholarship interviews.",
      },
    ],
  },
];

// -----------------------------------------------------------------------------
// Countries
// -----------------------------------------------------------------------------

export const countryPages: CountryPage[] = [
  {
    slug: "uk",
    country: "the UK",
    areaServed: "United Kingdom",
    currency: "GBP",
    title: "Online Tutoring for Nigerian Families in the UK",
    description:
      "One to one online tutoring for children of Nigerian families in the UK. Vetted Nigerian teachers, UK National Curriculum, SATs, 11+ and GCSE. From £9.63 a session.",
    h1: "Online tutoring for Nigerian families in the UK",
    intro:
      "Masani gives children of Nigerian families across England, Scotland, Wales and Northern Ireland private, one to one lessons with carefully vetted Nigerian teachers who know the UK curriculum. Lessons fit around the school day in UK time, and you see every step of your child's progress.",
    curriculumTitle: "Following the UK curriculum",
    curriculum: [
      "Key Stages 1 to 4, from primary through secondary school",
      "Key Stage 2 SATs preparation",
      "11+ entrance exams for grammar and independent schools",
      "GCSE maths, English and sciences",
    ],
    whyTitle: "Why UK families choose Masani",
    why: [
      "Teachers who share your family's heritage and values, and hold high expectations for your child",
      "Lessons after school, in the evening and at weekends, all in UK time",
      "Clear pricing in pounds, from £88 for 8 sessions",
      "A written report after every lesson, so you always know what was covered",
    ],
    testimonialMatch: /UK|United Kingdom|Scotland/i,
    faqs: [
      {
        question: "Are your tutors familiar with the UK school system?",
        answer:
          "Yes. Our teachers work with the UK National Curriculum from Key Stage 1 to GCSE, including SATs and 11+ preparation, and we match your child with a teacher experienced in their year group and subjects.",
      },
      {
        question: "How much does online tutoring cost in the UK with Masani?",
        answer:
          "Packages start at £88 for 8 one to one sessions (£11 a session). Larger packages bring the price down to £10.08 a session for 24 sessions and £9.63 for 48, with free sessions included.",
      },
      {
        question: "What times are lessons available in the UK?",
        answer:
          "We run lessons across UK hours, including after school, evenings and weekends. Every booking shows in your own local time.",
      },
      {
        question: "Why choose a Nigerian tutor for my child in the UK?",
        answer:
          "Many parents want a teacher who understands their family's culture and expectations as well as the UK curriculum. Our teachers are selected from the top 3% of applicants and bring both.",
      },
    ],
  },
  {
    slug: "usa",
    country: "the US",
    areaServed: "United States",
    currency: "USD",
    title: "Online Tutoring for Nigerian Families in the USA",
    description:
      "One to one online tutoring for children of Nigerian families in the US. Vetted Nigerian teachers, Common Core, state tests, SAT and ACT prep. From $13.13 a session.",
    h1: "Online tutoring for Nigerian families in the US",
    intro:
      "Masani gives children of Nigerian families across the United States private, one to one lessons with carefully vetted Nigerian teachers who know American school standards. Lessons are scheduled in your own time zone, from the East Coast to the West Coast.",
    curriculumTitle: "Following US school standards",
    curriculum: [
      "Elementary, middle and high school",
      "Common Core and state standards in math and English language arts",
      "State test preparation",
      "SAT and ACT college admissions tests",
      "Science from elementary to high school",
    ],
    whyTitle: "Why US families choose Masani",
    why: [
      "Teachers who share your family's heritage and values, and hold high expectations for your child",
      "Lessons scheduled in Eastern, Central, Mountain or Pacific time",
      "Clear pricing in dollars, from $120 for 8 sessions",
      "A written report after every lesson, so you always know what was covered",
    ],
    testimonialMatch: /United States|US\b/i,
    faqs: [
      {
        question: "Do your tutors know the American curriculum?",
        answer:
          "Yes. Our teachers work with Common Core and state standards from elementary through high school, and prepare students for the SAT and ACT.",
      },
      {
        question: "How much does online tutoring cost in the US with Masani?",
        answer:
          "Packages start at $120 for 8 one to one sessions ($15 a session). Larger packages bring the price down to $13.75 a session for 24 sessions and $13.13 for 48, with free sessions included.",
      },
      {
        question: "Can you schedule lessons in my US time zone?",
        answer:
          "Yes. We hold sessions across US hours, and every booking shows in your own local time, whether you are in New York, Houston, Chicago or Los Angeles.",
      },
      {
        question: "Why choose a Nigerian tutor for my child in the US?",
        answer:
          "Many parents want a teacher who understands their family's culture and expectations as well as the American curriculum. Our teachers are selected from the top 3% of applicants and bring both.",
      },
    ],
  },
  {
    slug: "canada",
    country: "Canada",
    areaServed: "Canada",
    currency: "CAD",
    title: "Online Tutoring for Nigerian Families in Canada",
    description:
      "One to one online tutoring for children of Nigerian families in Canada. Vetted Nigerian teachers following your province's curriculum. From C$18.38 a session.",
    h1: "Online tutoring for Nigerian families in Canada",
    intro:
      "Masani gives children of Nigerian families across Canada private, one to one lessons with carefully vetted Nigerian teachers who follow your province's curriculum. Lessons fit around the school day in your own time zone.",
    curriculumTitle: "Following your province's curriculum",
    curriculum: [
      "Elementary and secondary school, grade by grade",
      "Provincial curricula, including Ontario, Alberta and British Columbia",
      "Math, English and science",
      "Preparation for provincial assessments",
      "SAT and ACT for students applying to US colleges",
    ],
    whyTitle: "Why Canadian families choose Masani",
    why: [
      "Teachers who share your family's heritage and values, and hold high expectations for your child",
      "Lessons scheduled in your time zone, from Atlantic to Pacific",
      "Clear pricing in Canadian dollars, from C$168 for 8 sessions",
      "A written report after every lesson, so you always know what was covered",
    ],
    testimonialMatch: /Canada/i,
    faqs: [
      {
        question: "Do your tutors follow Canadian provincial curricula?",
        answer:
          "Yes. We match your child with a teacher who works with your province's curriculum and your child's grade, in math, English and science.",
      },
      {
        question: "How much does online tutoring cost in Canada with Masani?",
        answer:
          "Packages start at C$168 for 8 one to one sessions (C$21 a session). Larger packages bring the price down to C$19.25 a session for 24 sessions and C$18.38 for 48, with free sessions included.",
      },
      {
        question: "Can lessons be scheduled in my Canadian time zone?",
        answer:
          "Yes. Every booking shows in your own local time, so lessons fit around the school day wherever you are in Canada.",
      },
    ],
  },
];

export function subjectBySlug(slug: string): SubjectPage | undefined {
  return subjectPages.find((s) => s.slug === slug);
}

export function countryBySlug(slug: string): CountryPage | undefined {
  return countryPages.find((c) => c.slug === slug);
}
