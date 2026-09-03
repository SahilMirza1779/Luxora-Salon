import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import YouTube from "react-youtube";
import "./App.css";

const socket = io.connect("https://luxora-backend-odio.onrender.com");

function App() {
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  // Default false kiya taaki button pehle 'Play' icon dikhaye
  const [isPlaying, setIsPlaying] = useState(false);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  const [showInstall, setShowInstall] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  const [isMuted, setIsMuted] = useState(false);
  const [currentSongTitle, setCurrentSongTitle] = useState(
    "Ready - Tap Play ▶️",
  );

  const [isRaining, setIsRaining] = useState(false);

  const playerRef = useRef(null);
  const rainAudio = useRef(
    new Audio(
      "https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1132a.mp3?filename=heavy-rain-nature-sounds-8186.mp3",
    ),
  );

  useEffect(() => {
    const rain = rainAudio.current;
    rain.loop = true;

    socket.on("user_count", (count) => setOnlineUsers(count));
    socket.on("receive_message", (data) => setChat((prev) => [...prev, data]));

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      socket.off("user_count");
      socket.off("receive_message");
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      rain.pause();
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        console.log("User accepted the install prompt");
      }
      setDeferredPrompt(null);
      setShowInstall(false);
    } else {
      closeAllPopups();
      setIsInstallModalOpen(true);
    }
  };

  const onPlayerStateChange = (event) => {
    // 1 = Playing, 2 = Paused
    if (event.data === 1) {
      setCurrentSongTitle(event.target.getVideoData().title);
      setIsPlaying(true);
    } else if (event.data === 2) {
      setIsPlaying(false);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      socket.emit("send_message", {
        text: message,
        sender: "Guest" + Math.floor(Math.random() * 100),
      });
      setMessage("");
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    } else {
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  const nextSong = () => {
    if (playerRef.current) playerRef.current.nextVideo();
  };

  const toggleMute = () => {
    if (isMuted) playerRef.current.unMute();
    else playerRef.current.mute();
    setIsMuted(!isMuted);
  };

  const toggleRain = () => {
    if (isRaining) rainAudio.current.pause();
    else rainAudio.current.play();
    setIsRaining(!isRaining);
  };

  const handleShare = async () => {
    const shareData = {
      title: "Luxora Salon",
      text: "Listen to premium ambient radio 24/7!",
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log("Share cancelled", error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const closeAllPopups = () => {
    setIsChatOpen(false);
    setIsAboutOpen(false);
    setIsFaqOpen(false);
    setIsSupportOpen(false);
    setIsInstallModalOpen(false);
  };

  const renderRaindrops = () => {
    return (
      <div className="rain-container">
        {[...Array(150)].map((_, i) => (
          <div
            key={i}
            className="drop"
            style={{
              left: `${Math.random() * 100}vw`,
              animationDuration: `${0.2 + Math.random() * 0.4}s`,
              animationDelay: `${Math.random() * 1}s`,
            }}
          ></div>
        ))}
      </div>
    );
  };

  const isAnyPopupOpen =
    isChatOpen ||
    isAboutOpen ||
    isFaqOpen ||
    isSupportOpen ||
    isInstallModalOpen;

  return (
    <div
      className={`luxora-container ${isAnyPopupOpen ? "popup-active" : ""}`}
      style={{ backgroundImage: `url(/bg.jpg)` }}
    >
      <div className="bg-overlay"></div>
      {isRaining && renderRaindrops()}

      <header className="header">
        <div className="live-badge">🟢 {onlineUsers} online</div>
        <div className="nav-links">
          <span
            onClick={() => {
              closeAllPopups();
              setIsAboutOpen(true);
            }}
          >
            About
          </span>
          <span
            onClick={() => {
              closeAllPopups();
              setIsFaqOpen(true);
            }}
          >
            FAQ
          </span>
          <span
            className="support-btn"
            onClick={() => {
              closeAllPopups();
              setIsSupportOpen(true);
            }}
          >
            ❤️ Support us
          </span>
        </div>
      </header>

      <div className="center-content">
        <h1 className="main-title">लक्सोरा</h1>
        <h1 className="main-subtitle">सैलून</h1>
        <button
          className="chat-toggle-btn"
          onClick={() => {
            closeAllPopups();
            setIsChatOpen(true);
          }}
        >
          💬 Live Chat{" "}
          {chat.length > 0 && <span className="chat-badge">{chat.length}</span>}
        </button>
      </div>

      <div style={{ display: "none" }}>
        <YouTube
          opts={{
            playerVars: {
              autoplay: 1,
              listType: "playlist",
              list: "PLVj13wxnoNgc",
              index: 0,
            },
          }}
          onReady={(e) => {
            playerRef.current = e.target;
            e.target.setVolume(70);
            // Auto-play remove kiya taaki mobile crash na kare, user khud play karega
          }}
          onStateChange={onPlayerStateChange}
        />
      </div>

      {isChatOpen && (
        <div className="info-modal chat-popup">
          <div className="modal-header">
            <span>💬 Live Chat</span>
            <button
              className="close-modal"
              onClick={() => setIsChatOpen(false)}
            >
              ✖
            </button>
          </div>
          <div className="chat-box">
            {chat.map((msg, idx) => (
              <div key={idx} className="chat-message">
                <strong>{msg.sender}:</strong> {msg.text}
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} className="chat-form">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="chat-input"
            />
          </form>
        </div>
      )}

      {isAboutOpen && (
        <div className="info-modal">
          <div className="modal-header">
            <span>ℹ️ About Luxora Salon</span>
            <button
              className="close-modal"
              onClick={() => setIsAboutOpen(false)}
            >
              ✖
            </button>
          </div>
          <div className="modal-body">
            <p>
              <strong>Luxora Salon</strong> is a premium ambient radio
              experience recreating the nostalgic vibes of a 2000s Indian salon.
            </p>
            <br />
            <p>
              Developed with ❤️ by <strong>Sahil Intekhab Mirza</strong> using
              the MERN stack and Socket.io.
            </p>
          </div>
        </div>
      )}

      {isFaqOpen && (
        <div className="info-modal">
          <div className="modal-header">
            <span>❓ FAQ</span>
            <button className="close-modal" onClick={() => setIsFaqOpen(false)}>
              ✖
            </button>
          </div>
          <div className="modal-body">
            <p>
              <strong>Is this free?</strong>
              <br />
              Yes, 100% free and ad-free experience.
            </p>
            <br />
            <p>
              <strong>How do I change songs?</strong>
              <br />
              Use the next (⏭) button on the bottom player.
            </p>
            <br />
            <p>
              <strong>What technologies were used?</strong>
              <br />
              React.js, Node.js, Socket.io, and YouTube API.
            </p>
          </div>
        </div>
      )}

      {isSupportOpen && (
        <div className="info-modal">
          <div className="modal-header">
            <span>❤️ Support Luxora</span>
            <button
              className="close-modal"
              onClick={() => setIsSupportOpen(false)}
            >
              ✖
            </button>
          </div>
          <div className="modal-body" style={{ textAlign: "center" }}>
            <p>
              Agar aapko ye ambient vibes pasand aayi, toh server cost ke liye
              thoda support kar sakte hain! ☕
            </p>
            <br />
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=sahil@upi&pn=Sahil"
              alt="UPI QR Code"
              style={{
                borderRadius: "10px",
                marginBottom: "15px",
                border: "2px solid #d4af37",
              }}
            />
            <p>
              <strong>UPI ID:</strong> sahil@okaxis
            </p>
          </div>
        </div>
      )}

      {isInstallModalOpen && (
        <div className="info-modal">
          <div className="modal-header">
            <span>📥 Install Luxora Salon App</span>
            <button
              className="close-modal"
              onClick={() => setIsInstallModalOpen(false)}
            >
              ✖
            </button>
          </div>
          <div className="modal-body">
            <p>
              App ko apne device par install karne ke liye niche diye gaye steps
              follow karein:
            </p>
            <br />
            <p>
              1. Apne browser ke top-right corner me bane{" "}
              <strong>3 Dots (Menu)</strong> par click karein.
            </p>
            <p>
              2. <strong>"Install Luxora Salon..."</strong> ya{" "}
              <strong>"Add to Home Screen"</strong> ka option select karein.
            </p>
            <p>3. Confirm karein aur app aapke system par install ho jayegi!</p>
          </div>
        </div>
      )}

      <div className="bottom-wrapper">
        <div className="floating-actions">
          <button
            className={`action-btn ${isRaining ? "active" : ""}`}
            onClick={toggleRain}
          >
            🌧️ Baarish?
          </button>
          <button className="action-btn" onClick={handleShare}>
            💬 Share
          </button>
        </div>

        {showInstall && (
          <div className="install-banner">
            <div className="install-info">
              <img src="/logo.png" alt="App Icon" className="app-icon" />
              <div>
                <strong>Install Our APP</strong>
                <p>One tap listen anywhere.</p>
              </div>
            </div>
            <div className="install-actions">
              <button className="install-btn" onClick={handleInstallClick}>
                📥 Install
              </button>
              <button
                className="close-banner"
                onClick={() => setShowInstall(false)}
              >
                ✖
              </button>
            </div>
          </div>
        )}

        <div className="bottom-player">
          <div className="song-info">
            <img src="/logo.png" alt="thumbnail" className="song-thumb" />
            <div className="song-details">
              <h4>Luxora Salon Mix</h4>
              <p className="song-marquee">{currentSongTitle}</p>
            </div>
          </div>
          <div className="player-controls">
            <button className="control-btn" onClick={togglePlay}>
              {isPlaying ? "⏸" : "▶️"}
            </button>
            <button className="control-btn" onClick={nextSong}>
              ⏭
            </button>
            <button className="control-btn" onClick={toggleMute}>
              {isMuted ? "🔇" : "🔊"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
