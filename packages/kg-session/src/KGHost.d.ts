
export type Dataset = {
  set: string;
  type: 'sparql' | 'file';
  baseIRI: string;
  file?: string;
};

export type TrisEndpoint = {
  [key: string]: {
    datasets: Dataset[];
  };
};

export type KeyValueObject = {
  [key: string]: string;
};

// Optionally, you could add more specific types here if needed.