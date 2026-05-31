/** Shared battle-quiz session flags & score mapping helpers */

let readyForNewMatch = true;
let matchmakingSessionCounter = 0;

export function markReadyForNewMatch() {
  readyForNewMatch = true;
  matchmakingSessionCounter += 1;
}

export function markBattleFlowComplete() {
  readyForNewMatch = false;
}

export function getMatchmakingSessionCounter() {
  return matchmakingSessionCounter;
}

export function shouldRestartMatchmakingOnFocus() {
  return readyForNewMatch;
}

type ScorePayload = {
  playerScores?: { player1?: number; player2?: number };
  myScore?: number;
  opponentScore?: number;
  myPosition?: 'player1' | 'player2' | string;
};

/** Map server scores to local view: player1Score = You, player2Score = Opponent */
export function mapScoresToLocalView(
  data: ScorePayload,
  current: { player1Score: number; player2Score: number },
  fallbackPosition?: 'player1' | 'player2',
): { player1Score: number; player2Score: number } {
  let player1Score = current.player1Score;
  let player2Score = current.player2Score;

  const myPosition =
    data.myPosition === 'player2' ? 'player2' : data.myPosition === 'player1' ? 'player1' : fallbackPosition;

  if (typeof data.myScore === 'number' && typeof data.opponentScore === 'number') {
    player1Score = data.myScore;
    player2Score = data.opponentScore;
    return { player1Score, player2Score };
  }

  if (data.playerScores) {
    const serverP1 = data.playerScores.player1;
    const serverP2 = data.playerScores.player2;
    if (myPosition === 'player2') {
      if (typeof serverP2 === 'number') player1Score = serverP2;
      if (typeof serverP1 === 'number') player2Score = serverP1;
    } else {
      if (typeof serverP1 === 'number') player1Score = serverP1;
      if (typeof serverP2 === 'number') player2Score = serverP2;
    }
  }

  return { player1Score, player2Score };
}
