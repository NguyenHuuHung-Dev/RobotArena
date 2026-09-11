export type ChallengeDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'master';

export interface ChallengeObjective {
  id: string;
  description: string;
  requiredMetric: string;
  targetValue: number;
  completed: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: ChallengeDifficulty;
  category: 'navigation' | 'combat' | 'survival' | 'targeting' | 'efficiency';
  opponentRobotIds: string[];
  objectives: ChallengeObjective[];
  starterCode: string;
  maxTicks: number;
  rewardPoints: number;
}

export interface LeaderboardEntry {
  rank: number;
  robotId: string;
  robotName: string;
  authorName: string;
  matchesPlayed: number;
  wins: number;
  winRate: number; // Percentage 0 - 100
  totalScore: number;
  eloRating: number;
  lastUpdated: string;
}
