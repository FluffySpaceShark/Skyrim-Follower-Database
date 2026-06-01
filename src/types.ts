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
  location: string;
  quests: string[];
  nonFollowerMods: string[];
}

export type SortField = 'follower' | 'gender' | 'race' | 'class' | 'mod' | 'location';
export type SortDirection = 'asc' | 'desc';
