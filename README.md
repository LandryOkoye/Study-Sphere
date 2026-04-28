# Study-Sphere - Next-Generation Student Learning Platform

Study-Sphere is a modern, full-stack student learning platform built with Next.js, React, and TypeScript. By combining traditional educational tools with cutting-edge Web3 and AI integrations, Study-Sphere delivers a seamless, highly collaborative, and secure experience for students to access educational content and manage their learning journey.

---

##  What Makes Study-Sphere Different?

While most learning platforms rely on centralized servers and standard databases, Study-Sphere stands out through its innovative decentralized architecture and powerful AI capabilities.

### 1. Decentralized Storage (0G Storage)
We leverage **0G Storage** to ensure that user data and educational resources are highly secure, censorship-resistant, and permanently accessible. This decentralized approach eliminates single points of failure and provides a transparent, verifiable content ecosystem.

### 2. Powerful AI Integration (0G Compute & Qwen2.5)
The platform integrates advanced AI through **0G Compute** powering the **Qwen2.5** language model. Students can interact directly with our AI assistant within a dedicated study IDE. This assistant can explain complex topics, format mathematical equations beautifully using LaTeX, and adapt to individual learning paces.

### 3. Integrated Learning IDE
Unlike static reading platforms, Study-Sphere features an interactive **Study IDE**. Students can read textbook materials while chatting with our AI in a split-pane interface, enabling real-time learning and immediate Q&A without switching tabs.

### 4. Custom Study Libraries
Users can create curated "Libraries" from various topics, generating specialized, distraction-free study views. These custom libraries can be easily shared with peers via secure links.

---

##  Key Features

- **Web3 & Social Authentication**: Secure, flexible login using **Web3Auth**, supporting both traditional Google Sign-In and Web3 wallets like MetaMask.
- **Decentralized Infrastructure**: Content hosted securely via **0G Storage SDK**.
- **AI-Powered Study Assistant**: Context-aware AI chat powered by **0G Compute (Qwen2.5)** with rich markdown and LaTeX math support.
- **Interactive Library IDE**: Resizable split-pane interface linking course material and AI tools.
- **Secure Payments**: Robust **Interswitch Web Redirect Checkout** integration for premium access.
- **User-Friendly Interface**: Clean, responsive, and minimalist design optimized for all devices.

---

##  How to Use the Study IDE

The interactive IDE is the core of the Study-Sphere experience:

1. **Accessing the IDE**: Click on any course or textbook from your dashboard to enter the Study IDE.
2. **Split-Browser Workflow**: The screen is split into two resizable panels. Your reading material takes up the main view, while the AI Chat assistant is docked conveniently alongside it.
3. **Conversing with AI**: Ask the AI questions about the specific section you're reading. It utilizes context to provide accurate answers, complete with beautifully formatted mathematical expressions.
4. **Creating a Library**: Click "Create Library" at the top of the IDE to pull specific topics into a customized, focused study collection that you can easily share.

---

##  Tech Stack

- **Frontend**: Next.js (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Next.js API Routes
- **Authentication**: Web3Auth (v10)
- **Decentralization / AI**: 0G Storage SDK, 0G Compute (Qwen2.5)
- **Payments**: Interswitch API Integration
- **Build Tools**: ESLint, PostCSS

---

##  Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm, yarn, pnpm, or bun
- Valid environment variables for Web3Auth, Interswitch, and 0G services.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Chiamaka-odike/Stud.git
   cd Stud
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or yarn install / pnpm install / bun install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the root directory and add the necessary API keys for Web3Auth, Interswitch, and 0G SDKs based on `.env.example`.

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

---

##  Team Contributions

This project was developed collaboratively with clear role separation:

### **Frontend Development — Chiamaka Odike**
Designed and implemented the entire user interface, including:
- Overall user experience and application flow.
- Seamless Web3Auth wallet and social login integrations.
- The resizable, interactive Study IDE and custom library curation features.
- Clean, modern UI/UX principles utilizing Tailwind CSS.

### **Backend Development — Landry Okoye**
Handled all server-side logic and system functionality:
- Integrated the **Interswitch API** for secure, robust payment processing.
- Implemented core backend architecture, including the **0G Storage SDK** and **0G Compute** implementations.
- Developed RESTful APIs and managed backend services.
- Handled systemic data flow and server-side logic mechanisms.

---

##  Learn More

To learn more about the technologies used in this project:
- [Next.js Documentation](https://nextjs.org/docs)
- [0G Network](https://0g.ai/)
- [Web3Auth Documentation](https://web3auth.io/docs/)
- [Interswitch API Documentation](https://developer.interswitchgroup.com)

##  Deployment

The easiest way to deploy this Next.js application is using the [Vercel Platform](https://vercel.com).
Check the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for details.

##  License

This project is open-source and available under the MIT License.

##  Contributing & Contact

Contributions are welcome! Please feel free to submit a Pull Request or open an issue in the repository.

---
