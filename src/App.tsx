import React from 'react';
import { SovereignTerminal } from './components/SovereignTerminal';

const App: React.FC = () => {
  return (
    <main className="h-screen w-screen flex flex-col bg-[#020617] text-white overflow-hidden select-none">
      <SovereignTerminal />
    </main>
  );
};

export default App;
