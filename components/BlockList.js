const BlockList = ({ blocks, onBlockHover }) => {
  console.log("Blocks passed to BlockList:", blocks);

  return (
    <ul className="flex justify-start w-96 flex-wrap">
      {blocks.map((block) => (
        <li
          key={block.id}
          className="relative group cursor-pointer"
          onClick={() =>
            window.open(`https://www.are.na/block/${block.blockId}`, "_blank")
          }
          onMouseEnter={() => onBlockHover(block)}
          onMouseLeave={() => onBlockHover(null)}
        >
          <div className="w-3 h-3 mr-0.5 mb-0.5 bg-gray-300 rounded-full hover:bg-gray-500"></div>
        </li>
      ))}
    </ul>
  );
};

export default BlockList;
