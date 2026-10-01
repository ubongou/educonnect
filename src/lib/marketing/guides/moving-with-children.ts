import type { Guide } from "./types";

export const movingWithChildrenGuide: Guide = {
  slug: "moving-from-nigeria-with-children-school-checklist",
  shortTitle: "Moving from Nigeria with children",
  title: "Moving to the UK or Canada from Nigeria with Children: School Checklist",
  description:
    "What to pack, when to apply and how your child will be placed in school when you relocate from Nigeria to the UK or Canada, plus how to keep learning on track during the move.",
  h1: "Moving to the UK or Canada from Nigeria with children: a school checklist",
  intro:
    "Relocation guides tell you about visas, flights and rent. Very few tell you what happens to your child's education in the months around the move, which is exactly where children lose ground. This is the checklist I give families, built from the official rules in both countries.",
  published: "2026-10-01",
  sections: [
    {
      heading: "Before you leave Nigeria: the school folder",
      blocks: [
        {
          type: "p",
          text: "Put these in one folder, with photocopies and scans, before you travel. Some are needed to register. The rest help your child's new teachers place and support them properly.",
        },
        {
          type: "list",
          items: [
            "Birth certificate and passport for each child.",
            "Your visa or immigration documents, and your child's.",
            "Immunisation records. In Ontario, proof of immunisation is required for school attendance, so ask your clinic for a complete written record before you go.",
            "The last two years of school reports, with the school's stamp.",
            "Any exam results, such as Common Entrance, BECE or WAEC.",
            "Notes on any additional learning needs, assessments or support your child has had.",
            "A short list of what your child was studying in each subject this term. New teachers find this more useful than grades.",
          ],
        },
      ],
    },
    {
      heading: "Moving to England: how school places work",
      blocks: [
        {
          type: "list",
          items: [
            "State schools are free. Children who are dependants of parents with work or student visas, or with settled status, can attend state funded schools.",
            "Children who are in the UK on a visitor visa cannot enrol in a state school, and children on child student visas must attend licensed independent schools.",
            "You apply through the local council where you will live. Mid year applications are called in year admissions.",
            "You can apply before you arrive. Councils should process an application from abroad when you show evidence that you are moving, such as a tenancy agreement or an employer's letter.",
            "Schools must not ask to see passports or immigration documents as a condition of admission. They can ask for proof of address and your child's date of birth.",
            "Your child is placed by date of birth. See our guide to the UK school system for how Nigerian classes line up with UK year groups.",
          ],
        },
        {
          type: "note",
          title: "A practical tip",
          text: "Popular schools fill quickly, especially in London and the big cities. Apply to several schools, and accept a reasonable offer while you wait for your first choice. Your child can stay on the waiting list.",
        },
      ],
    },
    {
      heading: "Moving to Canada: how school registration works",
      blocks: [
        {
          type: "p",
          text: "Education is run by each province, and you register directly with the local school board once you have an address. Using Ontario as the example:",
        },
        {
          type: "list",
          items: [
            "Grade is decided by year of birth, not by previous schooling, English level or birth month. A child born in 2018 goes into Grade 1 in the school year that starts in September 2024, for example.",
            "Boards ask for proof of age, such as a birth certificate or passport.",
            "They ask for proof of address. The Toronto District School Board asks for one document from a list such as a lease or property tax bill, plus one from a second list such as a utility bill or government letter.",
            "Proof of immunisation is required.",
            "If your child was not born in Canada, boards ask for proof of the date you arrived.",
          ],
        },
        {
          type: "p",
          text: "Because placement follows year of birth in Ontario, a child who was a year ahead in Nigeria may find themselves in a younger grade, and a child who was behind may skip ahead. Ask the school how they will check what your child already knows in maths and literacy in the first weeks.",
        },
      ],
    },
    {
      heading: "The gap months, and how to protect them",
      blocks: [
        {
          type: "p",
          text: "Between the last day at the old school and the first settled weeks at the new one, there are often two to four months where very little structured learning happens. Packing, travel, temporary housing, waiting for a place. Children rarely fall behind because they are moving. They fall behind because nobody is teaching them while it happens.",
        },
        {
          type: "list",
          items: [
            "Keep reading every day, whatever else is going on.",
            "Keep times tables and number facts fresh with ten minutes of daily practice.",
            "Start learning the new country's vocabulary and school terms before you arrive.",
            "Choose online lessons that can continue across the move, with the same teacher, in whichever time zone you are in.",
          ],
        },
        {
          type: "p",
          text: "Masani lessons are online and scheduled in your own time zone, so they can start in Nigeria and carry on the week you land, with the same teacher. Our teachers follow the UK, US, Canadian and Nigerian curricula, which makes them well placed to bridge the two.",
        },
      ],
    },
    {
      heading: "The first term: what to watch for",
      blocks: [
        {
          type: "list",
          items: [
            "Quietness. A child who was chatty at home and is silent at school may be struggling with accent, vocabulary or confidence.",
            "Homework avoidance. It often means the work feels unfamiliar, not that your child is lazy.",
            "Maths method clashes. Teachers may want a different written method from the one your child learned in Nigeria. Both are usually right.",
            "The first parents' evening. Ask directly: what can my child do, what can't they do yet, and what should we practise at home?",
          ],
        },
      ],
    },
  ],
  faqs: [
    {
      question: "Can I apply for a UK school place before we move?",
      answer:
        "Yes. In England, councils should process applications from families living abroad who show evidence of the move, such as a tenancy agreement or employer's letter.",
    },
    {
      question: "How is grade decided for a newcomer child in Ontario?",
      answer:
        "By year of birth. Ontario boards place children in the grade for their birth year, regardless of their previous schooling or English level.",
    },
  ],
  sources: [
    { label: "Department for Education, School applications for foreign national children and children resident outside England", url: "https://dera.ioe.ac.uk/id/eprint/39168/1/School%20applications%20for%20foreign%20national%20children%20and%20children%20resident%20outside%20England%20-%20GOV.pdf" },
    { label: "Toronto District School Board, Registration", url: "https://www.tdsb.on.ca/Find-your/School/Registration" },
    { label: "Waterloo Region District School Board, What grade will my child be in?", url: "https://www.wrdsb.ca/register/faq/what-grade-will-my-child-be-in/" },
  ],
};
