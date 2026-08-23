const neo4j = require('neo4j-driver');
const dotenv = require('dotenv');

dotenv.config();

const URI = process.env.COGNODB_URI || 'bolt+s://your-instance-id.databases.cognodb.cloud';
const USER = process.env.COGNODB_USER || 'cognodb';
const PASSWORD = process.env.COGNODB_PASSWORD || '';

if (!PASSWORD || PASSWORD === 'your_generated_password' || URI.includes('your-instance-id')) {
  console.error('❌ Cannot seed database: COGNODB_URI or COGNODB_PASSWORD not set in backend/.env');
  console.error('Please configure your CognoDB Cloud credentials first.');
  process.exit(1);
}

const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD), {
  disableLosslessIntegers: true,
});

async function seedDatabase() {
  const session = driver.session();
  console.log('🚀 Starting CognoDB Database Seeding for Wexa Graph Application...\n');

  try {
    // 1. Verify Connection
    console.log(`📡 Connecting to ${URI}...`);
    await driver.verifyConnectivity();
    console.log('✅ Connection verified.\n');

    // 2. Clear Existing Data
    console.log('🧹 Purging existing nodes and relationships (MATCH (n) DETACH DELETE n)...');
    await session.run('MATCH (n) DETACH DELETE n');
    console.log('✅ Graph cleared successfully.\n');

    // 3. Create Constraints / Indexes if supported
    console.log('⚙️ Creating uniqueness constraints for node IDs...');
    const constraintQueries = [
      'CREATE CONSTRAINT user_id_unique IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE',
      'CREATE CONSTRAINT skill_id_unique IF NOT EXISTS FOR (s:Skill) REQUIRE s.id IS UNIQUE',
      'CREATE CONSTRAINT company_id_unique IF NOT EXISTS FOR (c:Company) REQUIRE c.id IS UNIQUE',
      'CREATE CONSTRAINT job_id_unique IF NOT EXISTS FOR (j:Job) REQUIRE j.id IS UNIQUE',
    ];

    for (const cq of constraintQueries) {
      try {
        await session.run(cq);
      } catch (err) {
        // Some graph databases or specific sub-editions ignore or differ on constraint syntax, continue gracefully
        console.warn(`   Notice: Constraint creation skipped or already exists (${err.message})`);
      }
    }

    // 4. Create Skills
    console.log('📚 Inserting Skills...');
    const skillsQuery = `
      UNWIND $skills AS s
      CREATE (:Skill {
        id: s.id,
        name: s.name,
        category: s.category,
        popularity: s.popularity
      })
    `;
    const skillsData = [
      { id: 'sk_react', name: 'React', category: 'Frontend', popularity: 95 },
      { id: 'sk_typescript', name: 'TypeScript', category: 'Languages', popularity: 94 },
      { id: 'sk_nodejs', name: 'Node.js', category: 'Backend', popularity: 90 },
      { id: 'sk_neo4j', name: 'Neo4j / CognoDB', category: 'Data & Graph', popularity: 88 },
      { id: 'sk_graph_db', name: 'Graph Databases & Cypher', category: 'Data & Graph', popularity: 89 },
      { id: 'sk_python', name: 'Python', category: 'Languages', popularity: 98 },
      { id: 'sk_pytorch', name: 'PyTorch', category: 'AI & ML', popularity: 92 },
      { id: 'sk_langchain', name: 'LangChain & Agentic AI', category: 'AI & ML', popularity: 91 },
      { id: 'sk_llm', name: 'LLM Fine-Tuning & RAG', category: 'AI & ML', popularity: 93 },
      { id: 'sk_docker', name: 'Docker', category: 'Infra & Cloud', popularity: 89 },
      { id: 'sk_kubernetes', name: 'Kubernetes', category: 'Infra & Cloud', popularity: 87 },
      { id: 'sk_golang', name: 'Go', category: 'Languages', popularity: 85 },
      { id: 'sk_distributed', name: 'Distributed Systems', category: 'Architecture', popularity: 88 },
      { id: 'sk_postgresql', name: 'PostgreSQL', category: 'Databases', popularity: 91 },
      { id: 'sk_graphql', name: 'GraphQL', category: 'Backend', popularity: 84 },
      { id: 'sk_tailwindcss', name: 'Tailwind CSS', category: 'Frontend', popularity: 90 },
      { id: 'sk_kafka', name: 'Apache Kafka', category: 'Data Streaming', popularity: 86 },
      { id: 'sk_spark', name: 'Apache Spark', category: 'Data & Graph', popularity: 82 },
      { id: 'sk_vectordb', name: 'Vector Databases', category: 'AI & ML', popularity: 89 }
    ];
    await session.run(skillsQuery, { skills: skillsData });
    console.log(`   Inserted ${skillsData.length} Skill nodes.`);

    // 5. Create Companies
    console.log('🏢 Inserting Companies...');
    const companiesQuery = `
      UNWIND $companies AS c
      CREATE (:Company {
        id: c.id,
        name: c.name,
        industry: c.industry,
        size: c.size,
        location: c.location,
        website: c.website,
        tagline: c.tagline,
        logo: c.logo
      })
    `;
    const companiesData = [
      {
        id: 'comp_wexa',
        name: 'Wexa AI',
        industry: 'Autonomous AI & Agent Systems',
        size: '50-200 employees',
        location: 'San Francisco, CA (Hybrid)',
        website: 'https://wexa.ai',
        tagline: 'Pioneering next-generation graph-augmented AI agents',
        logo: '🤖'
      },
      {
        id: 'comp_nexus',
        name: 'Nexus Graph Systems',
        industry: 'Enterprise Knowledge Graphs',
        size: '200-500 employees',
        location: 'New York, NY (Remote)',
        website: 'https://nexusgraph.io',
        tagline: 'High-throughput graph compute engines for enterprise intelligence',
        logo: '🕸️'
      },
      {
        id: 'comp_hyperscale',
        name: 'HyperScale Cloud',
        industry: 'Cloud Infrastructure & Edge Computing',
        size: '1,000+ employees',
        location: 'Seattle, WA (Remote)',
        website: 'https://hyperscale.cloud',
        tagline: 'Global zero-latency distributed compute platform',
        logo: '⚡'
      },
      {
        id: 'comp_synthetix',
        name: 'Synthetix Bio',
        industry: 'AI-Driven Drug Discovery',
        size: '100-250 employees',
        location: 'Boston, MA (Hybrid)',
        website: 'https://synthetixbio.ai',
        tagline: 'Graph neural networks for molecular dynamics simulation',
        logo: '🧬'
      },
      {
        id: 'comp_finstream',
        name: 'FinStream Networks',
        industry: 'Real-time Financial Infrastructure',
        size: '500-1,000 employees',
        location: 'Austin, TX (Hybrid)',
        website: 'https://finstream.tech',
        tagline: 'Sub-millisecond graph fraud detection and payment settlement',
        logo: '💳'
      }
    ];
    await session.run(companiesQuery, { companies: companiesData });
    console.log(`   Inserted ${companiesData.length} Company nodes.`);

    // 6. Create Jobs
    console.log('💼 Inserting Jobs...');
    const jobsQuery = `
      UNWIND $jobs AS j
      CREATE (:Job {
        id: j.id,
        title: j.title,
        department: j.department,
        salaryRange: j.salaryRange,
        location: j.location,
        employmentType: j.employmentType,
        experienceLevel: j.experienceLevel,
        description: j.description
      })
    `;
    const jobsData = [
      {
        id: 'job_wexa_graph_ai',
        title: 'Senior Graph & AI Engineer',
        department: 'Core AI Systems',
        salaryRange: '$175,000 - $225,000',
        location: 'San Francisco / Remote',
        employmentType: 'Full-time',
        experienceLevel: 'Senior (4+ yrs)',
        description: 'Build knowledge graph pipelines and multi-hop inference engines for autonomous AI agents using Neo4j/CognoDB and Python.'
      },
      {
        id: 'job_wexa_fullstack',
        title: 'Staff Full-Stack Agent Platform Architect',
        department: 'Product Engineering',
        salaryRange: '$190,000 - $240,000',
        location: 'San Francisco / Remote',
        employmentType: 'Full-time',
        experienceLevel: 'Staff (6+ yrs)',
        description: 'Lead the architecture of our agent orchestration dashboard, building high-performance React frontends and Node.js graph services.'
      },
      {
        id: 'job_nexus_distrib',
        title: 'Principal Distributed Graph Engine Engineer',
        department: 'Storage & Engine',
        salaryRange: '$210,000 - $265,000',
        location: 'Remote (US/EU)',
        employmentType: 'Full-time',
        experienceLevel: 'Principal (7+ yrs)',
        description: 'Design distributed Raft consensus and index-free adjacency graph partitions in Go and C++ for ultra low-latency queries.'
      },
      {
        id: 'job_nexus_viz',
        title: 'Senior Frontend & Graph Visualization Engineer',
        department: 'Design & Visuals',
        salaryRange: '$160,000 - $205,000',
        location: 'New York, NY / Remote',
        employmentType: 'Full-time',
        experienceLevel: 'Senior (4+ yrs)',
        description: 'Create interactive WebGL and 2D canvas knowledge-graph visualizations, combining React, TypeScript, and Tailwind CSS.'
      },
      {
        id: 'job_hyperscale_k8s',
        title: 'Lead Cloud Infrastructure Architect',
        department: 'Infrastructure & Edge',
        salaryRange: '$195,000 - $245,000',
        location: 'Seattle, WA / Remote',
        employmentType: 'Full-time',
        experienceLevel: 'Lead (5+ yrs)',
        description: 'Architect multi-region Kubernetes clusters, automated Terraform infrastructure, and high-performance Docker environments.'
      },
      {
        id: 'job_synthetix_ml',
        title: 'Senior ML Systems Engineer (Graph Neural Networks)',
        department: 'Computational Biology',
        salaryRange: '$180,000 - $230,000',
        location: 'Boston, MA / Hybrid',
        employmentType: 'Full-time',
        experienceLevel: 'Senior (4+ yrs)',
        description: 'Train deep Graph Neural Networks with PyTorch, LangChain, and vector embeddings on biological molecular structures.'
      },
      {
        id: 'job_finstream_stream',
        title: 'High-Throughput Streaming & Graph Engineer',
        department: 'Risk & Fraud Engine',
        salaryRange: '$170,000 - $220,000',
        location: 'Austin, TX / Remote',
        employmentType: 'Full-time',
        experienceLevel: 'Senior (4+ yrs)',
        description: 'Develop sub-millisecond fraud pattern detection graph traversals over Kafka streaming data pipelines and PostgreSQL.'
      },
      {
        id: 'job_wexa_llm',
        title: 'AI Agent & LLM Applications Engineer',
        department: 'Applied Research',
        salaryRange: '$165,000 - $215,000',
        location: 'San Francisco, CA / Remote',
        employmentType: 'Full-time',
        experienceLevel: 'Mid-Senior (3+ yrs)',
        description: 'Implement autonomous agent reasoning loops, RAG architectures with Vector Databases and Neo4j, and LLM evaluation benchmarks.'
      }
    ];
    await session.run(jobsQuery, { jobs: jobsData });
    console.log(`   Inserted ${jobsData.length} Job nodes.`);

    // 7. Create Users (Candidates)
    console.log('👤 Inserting Users (Candidates)...');
    const usersQuery = `
      UNWIND $users AS u
      CREATE (:User {
        id: u.id,
        name: u.name,
        title: u.title,
        experienceYears: u.experienceYears,
        location: u.location,
        bio: u.bio,
        avatar: u.avatar
      })
    `;
    const usersData = [
      {
        id: 'usr_alex',
        name: 'Alex Chen',
        title: 'Senior Full-Stack & Graph Developer',
        experienceYears: 6,
        location: 'San Francisco, CA',
        bio: 'Passionate about graph-backed reactive web applications, TypeScript, and modern AI developer tools.',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      },
      {
        id: 'usr_elena',
        name: 'Elena Rostova',
        title: 'Staff AI Systems & GNN Engineer',
        experienceYears: 7,
        location: 'New York, NY',
        bio: 'Specialized in Graph Neural Networks, PyTorch distributed training, Neo4j, and autonomous agent memory layers.',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
      },
      {
        id: 'usr_marcus',
        name: 'Marcus Vance',
        title: 'Principal Cloud & Distributed Systems Architect',
        experienceYears: 9,
        location: 'Seattle, WA',
        bio: 'Architecting resilient cloud native platforms with Kubernetes, Go, Terraform, and high-concurrency systems.',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
      },
      {
        id: 'usr_sarah',
        name: 'Sarah Jenkins',
        title: 'Lead Frontend & Visualization Architect',
        experienceYears: 5,
        location: 'Chicago, IL',
        bio: 'Obsessed with delightful UI/UX, Tailwind CSS design systems, WebGL graph rendering, and accessible web apps.',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
      },
      {
        id: 'usr_devon',
        name: 'Devon Patel',
        title: 'Senior Backend & Streaming Engineer',
        experienceYears: 5,
        location: 'Austin, TX',
        bio: 'Building low-latency Kafka stream processors, Go microservices, and high-performance PostgreSQL graph models.',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
      },
      {
        id: 'usr_chloe',
        name: 'Chloe Zhao',
        title: 'AI Agent & LLM Engineer',
        experienceYears: 4,
        location: 'Boston, MA',
        bio: 'Crafting agentic workflows with LangChain, CognoDB graph retrieval, and multi-agent coordination frameworks.',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'
      }
    ];
    await session.run(usersQuery, { users: usersData });
    console.log(`   Inserted ${usersData.length} User nodes.`);

    // 8. Link Companies to Jobs (:OFFERS_JOB)
    console.log('🔗 Linking Companies to Jobs (:OFFERS_JOB)...');
    const companyJobsQuery = `
      UNWIND $companyJobs AS cj
      MATCH (c:Company {id: cj.companyId})
      MATCH (j:Job {id: cj.jobId})
      MERGE (c)-[:OFFERS_JOB { postedAt: datetime() }]->(j)
    `;
    const companyJobsData = [
      { companyId: 'comp_wexa', jobId: 'job_wexa_graph_ai' },
      { companyId: 'comp_wexa', jobId: 'job_wexa_fullstack' },
      { companyId: 'comp_wexa', jobId: 'job_wexa_llm' },
      { companyId: 'comp_nexus', jobId: 'job_nexus_distrib' },
      { companyId: 'comp_nexus', jobId: 'job_nexus_viz' },
      { companyId: 'comp_hyperscale', jobId: 'job_hyperscale_k8s' },
      { companyId: 'comp_synthetix', jobId: 'job_synthetix_ml' },
      { companyId: 'comp_finstream', jobId: 'job_finstream_stream' }
    ];
    await session.run(companyJobsQuery, { companyJobs: companyJobsData });

    // 9. Link Jobs to Required Skills (:REQUIRES_SKILL)
    console.log('🔗 Linking Jobs to Required Skills (:REQUIRES_SKILL)...');
    const jobSkillsQuery = `
      UNWIND $jobSkills AS js
      MATCH (j:Job {id: js.jobId})
      MATCH (s:Skill {id: js.skillId})
      MERGE (j)-[:REQUIRES_SKILL { importance: js.importance, minYears: js.minYears }]->(s)
    `;
    const jobSkillsData = [
      // Wexa Senior Graph & AI Engineer
      { jobId: 'job_wexa_graph_ai', skillId: 'sk_neo4j', importance: 'Required', minYears: 3 },
      { jobId: 'job_wexa_graph_ai', skillId: 'sk_graph_db', importance: 'Required', minYears: 3 },
      { jobId: 'job_wexa_graph_ai', skillId: 'sk_python', importance: 'Required', minYears: 4 },
      { jobId: 'job_wexa_graph_ai', skillId: 'sk_langchain', importance: 'Required', minYears: 2 },
      { jobId: 'job_wexa_graph_ai', skillId: 'sk_vectordb', importance: 'Preferred', minYears: 1 },

      // Wexa Staff Full-Stack Agent Platform Architect
      { jobId: 'job_wexa_fullstack', skillId: 'sk_react', importance: 'Required', minYears: 5 },
      { jobId: 'job_wexa_fullstack', skillId: 'sk_typescript', importance: 'Required', minYears: 5 },
      { jobId: 'job_wexa_fullstack', skillId: 'sk_nodejs', importance: 'Required', minYears: 4 },
      { jobId: 'job_wexa_fullstack', skillId: 'sk_neo4j', importance: 'Required', minYears: 2 },
      { jobId: 'job_wexa_fullstack', skillId: 'sk_tailwindcss', importance: 'Preferred', minYears: 2 },
      { jobId: 'job_wexa_fullstack', skillId: 'sk_graphql', importance: 'Preferred', minYears: 2 },

      // Nexus Principal Distributed Graph Engine Engineer
      { jobId: 'job_nexus_distrib', skillId: 'sk_golang', importance: 'Required', minYears: 5 },
      { jobId: 'job_nexus_distrib', skillId: 'sk_distributed', importance: 'Required', minYears: 6 },
      { jobId: 'job_nexus_distrib', skillId: 'sk_graph_db', importance: 'Required', minYears: 4 },
      { jobId: 'job_nexus_distrib', skillId: 'sk_docker', importance: 'Preferred', minYears: 3 },
      { jobId: 'job_nexus_distrib', skillId: 'sk_kubernetes', importance: 'Preferred', minYears: 3 },

      // Nexus Senior Frontend & Graph Visualization Engineer
      { jobId: 'job_nexus_viz', skillId: 'sk_react', importance: 'Required', minYears: 4 },
      { jobId: 'job_nexus_viz', skillId: 'sk_typescript', importance: 'Required', minYears: 4 },
      { jobId: 'job_nexus_viz', skillId: 'sk_tailwindcss', importance: 'Required', minYears: 3 },
      { jobId: 'job_nexus_viz', skillId: 'sk_graph_db', importance: 'Preferred', minYears: 1 },

      // HyperScale Lead Cloud Infrastructure Architect
      { jobId: 'job_hyperscale_k8s', skillId: 'sk_kubernetes', importance: 'Required', minYears: 5 },
      { jobId: 'job_hyperscale_k8s', skillId: 'sk_docker', importance: 'Required', minYears: 5 },
      { jobId: 'job_hyperscale_k8s', skillId: 'sk_golang', importance: 'Required', minYears: 3 },
      { jobId: 'job_hyperscale_k8s', skillId: 'sk_distributed', importance: 'Required', minYears: 4 },

      // Synthetix Senior ML Systems Engineer
      { jobId: 'job_synthetix_ml', skillId: 'sk_python', importance: 'Required', minYears: 4 },
      { jobId: 'job_synthetix_ml', skillId: 'sk_pytorch', importance: 'Required', minYears: 4 },
      { jobId: 'job_synthetix_ml', skillId: 'sk_graph_db', importance: 'Required', minYears: 2 },
      { jobId: 'job_synthetix_ml', skillId: 'sk_spark', importance: 'Preferred', minYears: 2 },

      // FinStream High-Throughput Streaming & Graph Engineer
      { jobId: 'job_finstream_stream', skillId: 'sk_kafka', importance: 'Required', minYears: 3 },
      { jobId: 'job_finstream_stream', skillId: 'sk_postgresql', importance: 'Required', minYears: 4 },
      { jobId: 'job_finstream_stream', skillId: 'sk_golang', importance: 'Required', minYears: 3 },
      { jobId: 'job_finstream_stream', skillId: 'sk_graph_db', importance: 'Preferred', minYears: 2 },

      // Wexa AI Agent & LLM Applications Engineer
      { jobId: 'job_wexa_llm', skillId: 'sk_python', importance: 'Required', minYears: 3 },
      { jobId: 'job_wexa_llm', skillId: 'sk_llm', importance: 'Required', minYears: 2 },
      { jobId: 'job_wexa_llm', skillId: 'sk_langchain', importance: 'Required', minYears: 2 },
      { jobId: 'job_wexa_llm', skillId: 'sk_vectordb', importance: 'Required', minYears: 2 },
      { jobId: 'job_wexa_llm', skillId: 'sk_neo4j', importance: 'Preferred', minYears: 1 }
    ];
    await session.run(jobSkillsQuery, { jobSkills: jobSkillsData });

    // 10. Link Users to Skills (:HAS_SKILL)
    console.log('🔗 Linking Users to Skills (:HAS_SKILL)...');
    const userSkillsQuery = `
      UNWIND $userSkills AS us
      MATCH (u:User {id: us.userId})
      MATCH (s:Skill {id: us.skillId})
      MERGE (u)-[:HAS_SKILL { proficiency: us.proficiency, years: us.years }]->(s)
    `;
    const userSkillsData = [
      // Alex Chen (Senior Fullstack & Graph)
      { userId: 'usr_alex', skillId: 'sk_react', proficiency: 'Expert', years: 6 },
      { userId: 'usr_alex', skillId: 'sk_typescript', proficiency: 'Expert', years: 5 },
      { userId: 'usr_alex', skillId: 'sk_nodejs', proficiency: 'Expert', years: 5 },
      { userId: 'usr_alex', skillId: 'sk_neo4j', proficiency: 'Advanced', years: 3 },
      { userId: 'usr_alex', skillId: 'sk_graph_db', proficiency: 'Advanced', years: 3 },
      { userId: 'usr_alex', skillId: 'sk_tailwindcss', proficiency: 'Advanced', years: 4 },
      { userId: 'usr_alex', skillId: 'sk_graphql', proficiency: 'Advanced', years: 3 },
      { userId: 'usr_alex', skillId: 'sk_postgresql', proficiency: 'Advanced', years: 4 },

      // Elena Rostova (Staff AI Systems & GNN)
      { userId: 'usr_elena', skillId: 'sk_python', proficiency: 'Expert', years: 7 },
      { userId: 'usr_elena', skillId: 'sk_pytorch', proficiency: 'Expert', years: 6 },
      { userId: 'usr_elena', skillId: 'sk_graph_db', proficiency: 'Expert', years: 5 },
      { userId: 'usr_elena', skillId: 'sk_neo4j', proficiency: 'Expert', years: 4 },
      { userId: 'usr_elena', skillId: 'sk_langchain', proficiency: 'Advanced', years: 2 },
      { userId: 'usr_elena', skillId: 'sk_llm', proficiency: 'Advanced', years: 2 },
      { userId: 'usr_elena', skillId: 'sk_spark', proficiency: 'Advanced', years: 3 },

      // Marcus Vance (Principal Cloud & Distributed Systems)
      { userId: 'usr_marcus', skillId: 'sk_kubernetes', proficiency: 'Expert', years: 7 },
      { userId: 'usr_marcus', skillId: 'sk_docker', proficiency: 'Expert', years: 8 },
      { userId: 'usr_marcus', skillId: 'sk_golang', proficiency: 'Expert', years: 6 },
      { userId: 'usr_marcus', skillId: 'sk_distributed', proficiency: 'Expert', years: 8 },
      { userId: 'usr_marcus', skillId: 'sk_kafka', proficiency: 'Advanced', years: 4 },

      // Sarah Jenkins (Lead Frontend)
      { userId: 'usr_sarah', skillId: 'sk_react', proficiency: 'Expert', years: 5 },
      { userId: 'usr_sarah', skillId: 'sk_typescript', proficiency: 'Expert', years: 5 },
      { userId: 'usr_sarah', skillId: 'sk_tailwindcss', proficiency: 'Expert', years: 4 },
      { userId: 'usr_sarah', skillId: 'sk_graphql', proficiency: 'Advanced', years: 3 },
      { userId: 'usr_sarah', skillId: 'sk_graph_db', proficiency: 'Intermediate', years: 1 },

      // Devon Patel (Senior Backend & Streaming)
      { userId: 'usr_devon', skillId: 'sk_golang', proficiency: 'Expert', years: 5 },
      { userId: 'usr_devon', skillId: 'sk_kafka', proficiency: 'Expert', years: 4 },
      { userId: 'usr_devon', skillId: 'sk_postgresql', proficiency: 'Expert', years: 5 },
      { userId: 'usr_devon', skillId: 'sk_docker', proficiency: 'Advanced', years: 4 },
      { userId: 'usr_devon', skillId: 'sk_distributed', proficiency: 'Advanced', years: 4 },

      // Chloe Zhao (AI Agent & LLM)
      { userId: 'usr_chloe', skillId: 'sk_python', proficiency: 'Expert', years: 4 },
      { userId: 'usr_chloe', skillId: 'sk_llm', proficiency: 'Expert', years: 3 },
      { userId: 'usr_chloe', skillId: 'sk_langchain', proficiency: 'Expert', years: 2 },
      { userId: 'usr_chloe', skillId: 'sk_vectordb', proficiency: 'Expert', years: 2 },
      { userId: 'usr_chloe', skillId: 'sk_neo4j', proficiency: 'Intermediate', years: 1 }
    ];
    await session.run(userSkillsQuery, { userSkills: userSkillsData });

    // 11. Link Users to Companies (:WORKS_AT)
    console.log('🏢 Linking Users to Employment (:WORKS_AT)...');
    const worksAtQuery = `
      UNWIND $worksAt AS w
      MATCH (u:User {id: w.userId})
      MATCH (c:Company {id: w.companyId})
      MERGE (u)-[:WORKS_AT { role: w.role, since: w.since }]->(c)
    `;
    const worksAtData = [
      { userId: 'usr_alex', companyId: 'comp_nexus', role: 'Senior Software Engineer', since: 2022 },
      { userId: 'usr_elena', companyId: 'comp_wexa', role: 'Principal AI Researcher', since: 2023 },
      { userId: 'usr_marcus', companyId: 'comp_hyperscale', role: 'Principal Infrastructure Architect', since: 2021 },
      { userId: 'usr_sarah', companyId: 'comp_nexus', role: 'Senior Frontend Engineer', since: 2022 },
      { userId: 'usr_devon', companyId: 'comp_finstream', role: 'Lead Platform Engineer', since: 2023 },
      { userId: 'usr_chloe', companyId: 'comp_wexa', role: 'AI Agent Specialist', since: 2024 }
    ];
    await session.run(worksAtQuery, { worksAt: worksAtData });

    // 12. Social Network Connections (:CONNECTED_TO)
    console.log('🤝 Creating Social Graph Connections (:CONNECTED_TO)...');
    const connectionsQuery = `
      UNWIND $connections AS con
      MATCH (u1:User {id: con.from})
      MATCH (u2:User {id: con.to})
      MERGE (u1)-[:CONNECTED_TO { relationship: con.relationship, strength: con.strength }]->(u2)
      MERGE (u2)-[:CONNECTED_TO { relationship: con.relationship, strength: con.strength }]->(u1)
    `;
    const connectionsData = [
      { from: 'usr_alex', to: 'usr_elena', relationship: 'Former Open Source Co-Maintainer', strength: 0.9 },
      { from: 'usr_alex', to: 'usr_sarah', relationship: 'Current Colleague at Nexus', strength: 0.95 },
      { from: 'usr_alex', to: 'usr_marcus', relationship: 'Tech Conference Speaker Peer', strength: 0.75 },
      { from: 'usr_elena', to: 'usr_chloe', relationship: 'Colleague & Mentor at Wexa AI', strength: 0.95 },
      { from: 'usr_marcus', to: 'usr_devon', relationship: 'Former Colleague at CloudScale', strength: 0.85 },
      { from: 'usr_devon', to: 'usr_alex', relationship: 'Hackathon Partner', strength: 0.8 }
    ];
    await session.run(connectionsQuery, { connections: connectionsData });

    console.log('\n📊 Seeding Complete! Verifying Graph Node & Relationship Counts...');
    const countResult = await session.run(`
      MATCH (n)
      RETURN 
        count(n) AS totalNodes,
        count { MATCH ()-->() } AS totalRelationships
    `);

    const record = countResult.records[0];
    const totalNodes = record.get('totalNodes');
    const totalRelationships = record.get('totalRelationships');

    console.log(`\n======================================================`);
    console.log(`🎉 SUCCESS: CognoDB Graph Seeded Successfully!`);
    console.log(`   📦 Total Nodes: ${totalNodes}`);
    console.log(`   ⚡ Total Relationships: ${totalRelationships}`);
    console.log(`======================================================\n`);
  } catch (error) {
    console.error('\n❌ Error during database seeding:', error);
    process.exit(1);
  } finally {
    await session.close();
    await driver.close();
  }
}

seedDatabase();

