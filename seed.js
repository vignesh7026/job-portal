'use strict';
// Realistic demo jobs. Salaries are in LPA (lakhs per annum, INR).
const D = (n) => new Date(Date.now() - (n * 24 + 2 + (n * 7) % 9) * 3600000).toISOString();
const rows = [
  // title, company, location, mode, type, category, level, min, max, skills, daysAgo
  ['Frontend Developer Intern', 'Pixelforge', 'Bengaluru', 'onsite', 'internship', 'Engineering', 'intern', 3, 4.8, ['React', 'JavaScript', 'CSS', 'Git'], 1],
  ['Backend Developer (Node.js)', 'Cartly', 'Hyderabad', 'hybrid', 'full-time', 'Engineering', 'mid', 14, 22, ['Node.js', 'PostgreSQL', 'REST', 'Docker'], 2],
  ['Full Stack Engineer', 'Finlytics', 'Remote', 'remote', 'full-time', 'Engineering', 'mid', 18, 30, ['React', 'Node.js', 'TypeScript', 'AWS'], 3],
  ['Data Analyst', 'InsightHive', 'Pune', 'hybrid', 'full-time', 'Data', 'junior', 6, 10, ['SQL', 'Excel', 'Power BI', 'Python'], 4],
  ['Machine Learning Engineer', 'NeuralNest', 'Bengaluru', 'hybrid', 'full-time', 'Data', 'senior', 32, 50, ['Python', 'PyTorch', 'MLOps', 'SQL'], 5],
  ['UI/UX Designer', 'Studio Orbit', 'Mumbai', 'onsite', 'full-time', 'Design', 'junior', 5, 9, ['Figma', 'Prototyping', 'User Research'], 2],
  ['Product Designer', 'Lumen Labs', 'Remote', 'remote', 'full-time', 'Design', 'mid', 15, 26, ['Figma', 'Design Systems', 'UX'], 6],
  ['Digital Marketing Executive', 'GrowthLoop', 'Chennai', 'onsite', 'full-time', 'Marketing', 'junior', 3.5, 6, ['SEO', 'Google Ads', 'Analytics', 'Content'], 7],
  ['Content Writing Intern', 'WordWave', 'Remote', 'remote', 'internship', 'Marketing', 'intern', 1.2, 2.4, ['Writing', 'SEO', 'Research'], 1],
  ['Talent Acquisition Specialist', 'Jobs Territory', 'Coimbatore', 'onsite', 'full-time', 'HR', 'junior', 3.6, 6, ['Sourcing', 'Interviewing', 'ATS', 'Communication'], 1],
  ['HR Operations Intern (WFO)', 'Jobs Territory', 'Coimbatore', 'onsite', 'internship', 'HR', 'intern', 1.2, 2.4, ['Communication', 'Excel', 'Recruitment'], 0],
  ['Software Engineering Intern (WFO)', 'Jobs Territory', 'Coimbatore', 'onsite', 'internship', 'Engineering', 'intern', 1.8, 3, ['JavaScript', 'Node.js', 'SQL', 'Git'], 0],
  ['DevOps Engineer', 'CloudCrest', 'Gurugram', 'hybrid', 'full-time', 'Engineering', 'senior', 24, 40, ['AWS', 'Kubernetes', 'Terraform', 'CI/CD'], 8],
  ['QA Automation Engineer', 'TestBridge', 'Noida', 'hybrid', 'full-time', 'Engineering', 'mid', 10, 18, ['Selenium', 'Cypress', 'JavaScript', 'API Testing'], 9],
  ['Android Developer', 'Appvana', 'Bengaluru', 'onsite', 'full-time', 'Engineering', 'mid', 12, 22, ['Kotlin', 'Android', 'Jetpack Compose'], 10],
  ['iOS Developer', 'Appvana', 'Remote', 'remote', 'full-time', 'Engineering', 'mid', 14, 24, ['Swift', 'iOS', 'SwiftUI'], 11],
  ['Business Development Associate', 'SalesSpring', 'Delhi', 'onsite', 'full-time', 'Sales', 'junior', 4, 8, ['Communication', 'CRM', 'Negotiation'], 3],
  ['Inside Sales Representative', 'SalesSpring', 'Hyderabad', 'hybrid', 'full-time', 'Sales', 'junior', 4.5, 9, ['CRM', 'Cold Calling', 'English'], 5],
  ['Customer Support Specialist', 'HelpDeskly', 'Remote', 'remote', 'part-time', 'Support', 'junior', 2.4, 4, ['Communication', 'Zendesk', 'Empathy'], 4],
  ['Technical Support Engineer', 'HelpDeskly', 'Pune', 'hybrid', 'full-time', 'Support', 'junior', 5, 9, ['Troubleshooting', 'SQL', 'APIs', 'Linux'], 6],
  ['Financial Analyst', 'LedgerLine', 'Mumbai', 'onsite', 'full-time', 'Finance', 'mid', 9, 16, ['Excel', 'Financial Modeling', 'SQL'], 7],
  ['Accounts Executive', 'LedgerLine', 'Chennai', 'onsite', 'full-time', 'Finance', 'junior', 3, 5.5, ['Tally', 'GST', 'Excel'], 12],
  ['Product Manager', 'Shipfast', 'Bengaluru', 'hybrid', 'full-time', 'Product', 'senior', 28, 45, ['Roadmapping', 'Analytics', 'Stakeholder Management'], 2],
  ['Associate Product Manager', 'Shipfast', 'Bengaluru', 'hybrid', 'full-time', 'Product', 'junior', 10, 16, ['Analytics', 'SQL', 'Communication'], 8],
  ['Cybersecurity Analyst', 'SecureNet', 'Hyderabad', 'hybrid', 'full-time', 'Engineering', 'mid', 12, 20, ['SIEM', 'Networking', 'Incident Response'], 13],
  ['Python Developer', 'DataWeave', 'Remote', 'remote', 'contract', 'Engineering', 'mid', 12, 20, ['Python', 'Django', 'PostgreSQL', 'REST'], 5],
  ['Data Engineer', 'DataWeave', 'Bengaluru', 'hybrid', 'full-time', 'Data', 'mid', 18, 30, ['Python', 'Spark', 'Airflow', 'SQL'], 4],
  ['Graphic Designer (Freelance)', 'Studio Orbit', 'Remote', 'remote', 'contract', 'Design', 'junior', 3, 6, ['Photoshop', 'Illustrator', 'Branding'], 9],
  ['Operations Manager', 'Shipfast', 'Kolkata', 'onsite', 'full-time', 'Operations', 'senior', 15, 26, ['Operations', 'Leadership', 'Excel'], 14],
  ['Supply Chain Intern', 'Shipfast', 'Chennai', 'onsite', 'internship', 'Operations', 'intern', 1.5, 2.8, ['Excel', 'Logistics', 'Communication'], 3],
  ['React Native Developer', 'Appvana', 'Remote', 'remote', 'full-time', 'Engineering', 'mid', 14, 24, ['React Native', 'JavaScript', 'TypeScript'], 1],
  ['Social Media Manager', 'GrowthLoop', 'Mumbai', 'hybrid', 'full-time', 'Marketing', 'mid', 6, 11, ['Social Media', 'Content', 'Analytics'], 6],
  ['Recruitment Coordinator', 'Jobs Territory', 'Coimbatore', 'onsite', 'full-time', 'HR', 'junior', 3, 4.8, ['ATS', 'Scheduling', 'Communication'], 2],
  ['Java Backend Developer', 'BankStack', 'Chennai', 'onsite', 'full-time', 'Engineering', 'senior', 22, 36, ['Java', 'Spring Boot', 'Microservices', 'Kafka'], 7],
  ['Prompt Engineer / AI Intern', 'NeuralNest', 'Remote', 'remote', 'internship', 'Data', 'intern', 2, 4, ['Python', 'LLMs', 'Prompt Engineering'], 0],
];
const intro = {
  Engineering: 'You will design, build and ship reliable software used by thousands of people every day.',
  Data: 'You will turn raw data into decisions, models and dashboards that drive the business.',
  Design: 'You will shape intuitive, accessible experiences from first sketch to polished handoff.',
  Marketing: 'You will grow our audience and pipeline through measurable, creative campaigns.',
  HR: 'You will help us find, evaluate and welcome great people to the team.',
  Sales: 'You will build relationships, run discovery calls and close new business.',
  Support: 'You will be the friendly expert that helps customers succeed with our product.',
  Finance: 'You will keep numbers accurate and give leadership clear financial insight.',
  Product: 'You will own the "why" and "what", aligning users, design and engineering around outcomes.',
  Operations: 'You will keep processes running smoothly and find ways to make them faster.',
};
function seedJobs(db) {
  if (db.prepare('SELECT COUNT(*) c FROM jobs').get().c > 0) return;
  const ins = db.prepare(`INSERT INTO jobs(title,company,location,mode,type,category,level,salary_min,salary_max,
    description,responsibilities,requirements,skills,posted_at,deadline) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  for (const [title, company, location, mode, type, category, level, min, max, skills, days] of rows) {
    const desc = `${company} is hiring a ${title} ${location === 'Remote' ? 'to work fully remotely' : `based in ${location} (${mode})`}. ${intro[category]} ` +
      `This ${type} role is ideal for someone at ${level} level who enjoys working with ${skills.slice(0, 3).join(', ')}.`;
    const resp = [`Own day-to-day work related to ${skills[0]} and ${skills[1] || skills[0]}`,
      'Collaborate with cross-functional teammates and share progress openly',
      'Document your work and continuously improve processes', 'Participate in reviews, planning and retrospectives'];
    const reqs = [`Hands-on experience with ${skills.slice(0, 2).join(' and ')}`,
      level === 'intern' ? 'Currently pursuing or recently completed a relevant degree' : `Relevant ${level}-level experience`,
      'Strong written and verbal communication', 'Eagerness to learn and take ownership'];
    ins.run(title, company, location, mode, type, category, level, min, max, desc, JSON.stringify(resp),
      JSON.stringify(reqs), JSON.stringify(skills), D(days), new Date(Date.now() + 30 * 86400000).toISOString());
  }
}
module.exports = { seedJobs };

// Company profiles (illustrative demo data - ratings are not real reviews).
const C = (industry, size, hq, founded, rating, reviews, recommend, about, benefits) => ({ industry, size, hq, founded, rating, reviews, recommend, about, benefits });
const COMPANIES = {
  'Jobs Territory': C('HR Tech & Staffing', '51-200', 'Coimbatore', 2019, 4.4, 128, 91, 'Jobs Territory builds CRM and ATS tools and helps companies hire faster. Interns and freshers work directly with the product and recruiting teams.', ['Mentorship', 'Flexible learning budget', 'Performance bonus', 'Certificate and PPO track']),
  Pixelforge: C('Software', '201-500', 'Bengaluru', 2015, 4.1, 342, 82, 'Product studio building design-led web apps for fast-growing startups.', ['Health insurance', 'Learning budget', 'Free meals']),
  Cartly: C('E-commerce', '501-1000', 'Hyderabad', 2013, 3.9, 811, 74, 'Cartly powers online storefronts for 20,000+ small merchants across India.', ['Health insurance', 'ESOPs', 'Hybrid work']),
  Finlytics: C('Fintech', '201-500', 'Remote', 2018, 4.3, 207, 88, 'Remote-first analytics platform for lending and treasury teams.', ['Remote-first', 'ESOPs', 'Annual offsite']),
  InsightHive: C('Analytics', '51-200', 'Pune', 2017, 4.0, 96, 80, 'Business intelligence consultancy turning messy data into clear dashboards.', ['Flexible hours', 'Certification support']),
  NeuralNest: C('Artificial Intelligence', '51-200', 'Bengaluru', 2020, 4.5, 74, 93, 'Applied AI lab shipping language and vision models into production.', ['GPU credits', 'Research time', 'ESOPs']),
  'Studio Orbit': C('Design Agency', '11-50', 'Mumbai', 2016, 4.2, 58, 85, 'Brand and product design studio working with consumer startups.', ['Creative freedom', 'Flexible hours']),
  'Lumen Labs': C('Software', '51-200', 'Remote', 2019, 4.4, 113, 90, 'Design-system and developer tooling company, fully distributed.', ['Remote-first', 'Home office stipend']),
  GrowthLoop: C('Marketing', '51-200', 'Chennai', 2014, 3.8, 149, 72, 'Performance marketing agency for D2C and SaaS brands.', ['Performance bonus', 'Training']),
  WordWave: C('Media', '11-50', 'Remote', 2021, 4.0, 31, 84, 'Content studio producing long-form writing for tech brands.', ['Remote', 'Byline credit']),
  CloudCrest: C('Cloud Infrastructure', '501-1000', 'Gurugram', 2012, 4.0, 524, 78, 'Managed cloud and platform-engineering partner for enterprises.', ['Health insurance', 'Certification budget', 'Hybrid work']),
  TestBridge: C('Software Quality', '201-500', 'Noida', 2011, 3.7, 266, 70, 'Independent testing and QA automation services.', ['Health insurance', 'Training']),
  Appvana: C('Mobile Apps', '201-500', 'Bengaluru', 2016, 4.2, 301, 83, 'Builds consumer mobile apps with millions of installs.', ['Health insurance', 'ESOPs', 'Learning budget']),
  SalesSpring: C('Sales & SaaS', '201-500', 'Delhi', 2015, 3.9, 372, 73, 'Outbound sales and lead-generation partner for B2B SaaS companies.', ['Uncapped incentives', 'Fast promotions']),
  HelpDeskly: C('Customer Support', '501-1000', 'Pune', 2014, 3.8, 690, 71, 'Help-desk software and outsourced support for global brands.', ['Health insurance', 'Night allowance']),
  LedgerLine: C('Financial Services', '201-500', 'Mumbai', 2010, 4.0, 233, 79, 'Accounting and financial-planning services for mid-market firms.', ['Provident fund', 'Health insurance']),
  Shipfast: C('Logistics Tech', '1001-5000', 'Bengaluru', 2012, 4.1, 1204, 81, 'Last-mile logistics network delivering 2M parcels a day.', ['Health insurance', 'ESOPs', 'Meal cards']),
  SecureNet: C('Cybersecurity', '201-500', 'Hyderabad', 2016, 4.2, 187, 86, 'Managed detection and response for banks and enterprises.', ['Certification budget', 'Hybrid work']),
  DataWeave: C('Data Platforms', '201-500', 'Bengaluru', 2015, 4.3, 254, 87, 'Data-engineering firm building pipelines for retail and CPG.', ['Remote friendly', 'Learning budget', 'ESOPs']),
  BankStack: C('Banking Technology', '1001-5000', 'Chennai', 2008, 3.9, 958, 75, 'Core-banking software used by 40+ banks.', ['Provident fund', 'Health insurance', 'Stable growth']),
};
module.exports.COMPANIES = COMPANIES;

// Hiring-team contacts. Entirely fictional demo people; e-mail addresses use the reserved ".example" TLD so nothing can reach a real inbox.
const FIRST = ['Priya', 'Arjun', 'Meera', 'Karthik', 'Ananya', 'Rohit', 'Divya', 'Vikram', 'Sneha', 'Aditya', 'Nisha', 'Rahul', 'Kavya', 'Siddharth', 'Lakshmi', 'Varun', 'Isha', 'Naveen'];
const LAST = ['Raman', 'Iyer', 'Menon', 'Nair', 'Reddy', 'Sharma', 'Kapoor', 'Pillai', 'Verma', 'Bose', 'Gupta', 'Das', 'Rao', 'Chandran', 'Shah', 'Joshi', 'Mehta', 'Krishnan'];
const hashOf = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
function contactsFor(company) {
  const h = hashOf(company), slug = company.toLowerCase().replace(/[^a-z0-9]/g, ''), info = COMPANIES[company] || {};
  const small = ['11-50', '51-200', '201-500'].includes(info.size);
  const mk = (i, role, title) => {
    const first = FIRST[(h + i * 5) % FIRST.length], last = LAST[(h + i * 7 + 3) % LAST.length];
    return { id: `${slug}-${i}`, name: `${first} ${last}`, role, title, email: `${first}.${last}@${slug}.example`.toLowerCase(),
      linkedin: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`${first} ${last} ${company}`)}` };
  };
  return [mk(0, 'founder', small ? 'Founder & CEO' : 'Chief People Officer'), mk(1, 'recruiter', 'Talent Acquisition Lead'), mk(2, 'recruiter', 'Senior Recruiter')];
}
// The recruiter who "posted" a given job (alternates between the two recruiters).
const postedBy = (company, jobId) => contactsFor(company)[1 + (jobId % 2)];
module.exports.contactsFor = contactsFor;
module.exports.postedBy = postedBy;
