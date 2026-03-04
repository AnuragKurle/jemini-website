import React, { useState, useEffect, useRef, useCallback } from 'react';
import HomeView from './views/HomeView';
import RemedyListView from './views/RemedyListView';
import DifficultyView from './views/DifficultyView';
import GameView from './views/GameView';
import RecapView from './views/RecapView';
import CelebrationScreen from './views/CelebrationScreen';
import ScoreSummaryScreen from './views/ScoreSummaryScreen';
import AuthView from './views/AuthView';
import AdminView from './views/AdminView';
import ManageSymptomsView from './views/ManageSymptomsView';
import ProfileView from './views/ProfileView';
import HowToPlayView from './views/HowToPlayView';
import ScoreboardView from './views/ScoreboardView';
import SideMenu from './components/SideMenu';
import { IconLogout, IconStar, IconMenu, IconArrowLeft } from './components/Icons';
import LoadingAnimation from './components/LoadingAnimation';
import { useAuth } from './lib/auth.jsx';
import { playSound } from './lib/audio';
import { REMEDY_DATA_MAP, getRemedyData, REMEDY_ORDER } from './lib/data';
import { db } from './lib/firebase';
import { shuffleArray, hasMinimumItems } from './lib/utils';
import AnimatedPage from './components/AnimatedPage';

