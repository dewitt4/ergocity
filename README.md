# ErgoCity 🌆

**Experience the mathematical beauty of ergodicity in the digital frontier**

ErgoCity is an interactive web application that demonstrates the concept of **ergodicity** through a gamified blockchain experience. Learn about the fascinating differences between ensemble averages and time averages in multiplicative systems - a critical concept for understanding risk in finance, investing, and decision-making.

---

## 📚 Documentation for End Users

**New to ErgoCity?** Start here:

- **[Quick Start Guide](QUICK_START.md)** - Get started in 5 minutes! 🚀
- **[User Guide](USER_GUIDE.md)** - Complete walkthrough for non-technical users
  - Getting started
  - How to play (Simulation & Blockchain modes)
  - Understanding ergodicity
  - Step-by-step tutorials
  - Safety and best practices

- **[Business Overview](BUSINESS_OVERVIEW.md)** - Understand what ErgoCity does
  - What is ErgoCity?
  - Business value proposition
  - Target audience
  - Use cases and applications
  - Technology overview

- **[Frequently Asked Questions](FAQ.md)** - Quick answers to common questions
  - General questions
  - Getting started
  - Understanding the game
  - Troubleshooting
  - Privacy and security

---

## 🚀 Quick Start

### For Users (No Technical Skills Required)

1. Visit the ErgoCity application in your web browser
2. Start with **Simulation Mode** - no setup required!
3. Select a Risk Protocol (try LOW first)
4. Click "≫ ENTER SIMULATED GRID ≪"
5. Learn about ergodicity hands-on!

**Want to use Blockchain Mode?** See the [User Guide](USER_GUIDE.md) for wallet setup instructions.

---

## 🎯 What is Ergodicity?

**Ergodicity** is a mathematical property where the average outcome of a group at one time equals the average outcome of one individual over time.

**The ErgoCity Paradox**: In multiplicative systems (like this game, or real-world investing):
- The **Ensemble Average** (all players at once) can be positive
- The **Time Average** (one player over time) can be negative
- This means "good odds" don't guarantee long-term success!

This concept is crucial for understanding:
- Investment risk and portfolio management
- Business growth and scaling decisions
- Financial planning and risk management
- Why diversification and position sizing matter

---

## 🎮 Two Ways to Play

### Simulation Mode (Recommended for Beginners)
- ✅ No wallet or cryptocurrency needed
- ✅ Instant, free gameplay
- ✅ Perfect for learning
- ✅ Unlimited resets

### Blockchain Mode (Advanced)
- ✅ Transparent, verifiable outcomes
- ✅ On-chain score storage
- ✅ Contributes to global statistics
- ✅ Real blockchain experience
- ⚠️ Requires wallet + small MATIC fees

---

## 🛠️ Developer Setup

This is a [Next.js](https://nextjs.org) project built with React and Web3 integration.

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/dewitt4/ergocity.git
cd ergocity

# Install dependencies
npm install

# Set up environment variables (see .env.example)
cp .env.example .env.local
# Edit .env.local with your configuration

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=<deployed_contract_address>
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<your_walletconnect_project_id>
NEXT_PUBLIC_POLYGON_MAINNET_RPC_URL=<polygon_rpc_url>
NEXT_PUBLIC_TARGET_CHAIN_ID=137
```

### Build for Production

```bash
npm run build
npm run start
```

### Linting

```bash
npm run lint
```

---

## 🏗️ Technology Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS 4
- **Blockchain**: Polygon (MATIC), Solidity Smart Contract
- **Web3**: Web3.js, WalletConnect v2
- **Deployment**: Firebase, Vercel-ready

---

## 📖 Project Structure

```
ergocity/
├── src/
│   ├── pages/          # Next.js pages
│   ├── components/     # React components
│   ├── services/       # Web3 services
│   ├── abis/          # Smart contract ABIs
│   └── styles/        # CSS styles
├── public/            # Static assets
├── USER_GUIDE.md      # End-user documentation
├── BUSINESS_OVERVIEW.md # Business/product documentation
├── FAQ.md             # Frequently asked questions
└── README.md          # This file
```

---

## 🎓 Educational Use

ErgoCity is designed for educational purposes and is ideal for:
- **University courses** in finance, economics, or mathematics
- **Financial literacy programs**
- **Blockchain education**
- **Risk management training**
- **Behavioral economics research**

Educators: Feel free to use ErgoCity in your curriculum! See [BUSINESS_OVERVIEW.md](BUSINESS_OVERVIEW.md) for more details.

---

## 🔒 Security & Privacy

- **Non-custodial**: Your funds remain in your control
- **No personal data collection**: Only wallet addresses (public anyway)
- **Open and transparent**: Contract code is verifiable on-chain
- **Educational purpose**: Not designed for profit or gambling

See [FAQ.md](FAQ.md) for detailed security information.

---

## 🤝 Contributing

Contributions are welcome! Whether it's:
- Bug reports
- Feature suggestions
- Documentation improvements
- Educational content
- Code contributions

Please open an issue or pull request.

---

## 📄 License

This project is intended for educational and non-commercial use.

---

## 🌐 Learn More

### About Next.js
- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)

### About Ergodicity
- Search for "ergodicity economics"
- Explore "time average vs ensemble average"
- Learn about "Kelly Criterion" for applications

### About Blockchain
- [Polygon Network](https://polygon.technology/)
- [MetaMask Documentation](https://docs.metamask.io/)
- [Web3.js Documentation](https://web3js.readthedocs.io/)

---

## 📞 Support

- **For Users**: See [USER_GUIDE.md](USER_GUIDE.md) and [FAQ.md](FAQ.md)
- **For Developers**: Check the code documentation and open issues
- **For Business Inquiries**: See [BUSINESS_OVERVIEW.md](BUSINESS_OVERVIEW.md)

---

## 🎯 Mission

ErgoCity aims to make complex mathematical and financial concepts accessible through interactive, engaging experiences. We believe understanding ergodicity is crucial for making better financial decisions and managing risk in the real world.

**Enter the Grid. Learn the Math. Master the Risk.** 🌆✨

---

*Version 2.1.0 - Educational Platform for Understanding Ergodicity*
