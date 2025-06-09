import React, { useState, useEffect } from 'react';
import { Plus, RotateCcw, Square, Play, Moon, Sun, Trophy, Users, Undo2 } from 'lucide-react';
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
  const [playerNames, setPlayerNames] = useState<string[]>(['', '']);
  const [darkMode, setDarkMode] = useState(false);
  const [actionHistory, setActionHistory] = useState<GameAction[]>([]);
  
  const { toast } = useToast();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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
    
    const winner = gameState.players.reduce((prev, current) => 
      prev.totalScore > current.totalScore ? prev : current
    );

    toast({
      title: "Game Over!",
      description: `${winner.name} wins with ${winner.totalScore} points!`
    });
  };

  const restartGame = () => {
    setShowSetup(true);
    setPlayerNames(Array(numPlayers).fill(''));
    setGameState({
      players: [],
      currentRound: 0,
      gameEnded: false
    });
    setActionHistory([]);
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
        <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
            <CardHeader className="text-center pb-6 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 bg-blue-900 rounded">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold text-blue-900 dark:text-white">
                    KP Scoreboard
                  </CardTitle>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">Keep Points - Multiplayer Game Manager</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDarkMode(!darkMode)}
                className="absolute top-4 right-4 text-gray-600 dark:text-gray-300"
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Number of Players
                </label>
                <Input
                  type="number"
                  min={2}
                  max={8}
                  value={numPlayers}
                  onChange={(e) => {
                    const num = parseInt(e.target.value) || 2;
                    setNumPlayers(num);
                    setPlayerNames(Array(num).fill(''));
                  }}
                  className="text-center text-lg border-gray-300 dark:border-gray-600"
                />
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Player Names
                </label>
                {Array.from({ length: numPlayers }, (_, i) => (
                  <Input
                    key={i}
                    placeholder={`Player ${i + 1} name`}
                    value={playerNames[i] || ''}
                    onChange={(e) => {
                      const newNames = [...playerNames];
                      newNames[i] = e.target.value;
                      setPlayerNames(newNames);
                    }}
                    className="border-gray-300 dark:border-gray-600"
                  />
                ))}
              </div>
              
              <Button 
                onClick={handleSetupComplete}
                className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 rounded"
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
      <div className="min-h-screen bg-white dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-900 rounded">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-blue-900 dark:text-white">KP Scoreboard</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Round {gameState.currentRound + 1} • {gameState.players.length} Players
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDarkMode(!darkMode)}
                  className="text-gray-600 dark:text-gray-300"
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
                      className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    >
                      <Undo2 className="h-4 w-4 mr-1" />
                      Undo
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetCurrentRound}
                      className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reset Round
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={endRound}
                      className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      End Round
                    </Button>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={endGame}
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
                    className="bg-blue-900 hover:bg-blue-800 text-white"
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
        <div className="max-w-7xl mx-auto p-4">
          {/* Scoreboard Table */}
          <Card className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600 min-w-24">
                        Round
                      </th>
                      {gameState.players.map((player, index) => (
                        <th key={index} className="px-4 py-4 text-center text-sm font-semibold border-r border-gray-300 dark:border-gray-600 last:border-r-0 min-w-32">
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2">
                              {getLeaderPosition(index) === 1 && (
                                <Trophy className="h-4 w-4 text-blue-900" />
                              )}
                              <span className="text-gray-900 dark:text-white">{player.name}</span>
                            </div>
                            <Badge 
                              variant={getLeaderPosition(index) === 1 ? "default" : "secondary"}
                              className={`text-xs ${getLeaderPosition(index) === 1 ? 'bg-blue-900 hover:bg-blue-800 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}
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
                      <tr key={roundIndex} className="border-b border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">
                          Round {roundIndex + 1}
                          {roundIndex === gameState.currentRound && !gameState.gameEnded && (
                            <Badge variant="outline" className="ml-2 text-xs border-gray-300 dark:border-gray-600">Current</Badge>
                          )}
                        </td>
                        {gameState.players.map((player, playerIndex) => (
                          <td key={playerIndex} className="px-4 py-4 text-center border-r border-gray-300 dark:border-gray-600 last:border-r-0">
                            <div className="flex flex-col items-center gap-2">
                              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                {player.roundScores[roundIndex] || 0}
                              </span>
                              {roundIndex === gameState.currentRound && !gameState.gameEnded && (
                                <Button
                                  size="sm"
                                  onClick={() => addPoint(playerIndex)}
                                  className="bg-blue-900 hover:bg-blue-800 text-white font-medium px-3 py-1 rounded"
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
            <Card className="mt-6 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
              <CardHeader className="text-center border-b border-gray-200 dark:border-gray-600">
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                  <Trophy className="h-8 w-8 text-blue-900" />
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
                        className={`p-4 rounded border-2 ${
                          position === 0 
                            ? 'border-blue-900 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {position === 0 && <Trophy className="h-5 w-5 text-blue-900" />}
                            <span className="font-semibold text-gray-900 dark:text-white">
                              #{position + 1} {player.name}
                            </span>
                          </div>
                          <Badge 
                            variant={position === 0 ? "default" : "secondary"}
                            className={position === 0 ? 'bg-blue-900 hover:bg-blue-800 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}
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
