import axios from "axios";

export default async function handler(req, res) {
  const { user1, user2 } = req.query;

  if (!user1 || !user2) {
    return res
      .status(400)
      .json({ error: "Both user1 and user2 parameters are required" });
  }

  const accessToken = "jOjmF09t2R8a_7pB-5u6VnexekhMzrtLoVVDoUityBg";

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    // Fetch blocks for both users
    const user1Blocks = await fetchUserBlocks(user1, accessToken, res);
    const user2Blocks = await fetchUserBlocks(user2, accessToken, res);

    // Find common blocks between the two users
    const commonBlocks = findCommonBlocks(user1Blocks, user2Blocks);

    res.write(
      `data: ${JSON.stringify({ commonBlocks, user1Blocks, user2Blocks })}\n\n`
    );
    res.end();
  } catch (error) {
    console.error("Error comparing blocks:", error);
    res.write(
      `data: ${JSON.stringify({
        error: "An error occurred while comparing blocks",
      })}\n\n`
    );
    res.end();
  }
}

async function fetchUserBlocks(username, accessToken, res) {
  const blocksLog = [];

  try {
    const userResponse = await axios.get(
      `https://api.are.na/v2/users/${username}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const userId = userResponse.data.id;
    console.log("⭐️ Got userId", userId);

    const channelsResponse = await axios.get(
      `https://api.are.na/v2/users/${userId}/channels`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // Filter channels to only be ones created by the user AND that are public
    let filteredChannels = channelsResponse.data.channels.filter((channel) => {
      const isCreatedByUser = channel.user_id === userId;
      if (!isCreatedByUser) {
        console.log(
          `Eliminated channel: ${channel.slug} ${channel.user_id} (not created by ${username} ${userId})`
        );
      }
      if (!channel.published) {
        console.log(
          `Eliminated channel: ${channel.slug} because it's not public`
        );
      }
      return channel.published && isCreatedByUser;
    });

    // Sort channels by updated_at and take the top 20 most recently updated
    const sortedChannels = filteredChannels
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 20);

    // Iterate over the top 10 channels
    for (const channel of sortedChannels) {
      let page = 1;
      let hasMorePages = true;

      console.log("💡 starting new channel", channel.slug);
      while (hasMorePages && page <= 20) {
        // Fetch 50 blocks from the channel for the current page
        const channelBlocksResponse = await axios.get(
          `https://api.are.na/v2/channels/${channel.slug}/contents?per=50&page=${page}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        const channelBlocks = channelBlocksResponse.data.contents;

        // Log blocks with their id, the channel they belong to, and their source

        for (const block of channelBlocks) {
          // Check for whether there is a source
          let blockSource = null;
          if (block.source && block.source.url) {
            blockSource = block.source.url;
          }

          blocksLog.push({
            blockId: block.id,
            channelId: channel.id,
            channelName: channel.title,
            source: blockSource,
          });
        }
        console.log(
          "💞 got blocks for channel",
          channel.slug,
          page,
          channelBlocks.length
        );

        // Send progress update to the client
        res.write(
          `data: ${JSON.stringify({
            channel: channel.slug,
            page,
            blocks: channelBlocks.length,
          })}\n\n`
        );

        // Check if there are more pages
        hasMorePages = channelBlocks.length === 50;
        page++;
      }
    }
  } catch (error) {
    console.error(`Error fetching blocks for user ${username}:`, error);
  }

  return blocksLog;
}

function findCommonBlocks(blocks1, blocks2) {
  const map1 = new Map(blocks1.map((block) => [block.blockId, block]));

  // blocks can share either [1] the same ID or [2] the same source URL
  return blocks2.filter((block) => {
    const matchById = map1.has(block.blockId);
    const matchBySource = Array.from(map1.values()).some(
      (b) => b.source === block.source
    );
    return matchById || matchBySource;
  });
}
