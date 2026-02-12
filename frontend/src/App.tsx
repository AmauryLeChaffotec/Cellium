import { SpreadsheetGrid } from './components/Grid';
import { CommandBar } from './components/CommandBar';
import { DiffOverlay, ActionBar } from './components/Diff';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

function App() {
  // Activate keyboard shortcuts (Escape, Ctrl+Enter)
  useKeyboardShortcuts();

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 px-4 py-2">
        <h1 className="text-lg font-semibold text-gray-800">Cellium</h1>
      </header>
      <CommandBar />
      <div className="relative">
        <SpreadsheetGrid />
        <DiffOverlay />
      </div>
      <ActionBar />
    </div>
  );
}

export default App;
