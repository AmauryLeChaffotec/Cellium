import { SpreadsheetGrid } from './components/Grid';

function App() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 px-4 py-2">
        <h1 className="text-lg font-semibold text-gray-800">Cellium</h1>
      </header>
      <SpreadsheetGrid />
    </div>
  );
}

export default App;
