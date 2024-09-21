import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import debounce from "lodash/debounce";

const BlockList = ({ blocks }) => (
  <ul className="space-y-4 justify-center items-center mt-12">
    {blocks.map((block) => (
      <li
        key={block.id}
        className="flex items-center justify-center relative group cursor-pointer"
        onClick={() =>
          window.open(`https://www.are.na/block/${block.id}`, "_blank")
        }
      >
        {block.imageUrl && (
          <>
            <img
              src={block.imageUrl}
              alt="Block thumbnail"
              className="w-32 h-32 object-cover mr-4 rounded"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span className="text-white text-sm font-semibold">
                {block.id}
              </span>
            </div>
          </>
        )}
      </li>
    ))}
  </ul>
);

const UserInfo = ({ userInfo }) => {
  return (
    <div className="flex flex-col justify-center items-center mt-4 text-sm space-y-2">
      {userInfo && (
        <img
          src={userInfo.avatar}
          className="w-12 h-12 border-[1px] border-gray-200 inline-block mr-2"
        />
      )}
      {userInfo && <span> {userInfo.full_name}</span>}
    </div>
  );
};

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (user1 && user2 && user1Valid && user2Valid) {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/compare-blocks?user1=${user1}&user2=${user2}`
        );
        const data = await response.json();
        setUser1Blocks(data.user1Blocks);
        setUser2Blocks(data.user2Blocks);
        setCommonBlocks(data.commonBlocks);
      } catch (error) {
        console.error("Error comparing blocks:", error);
      }
      setLoading(false);
    }
  };

  const getBorderColor = (isValid) => {
    if (isValid === null) return "border-gray-300";
    return isValid ? "border-green-500" : "border-red-500";
  };

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
      <main className=" pt-24 ">
        <section className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0 w-screen justify-center">
          <div>
            <input
              type="text"
              value={user1}
              onChange={(e) => setUser1(e.target.value)}
              placeholder="Enter first Arena username"
              required
              className={`px-4 py-2 border-2 rounded ${getBorderColor(
                user1Valid
              )} focus:outline-none`}
            />
            <UserInfo userInfo={user1Info} />
            <BlockList blocks={user1Blocks} />
          </div>
          <div>
            <button
              type="submit"
              className={`px-4 py-2 rounded ${
                loading || !user1 || !user2 || !user1Valid || !user2Valid
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
              disabled={
                loading || !user1 || !user2 || !user1Valid || !user2Valid
              }
              onClick={handleSubmit}
            >
              {loading ? "Comparing..." : "Compare Blocks"}
            </button>
            <BlockList blocks={commonBlocks} />
          </div>

          <div>
            <input
              type="text"
              value={user2}
              onChange={(e) => setUser2(e.target.value)}
              placeholder="Enter second Arena username"
              required
              className={`px-4 py-2 border-2 rounded ${getBorderColor(
                user2Valid
              )} focus:outline-none`}
            />
            <UserInfo userInfo={user2Info} />
            <BlockList blocks={user2Blocks} />
          </div>
        </section>
      </main>
    </>
  );
}
