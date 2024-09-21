import { useState, useEffect, useCallback, useRef } from "react";
import Head from "next/head";
import debounce from "lodash/debounce";
import BlockList from "../components/BlockList";
import UserInfo from "../components/UserInfo";
import HighlightedBlock from "../components/HighlightedBlock";
import DebugMenu from "../components/DebugMenu";

export default function Home() {
  const [user1, setUser1] = useState("");
  const [user1Info, setUser1Info] = useState(null);
  const [user2, setUser2] = useState("");
  const [user2Info, setUser2Info] = useState(null);
  const [user1Valid, setUser1Valid] = useState(null);
  const [user2Valid, setUser2Valid] = useState(null);
  const [user1Blocks, setUser1Blocks] = useState([]);
  const [user2Blocks, setUser2Blocks] = useState([]);
  const [commonBlocks, setCommonBlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progressData, setProgressData] = useState({});
  const progressRef = useRef(null);
  const [highlightedBlock, setHighlightedBlock] = useState(null);

  // Add a ref to store the current EventSource instance
  const eventSourceRef = useRef(null);

  const checkUserValidity = useCallback(
    debounce(async (username, setValidity, setUserInfo) => {
      console.log("Checking user validity for", username);
      if (username.length > 0) {
        try {
          const response = await fetch(
            `https://api.are.na/v2/users/${username}`
          );
          const data = await response.json();
          const avatar = data.avatar;

          if (avatar) {
            console.log("User is valid");
            setUserInfo(data);
            setValidity(true);
          } else {
            console.log("User is invalid");
            setValidity(false);
            setUserInfo(null);
          }
        } catch (error) {
          console.error("Error checking user validity:", error);
          setValidity(false);
          setUserInfo(null);
        }
      } else {
        setValidity(null);
        setUserInfo(null);
      }
    }, 300),
    []
  );

  useEffect(() => {
    checkUserValidity(user1, setUser1Valid, setUser1Info);
  }, [user1, checkUserValidity]);

  useEffect(() => {
    checkUserValidity(user2, setUser2Valid, setUser2Info);
  }, [user2, checkUserValidity]);

  useEffect(() => {
    if (progressRef.current) {
      progressRef.current.scrollTop = progressRef.current.scrollHeight;
    }
  }, [progressData]);

  useEffect(() => {
    // Cleanup on component unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (user1 && user2 && user1Valid && user2Valid) {
      // Close any existing EventSource to prevent overlapping
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      setLoading(true);
      setProgressData({});
      setUser1Blocks([]);
      setUser2Blocks([]);
      setCommonBlocks([]);

      const eventSource = new EventSource(
        `/api/compare-blocks?user1=${encodeURIComponent(
          user1
        )}&user2=${encodeURIComponent(
          user2
        )}&concurrencyLimit=${concurrencyLimit}&maxSortedChannels=${maxSortedChannels}`
      );

      // Store the new EventSource instance
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        // Ensure we only process messages from the current EventSource
        if (eventSource === eventSourceRef.current) {
          if (data.commonBlocks) {
            setUser1Blocks(data.user1Blocks);
            setUser2Blocks(data.user2Blocks);
            setCommonBlocks(data.commonBlocks);
            setLoading(false);
            eventSource.close();
            eventSourceRef.current = null;

            // Add these console logs
            console.log(`Client: User1 blocks: ${data.user1Blocks.length}`);
            console.log(`Client: User2 blocks: ${data.user2Blocks.length}`);
            console.log(`Client: Common blocks: ${data.commonBlocks.length}`);
            console.log(
              "Client: First 5 common blocks:",
              data.commonBlocks.slice(0, 5)
            );
          } else if (data.error) {
            console.error(data.error);
            setProgressData((prev) => ({
              ...prev,
              [data.username]: { error: data.error },
            }));
            setLoading(false);
            eventSource.close();
            eventSourceRef.current = null;
          } else {
            setProgressData((prevProgressData) => {
              const updatedProgressData = { ...prevProgressData };
              const username = data.username;

              if (data.type === "userStart") {
                updatedProgressData[username] = {
                  totalChannels: data.totalChannels,
                  channels: [],
                };
              } else if (
                data.type === "channelStart" ||
                data.type === "channelProgress" ||
                data.type === "channelComplete"
              ) {
                if (!updatedProgressData[username]) {
                  updatedProgressData[username] = { channels: [] };
                }

                // Ensure the channels array is initialized up to the current index
                const channelIndex = data.channelIndex - 1;
                if (!updatedProgressData[username].channels[channelIndex]) {
                  updatedProgressData[username].channels[channelIndex] = {};
                }

                updatedProgressData[username].channels[channelIndex] = {
                  ...updatedProgressData[username].channels[channelIndex],
                  channelName: data.channelName,
                  pagesFetched: data.pagesFetched || data.page || 0,
                  pagesInChannel: data.pagesInChannel,
                  blocksFetched: data.blocksFetched || 0,
                };
              }

              return updatedProgressData;
            });
          }
        } else {
          console.log("Ignoring message from an outdated EventSource");
        }
      };

      eventSource.onerror = (error) => {
        console.error("EventSource failed:", error);
        setLoading(false);
        eventSource.close();
        eventSourceRef.current = null;
      };
    }
  };

  const renderProgressLog = () => {
    return Object.entries(progressData).map(
      ([username, userProgress], index, array) => (
        <div key={username}>
          <strong>USER: {username}</strong>
          {userProgress.channels &&
            userProgress.channels.map((channel, idx) => (
              <div key={idx}>
                [{idx + 1}/{userProgress.totalChannels}] {channel.channelName}:
                [
                {Array(channel.pagesInChannel)
                  .fill("0")
                  .slice(0, channel.pagesFetched)
                  .join("")}
                {channel.pagesFetched < channel.pagesInChannel
                  ? Array(channel.pagesInChannel - channel.pagesFetched)
                      .fill("_")
                      .join("")
                  : ""}
                ]
              </div>
            ))}
          {userProgress.error && <div>Error: {userProgress.error}</div>}
          {index < array.length - 1 && <br />}{" "}
          {/* Add line break if not the last user */}
        </div>
      )
    );
  };

  const getBorderColor = (isValid) => {
    return "border-gray-300";
  };

  const [concurrencyLimit, setConcurrencyLimit] = useState(5);
  const [maxSortedChannels, setMaxSortedChannels] = useState(15);
  const [isDebugMenuOpen, setIsDebugMenuOpen] = useState(false);

  return (
    <>
      <Head>
        <title>Arena Block Comparison</title>
        <meta
          name="description"
          content="Compare blocks from two Arena profiles"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="pt-24">
        <DebugMenu
          isDebugMenuOpen={isDebugMenuOpen}
          setIsDebugMenuOpen={setIsDebugMenuOpen}
          concurrencyLimit={concurrencyLimit}
          setConcurrencyLimit={setConcurrencyLimit}
          maxSortedChannels={maxSortedChannels}
          setMaxSortedChannels={setMaxSortedChannels}
        />

        <section className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0 w-screen justify-center">
          <div>
            <input
              type="text"
              value={user1}
              onChange={(e) => setUser1(e.target.value)}
              placeholder="Enter first Arena username"
              required
              className={`px-4 py-2 border-[2px] rounded-full ${getBorderColor(
                user1Valid
              )} focus:outline-none`}
            />
            <UserInfo userInfo={user1Info} />
          </div>
          <div className="w-96 flex flex-col items-center justify-start">
            <button
              type="submit"
              className={`px-8 py-8 rounded-[50%] ${
                loading || !user1 || !user2 || !user1Valid || !user2Valid
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-[#ff60af] text-xl font-[cursive] text-white hover:bg-[#ff52ae] hover:scale-110 hover:shadow-lg hover:shadow-pink-300/50 hover:animate-wiggle"
              } transition-all duration-300 ease-in-out relative overflow-hidden group`}
              disabled={
                loading || !user1 || !user2 || !user1Valid || !user2Valid
              }
              onClick={handleSubmit}
            >
              <span className="relative z-10">
                {loading ? (
                  <span className="goofy-animation">
                    {"Comparing...".split("").map((char, index) => (
                      <span
                        key={index}
                        className="inline-block animate-goofy mr-[0.6px]"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        {char}
                      </span>
                    ))}
                  </span>
                ) : (
                  "Compare Blocks"
                )}
              </span>
              <span className="absolute inset-0 z-0 bg-[url('/sparkles.png')] bg-repeat opacity-0 group-hover:opacity-50 animate-twinkle"></span>
            </button>

            <div className="mt-8 w-96">
              {Object.keys(progressData).length > 0 && (
                <>
                  <div className="font-mono text-xs px-2 py-1 bg-gray-200 w-fit">
                    Progress
                  </div>
                  <div
                    ref={progressRef}
                    className="h-64 w-96 bg-gray-200 rounded-sm p-3 font-mono text-xs overflow-y-auto"
                  >
                    <pre>{renderProgressLog()}</pre>
                  </div>
                </>
              )}
            </div>
          </div>
          <div>
            <input
              type="text"
              value={user2}
              onChange={(e) => setUser2(e.target.value)}
              placeholder="Enter second Arena username"
              required
              className={`px-4 py-2 border-[2px] rounded-full ${getBorderColor(
                user2Valid
              )} focus:outline-none`}
            />
            <UserInfo userInfo={user2Info} />
          </div>
        </section>

        {user1Blocks.length > 0 && (
          <section className="flex w-fit space-x-4 mx-auto justify-center my-24">
            <div className="flex-1 max-w-md">
              <h2 className="text-xs font-mono mb-2">
                {user1}'s blocks: {user1Blocks.length}
              </h2>
              <BlockList
                blocks={user1Blocks}
                onBlockHover={setHighlightedBlock}
              />
            </div>
            <div className="flex-1 max-w-md">
              <h2 className="text-xs font-mono mb-2">
                Common blocks: {commonBlocks.length}
              </h2>
              <BlockList
                blocks={commonBlocks}
                onBlockHover={setHighlightedBlock}
              />
              <HighlightedBlock block={highlightedBlock} />
            </div>
            <div className="flex-1 max-w-md">
              <h2 className="text-xs font-mono mb-2">
                {user2}'s blocks: {user2Blocks.length}
              </h2>
              <BlockList
                blocks={user2Blocks}
                onBlockHover={setHighlightedBlock}
              />
            </div>
          </section>
        )}
      </main>
    </>
  );
}
