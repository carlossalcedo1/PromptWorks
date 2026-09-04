// The two people behind Promptworks. Single source of truth: the footer
// contact block and the About page's founder split both read from here, so a
// changed link only has to be changed once.
export const PEOPLE = [
  {
    slug: "carlos-salcedo",
    name: "Carlos Salcedo",
    role: "Frontend, Systems & Platform Engineering",
    // 2–3 sentences. Kept short on purpose: this is a bio, not a résumé.
    bio: "Carlos builds the product end to end — the grader, the API and the site you are reading. He works out of Miami and Gainesville, where he is finishing a computer science degree at the University of Florida. Promptworks started as his answer to a question nobody at work could answer: did any of that AI training actually stick?",
    headshot: "/headshots/carlos-salcedo.jpg",
    email: "cmsal06@icloud.com",
    phone: "(305) 763-2541",
    phoneHref: "tel:+13057632541",
    location: "Miami, FL",
    github: "https://github.com/carlossalcedo1/",
    linkedin: "https://www.linkedin.com/in/carloscs1/",
    facebook: "https://www.facebook.com/marketplace/profile/100038115972128/",
  },
  {
    slug: "rj-cooke",
    name: "RJ Cooke",
    role: "Backend Architect",
    bio: "RJ owns the content side: the scenario library, the six-dimension rubric, and the hand-scored attempts every grader change is measured against. He is based in Orlando. If a score feels wrong to you, he is the one who wants to hear about it.",
    headshot: "/headshots/rj-cooke.jpg",
    // No public address yet — rendered as plain text, not a mailto link.
    emailPlaceholder: "rjuniorc6237@icloud.com",
    phone: "(321) 291-1637",
    phoneHref: "tel:+13212911637",
    location: "Orlando, FL",
    github: "https://github.com/RyanCooke1",
    // Blank until the page exists; the icon is omitted rather than linking nowhere.
    linkedin: "",
  },
];
