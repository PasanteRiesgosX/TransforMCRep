import { Outlet } from 'react-router-dom';
import AppHeader from './AppHeader';

export default function UserLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0e0e0e] text-white">
      <AppHeader />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
    </div>
  );
}
