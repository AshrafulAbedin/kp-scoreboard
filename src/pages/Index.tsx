import React, { useState, useEffect } from 'react';
import { Plus, RotateCcw, Square, Play, Moon, Sun, Trophy, Users, Undo2, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Player {
  name: string;
  totalScore: number;
  roundScores: number[];
}

interface GameAction {
  type: 'addPoint' | 'endRound' | 'resetRound';
  playerIndex?: number;
  roundIndex?: number;
  previousState: GameState;
}

interface GameState {
  players: Player[];
  currentRound: number;
  gameEnded: boolean;
}

const Index = () => {
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    currentRound: 0,
    gameEnded: false
  });
  
  const [showSetup, setShowSetup] = useState(true);
  const [numPlayers, setNumPlayers] = useState(2);
  const [playerNames, setPlayerNames] = useState<string[]>(['Player 1', 'Player 2']);
  const [darkMode, setDarkMode] = useState(false);
  const [actionHistory, setActionHistory] = useState<GameAction[]>([]);
  const [showWinnerAnimation, setShowWinnerAnimation] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Update player names when number changes
  useEffect(() => {
    const newNames = Array.from({ length: numPlayers }, (_, i) => 
      playerNames[i] || `Player ${i + 1}`
    );
    setPlayerNames(newNames);
  }, [numPlayers]);

  const handlePlayerCountChange = (increment: boolean) => {
    if (increment && numPlayers < 20) {
      setNumPlayers(prev => prev + 1);
    } else if (!increment && numPlayers > 2) {
      setNumPlayers(prev => prev - 1);
    }
  };

  const handleSetupComplete = () => {
    const validNames = playerNames.filter(name => name.trim() !== '');
    if (validNames.length < 2) {
      toast({
        title: "Invalid Setup",
        description: "Please enter at least 2 player names.",
        variant: "destructive"
      });
      return;
    }

    const players: Player[] = validNames.map(name => ({
      name: name.trim(),
      totalScore: 0,
      roundScores: [0]
    }));

    setGameState({
      players,
      currentRound: 0,
      gameEnded: false
    });
    setActionHistory([]);
    setShowSetup(false);
    
    toast({
      title: "Game Started!",
      description: `${players.length} players ready to play.`
    });
  };

  const saveAction = (action: GameAction) => {
    setActionHistory(prev => [...prev, action]);
  };

  const addPoint = (playerIndex: number) => {
    if (gameState.gameEnded) return;

    const previousState = JSON.parse(JSON.stringify(gameState));
    
    setGameState(prev => {
      const newPlayers = [...prev.players];
      newPlayers[playerIndex].roundScores[prev.currentRound] += 10;
      newPlayers[playerIndex].totalScore += 10;
      
      return {
        ...prev,
        players: newPlayers
      };
    });

    saveAction({
      type: 'addPoint',
      playerIndex,
      roundIndex: gameState.currentRound,
      previousState
    });

    toast({
      title: "Point Added!",
      description: `${gameState.players[playerIndex].name} +10 points`
    });
  };

  const endRound = () => {
    if (gameState.gameEnded) return;

    const previousState = JSON.parse(JSON.stringify(gameState));
    
    setGameState(prev => ({
      ...prev,
      currentRound: prev.currentRound + 1,
      players: prev.players.map(player => ({
        ...player,
        roundScores: [...player.roundScores, 0]
      }))
    }));

    saveAction({
      type: 'endRound',
      previousState
    });

    toast({
      title: "Round Complete!",
      description: `Starting Round ${gameState.currentRound + 2}`
    });
  };

  const resetCurrentRound = () => {
    if (gameState.gameEnded) return;

    const previousState = JSON.parse(JSON.stringify(gameState));
    
    setGameState(prev => {
      const newPlayers = prev.players.map(player => {
        const newPlayer = { ...player };
        const currentRoundScore = newPlayer.roundScores[prev.currentRound];
        newPlayer.totalScore -= currentRoundScore;
        newPlayer.roundScores[prev.currentRound] = 0;
        return newPlayer;
      });
      
      return {
        ...prev,
        players: newPlayers
      };
    });

    saveAction({
      type: 'resetRound',
      previousState
    });

    toast({
      title: "Round Reset",
      description: `Round ${gameState.currentRound + 1} scores cleared`
    });
  };

  const undoLastAction = () => {
    if (actionHistory.length === 0) return;

    const lastAction = actionHistory[actionHistory.length - 1];
    setGameState(lastAction.previousState);
    setActionHistory(prev => prev.slice(0, -1));

    toast({
      title: "Action Undone",
      description: "Last action has been reversed"
    });
  };

  const endGame = () => {
    setGameState(prev => ({ ...prev, gameEnded: true }));
    setShowWinnerAnimation(true);
    
    const winner = gameState.players.reduce((prev, current) => 
      prev.totalScore > current.totalScore ? prev : current
    );

    setTimeout(() => setShowWinnerAnimation(false), 3000);

    toast({
      title: "Game Over!",
      description: `${winner.name} wins with ${winner.totalScore} points!`
    });
  };

  const restartGame = () => {
    setShowSetup(true);
    setPlayerNames(Array.from({ length: numPlayers }, (_, i) => `Player ${i + 1}`));
    setGameState({
      players: [],
      currentRound: 0,
      gameEnded: false
    });
    setActionHistory([]);
    setShowWinnerAnimation(false);
  };

  const getLeaderPosition = (playerIndex: number) => {
    const sortedPlayers = [...gameState.players]
      .map((player, index) => ({ ...player, originalIndex: index }))
      .sort((a, b) => b.totalScore - a.totalScore);
    
    return sortedPlayers.findIndex(p => p.originalIndex === playerIndex) + 1;
  };

  if (showSetup) {
    return (
      <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-6">
          <Card className="w-full max-w-lg bg-white dark:bg-gray-800 border-2 border-gray-800 dark:border-gray-600">
            <CardHeader className="text-center pb-6 border-b-2 border-gray-800 dark:border-gray-600">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 bg-gray-800 dark:bg-gray-700 rounded">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold text-gray-800 dark:text-white">
                    KP Scoreboard
                  </CardTitle>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">Keep Points - Multiplayer Game Manager</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDarkMode(!darkMode)}
                className="absolute top-4 right-4 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div>
                <label className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Number of Players (2-20)
                </label>
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePlayerCountChange(false)}
                    disabled={numPlayers <= 2}
                    className="bg-white dark:bg-gray-700 border-2 border-gray-800 dark:border-gray-600 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 px-3 py-2"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="bg-gray-800 dark:bg-gray-700 text-white px-6 py-3 rounded text-xl font-bold min-w-[80px] text-center">
                    {numPlayers}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePlayerCountChange(true)}
                    disabled={numPlayers >= 20}
                    className="bg-white dark:bg-gray-700 border-2 border-gray-800 dark:border-gray-600 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 px-3 py-2"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  Player Names
                </label>
                <div className="max-h-60 overflow-y-auto space-y-3">
                  {Array.from({ length: numPlayers }, (_, i) => (
                    <Input
                      key={i}
                      placeholder={`Player ${i + 1}`}
                      value={playerNames[i] || ''}
                      onChange={(e) => {
                        const newNames = [...playerNames];
                        newNames[i] = e.target.value;
                        setPlayerNames(newNames);
                      }}
                      className="bg-white dark:bg-gray-700 border-2 border-gray-800 dark:border-gray-600 text-gray-800 dark:text-white px-4 py-3"
                    />
                  ))}
                </div>
              </div>
              
              <Button 
                onClick={handleSetupComplete}
                className="w-full bg-gray-800 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-semibold py-4 rounded border-2 border-gray-800 dark:border-gray-600"
              >
                <Play className="mr-2 h-5 w-5" />
                Start Game
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        {/* Winner Animation Overlay */}
        {showWinnerAnimation && gameState.gameEnded && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border-4 border-gray-800 dark:border-gray-600 text-center animate-scale-in">
              <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4 animate-pulse" />
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                🎉 Winner! 🎉
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                {gameState.players.reduce((prev, current) => 
                  prev.totalScore > current.totalScore ? prev : current
                ).name}
              </p>
              <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">
                {gameState.players.reduce((prev, current) => 
                  prev.totalScore > current.totalScore ? prev : current
                ).totalScore} points
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b-4 border-gray-800 dark:border-gray-600">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-800 dark:bg-gray-700 rounded">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-white">KP Scoreboard</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Round {gameState.currentRound + 1} • {gameState.players.length} Players
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDarkMode(!darkMode)}
                  className="text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                
                {!gameState.gameEnded && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={undoLastAction}
                      disabled={actionHistory.length === 0}
                      className="bg-white dark:bg-gray-700 border-2 border-gray-800 dark:border-gray-600 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <Undo2 className="h-4 w-4 mr-1" />
                      Undo
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetCurrentRound}
                      className="bg-white dark:bg-gray-700 border-2 border-gray-800 dark:border-gray-600 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reset Round
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={endRound}
                      className="bg-white dark:bg-gray-700 border-2 border-gray-800 dark:border-gray-600 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      End Round
                    </Button>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={endGame}
                      className="bg-red-700 dark:bg-red-800 hover:bg-red-600 dark:hover:bg-red-700 text-white border-2 border-red-700 dark:border-red-800"
                    >
                      <Square className="h-4 w-4 mr-1" />
                      End Game
                    </Button>
                  </>
                )}
                
                {gameState.gameEnded && (
                  <Button
                    size="sm"
                    onClick={restartGame}
                    className="bg-gray-800 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white border-2 border-gray-800 dark:border-gray-600"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    New Game
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto p-6">
          {/* Scoreboard Table */}
          <Card className="bg-white dark:bg-gray-800 border-4 border-gray-800 dark:border-gray-600">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-200 dark:bg-gray-700 border-b-4 border-gray-800 dark:border-gray-600">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800 dark:text-white border-r-4 border-gray-800 dark:border-gray-600 min-w-32">
                        Round
                      </th>
                      {gameState.players.map((player, index) => (
                        <th key={index} className="px-6 py-4 text-center text-sm font-semibold border-r-4 border-gray-800 dark:border-gray-600 last:border-r-0 min-w-40">
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2">
                              {getLeaderPosition(index) === 1 && (
                                <Trophy className="h-4 w-4 text-yellow-500 animate-pulse" />
                              )}
                              <span className="text-gray-800 dark:text-white">{player.name}</span>
                            </div>
                            <Badge 
                              variant={getLeaderPosition(index) === 1 ? "default" : "secondary"}
                              className={`text-xs ${getLeaderPosition(index) === 1 ? 'bg-gray-800 dark:bg-gray-600 text-white border-2 border-gray-800 dark:border-gray-600' : 'bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white border-2 border-gray-500 dark:border-gray-500'}`}
                            >
                              {player.totalScore} pts
                            </Badge>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: gameState.currentRound + 1 }, (_, roundIndex) => (
                      <tr key={roundIndex} className="border-b-4 border-gray-800 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-white border-r-4 border-gray-800 dark:border-gray-600">
                          Round {roundIndex + 1}
                          {roundIndex === gameState.currentRound && !gameState.gameEnded && (
                            <Badge variant="outline" className="ml-2 text-xs bg-white dark:bg-gray-700 border-2 border-gray-800 dark:border-gray-600 text-gray-800 dark:text-white">Current</Badge>
                          )}
                        </td>
                        {gameState.players.map((player, playerIndex) => (
                          <td key={playerIndex} className="px-6 py-4 text-center border-r-4 border-gray-800 dark:border-gray-600 last:border-r-0">
                            <div className="flex flex-col items-center gap-3">
                              <span className="text-lg font-semibold text-gray-800 dark:text-white">
                                {player.roundScores[roundIndex] || 0}
                              </span>
                              {roundIndex === gameState.currentRound && !gameState.gameEnded && (
                                <Button
                                  size="sm"
                                  onClick={() => addPoint(playerIndex)}
                                  className="bg-gray-800 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-medium px-4 py-2 rounded border-2 border-gray-800 dark:border-gray-600 transition-all hover:scale-105"
                                >
                                  +10
                                </Button>
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Game Over Summary */}
          {gameState.gameEnded && (
            <Card className="mt-6 bg-white dark:bg-gray-800 border-4 border-gray-800 dark:border-gray-600">
              <CardHeader className="text-center border-b-4 border-gray-800 dark:border-gray-600">
                <CardTitle className="text-2xl font-bold text-gray-800 dark:text-white flex items-center justify-center gap-2">
                  <Trophy className="h-8 w-8 text-yellow-500" />
                  Game Over - Final Results
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...gameState.players]
                    .map((player, index) => ({ ...player, originalIndex: index }))
                    .sort((a, b) => b.totalScore - a.totalScore)
                    .map((player, position) => (
                      <div 
                        key={player.originalIndex}
                        className={`p-4 rounded border-4 transition-all hover:scale-105 ${
                          position === 0 
                            ? 'border-gray-800 dark:border-gray-600 bg-gray-200 dark:bg-gray-700 animate-pulse' 
                            : 'border-gray-800 dark:border-gray-600 bg-white dark:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {position === 0 && <Trophy className="h-5 w-5 text-yellow-500" />}
                            <span className="font-semibold text-gray-800 dark:text-white">
                              #{position + 1} {player.name}
                            </span>
                          </div>
                          <Badge 
                            variant={position === 0 ? "default" : "secondary"}
                            className={position === 0 ? 'bg-gray-800 dark:bg-gray-600 text-white border-2 border-gray-800 dark:border-gray-600' : 'bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white border-2 border-gray-500 dark:border-gray-500'}
                          >
                            {player.totalScore} pts
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
