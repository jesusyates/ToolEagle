export type TopicRegistryPage = { type?: string; url: string; createdAt?: string };

export type TopicRegistryEntry = {
  topicKey: string;
  platform?: string;
  primaryType?: string;
  primaryUrl?: string;
  pages?: TopicRegistryPage[];
  lastUpdated?: string;
};

export type TopicRegistryFile = {
  updatedAt?: string;
  topics: TopicRegistryEntry[];
};
