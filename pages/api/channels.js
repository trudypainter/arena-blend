import axios from "axios";

export default async function handler(req, res) {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: "Username parameter is required" });
  }

  const accessToken = "jOjmF09t2R8a_7pB-5u6VnexekhMzrtLoVVDoUityBg";

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
    const channels = channelsResponse.data;

    res.status(200).json({ channels });
  } catch (error) {
    console.error("Error fetching user channels:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching user channels" });
  }
}
