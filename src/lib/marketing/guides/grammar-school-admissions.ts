import type { Guide } from "./types";

export const grammarSchoolAdmissionsGuide: Guide = {
  slug: "grammar-school-admissions-by-area",
  shortTitle: "Grammar school admissions by area",
  title: "How Grammar School Admissions Work, Area by Area",
  description:
    "Who sets the 11+ where you live, when registration closes, how catchment and pupil premium priority work, and what to do if your child is refused a grammar place.",
  h1: "How grammar school admissions work, area by area",
  intro:
    "If you sat Common Entrance for a unity school in Nigeria, you remember one exam, one timetable, one result. Grammar school entry in England is nothing like that. Each area runs its own test, on its own dates, with its own rules about who can apply. Two families living ten miles apart can face completely different systems. Here is how the pieces fit, and how to find the rules that apply to you.",
  published: "2026-11-01",
  sections: [
    {
      heading: "Grammar schools exist only in some places",
      blocks: [
        {
          type: "p",
          text: "England has about 163 state grammar schools, and they are not spread evenly. Most local authorities have none at all. A few have so many that almost every family with a Year 5 child has to think about the 11+.",
        },
        {
          type: "list",
          items: [
            "Kent has around 38 grammar schools, more than anywhere else.",
            "Lincolnshire has around 15 and Buckinghamshire around 13. In Buckinghamshire, children at state primary schools in the county are registered for the test automatically.",
            "Trafford, in Greater Manchester, has 7.",
            "Other areas have a handful. In London, grammar schools are found in boroughs such as Bexley, Sutton, Bromley, Kingston, Redbridge and Enfield. Birmingham has 8 grammar schools sharing one test, and Reading has selective schools too.",
          ],
        },
        {
          type: "p",
          text: "So the first question is not \"how good is my child?\" It is \"is there a grammar school we could realistically get to, and whose test does it use?\"",
        },
        {
          type: "note",
          title: "Northern Ireland",
          text: "Northern Ireland has its own system. Children hoping for a grammar place there can sit the SEAG Entrance Assessment in their final year of primary school. For children transferring in September 2027, registration closed on 18 September 2026 and the assessment takes place in November 2026. Check the SEAG website for current dates.",
        },
      ],
    },
    {
      heading: "Who sets the test, and why a pass only counts locally",
      blocks: [
        {
          type: "p",
          text: "There is no national 11+. The test can be run by the local council, by a group of schools working together (a consortium), or by a single school. Many areas buy their papers from GL Assessment, which writes the tests for Buckinghamshire, Redbridge, the Birmingham and West Midlands grammar schools and the Trafford Consortium. Even then, the papers are often made specially for that area. Trafford's consortium sits a bespoke paper that children elsewhere never see.",
        },
        {
          type: "p",
          text: "This has a practical consequence parents often miss. A pass in one area does not carry over to another. Buckinghamshire says plainly that qualifying in its test applies to Buckinghamshire grammar schools only. If you are considering schools in two areas, your child may need to sit two tests, registered separately, on different days.",
        },
        {
          type: "p",
          text: "Some areas also test in stages. In Sutton, children sit a first round called the Selective Eligibility Test in mid September, and those who do well go on to a second paper at the individual school later in the month or in early October.",
        },
      ],
    },
    {
      heading: "Eight areas side by side",
      blocks: [
        {
          type: "table",
          caption: "Arrangements for children starting secondary school in September 2027. Registration for this year has closed. Use it to see the pattern, then check your own area for 2028.",
          head: ["Area", "Who runs the test", "Registration window", "Test date", "Worth knowing"],
          rows: [
            ["Kent", "Kent County Council (the Kent Test)", "1 June to 1 July 2026", "10 September 2026 in Kent schools, 12 or 13 September for children at schools outside Kent", "Open to children living in England. Results on 15 October 2026."],
            ["Buckinghamshire", "Buckinghamshire Council, test by GL Assessment", "1 May to 2 June 2026", "8 and 10 September 2026", "Free. Children at Bucks state primaries are registered automatically. All testing happens in the UK."],
            ["Bexley", "London Borough of Bexley", "1 to 31 March 2026", "2 to 10 September 2026", "Registration closes in Year 5 spring, far earlier than most. No late entries. Results from 2 October 2026."],
            ["Sutton", "Sutton grammar schools, Selective Eligibility Test", "1 May to 31 July 2026", "15 September 2026, then a second stage at each school", "Covers schools including Nonsuch, Wallington High, Wallington County, Sutton Grammar and Wilson's."],
            ["Redbridge", "London Borough of Redbridge, test by GL Assessment", "1 May to 15 June 2026", "18 September 2026", "Your child must live inside the common catchment area. Results in mid October."],
            ["Birmingham", "King Edward VI Foundation, test by GL Assessment", "Closed 26 June 2026", "12 September 2026", "One test for 8 Birmingham grammars, shared across the West Midlands. Each school gives some priority to pupil premium children."],
            ["Trafford", "Trafford Consortium (5 of the 7 grammars), GL Assessment", "23 April to 19 June 2026", "14 September 2026", "You register with the grammar school directly, not the council."],
            ["Reading (Kendrick School)", "Kendrick School, marked by GL Assessment", "1 May to 1 July 2026", "18 September 2026", "No child living outside the designated area has been offered a place, whatever their score."],
          ],
        },
        {
          type: "p",
          text: "Look at the registration column. Bexley closed at the end of March. Buckinghamshire closed on 2 June. Sutton stayed open until the end of July. A family who assumes every area works like the one their friend used can miss a deadline by months. These dates change every year, so always check your local authority and each school's admissions page.",
        },
      ],
    },
    {
      heading: "The national dates that hold it together",
      blocks: [
        {
          type: "p",
          text: "Underneath all the local variety sit two national dates. Secondary school applications are due by 31 October of Year 6, and offers go out on 1 March. You apply through your own council, even when the school you want is in another council's area, and you list your schools in order of preference.",
        },
        {
          type: "p",
          text: "Most areas send 11+ results in October, before the deadline, so you know whether your child qualified before you rank your choices. Kent sent results on 15 October 2026, and because 31 October 2026 fell on a Saturday, its application deadline moved to 2 November. Small shifts like that are normal. Read your council's dates, not last year's.",
        },
      ],
    },
    {
      heading: "Passing is not the same as a place",
      blocks: [
        {
          type: "p",
          text: "Popular grammar schools have more qualifying children than places. When that happens, the school ranks applicants using its published oversubscription criteria. Children in care, or who have been in care, must come first at every state school. After that, schools can give priority for things like living close by, having a brother or sister at the school, or being eligible for the pupil premium.",
        },
        {
          type: "list",
          items: [
            "Catchment. Redbridge requires your child to live inside a mapped common catchment area. Kendrick in Reading says it has never offered a place to a child outside its designated area.",
            "Distance. Birmingham's grammar schools expect your home to be within a reasonable commuting distance, and may ask for proof if you plan to move.",
            "Pupil premium. Schools are allowed to give priority to children eligible for the pupil premium, and every Birmingham grammar school does in some form. If your child qualifies, ask how each school uses it.",
          ],
        },
        {
          type: "p",
          text: "If you are moving from Nigeria or elsewhere abroad, ask early. Kent's registration is open to children resident in England. Buckinghamshire says all of its testing happens in the UK and asks families abroad to tell the council when they will arrive. Get the answer in writing from the council or school, because the rules turn on where you live when you apply.",
        },
      ],
    },
    {
      heading: "If the answer is no",
      blocks: [
        {
          type: "p",
          text: "You can appeal against each refusal separately. The admission authority must give you at least 20 school days from the decision letter to lodge your appeal, and appeals must be heard within 40 school days of that deadline. An independent panel of three or more people hears the case and usually sends its decision within 5 school days.",
        },
        {
          type: "p",
          text: "Ask the school or council exactly what evidence they will accept, and send it before their deadline, because late evidence may not be considered. School reports, letters from teachers and proof of illness or disruption on test day say more than a parent's conviction. Keep copies of everything from the start.",
        },
      ],
    },
    {
      heading: "Where Masani fits",
      blocks: [
        {
          type: "p",
          text: "Once you know which test your child will sit, preparation gets much more focused. Masani offers one to one online 11+ preparation with carefully vetted Nigerian teachers, alongside English and Maths support. Lessons are recorded, every lesson ends with a written report, and the parent portal tracks progress skill by skill, so you can see exactly where your child stands before test day.",
        },
      ],
    },
  ],
  faqs: [
    {
      question: "Can my child sit the 11+ for grammar schools in more than one area?",
      answer:
        "Yes, but each area runs its own test with its own registration, and a pass in one area usually does not count in another. You need to register separately for each.",
    },
    {
      question: "Does passing the 11+ guarantee a grammar school place?",
      answer:
        "No. Passing shows your child met the standard. Places are then given using each school's oversubscription criteria, such as catchment, distance, pupil premium priority or score.",
    },
    {
      question: "When do I apply for a grammar school place?",
      answer:
        "Register for the test in Year 5, by your area's deadline, then name the school on your council's secondary application by 31 October of Year 6. Offers come on 1 March.",
    },
  ],
  sources: [
    { label: "House of Commons Library, Grammar schools in England (163 grammar schools)", url: "https://dera.ioe.ac.uk/34943/1/SN01398%20%28redacted%29.pdf" },
    { label: "Wikipedia, List of grammar schools in England (counts by area)", url: "https://en.wikipedia.org/wiki/List_of_grammar_schools_in_England" },
    { label: "GOV.UK, How to apply for a school place", url: "https://www.gov.uk/schools-admissions/how-to-apply" },
    { label: "GOV.UK, School admission criteria", url: "https://www.gov.uk/schools-admissions/admissions-criteria" },
    { label: "GOV.UK, Appealing a school's decision", url: "https://www.gov.uk/schools-admissions/appealing-a-schools-decision" },
    { label: "Kent County Council, Secondary admissions scheme 2027 to 2028", url: "https://democracy.kent.gov.uk/documents/s136050/26%2000015%20Appendix%20B%20-%20Proposed%20Secondary%20Admissions%20Scheme%202027-28.pdf" },
    { label: "Buckinghamshire Council, Secondary Transfer Test registration", url: "https://www.buckinghamshire.gov.uk/schools-libraries-and-parks/school-admissions-and-appeals/guides-and-policies/guide-to-grammar-schools-and-the-secondary-school-transfer-test-11-plus/registration/" },
    { label: "Buckinghamshire Council, Secondary Transfer Test dates", url: "https://www.buckinghamshire.gov.uk/schools-libraries-and-parks/school-admissions-and-appeals/guides-and-policies/guide-to-grammar-schools-and-the-secondary-school-transfer-test-11-plus/test-dates-for-secondary-transfer-test/" },
    { label: "London Borough of Bexley, Register for the secondary selection test", url: "https://www.bexley.gov.uk/services/schools-and-education/selection-tests/register-secondary-selection-test" },
    { label: "Sutton Grammar School, Selective Eligibility Test", url: "https://www.suttongrammar.sutton.sch.uk/admissions/selective-eligibility-test-examination/" },
    { label: "London Borough of Redbridge, Redbridge 11 plus", url: "https://www.redbridge.gov.uk/schools/school-admissions/redbridge-11-plus" },
    { label: "King Edward VI Foundation Birmingham, The test", url: "https://kingedwardvifoundation.co.uk/the-test/" },
    { label: "Trafford Council, Entrance test for grammar schools", url: "https://www.trafford.gov.uk/schools-and-learning/starting-school-and-admissions/starting-secondary-school/entrance-test-grammar-schools" },
    { label: "Sale Grammar School, September 2027 entry", url: "https://salegrammar.co.uk/6731/september-2027-entry" },
    { label: "Kendrick School, Admissions", url: "https://www.kendrick.reading.sch.uk/page/?pid=72" },
    { label: "SEAG, 2026 Entrance Assessment registration", url: "https://seagni.co.uk/latest-news/last-days-to-register-pupils-for-the-2026-seag-entrance-assessment" },
  ],
};
