## ⚠️ lol this whole readme was generated with GPT-o1 (sorry miss gemini xx)

# Arena Blend

Welcome to **Arena Blend**, a tool designed to compare blocks from two Arena profiles efficiently. Explore and find overlapping content between users seamlessly.

## 🖥️ Live Demo

Visit my [are.na profile](https://www.trudy.computer) to see Arena Blend in action.

## 🔍 Overview

Arena Blend allows you to compare blocks from two different Arena users, identifying common content across their channels. The backend is optimized for performance, handling multiple operations concurrently to ensure quick results.

## 🚀 Features

- **Concurrent Processing:** Efficiently compares blocks from multiple channels simultaneously.
- **Customizable Limits:** Adjust concurrency and the number of channels to balance performance and resource usage.
- **Real-time Progress Tracking:** Monitor the comparison process with a dynamic progress log.

## 🛠️ Backend Logic

### 1. `compare-blocks.js`

This is the core of Arena Blend. It performs the following tasks:

- **Iterates Through Channels:** Fetches and processes channels for each user.
- **Processes Channel Contents:** Goes through each block within the channels.
- **Finds Overlapping Blocks:** Identifies common blocks between the two users.
- **Concurrency Management:** Handles multiple operations at the same time, with adjustable concurrency limits to optimize performance.

### 2. `channels.js`

This script serves as a test to ensure your API key is functioning correctly. It verifies the connection to the Arena API and fetches user channels, providing a reliable way to validate your setup.

## 📦 Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/yourusername/arena-blend.git
   ```

2. **Navigate to the Project Directory:**

   ```bash
   cd arena-blend
   ```

3. **Install Dependencies:**

   ```bash
   npm install
   ```

4. **Run the Development Server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## 🔑 API Key Setup

To use Arena Blend, you'll need an Are.na API key. Follow these steps to obtain and configure your API key:

1. **Get an API Key:**

   - Go to the [Are.na Developer Portal](https://dev.are.na/).
   - Log in to your Are.na account or create one if you haven't already.
   - Navigate to the "Applications" section.
   - Create a new application or use an existing one.
   - Copy the generated API key.

2. **Configure the API Key:**

   - In the root directory of the project, create a file named `.env.local` if it doesn't exist.
   - Add the following line to the `.env.local` file, replacing `YOUR_API_KEY` with the key you copied:

     ```
     ARENA_API_KEY=YOUR_API_KEY
     ```

3. **Restart Your Development Server:**
   - If your development server is running, stop it and start it again to load the new environment variable.

⚠️ **Important:** Never commit your `.env.local` file to version control. It's already included in the `.gitignore` file to prevent accidental commits.

For more information on Are.na's API, refer to their [API documentation](https://dev.are.na/documentation/channels).

## 🛠️ Configuration

- **API Key:** Ensure you have a valid Arena API key and set it in the appropriate configuration files.

- **Concurrency Limits:** Adjust the `concurrencyLimit` and `maxSortedChannels` in the frontend to optimize the comparison process based on your requirements.

## 🧰 Technologies Used

- **Frontend:** React, Next.js, Tailwind CSS
- **Backend:** Node.js, Next.js API Routes
- **Others:** Axios, Lodash

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## 📫 Contact

For any questions or feedback, feel free to reach out through my [are.na profile](https://www.trudy.computer).