const App = () => {
  const { currentUser, loading, logout, isAdmin, recordLevelCompletion, levelsCompleted, unlockNextRemedy } = useAuth();
  const [view, setView] = useState('home');
  const [selectedRemedy, setSelectedRemedy] = useState(null);
  const [difficulty, setDifficulty] = useState('EASY');
  const [cards, setCards] = useState([]);
  const [_turns, setTurns] = useState(0);
  const [choiceOne, setChoiceOne] = useState(null);
  const [choiceTwo, setChoiceTwo] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [matches, setMatches] = useState(0);
  const [time, setTime] = useState(0);
  const [recapIndex, setRecapIndex] = useState(0);
  const levelRecorded = useRef(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [levelScore, setLevelScore] = useState(0);
  const [previousTotalScore, setPreviousTotalScore] = useState(0);
  const [availableSymptomCount, setAvailableSymptomCount] = useState(0);
  const [matchAnimationData, setMatchAnimationData] = useState(null);

  // Simple loading state with minimum display time
  const [showLoading, setShowLoading] = useState(true);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [gameLoading, setGameLoading] = useState(false);

  // Start the minimum time timer once on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 1800); // 1.8s to let animation play fully
    return () => clearTimeout(timer);
  }, []);

  // Hide loading only when BOTH conditions are met
  useEffect(() => {
    if (!loading && minTimeElapsed) {
      // Small delay for smoother transition
      const timer = setTimeout(() => {
        setShowLoading(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [loading, minTimeElapsed]);

  useEffect(() => {
    if (!currentUser) {
      setView('home');
      setSelectedRemedy(null);
      setDifficulty('EASY');
      setCards([]);
      setTurns(0);
      setChoiceOne(null);
      setChoiceTwo(null);
      setDisabled(false);
      setMatches(0);
      setTime(0);
      setRecapIndex(0);
    }
  }, [currentUser]);

  const getDifficultySettings = (level) => {
    switch (level) {
      case 'HARD': return { pairs: 20, cols: 8, rows: 5, pointsPerSymptom: 3 };  // 8 cols × 5 rows = 40 cards
      case 'MEDIUM': return { pairs: 14, cols: 7, rows: 4, pointsPerSymptom: 2 };  // 7 cols × 4 rows = 28 cards
      case 'EASY':
      default: return { pairs: 6, cols: 4, rows: 3, pointsPerSymptom: 2 };  // 4 cols × 3 rows = 12 cards
    }
  };

  // Calculate level score
  const getLevelScore = (diff) => {
    const settings = getDifficultySettings(diff);
    return settings.pairs * settings.pointsPerSymptom;
  };

  // Calculate previous total score from levelsCompleted
  const calculateTotalScore = () => {
    if (!Array.isArray(levelsCompleted) || levelsCompleted.length === 0) return 0;
    const levelMap = new Map();
    levelsCompleted.forEach(level => {
      if (level && level.remedy && level.difficulty) {
        const key = `${level.remedy}-${level.difficulty}`;
        if (!levelMap.has(key)) {
          levelMap.set(key, level);
        }
      }
    });
    let total = 0;
    levelMap.forEach(level => {
      if (level.totalPoints) {
        total += level.totalPoints;
      } else {
        // Legacy calculation
        total += level.difficulty === 'HARD' ? 60 : level.difficulty === 'MEDIUM' ? 28 : 12;
      }
    });
    return total;
  };

  // Preload a single image URL into the browser cache
  const preloadOne = (url) => new Promise((resolve) => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = resolve;
    img.src = url;
  });

  // Shuffle Logic
  const shuffleCards = async (diff = 'EASY') => {
    setGameLoading(true);
    setDifficulty(diff);
    const settings = getDifficultySettings(diff);
    const numPairs = settings.pairs;

    // Map difficulty string to numeric value for bucket filtering
    const difficultyNum = diff === 'HARD' ? 3 : diff === 'MEDIUM' ? 2 : 1;

    // Load dynamic data filtered to the selected difficulty bucket
    const remedyData = await getRemedyData(selectedRemedy, db, difficultyNum);

    // Validate we have enough symptoms for this difficulty
    if (!hasMinimumItems(remedyData, numPairs)) {
      console.warn(`Insufficient symptoms for ${diff} difficulty. Need ${numPairs}, have ${remedyData?.length || 0}`);
      setGameLoading(false);
      return;
    }

    // Track total available symptoms for this remedy
    setAvailableSymptomCount(remedyData.length);

    // Create two identical image cards per symptom pair (same image matching)
    const allCards = [];
    remedyData.slice(0, numPairs).forEach((sym, idx) => {
      // First card of the pair
      allCards.push({
        id: `img-a-${idx}`,
        item_id: sym.id,
        type: 'image',
        content: sym.imageUrl || sym.emoji,
        text: sym.text,
        matched: false,
      });
      // Second card of the pair (identical)
      allCards.push({
        id: `img-b-${idx}`,
        item_id: sym.id,
        type: 'image',
        content: sym.imageUrl || sym.emoji,
        text: sym.text,
        matched: false,
      });
    });

    // Shuffle the cards using robust Fisher-Yates algorithm
    const shuffledCards = shuffleArray(allCards);

    // Add position to each card
    shuffledCards.forEach((c, i) => c.position = i);

    // Progressive preloading:
    // 1. Start loading ALL images in background immediately (fire-and-forget)
    // 2. Wait for only the first small batch before showing the game
    // 3. Rest finish loading while the user is reading the board
    const uniqueUrls = [...new Set(
      shuffledCards.map(c => c.content).filter(c => c?.startsWith('http'))
    )];
    const FIRST_BATCH = Math.min(4, uniqueUrls.length);
    uniqueUrls.slice(FIRST_BATCH).forEach(preloadOne); // background, no await
    const batchReady = Promise.all(uniqueUrls.slice(0, FIRST_BATCH).map(preloadOne));
    await Promise.race([batchReady, new Promise(r => setTimeout(r, 2000))]);

    setCards(shuffledCards);
    setChoiceOne(null);
    setChoiceTwo(null);
    setDisabled(false);
    setMatches(0);
    setTime(0);
    setTurns(0);
    setRecapIndex(0);
    levelRecorded.current = false; // Reset for new game
    setMatchAnimationData(null);
    setGameLoading(false);
    setView('game');
  };

  // Game Loop
  const handleChoice = (card) => {
    choiceOne ? setChoiceTwo(card) : setChoiceOne(card);
  };

  useEffect(() => {
    if (choiceOne && choiceTwo) {
      setDisabled(true);
      if (choiceOne.item_id === choiceTwo.item_id) {
        playSound('match');
        const el1 = document.querySelector(`[data-card-id="${choiceOne.id}"]`);
        const el2 = document.querySelector(`[data-card-id="${choiceTwo.id}"]`);
        if (el1 && el2) {
          const r1 = el1.getBoundingClientRect();
          const r2 = el2.getBoundingClientRect();
          setMatchAnimationData({
            id: Date.now(),
            positions: [
              { x: r1.left + r1.width / 2, y: r1.top + r1.height / 2 },
              { x: r2.left + r2.width / 2, y: r2.top + r2.height / 2 },
            ],
          });
        }
        setCards(prevCards => {
          return prevCards.map(card => {
            if (card.item_id === choiceOne.item_id) {
              return { ...card, matched: true };
            }
            return card;
          });
        });
        setMatches(prev => prev + 1);
        resetTurn();
      } else {
        setTimeout(() => resetTurn(), 1000);
      }
    }
  }, [choiceOne, choiceTwo]);

  const resetTurn = () => {
    setChoiceOne(null);
    setChoiceTwo(null);
    setTurns(prevTurns => prevTurns + 1);
    setDisabled(false);
  };

  useEffect(() => {
    const settings = getDifficultySettings(difficulty);
    if (matches === settings.pairs && matches > 0 && !levelRecorded.current) {
      playSound('win');
      // Record level completion (only once)
      levelRecorded.current = true;
      const score = getLevelScore(difficulty);
      setLevelScore(score);
      setPreviousTotalScore(calculateTotalScore());
      recordLevelCompletion(selectedRemedy, difficulty, time);
      // Go to celebration screen first
      setTimeout(() => setView('celebration'), 1500);
    }
  }, [matches, difficulty, selectedRemedy, time, recordLevelCompletion, levelsCompleted]);

  useEffect(() => {
    const settings = getDifficultySettings(difficulty);
    let interval;
    if (view === 'game' && matches < settings.pairs) {
      interval = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [view, matches, difficulty]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const uiView = currentUser ? view : 'home';

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative bg-[#AEE2FF] overflow-hidden">

      {/* CSS Clouds Background - Hidden on mobile */}
      <div className="cloud cloud-1 -bottom-12 -left-12 z-0 opacity-50 hidden sm:block"></div>
      <div className="cloud cloud-2 -bottom-20 left-1/3 z-0 opacity-60 hidden sm:block"></div>
      <div className="cloud cloud-1 -bottom-10 -right-10 z-0 opacity-50 hidden sm:block"></div>

      {/* Floating Clouds Top - Hidden on mobile */}
      <div className="cloud cloud-1 top-20 -left-20 z-0 opacity-30 animate-float hidden sm:block" style={{ animationDuration: '8s' }}></div>
      <div className="cloud cloud-2 top-40 -right-20 z-0 opacity-30 animate-float hidden sm:block" style={{ animationDuration: '12s' }}></div>

      {/* Star Decoration */}
      <div className="absolute top-20 right-10 w-48 h-48 text-blue-400 opacity-20 z-0 hidden sm:block animate-pulse">
        <IconStar />
      </div>

      {/* Adaptive Container - Full width for game, constrained for menus */}
      <div className={`w-full h-[100dvh] relative z-10 flex flex-col overflow-hidden shadow-2xl sm:rounded-3xl sm:h-[95vh] sm:max-h-[950px] bg-[radial-gradient(ellipse_at_center,_#FFFFFF_0%,_#E6F4FF_50%,_#C5E8FF_100%)] sm:border-8 sm:border-white/80 ${uiView === 'game'
        ? difficulty === 'HARD'
          ? 'max-w-[1400px]'
          : difficulty === 'MEDIUM'
            ? 'max-w-[1100px]'
            : 'max-w-[700px]'
        : uiView === 'admin' || uiView === 'manageSymptoms'
          ? 'max-w-[1600px]'
          : 'max-w-[480px]'
        }`}>
        {currentUser && (
          <>
            {/* Left side buttons - Hide during game */}
            {view !== 'game' && view !== 'recap' && view !== 'scoreSummary' && (
              <div className="absolute top-3 left-3 z-30 flex gap-2">
                {/* Back to Home button - show on all views except home */}
                {view !== 'home' && (
                  <button
                    onClick={() => {
                      playSound('tap');
                      setView('home');
                    }}
                    className="bg-white p-2.5 rounded-full shadow-md hover:bg-gray-50 text-gray-700 hover:text-blue-600 border border-gray-200 transition-all active:scale-95"
                    title="Back to Home"
                  >
                    <IconArrowLeft />
                  </button>
                )}
                {/* Hamburger Menu */}
                <button
                  onClick={() => {
                    playSound('tap');
                    setMenuOpen(true);
                  }}
                  className="bg-white p-2.5 rounded-full shadow-md hover:bg-gray-50 text-gray-700 hover:text-blue-600 border border-gray-200 transition-all active:scale-95"
                  title="Menu"
                >
                  <IconMenu />
                </button>
              </div>
            )}

            {view !== 'recap' && view !== 'scoreSummary' && view !== 'game' && (
              <div className="absolute top-2 right-2 z-30 flex gap-1.5">
                {isAdmin && (
                  <button
                    onClick={() => {
                      playSound('tap');
                      setView('admin');
                    }}
                    className="bg-purple-500/90 text-white px-2.5 py-1.5 rounded-full shadow-sm hover:bg-purple-600 transition text-xs font-semibold"
                    title="Admin Dashboard"
                  >
                    🛡️
                  </button>
                )}
                <button
                  onClick={async () => {
                    playSound('tap');
                    await logout();
                  }}
                  className="bg-white/70 p-2 rounded-full shadow-sm hover:bg-white/90 transition"
                  title={currentUser?.email || 'Logout'}
                >
                  <IconLogout />
                </button>
              </div>
            )}

            {/* Side Menu */}
            <SideMenu
              isOpen={menuOpen}
              onClose={() => setMenuOpen(false)}
              setView={setView}
              onLogout={logout}
            />
          </>
        )}

        {showLoading || gameLoading ? (
          <LoadingAnimation />
        ) : !currentUser ? (
          <AnimatedPage key="auth">
            <AuthView />
          </AnimatedPage>
        ) : (
          <AnimatedPage key={view}>
            {view === 'home' && <HomeView setView={setView} />}
            {view === 'remedies' && <RemedyListView setView={setView} setSelectedRemedy={setSelectedRemedy} />}
            {view === 'difficulty' && <DifficultyView setView={setView} selectedRemedy={selectedRemedy} shuffleCards={shuffleCards} />}
            {view === 'game' && <GameView
              setView={setView}
              selectedRemedy={selectedRemedy}
              difficulty={difficulty}
              cards={cards}
              handleChoice={handleChoice}
              choiceOne={choiceOne}
              choiceTwo={choiceTwo}
              disabled={disabled}
              matches={matches}
              time={time}
              formatTime={formatTime}
              matchAnimationData={matchAnimationData}
              pointsPerSymptom={getDifficultySettings(difficulty).pointsPerSymptom}
            />}
            {view === 'celebration' && <CelebrationScreen
              selectedRemedy={selectedRemedy}
              difficulty={difficulty}
              time={time}
              formatTime={formatTime}
              cards={cards}
              onContinue={() => setView('recap')}
            />}
            {view === 'recap' && <RecapView
              setView={setView}
              selectedRemedy={selectedRemedy}
              difficulty={difficulty}
              recapIndex={recapIndex}
              setRecapIndex={setRecapIndex}
              cards={cards}
              levelScore={levelScore}
              pointsPerSymptom={getDifficultySettings(difficulty).pointsPerSymptom}
              onComplete={() => {
                unlockNextRemedy(selectedRemedy);
                setView('scoreSummary');
              }}
            />}
            {view === 'scoreSummary' && <ScoreSummaryScreen
              selectedRemedy={selectedRemedy}
              difficulty={difficulty}
              levelScore={levelScore}
              previousTotalScore={previousTotalScore}
              availableSymptomCount={availableSymptomCount}
              onNextLevel={(nextDifficulty) => shuffleCards(nextDifficulty)}
              onNextRemedy={() => {
                const currentIdx = REMEDY_ORDER.findIndex(
                  r => r.toLowerCase() === selectedRemedy?.toLowerCase()
                );
                const nextRemedy = REMEDY_ORDER[currentIdx + 1];
                if (nextRemedy) {
                  setSelectedRemedy(nextRemedy);
                  setView('difficulty');
                } else {
                  setView('remedies');
                }
              }}
              onFinish={() => setView('home')}
            />}
            {view === 'admin' && isAdmin && <AdminView setView={setView} />}
            {view === 'manageSymptoms' && isAdmin && <ManageSymptomsView setView={setView} />}
            {view === 'profile' && <ProfileView setView={setView} />}
            {view === 'howToPlay' && <HowToPlayView setView={setView} />}
            {view === 'scoreboard' && <ScoreboardView setView={setView} />}
          </AnimatedPage>
        )}
      </div>
    </div>
  );
};

export default App;
