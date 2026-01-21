
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatSection from './components/ChatSection';
import ImageSection from './components/ImageSection';
import { ViewType } from './types';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>(ViewType.CHAT);

  const renderContent = () => {
    switch (activeView) {
      case ViewType.CHAT:
        return <ChatSection />;
      case ViewType.IMAGE_GEN:
        return <ImageSection />;
      default:
        return <ChatSection />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <main className="flex-1 relative flex flex-col overflow-hidden">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
