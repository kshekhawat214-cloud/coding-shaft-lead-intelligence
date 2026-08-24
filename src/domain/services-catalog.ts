export interface ServiceDefinition {
  id: string;
  name: string;
  category: "Web & Mobile" | "Enterprise Software" | "AI & Automation" | "Design & Marketing" | "Cloud & Infrastructure" | "Consulting & Support";
  tier: "Core" | "Growth" | "Enterprise";
  description: string;
  targetSignals: string[];
  quickWinPotential: boolean;
}

export const CODING_SHAFT_SERVICES: ServiceDefinition[] = [
  {
    id: "website-development",
    name: "Website Development",
    category: "Web & Mobile",
    tier: "Core",
    description: "Modern, responsive, high-performance website development for businesses without an active web presence.",
    targetSignals: ["no_website", "missing_domain", "unregistered_web_presence"],
    quickWinPotential: true,
  },
  {
    id: "website-redesign",
    name: "Website Redesign",
    category: "Web & Mobile",
    tier: "Core",
    description: "Complete visual, UX, and performance overhaul of outdated, non-responsive, or slow legacy websites.",
    targetSignals: ["outdated_design", "low_mobile_score", "slow_load_time", "non_responsive"],
    quickWinPotential: true,
  },
  {
    id: "ecommerce-development",
    name: "E-commerce Development",
    category: "Web & Mobile",
    tier: "Growth",
    description: "Custom online storefronts, payment gateways, product catalogs, and inventory integrations.",
    targetSignals: ["retail_business", "catalog_without_checkout", "missing_online_payment"],
    quickWinPotential: false,
  },
  {
    id: "mobile-app-development",
    name: "Mobile App Development",
    category: "Web & Mobile",
    tier: "Enterprise",
    description: "Native and cross-platform mobile apps for iOS and Android delivering rich customer experiences.",
    targetSignals: ["high_repeat_customers", "loyalty_program_need", "on_the_go_services"],
    quickWinPotential: false,
  },
  {
    id: "custom-software-development",
    name: "Custom Software Development",
    category: "Enterprise Software",
    tier: "Enterprise",
    description: "Tailored business applications, portals, and operational management systems.",
    targetSignals: ["manual_paper_workflows", "complex_multi_step_operations", "spreadsheet_heavy_processes"],
    quickWinPotential: false,
  },
  {
    id: "crm-development",
    name: "CRM Development",
    category: "Enterprise Software",
    tier: "Growth",
    description: "Custom customer relationship management, lead tracking, automated follow-ups, and sales pipelines.",
    targetSignals: ["untracked_inquiries", "lost_leads", "high_inquiry_volume", "customer_complaints_on_followup"],
    quickWinPotential: true,
  },
  {
    id: "erp-development",
    name: "ERP Development",
    category: "Enterprise Software",
    tier: "Enterprise",
    description: "Comprehensive enterprise resource planning unifying inventory, billing, HR, and supply chain.",
    targetSignals: ["multi_location_business", "complex_inventory", "large_team_coordination"],
    quickWinPotential: false,
  },
  {
    id: "ai-solutions",
    name: "AI Solutions",
    category: "AI & Automation",
    tier: "Enterprise",
    description: "Bespoke artificial intelligence solutions, machine learning models, predictive intelligence, and smart agents.",
    targetSignals: ["high_data_volume", "demand_forecasting_need", "content_generation_need"],
    quickWinPotential: false,
  },
  {
    id: "ai-chatbots",
    name: "AI Chatbots",
    category: "AI & Automation",
    tier: "Core",
    description: "24/7 intelligent customer support and lead qualification conversational AI chatbots.",
    targetSignals: ["unanswered_after_hours_calls", "frequently_asked_questions", "high_inquiry_volume"],
    quickWinPotential: true,
  },
  {
    id: "ai-automation",
    name: "AI Automation",
    category: "AI & Automation",
    tier: "Growth",
    description: "Intelligent document processing, automated categorization, smart data extraction, and AI agent workflows.",
    targetSignals: ["document_heavy_workflows", "manual_data_entry", "invoice_processing"],
    quickWinPotential: true,
  },
  {
    id: "business-process-automation",
    name: "Business Process Automation",
    category: "AI & Automation",
    tier: "Growth",
    description: "End-to-end workflow automation connecting internal tools, emails, notifications, and databases.",
    targetSignals: ["repetitive_manual_tasks", "cross_app_copy_pasting", "operational_delays"],
    quickWinPotential: true,
  },
  {
    id: "whatsapp-automation",
    name: "WhatsApp Automation",
    category: "AI & Automation",
    tier: "Core",
    description: "Automated WhatsApp business messaging, instant booking confirmations, notifications, and interactive menus.",
    targetSignals: ["heavy_whatsapp_usage", "manual_chat_replies", "booking_inquiries_via_chat"],
    quickWinPotential: true,
  },
  {
    id: "api-integration",
    name: "API Integration",
    category: "Enterprise Software",
    tier: "Growth",
    description: "Secure integrations between third-party SaaS tools, payment processors, accounting software, and CRMs.",
    targetSignals: ["siloed_software_systems", "manual_data_reentry", "missing_sync"],
    quickWinPotential: true,
  },
  {
    id: "ui-ux-design",
    name: "UI/UX Design",
    category: "Design & Marketing",
    tier: "Core",
    description: "User research, wireframing, high-fidelity prototypes, brand design systems, and conversion-focused design.",
    targetSignals: ["confusing_user_flow", "high_dropoff_rate", "outdated_branding"],
    quickWinPotential: true,
  },
  {
    id: "seo",
    name: "SEO",
    category: "Design & Marketing",
    tier: "Core",
    description: "Local and technical Search Engine Optimization, keyword ranking, Google Business Profile optimization.",
    targetSignals: ["missing_meta_tags", "low_search_ranking", "low_organic_discovery"],
    quickWinPotential: true,
  },
  {
    id: "digital-marketing",
    name: "Digital Marketing",
    category: "Design & Marketing",
    tier: "Growth",
    description: "Targeted digital advertising, campaign management, lead generation funnels, and performance tracking.",
    targetSignals: ["low_online_visibility", "weak_social_engagement", "growth_ambition"],
    quickWinPotential: false,
  },
  {
    id: "cloud-solutions",
    name: "Cloud Solutions",
    category: "Cloud & Infrastructure",
    tier: "Growth",
    description: "Scalable cloud architecture, migration, serverless setups, and cost optimization on AWS, GCP, and Azure.",
    targetSignals: ["on_premise_servers", "scalability_issues", "frequent_downtime"],
    quickWinPotential: false,
  },
  {
    id: "devops",
    name: "DevOps",
    category: "Cloud & Infrastructure",
    tier: "Enterprise",
    description: "CI/CD pipelines, containerization, Kubernetes, automated deployments, and infrastructure as code.",
    targetSignals: ["slow_deployment_cycles", "inconsistent_environments", "manual_releases"],
    quickWinPotential: false,
  },
  {
    id: "cybersecurity",
    name: "Cybersecurity",
    category: "Cloud & Infrastructure",
    tier: "Enterprise",
    description: "Security architecture reviews, vulnerability assessments, compliance posture, and data protection.",
    targetSignals: ["handling_sensitive_data", "unsecured_endpoints", "missing_ssl_or_security_headers"],
    quickWinPotential: false,
  },
  {
    id: "it-consulting",
    name: "IT Consulting",
    category: "Consulting & Support",
    tier: "Enterprise",
    description: "Strategic technology roadmap consulting, architecture reviews, and vendor evaluation.",
    targetSignals: ["technology_transition", "legacy_system_modernization", "scaling_challenges"],
    quickWinPotential: false,
  },
  {
    id: "data-analytics",
    name: "Data Analytics",
    category: "Consulting & Support",
    tier: "Growth",
    description: "Custom BI dashboards, performance tracking, revenue metrics, customer cohort analysis.",
    targetSignals: ["fragmented_reports", "lack_of_data_visibility", "decision_making_without_metrics"],
    quickWinPotential: true,
  },
  {
    id: "maintenance-support",
    name: "Maintenance & Support",
    category: "Consulting & Support",
    tier: "Core",
    description: "Ongoing 24/7 SLA maintenance, bug fixing, performance monitoring, and continuous security patching.",
    targetSignals: ["unmaintained_apps", "abandoned_codebases", "intermittent_errors"],
    quickWinPotential: true,
  },
];

export function getServiceById(id: string): ServiceDefinition | undefined {
  return CODING_SHAFT_SERVICES.find((s) => s.id === id || s.name.toLowerCase() === id.toLowerCase());
}

export function getServicesByCategory(category: ServiceDefinition["category"]): ServiceDefinition[] {
  return CODING_SHAFT_SERVICES.filter((s) => s.category === category);
}

export function getAllServiceNames(): string[] {
  return CODING_SHAFT_SERVICES.map((s) => s.name);
}
