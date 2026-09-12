import { createBrowserRouter, Navigate, useRouteError } from 'react-router-dom';
import { App } from './App';
import { LandingView } from './features/landing/LandingView';
import { ArenaView } from './features/arena/ArenaView';
import { RobotEditor } from './features/editor/RobotEditor';
import { ChallengesView } from './features/challenges/ChallengesView';
import { LeaderboardView } from './features/leaderboard/LeaderboardView';
import { MultiplayerView } from './features/multiplayer/MultiplayerView';
import { ProfileView } from './features/profile/ProfileView';
import { CaroView } from './features/caro/CaroView';
import { BridgeView } from './features/bridge/BridgeView';

const RootErrorBoundary: React.FC = () => {
  const error = useRouteError() as Error;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white font-sans">
      <div className="max-w-md w-full border border-black p-6 space-y-4">
        <div className="text-[11px] font-mono uppercase tracking-widest text-rose-600 font-bold">
          [ĐÃ XẢY RA LỖI TẠM THỜI]
        </div>
        <h2 className="text-xl font-extrabold text-black uppercase">
          Không thể tải giao diện
        </h2>
        <p className="text-xs font-mono text-neutral-600 bg-neutral-50 p-3 border border-neutral-200 overflow-auto max-h-32">
          {error?.message || 'Lỗi không xác định.'}
        </p>
        <button
          onClick={() => {
            window.location.href = '/';
          }}
          className="w-full py-2.5 bg-black text-white text-xs font-mono font-bold uppercase hover:bg-neutral-800 transition"
        >
          VỀ TRANG CHỦ & TẢI LẠI →
        </button>
      </div>
    </div>
  );
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <RootErrorBoundary />,
    children: [
      {
        index: true,
        element: <LandingView />,
      },
      {
        path: 'arena',
        element: <ArenaView />,
      },
      {
        path: 'online',
        element: <MultiplayerView />,
      },
      {
        path: 'caro',
        element: <CaroView />,
      },
      {
        path: 'bridge',
        element: <BridgeView />,
      },
      {
        path: 'editor',
        element: <RobotEditor />,
      },
      {
        path: 'challenges',
        element: <ChallengesView />,
      },
      {
        path: 'leaderboard',
        element: <LeaderboardView />,
      },
      {
        path: 'profile',
        element: <ProfileView />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
