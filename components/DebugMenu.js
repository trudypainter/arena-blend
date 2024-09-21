const DebugMenu = ({
  isDebugMenuOpen,
  setIsDebugMenuOpen,
  concurrencyLimit,
  setConcurrencyLimit,
  maxSortedChannels,
  setMaxSortedChannels,
}) => {
  return (
    <div className="fixed top-2 right-2 border-[1.5px] border-gray-200 ">
      <button
        onClick={() => setIsDebugMenuOpen(!isDebugMenuOpen)}
        className="text-xs text-gray-600
        hover:text-gray-800
        font-mono px-2 py-1 bg-white"
      >
        {isDebugMenuOpen ? "Close" : "Advanced"}
      </button>
      {isDebugMenuOpen && (
        <div className="mt-1 bg-white px-2 pb-2">
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-mono">
              Concurrency Limit:
              <input
                type="number"
                value={concurrencyLimit}
                onChange={(e) => setConcurrencyLimit(Number(e.target.value))}
                className="w-12 ml-1 px-1 border-2 border-gray-200"
              />
            </label>
            <label className="text-xs font-mono">
              Max Channels:
              <input
                type="number"
                value={maxSortedChannels}
                onChange={(e) => setMaxSortedChannels(Number(e.target.value))}
                className="w-12 ml-1 px-1 border-2 border-gray-200"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugMenu;
