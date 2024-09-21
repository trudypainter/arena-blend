export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const user1 = searchParams.get("user1");
  const user2 = searchParams.get("user2");
  const concurrencyLimit = parseInt(searchParams.get("concurrencyLimit")) || 5;
  const maxSortedChannels =
    parseInt(searchParams.get("maxSortedChannels")) || 15;

  if (!user1 || !user2) {
    return new Response(
      JSON.stringify({ error: "Both user1 and user2 parameters are required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const accessToken = process.env.ARENA_API_KEY;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const user1Blocks = await fetchUserBlocks(
          user1,
          accessToken,
          controller,
          concurrencyLimit,
          maxSortedChannels
        );
        const user2Blocks = await fetchUserBlocks(
          user2,
          accessToken,
          controller,
          concurrencyLimit,
          maxSortedChannels
        );

        const commonBlocks = findCommonBlocks(user1Blocks, user2Blocks);

        const finalData = JSON.stringify({
          commonBlocks,
          user1Blocks,
          user2Blocks,
        });
        controller.enqueue(`data: ${finalData}\n\n`);
        controller.close();
      } catch (error) {
        console.error("Error comparing blocks:", error);
        controller.enqueue(
          `data: ${JSON.stringify({
            error: "An error occurred while comparing blocks",
          })}\n\n`
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Content-Encoding": "none",
    },
  });
}

async function fetchUserBlocks(
  username,
  accessToken,
  controller,
  concurrencyLimit,
  maxSortedChannels
) {
  const blocksMap = new Map();

  try {
    // Fetch user data
    const userResponse = await fetch(
      `https://api.are.na/v2/users/${username}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    const userData = await userResponse.json();
    const userId = userData.id;

    // Fetch user's channels
    const channelsResponse = await fetch(
      `https://api.are.na/v2/users/${userId}/channels`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    const channelsData = await channelsResponse.json();

    // Filter and sort channels
    const filteredChannels = channelsData.channels.filter(
      (channel) => channel.published && channel.user_id === userId
    );
    const sortedChannels = filteredChannels
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, maxSortedChannels);

    const totalChannels = sortedChannels.length;

    // Send initial user start message
    controller.enqueue(
      `data: ${JSON.stringify({
        type: "userStart",
        username,
        totalChannels,
      })}\n\n`
    );

    // Initialize channel index counter
    let overallChannelIndex = 0;

    // Process channels concurrently in batches
    for (let i = 0; i < sortedChannels.length; i += concurrencyLimit) {
      const group = sortedChannels.slice(i, i + concurrencyLimit);
      await Promise.all(
        group.map((channel, index) => {
          // Calculate the overall channel index
          const channelIndex = i + index + 1;
          return processChannel(
            channel,
            channelIndex,
            totalChannels,
            username,
            accessToken,
            controller,
            blocksMap
          );
        })
      );
    }
  } catch (error) {
    console.error(`Error fetching blocks for user ${username}:`, error);
    controller.enqueue(
      `data: ${JSON.stringify({
        error: `Error fetching blocks for user ${username}`,
      })}\n\n`
    );
  }

  console.log(
    `Server: Fetched ${blocksMap.size} unique blocks for user ${username}`
  );

  // Convert the blocksMap values to an array before returning
  return Array.from(blocksMap.values());
}

