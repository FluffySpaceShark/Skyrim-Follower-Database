export interface Follower {
  follower: string;
  gender: 'Male' | 'Female';
  race: string;
  class: string;
  mod: string;
  interactsWith: string[];
  modUrl: string;
  modDbUrl?: string;
  note?: string;
}

export type SortField = 'follower' | 'gender' | 'race' | 'class' | 'mod';
export type SortDirection = 'asc' | 'desc';
