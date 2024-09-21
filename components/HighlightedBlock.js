const HighlightedBlock = ({ block }) => {
  if (!block) return null;

  return (
    <div className="flex flex-col items-center bg-white py-6 border-2 border-gray-200 mt-2">
      <p className="text-xs font-mono text-gray-600 w-64 text-left">
        Block ID: {block.blockId}
      </p>
      {block.imageURL && (
        <img
          src={block.imageURL}
          alt={block.title}
          className="w-64 h-64 object-cover mb-2 bg-gray-100"
        />
      )}

      {block.channels && block.channels.length > 0 && (
        <div className="text-xs font-mono text-gray-600 mt-2 w-64">
          <p>Channels:</p>
          <ul className="flex flex-col space-y-1">
            {block.channels.map((channel, index) => (
              <li className="p-2 border-2 border-gray-200" key={index}>
                {channel}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default HighlightedBlock;