async function processChannel(
  channel,
  channelIndex,
  totalChannels,
  username,
  accessToken,
  controller,
  blocksMap
) {
  try {
    // Fetch channel metadata to get total count
    const channelMetadataResponse = await fetch(
      `https://api.are.na/v2/channels/${channel.slug}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    const channelMetadata = await channelMetadataResponse.json();
    const pagesInChannel = Math.ceil(channelMetadata.length / 50);

    // Send channel start message
    controller.enqueue(
      `data: ${JSON.stringify({
        type: "channelStart",
        username,
        channelIndex,
        totalChannels,
        channelName: channel.slug,
        pagesInChannel,
      })}\n\n`
    );

    // Fetch all pages for this channel
    for (let page = 1; page <= pagesInChannel; page++) {
      await processPage(
        page,
        pagesInChannel,
        channel,
        channelIndex,
        totalChannels,
        username,
        accessToken,
        controller,
        blocksMap
      );
    }

    // Update the channel completion message
    controller.enqueue(
      `data: ${JSON.stringify({
        type: "channelComplete",
        username,
        channelIndex,
        totalChannels,
        channelName: channel.slug,
        pagesInChannel,
        pagesFetched: pagesInChannel, // Add this line
        blocksFetched: blocksMap.size,
      })}\n\n`
    );
  } catch (error) {
    console.error(`Error processing channel ${channel.slug}:`, error);
    controller.enqueue(
      `data: ${JSON.stringify({
        error: `Error processing channel ${channel.slug}`,
      })}\n\n`
    );
  }
}

async function processPage(
  page,
  pagesInChannel,
  channel,
  channelIndex,
  totalChannels,
  username,
  accessToken,
  controller,
  blocksMap
) {
  try {
    const channelBlocksResponse = await fetch(
      `https://api.are.na/v2/channels/${channel.slug}/contents?per=50&page=${page}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    const channelBlocksData = await channelBlocksResponse.json();
    const channelBlocks = channelBlocksData.contents;

    for (const block of channelBlocks) {
      const blockId = block.id;
      const blockSource = block.source?.url || null;
      const imageURL = block.image?.square?.url || null;
      const channelTitle = channel.title;

      if (blocksMap.has(blockId)) {
        // If the block already exists, add the channel title to the channels array if not already included
        const existingBlock = blocksMap.get(blockId);
        if (!existingBlock.channels.includes(channelTitle)) {
          existingBlock.channels.push(channelTitle);
        }
      } else {
        // Create a new block entry with the channels array
        blocksMap.set(blockId, {
          blockId: blockId,
          source: blockSource,
          imageURL: imageURL,
          channels: [channelTitle],
        });
      }
    }

    // Send channel progress update
    controller.enqueue(
      `data: ${JSON.stringify({
        type: "channelProgress",
        username,
        channelIndex,
        totalChannels,
        channelName: channel.slug,
        page,
        pagesInChannel,
        blocksFetched: blocksMap.size,
      })}\n\n`
    );
  } catch (error) {
    console.error(
      `Error processing page ${page} of channel ${channel.slug}:`,
      error
    );
    controller.enqueue(
      `data: ${JSON.stringify({
        error: `Error processing page ${page} of channel ${channel.slug}`,
      })}\n\n`
    );
  }
}

function findCommonBlocks(blocks1, blocks2) {
  const map1 = new Map();
  const excludedUrls = [
    "https://www.instagram.com/",
    "https://www.twitter.com/",
    "https://twitter.com/home",
    "https://www.tumblr.com/dashboard",
    "https://www.tumblr.com/explore/recommended-for-you",
    "https://www.tumblr.com/likes",
  ];

  // Create a map for blocks1 with blockId as key
  for (const block of blocks1) {
    map1.set(block.blockId, block);
  }

  const commonBlocksMap = new Map();

  console.log(
    `Comparing ${blocks1.length} blocks from user1 with ${blocks2.length} blocks from user2`
  );

  for (const block of blocks2) {
    const blockInMap1 = map1.get(block.blockId);

    let isCommon = false;
    let combinedChannels = [];

    // Check for match by blockId
    if (blockInMap1) {
      isCommon = true;
      combinedChannels = Array.from(
        new Set([...blockInMap1.channels, ...block.channels])
      );
      console.log(`✅ Match found by blockId: ${block.blockId}`);
      console.log(`User1 channels: ${blockInMap1.channels.join(", ")}`);
      console.log(`User2 channels: ${block.channels.join(", ")}`);
    } else if (block.source && !excludedUrls.includes(block.source)) {
      // If no match by blockId, check for match by source URL (excluding specified URLs)
      for (const b of map1.values()) {
        if (b.source && b.source === block.source) {
          isCommon = true;
          combinedChannels = Array.from(
            new Set([...b.channels, ...block.channels])
          );
          console.log(`⭐️ Match found by source URL: ${block.source}`);
          console.log(
            `User1 blockId: ${b.blockId}, User2 blockId: ${block.blockId}`
          );
          console.log(`User1 channels: ${b.channels.join(", ")}`);
          console.log(`User2 channels: ${block.channels.join(", ")}`);
          break;
        }
      }
    }

    if (isCommon) {
      commonBlocksMap.set(block.blockId, {
        blockId: block.blockId,
        source: block.source,
        imageURL: block.imageURL,
        channels: combinedChannels,
      });
    }
  }

  console.log(`Server: Found ${commonBlocksMap.size} common blocks`);

  // Return the common blocks as an array
  return Array.from(commonBlocksMap.values());
}
