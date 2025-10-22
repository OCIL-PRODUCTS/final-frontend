"use client";
import { useState, useEffect, useRef } from "react";
import "@/styles/liftai.css";

const MyTribes = () => {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: (
        `
          <p>🚀 Lift AI – Coming Soon!</p>
          <p>We’re working hard to bring Lift AI to life — your personal business companion right inside the app. With Lift AI, you’ll be able to:</p>
          <ul>
            <li>Generate Business Documents: Get important documents tailored to your business needs in minutes.</li>
            <li>Access Ready-to-Use Templates: Use practical business templates you can quickly fill out and adapt.</li>
            <li>Consult on Demand: Receive personalized business guidance for your unique challenges.</li>
          </ul>
          <p>Stay tuned — this feature is almost here, and it’s built to help you work smarter, not harder!</p>
        `
      ),
      timestamp: Date.now(),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // scroll down when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    const newMessage = {
      sender: "user",
      text,
      timestamp: Date.now(),
    };

    // 1) add user message
    setMessages((m) => [...m, newMessage]);
    setInput("");

    try {
      // Directly add bot message after user sends their message
      const botMessage = {
        sender: "bot",
        text: `
        <p>🚀 Lift AI – Coming Soon!</p>
        <p>We’re working hard to bring Lift AI to life — your personal business companion right inside the app. With Lift AI, you’ll be able to:</p>
        <ul>
          <li>Generate Business Documents: Get important documents tailored to your business needs in minutes.</li>
          <li>Access Ready-to-Use Templates: Use practical business templates you can quickly fill out and adapt.</li>
          <li>Consult on Demand: Receive personalized business guidance for your unique challenges.</li>
        </ul>
        <p>Stay tuned — this feature is almost here, and it’s built to help you work smarter, not harder!</p>
      `,
        timestamp: Date.now(),
      };

      // Add bot message instantly after the user message
      setMessages((prevMessages) => [...prevMessages, botMessage]);

    } catch (e) {
      // On error, replace with error message
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          sender: "bot",
          text: "Error—please try again.",
        };
        return copy;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div id="chat" className="--dark-theme chat-container">
        <div className="chat__conversation-board">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`chat__conversation-board__message-container ${msg.sender === "user" ? "reversed" : ""}`}
            >
              <div className="chat__conversation-board__message__person">
                <div className="chat__conversation-board__message__person__avatar">
                  <img
                    src={msg.sender === "user" ? "/assets/img/o_2.png" : "/assets/img/O.png"}
                    className="sender-img"
                    alt="Avatar"
                  />
                </div>
                <span className="chat__conversation-board__message__person__nickname">
                  {msg.sender === "user" ? "You" : "Lift AI"}
                </span>
              </div>
              <div className="chat__conversation-board__message__context d-flex align-items-center">
                <div className="chat__conversation-board__message__bubble">
                  <span dangerouslySetInnerHTML={{ __html: msg.text }} />
                </div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="chat__conversation-panel">
          <div className="chat__conversation-panel__container d-flex align-items-center w-100">
            <input
              className="chat__conversation-panel__input panel-item flex-grow-1"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
            />
            <button
              className="btn btn-primary ms-2"
              onClick={handleSend}
              disabled={loading}
            >
              <i className="fa fa-paper-plane" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MyTribes;