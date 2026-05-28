export type JobSource = 'indeed' | 'france-travail';

export type ContractType = 'CDI' | 'CDD' | 'Freelance' | 'Stage' | 'Alternance' | string;

export interface Offer {
  id: string;
  title: string;
  company: string;
  location: string;
  contractType: ContractType;
  source: JobSource;
  url: string;
  description: string;
  score: number;
  /** One-sentence LLM justification for the score. */
  summary: string;
  publishedAt: string; // ISO 8601
  fetchedAt: string;  // ISO 8601
}
