"use client";
import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { getChatLobby, fetchMe, createChatLobbyRequest, getUsersInfoChat } from "../../app/api"; // Adjust paths as needed
import moment from "moment";
import $ from "jquery";
import Script from "next/script";
import "../../styles/admin_assets/css/app.min.css";
import "../../styles/admin_assets/css/components.css";
import EmojiPicker from 'emoji-picker-react';
import { BsEmojiSmile } from 'react-icons/bs';


// Base endpoint (adjust as needed)
const BASE_ENDPOINT =
  process.env.NEXT_PUBLIC_BASE_ENDPOINT;

const SOCKET_ENDPOINT =
  process.env.NEXT_PUBLIC_BASE_ENDPOINT_SOCKET;

// Date separator component
const DateSeparator = ({ label }) => (
  <div style={{ textAlign: 'center', margin: '10px 0' }}>
    <span
      style={{
        background: '#e0e0e0',
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '0.7em',
        color: '#555',
      }}
    >
      {label}
    </span>
  </div>
);

// Get human-friendly date
const getDateLabel = (timestamp) => {
  const msgDate = moment(timestamp);
  if (msgDate.isSame(moment(), 'day')) return 'Today';
  if (msgDate.isSame(moment().subtract(1, 'day'), 'day')) return 'Yesterday';
  return msgDate.format('MMMM D, YYYY');
};

function getFilenameFromUrl(url) {
  try {
    // decodeURI so “%20” → spaces etc.
    const pathname = new URL(url).pathname;
    const raw = decodeURIComponent(pathname.split('/').pop());
    return raw;   // e.g. "1747789783494-…-Sid Meier's Civilization 6 [FitGirl Repack].torrent"
  } catch {
    return '';
  }
}
function makeFallbackName() {
  return `Download-File-${moment().format("YYYYMMDD-HHmmss")}`;
}


export default function ChatAppMerged() {
  // Chat state
  const [authUser, setAuthUser] = useState(null);
  const [credentials, setCredentials] = useState({
    name: "",
    room: "", // this is the chat lobby ID
    userId: "",
  });
  const [socket, setSocket] = useState(null);
  const [chats, setChats] = useState([]);
  const [input, setInput] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenCount, setUnseenCount] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const chatContentRef = useRef(null);
  const [hasMore, setHasMore] = useState(true);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [caption, setCaption] = useState("");
  const [reply_image, setReplyImage] = useState(false);
  const [reply_video, setReplyVideo] = useState(false);
  const [reply_file, setReplyFile] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editedText, setEditedText] = useState('');
  const [forwardMessage, setForwardMessage] = useState('');
  const [forwardFile, setForwardFile] = useState('');
  const [forwardImage, setForwardImage] = useState(false);
  const [forwardVideo, setForwardVideo] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]); // array of selected message ids
  const [topDropdownOpen, setTopDropdownOpen] = useState(false); // if you have top chat dropdown

  const isSelected = (id) => selectedIds.includes(id);

  // toggle single message selection
  const toggleSelectMessage = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // enter selection mode and optionally select a message immediately
  const enterSelectionMode = (initialId = null) => {
    setSelectionMode(true);
    if (initialId) {
      setSelectedIds((prev) => (prev.includes(initialId) ? prev : [...prev, initialId]));
    }
  };

  // exit and clear
  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds([]);
  };

  // --- Bulk actions ---
  const performBulkDeleteForMe = () => {
    // use your existing deleteForMe API for each selected message
    for (const id of selectedIds) {
      try {
        deleteForMe(id, credentials.userId, credentials.room);
      } catch (err) {
        console.error("Delete for me failed for", id, err);
      }
    }
    exitSelectionMode();
  };

  const performBulkCopy = async () => {
    // Build copy text in chat order; skip file messages entirely
    let out = "";
    for (const chat of chats) {
      if (isSelected(chat.id) && chat.type === "text") {
        // format requested: Username: (newline) Message (then a blank line)
        out += `${chat.from}:\n${chat.text}\n\n`;
      }
    }
    out = out.trim(); // remove final trailing blank line
    if (!out) {
      // Nothing to copy (maybe user selected only files)
      // Optionally alert user — or just return
      console.warn("Nothing to copy (no text messages selected).");
      return;
    }

    // Try to use navigator.clipboard, fallback to your helper copyToClipboard if available
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(out);
      } else if (typeof copyToClipboard === "function") {
        copyToClipboard(out);
      } else {
        // fallback: create textarea
        const ta = document.createElement("textarea");
        ta.value = out;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      // optionally show toast/notification that copy succeeded
      exitSelectionMode();
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  // --- Hook to handle Escape key to cancel selection mode (optional) ---
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && selectionMode) exitSelectionMode();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectionMode]);

  const handleEditMessage = (chat) => {
    // Set the message being edited and pre-fill the text
    setEditingMessageId(chat.id);
    setEditedText(chat.text);  // Pre-fill the current message text
  };

  const handleCaptionChange = (event) => {
    setCaption(event.target.value); // Update the caption state
  };

  const handleReplyPreview = (replyUrl) => {
    const isReplyImg = /\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(replyUrl);
    const isReplyVid = /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(replyUrl);
    const isReplyFile = !isReplyImg && !isReplyVid && replyUrl;

    setReplyImage(isReplyImg);
    setReplyVideo(isReplyVid);
    setReplyFile(isReplyFile);
  };

  const handleReplyPreviewOff = () => {

    setReplyImage(null);
    setReplyVideo(null);
    setReplyFile(null);
  };

  // Call-related state
  const [searchTerm, setSearchTerm] = useState("");
  const [friendsIds, setFriendsIds] = useState([]);        // raw IDs from fetchMe
  const [searchFriends, setSearchFriends] = useState([]);  // friend‐info for display
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  // ── New for Enlarging Images ──
  const [enlargedImageUrl, setEnlargedImageUrl] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [deletedMessages, setDeletedMessages] = useState([]);

  const [replyingTo, setReplyingTo] = useState(null);

  // call to start a reply
  const handleStartReply = (chat) => {
    // defaults
    let replyValue = chat.text || (chat.caption ?? '') || '';
    let replyMedia = !!chat.reply_media; // prefer existing flag if present
    let replyUrl = null;
    let replyFilename = '';


    // handle file-type messages
    if (chat.type === "file") {
      const trimmedUrl = (chat.url || "").trim();
      const absoluteUrl = /^https?:\/\//.test(trimmedUrl)
        ? trimmedUrl
        : `${BASE_ENDPOINT}/uploads/${trimmedUrl}`;

      // derive filename
      replyFilename = (absoluteUrl.split('/').pop() || '').split('?')[0] || '';

      // if image or video, use URL; otherwise use filename
      if (chat.isImage || chat.isVideo) {
        replyValue = absoluteUrl;
        replyMedia = true;
        replyUrl = absoluteUrl;
      } else {
        replyValue = replyFilename || (chat.caption ?? '') || '';
        replyMedia = true; // you said "if replying to file make reply media true"
        replyUrl = null;
      }
    }

    setReplyingTo({
      reply_id: chat.id,
      reply_userid: chat.senderId,
      reply: replyValue,
      reply_username: chat.senderUsername || chat.from || '',
      reply_media: replyMedia,
      // helper client-only fields for preview
      reply_url: replyUrl,
      reply_filename: replyFilename,
    });

    setOpenDropdown(null);
    // optional focus:
    // const ta = document.querySelector('#chat-form textarea'); if (ta) ta.focus();
  };


  // cancel reply
  const handleCancelReply = () => setReplyingTo(null);


  // Toggle dropdown visibility
  const toggleDropdown = (chatId, e) => {
    e.stopPropagation(); // Prevent event from bubbling up to parent
    setOpenDropdown(openDropdown === chatId ? null : chatId);
  };

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (e.target.closest('.message-container') === null) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick); // Cleanup
  }, []);

  // Add emoji to input
  const handleEmojiClick = (emojiObject) => {
    setInput(prev => prev + emojiObject.emoji);
  };

  const handleSaveEdit = (chatId) => {
    // Trigger socket event to save the edited message
    socket.emit('editMessage', {
      messageId: chatId,
      newText: editedText,
      userId: credentials.userId,
      chatLobbyId: credentials.room,
    }, (error, success) => {
      if (error) {
        console.error('Error editing message:', error);
      } else {
        console.log('Message edited successfully:', success);
        setEditingMessageId(null); // Reset editing mode
      }
    });
  };
  const handleCancelEdit = () => {
    setEditingMessageId(null); // Reset editing mode without saving
  };


  const deleteForMe = async (messageId, senderId, roomId) => {
    try {
      // Call your backend API to perform the deletion logic
      const response = await fetch(`${BASE_ENDPOINT}/messages/${messageId}/delete-for-me`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageId,  // Pass the message ID
          senderId,   // Pass the sender ID
          userId: credentials.userId, // Pass the current user's ID
          chatLobbyId: roomId,
        }),
      });
      setDeletedMessages((prevDeletedMessages) => [
        ...prevDeletedMessages,
        messageId,
      ]);

    } catch (error) {
      console.error("Error in deleteForMe:", error);
    }
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const audioRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filteredUsers = users.filter((usr) => {
    // Check if participants[1] exists
    const participant = usr.participants[1];
    if (!participant) return false; // Return false if participant[1] is undefined

    const firstName = participant.firstName || "";
    const lastName = participant.lastName || "";
    const fullName = (firstName + " " + lastName).toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  useEffect(() => {
    // If there’s a non‐empty search term AND no lobby matches, fetch friends
    if (searchTerm && filteredUsers.length === 0 && friendsIds.length) {
      getUsersInfoChat(friendsIds).then((allFriends) => {
        const lower = searchTerm.toLowerCase();
        setSearchFriends(
          allFriends
            .filter(u =>
              `${u.firstName} ${u.lastName}`.toLowerCase().includes(lower)
            )
            .sort((a, b) =>
              a.firstName.localeCompare(b.firstName) ||
              a.lastName.localeCompare(b.lastName)
            )
        );
      });
      return;
    }

    // Otherwise, if we previously had searchFriends, clear them exactly once
    if (searchFriends.length > 0) {
      setSearchFriends([]);
    }
  }, [searchTerm, filteredUsers, friendsIds, searchFriends]);



  const handleFriendClick = async (friend) => {
    if (!authUser) {
      console.error("User not authenticated");
      return;
    }
    try {
      const { chatLobbyId } = await createChatLobbyRequest(authUser._id, friend._id);
      window.location.href = `/profile/chat`;
    } catch (error) {
      console.error("Error starting chat", error);
    }
  };




  // Handler for the message textarea key down
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      // Prevent new line and send message on Enter
      e.preventDefault();
      handleMessageSubmit(e);
    }
    // Shift+Enter will naturally create a new line in a textarea
  };

  const deleteChatForUser = async (chatLobbyId, currentUserId) => {
    try {
      const response = await axios.post(
        `${BASE_ENDPOINT}/auth/delete-chat-for-user`,
        {
          chatLobbyId,
          userId: currentUserId // Pass the current user id explicitly
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access-token")}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting chat for user:", error);
      throw error;
    }
  };


  const handleDeleteChat = async (chatLobbyId, currentUserId) => {
    try {
      const data = await deleteChatForUser(chatLobbyId, currentUserId);
      setCredentials((prev) => ({ ...prev, room: null }));

      // Refresh page after successful deletion
      window.location.reload();
    } catch (error) {
      console.error("Failed to delete chat lobby for user", error);
    }
  };



  // Format seconds to mm:ss
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Helper: Choose a supported MIME type for recording
  const getSupportedMimeType = () => {
    const mimeTypes = [
      "audio/ogg; codecs=opus",
      "audio/webm; codecs=opus",
      "audio/webm",
    ];
    for (let type of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return "";
  };

  const deleteMessageSocket = (messageId, deleteType, chatLobbyId, userId, time) => {
    if (socket) {
      socket.emit("deleteMessage", { messageId, deleteType, chatLobbyId, userId, time }, (err) => {
        if (!err) {
          // Remove message from state immediately after deletion
          setChats((prevChats) => prevChats.filter(msg => msg.id !== messageId));
        } else {
          console.error("Error deleting message via socket:", err);
        }
      });
    }
  };


  // Fetch authenticated user info.
  useEffect(() => {
    const getMe = async () => {
      try {
        const me = await fetchMe();
        if (me && me.username) {
          setAuthUser(me);
          setCredentials((prev) => ({
            ...prev,
            name: me.username,
            userId: me._id,
          }));
          setFriendsIds(me.mytribers || []);
        }
      } catch (error) {
        console.error("Error fetching authenticated user:", error);
      }
    };
    getMe();
  }, []);

  // Fetch list of users.
  useEffect(() => {
    const getUsers = async () => {
      try {
        const data = await getChatLobby();
        setUsers(data);
      } catch (error) {
        console.error("Failed to fetch users", error);
      }
    };
    getUsers();
  }, []);

  const isMessageEditable = (sentAt) => {
    const now = new Date();
    const messageTime = new Date(sentAt);
    const timeDiff = now - messageTime; // Time difference in milliseconds
    const sevenMinutes = 7 * 60 * 1000;
    return timeDiff <= sevenMinutes; // Check if the message is within 7 minutes
  };


  const downloadFile = async (url, providedName) => {
    try {
      // pick providedName if it already has an extension, otherwise extract real:
      const realName = getFilenameFromUrl(url);
      const fileName = providedName && /\.[a-z0-9]+$/i.test(providedName)
        ? providedName
        : (realName || makeFallbackName());

      const finalUrl = url.includes("storage.googleapis.com")
        ? `${BASE_ENDPOINT}/proxy-download?fileUrl=${encodeURIComponent(url)}`
        : url;

      const response = await fetch(finalUrl);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const [page, setPage] = useState(0);
  // Fetch chat history when a chat lobby is set.
  useEffect(() => {
    if (!credentials.room) return;
    const fetchMessages = async () => {
      const el = chatContentRef.current;
      let previousHeight = 0;
      if (el && page > 0) previousHeight = el.scrollHeight;

      setIsLoading(true);
      try {
        const { data } = await axios.get(
          `${BASE_ENDPOINT}/auth/chat-messages/${credentials.room}?userId=${credentials.userId}&page=${page}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem("access-token")}` } }
        );
        const msgs = data.messages.map((msg) => {
          const trimmed = (msg.fileUrl || "").trim();
          const fileUrl = /^https?:\/\//.test(trimmed) ? trimmed : `${BASE_ENDPOINT}/uploads/${trimmed}`;

          // compute reply helper fields (server may already provide reply_media)
          const replyMediaFlag = !!msg.reply_media;
          let reply_url = null;
          let reply_filename = '';

          if (msg.reply) {
            if (replyMediaFlag || /^https?:\/\//.test(String(msg.reply))) {
              reply_url = /^https?:\/\//.test(String(msg.reply)) ? msg.reply : `${BASE_ENDPOINT}/uploads/${msg.reply}`;
              reply_filename = (reply_url.split('/').pop() || '').split('?')[0];
            } else {
              reply_filename = String(msg.reply);
            }
          }

          return {
            id: msg._id,
            text: msg.message,
            from: msg.sender.username || msg.sender,
            senderId: msg.sender._id || msg.sender,
            time: moment(msg.sentAt).format("hh:mm"),
            timestamp: msg.sentAt,
            senderUsername: msg.sender.username || msg.sender,
            type: msg.type || "text",
            seen: msg.seen,
            url: msg.fileUrl,
            caption: msg.caption,
            // reply fields
            reply_id: msg.reply_id || null,
            reply_userid: msg.reply_userid || null,
            reply: msg.reply || null,
            reply_username: msg.reply_username || null,
            reply_media: replyMediaFlag,
            reply_url,
            reply_filename,
            isImage: msg.isImage,
            edit: msg.edit,
            isVideo: msg.isVideo || (msg.fileUrl && /\.(mp4|webm|ogg)$/i.test(msg.fileUrl)),
          };
        });
        setHasMore(data.hasMore);
        if (page === 0) {
          setChats(msgs);
        } else {
          setChats((prev) => [...msgs, ...prev]);
          // maintain scroll position after prepending
          setTimeout(() => {
            if (el) {
              el.scrollTop = el.scrollHeight - previousHeight;
            }
          }, 0);
        }
      } catch (err) {
        console.error("Error fetching chat messages:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMessages();
  }, [credentials.room, credentials.userId, page]);

  // Infinite scroll: load older messages when scrolled to top
  useEffect(() => {
    const el = chatContentRef.current;
    if (!el) return;

    const onScroll = () => {
      // if we're within 20px of the top, and not already loading, fetch more
      if (el.scrollTop <= 20 && !isLoading && hasMore) {
        setPage(p => p + 1);
      }
    };

    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [isLoading]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (page === 0 && chatContentRef.current) {
      chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
    }
  }, [chats, page]);

  // Socket.IO connection and event handlers.
  useEffect(() => {
    if (authUser) {
      const socketConnection = io(SOCKET_ENDPOINT, { query: credentials });
      setSocket(socketConnection);

      socketConnection.on("connect", () => {
        socketConnection.emit("join", credentials, (err) => {
        });
      });

      socketConnection.on("newMessage", (message) => {
        const formattedTime = moment(message.sentAt).format("hh:mm");
        setChats((prevChats) => [
          ...prevChats,
          {
            id: message._id,
            text: message.text,
            from: message.from,
            senderId: message.senderId,
            time: formattedTime,
            seen: message.seen,
            timestamp: message.sentAt,
            type: "text",
            reply_id: message.reply_id,
            reply_userid: message.reply_userid,
            reply: message.reply,
            reply_username: message.reply_username,
            edit: message.edit,
          },
        ]);
        if (
          authUser &&
          message.senderId &&
          message.senderId !== authUser._id
        ) {
          if (!selectedUser || selectedUser._id !== message.senderId) {
            setUnseenCount((prev) => ({
              ...prev,
              [message.senderId]: (prev[message.senderId] || 0) + 1,
            }));
          }
        }
      });

      socketConnection.on("newFileMessage", (message) => {
        const formattedTime = moment(message.sentAt).format("hh:mm");
        setChats((prevChats) => [
          ...prevChats,
          {
            id: message._id,
            text: "",
            from: message.from,
            senderId: message.senderId,
            time: formattedTime,
            seen: message.seen,
            timestamp: message.sentAt,
            type: "file",
            caption: message.caption,
            url: message.url,
            isImage: message.isImage,
            reply_id: message.reply_id,
            reply_userid: message.reply_userid,
            reply: message.reply,
            reply_username: message.reply_username,
            edit: message.edit,
            isVideo:
              message.isVideo ||
              (message.url && /\.(mp4|webm|ogg)$/i.test(message.url)),
          },
        ]);
        if (
          authUser &&
          message.senderId &&
          message.senderId !== authUser._id
        ) {
          if (!selectedUser || selectedUser._id !== message.senderId) {
            setUnseenCount((prev) => ({
              ...prev,
              [message.senderId]: (prev[message.senderId] || 0) + 1,
            }));
          }
        }
      });



      socketConnection.on("messageDeleted", (data) => {
        setChats(prevChats =>
          prevChats.filter(chat => {
            if (data.messageId) {
              return chat.id !== data.messageId;
            } else if (data.timestamp) {
              return chat.timestamp !== data.timestamp;
            }
            return true;
          })
        );
      });

      socketConnection.on('lobbyUpdated', ({ chatLobbyId, lastmsg, lastUpdated }) => {
        setUsers(prev =>
          prev
            .map(usr =>
              usr.chatLobbyId === chatLobbyId
                ? { ...usr, lastmsg, lastUpdated }
                : usr
            )
            .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
        );
      });

      socketConnection.on("messageUpdated", ({ _id, chatLobbyId, text, senderId, sentAt, seen, type, edit }) => {
        // Check if necessary fields are present before updating the state
        setChats((prevChats) => {
          return prevChats.map(chat => {
            // If the current chat has the same _id as the updated one, update it
            if (chat.id === _id) {
              return {
                ...chat,
                text: text || chat.text, // Fallback to existing text if text is missing
                edit: edit !== undefined ? edit : chat.edit, // Fallback to existing edit flag if missing
                sentAt: sentAt || chat.sentAt, // Fallback to existing sentAt if missing
                seen: seen !== undefined ? seen : chat.seen, // Update seen if provided, otherwise keep the existing one
                type: type || chat.type, // Fallback to existing type if missing
              };
            }
            return chat; // Return unchanged chat if it's not the updated one
          });
        });
      });





      return () => {
        socketConnection.disconnect();
      };
    }
  }, [authUser, credentials.room, selectedUser]);

  // Called when the hidden <input type="file" /> changes
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setFilePreviewUrl(URL.createObjectURL(file));
  };

  const messageRefs = useRef({});

  // Scroll to a message already rendered in the DOM and flash it
  const scrollToMessage = (targetId) => {
    if (!targetId) return;
    const container = chatContentRef.current;
    const el = messageRefs.current[targetId];
    if (el && container) {
      // Smooth scroll the element into view within the scrollable chat container
      // Use scrollIntoView because it works reliably with overflow:auto containers
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // temporary highlight
      const prevBox = el.style.boxShadow;
      const prevTransform = el.style.transform;
      el.style.boxShadow = '0 0 0 4px rgba(59,130,246,0.18)';
      el.style.transform = 'translateY(-2px)';
      setTimeout(() => {
        el.style.boxShadow = prevBox || '';
        el.style.transform = prevTransform || '';
      }, 1400);
    } else {
      // target not loaded (older page) — nothing to do here,
      // you could fetch older pages, but that requires additional logic.
      console.warn('Target message not present in DOM (not loaded yet):', targetId);
    }
  };

  // Called when user confirms “Send” in the preview box
  const handleSendFile = () => {
    if (!selectedFile) return;
    // reuse your existing uploadFile logic, but pass in selectedFile
    const fakeFileInput = { files: [selectedFile] };
    uploadFile({ files: fakeFileInput.files }, false);
    // cleanup
    setSelectedFile(null);
    setFilePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // whenever chats change, auto-emit messageSeen for any incoming messages you haven’t seen yet
  useEffect(() => {
    if (!socket || !credentials.room) return;
    chats.forEach((msg) => {
      if (msg.from !== credentials.name && !msg.seen) {
        socket.emit("messageSeen", {
          messageId: msg.id,
          room: credentials.room,
          readerId: authUser._id
        });
      }
    });
  }, [chats, socket, credentials.room, authUser]);

  useEffect(() => {
    if (!socket) return;

    socket.on("userTyping", ({ userId }) => {
      setTypingUsers(prev => new Set(prev).add(userId));
    });

    socket.on("userStoppedTyping", ({ userId }) => {
      setTypingUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    return () => {
      socket.off("userTyping");
      socket.off("userStoppedTyping");
    };
  }, [socket]);

  let typingTimeout = useRef(null);

  const notifyTyping = () => {
    if (!socket) return;
    socket.emit("typing", {
      room: credentials.room,
      userId: credentials.userId,
      username: credentials.name,
    });

    // debounce stopTyping 1.5s after last keystroke
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("stopTyping", {
        room: credentials.room,
        userId: credentials.userId,
      });
    }, 1500);
  };



  // When a user is clicked in the sidebar, create or fetch a chat lobby.
  const handleUserClick = async (recipient) => {
    // 1. If it’s the same lobby, ignore
    if (credentials.room === recipient.chatLobbyId) return;

    // 2. Now clear out any old messages & reset page/loading
    setChats([]);
    setPage(0);
    setIsLoading(true);

    // 3. Switch the room and fetch
    setSelectedUser(recipient);
    try {
      const res = await axios.post(
        `${BASE_ENDPOINT}/auth/chat-lobby`,
        { userId1: authUser._id, userId2: recipient.participants[1] }
      );
      setCredentials((prev) => ({ ...prev, room: res.data.chatLobbyId }));
      // your fetch‐messages effect will fire automatically and clear isLoading when done
    } catch (err) {
      console.error("Error creating/fetching chat lobby", err);
      setIsLoading(false);
    }
  };


  // Send text messages.
  const handleMessageSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && socket) {
      socket.emit(
        "createMessage",
        {
          text: input, sender: authUser._id, room: credentials.room, reply_id: replyingTo?.reply_id || null,
          reply_userid: replyingTo?.reply_userid || null,
          reply: replyingTo?.reply || null, reply_username: replyingTo?.reply_username, reply_media: replyingTo?.reply_media || false,
        },
        () => {
          setInput("");
          setReplyingTo(null);
          if (chatContentRef.current) {
            chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
          }
        }
      );
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
      },
      (err) => {
      }
    );
  };

  const hasLobbies = filteredUsers.length > 0;

  const sortedLobbies = hasLobbies
    ? [...filteredUsers].sort(
      (a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated)
    )
    : [];
  const displayList = hasLobbies ? sortedLobbies : searchFriends;

  // File upload via jQuery AJAX.
  const uploadFile = (fileEl, isPrivate) => {
    const formData = new FormData();
    formData.append("file", fileEl.files[0]);
    formData.append("caption", caption);
    if (replyingTo) {
      formData.append("reply_id", replyingTo.reply_id);
      formData.append("reply_userid", replyingTo.reply_userid);
      formData.append("reply", replyingTo.reply);
      formData.append("reply_username", replyingTo.reply_username);
      formData.append("reply_media", replyingTo.reply_media ? "true" : "false");
    } else {
      formData.append("reply_id", "");
      formData.append("reply_userid", "");
      formData.append("reply", "");
      formData.append("reply_username", "");
      formData.append("reply_media", "false");
    }
    $.ajax({
      url: `${BASE_ENDPOINT}/uploadmsg`,
      type: "POST",
      data: formData,
      processData: false,
      contentType: false,
      xhr: function () {
        const xhr = new window.XMLHttpRequest();
        if (!isPrivate) {
          $("#upload-progress-bar").removeClass("progress-hide");
        } else {
          $("#private-upload-progress-bar").removeClass("private-progress-hide");
          $("#modal-close-button").attr("disabled", "disabled");
        }
        xhr.upload.addEventListener("progress", function (e) {
          if (e.lengthComputable) {
            const percent = (e.loaded / e.total) * 100;
            const width = "width:" + percent + "%";
            if (!isPrivate) {
              $("#upload-progress-bar-inner")
                .attr("style", width)
                .html(percent.toFixed(2) + " %");
            } else {
              $("#private-upload-progress-bar-inner")
                .attr("style", width)
                .html(percent.toFixed(2) + " %");
            }
          }
        });
        return xhr;
      },
      success: function (fileData) {
        $("#upload-progress-bar").addClass("progress-hide");
        if (socket) {
          socket.emit("newFileMessage", fileData);
        }
      },
      error: function (err, textStatus, errorThrown) {
        console.error("Error uploading file:", err, textStatus, errorThrown);
      },
      complete: function () {
        $("#upload-progress-bar").addClass("progress-hide");
        $("#private-upload-progress-bar").addClass("private-progress-hide");
      },
    });
  };

  // Bind file input events.
  useEffect(() => {
    if (authUser) {
      $("#input-file").on("change", function () {
        const fileEl = document.getElementById("input-file");
        handleFileChange({ target: fileEl });
      });
      $("#private-send-file").on("change", function () {
        const fileEl = document.getElementById("private-send-file");
        uploadFile(fileEl, true);
      });
      window.upload_file = () => {
        $("#input-file").click();
      };
      window.upload_private_file = () => {
        $("#private-send-file").click();
      };

      return () => {
        $("#input-file").off("change");
        $("#private-send-file").off("change");
      };
    }
  }, [authUser, socket]);


  // Add this function at the top level of your component (outside the renderMessage function)
  const renderTextWithLargeEmojis = (text) => {
    // Regex to match most common emojis (single character and some multi-character sequences)
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;

    // Split text into parts: emojis and regular text
    const parts = text.split(emojiRegex);

    return parts.map((part, index) => {
      if (emojiRegex.test(part)) {
        // This part is an emoji - render with larger font size
        return (
          <span
            key={index}
            style={{ fontSize: "1.5em", display: "inline-block" }}
          >
            {part}
          </span>
        );
      }
      // Regular text - render normally
      return part;
    });
  };

  const [showForwardModal, setShowForwardModal] = useState(false);
  // new state (add near your other useState lines)
  const [bulkForwardMessages, setBulkForwardMessages] = useState([]); // [{id, from, text}]
  const [bulkForwardFiles, setBulkForwardFiles] = useState([]); // [{id, fileUrl, isImage, isVideo}]
  const [forwardRecipients, setForwardRecipients] = useState([]); // optional: allow multiple recipients later

  // helper to reset forward-related state (single + bulk)
  const resetForwardState = () => {
    setShowForwardModal(false);
    setForwardImage(false);
    setForwardFile('');
    setForwardVideo(false);
    setForwardMessage('');
    setBulkForwardMessages([]);
    setBulkForwardFiles([]);
    setForwardRecipients([]);
  };

  // build bulk arrays from selectedIds and your chats array
  const prepareBulkForward = () => {
    const msgs = [];
    const files = [];

    for (const id of selectedIds) {
      const chat = chats.find((c) => c.id === id);
      if (!chat) continue;

      // treat explicit text messages first
      if (chat.type === 'text' || (chat.text && chat.text.trim() !== '')) {
        msgs.push({ id: chat.id, from: chat.from || '', text: chat.text || '' });
        continue;
      }

      // otherwise treat as a file (image/video/other)
      // try to grab a file URL property (adapt if your model uses different prop name)
      const fileUrl = chat.fileUrl || chat.file || chat.url || '';
      const isImage = !!(chat.isImage || chat.type === 'image' || (chat.mime && chat.mime.startsWith('image')));
      const isVideo = !!(chat.isVideo || chat.type === 'video' || (chat.mime && chat.mime.startsWith('video')));
      if (fileUrl) {
        files.push({ id: chat.id, fileUrl, isImage, isVideo });
      } else {
        // fallback: if there's no fileUrl but chat has attachments array etc, adapt here
        console.warn('Selected chat looks like a file but no URL found for id', id, chat);
      }
    }

    setBulkForwardMessages(msgs);
    setBulkForwardFiles(files);

    // open modal for choosing recipient(s) and confirming forward
    setShowForwardModal(true);
  };

  // single-message forward is kept (but slightly tightened)
  const handleForwardMessage = (userId) => {
    if (!userId) return console.warn('No recipient specified');

    if (forwardMessage) {
      socket.emit(
        'forwardMessage',
        {
          name: credentials.name,
          userId1: credentials.userId,
          userId2: userId,
          messageContent: forwardMessage,
        },
        (response) => {
          if (response) console.log('Message forwarded successfully:', response);
          else console.error('Error forwarding message');
        }
      );
    } else if (forwardFile) {
      socket.emit(
        'forwardFileMessage',
        {
          name: credentials.name,
          userId1: credentials.userId,
          userId2: userId,
          fileUrl: forwardFile,
          isImage: forwardImage,
          isVideo: forwardVideo,
        },
        (response) => {
          if (response) console.log('File forwarded successfully:', response);
          else console.error('Error forwarding file');
        }
      );
    }

    resetForwardState();
  };

  // bulk-forward (for selected messages/files)
  const handleBulkForward = async (userId) => {
    if (!userId) return console.warn('No recipient specified for bulk forward');

    // forward text messages first
    for (const m of bulkForwardMessages) {
      try {
        socket.emit(
          'forwardMessage',
          {
            name: credentials.name,
            userId1: credentials.userId,
            userId2: userId,
            messageContent: m.text,
            originalMessageId: m.id, // optional metadata
          },
          (response) => {
            if (!response) console.error('Bulk forward message failed for', m.id);
          }
        );
      } catch (err) {
        console.error('Error forwarding message id', m.id, err);
      }
    }

    // forward files
    for (const f of bulkForwardFiles) {
      try {
        socket.emit(
          'forwardFileMessage',
          {
            name: credentials.name,
            userId1: credentials.userId,
            userId2: userId,
            fileUrl: f.fileUrl,
            isImage: !!f.isImage,
            isVideo: !!f.isVideo,
            originalMessageId: f.id,
          },
          (response) => {
            if (!response) console.error('Bulk forward file failed for', f.id);
          }
        );
      } catch (err) {
        console.error('Error forwarding file id', f.id, err);
      }
    }

    // optional: you could await short delay or responses if backend returns promise/callback
    resetForwardState();
    exitSelectionMode(); // exit selection mode after forward
  };

  const renderMessage = (chat, index, isLast) => {
    const canDelete =
      chat.from === credentials.name &&
      new Date() - new Date(chat.timestamp) < 7 * 60 * 1000;



    // Show the "Seen" indicator only for the last message sent by the current user.
    const showSeen = isLast && chat.from === credentials.name;

    // Define a common responsive style for images and iframes.
    const commonResponsiveStyle = {
      maxWidth: "200px",
      width: "100%",
      display: "block"
    };
    const commonimgResponsiveStyle = {
      maxWidth: "230px",
      width: "100%",
      maxHeight: "230px",
      height: "100%",
      display: "block"
    };
    const commonvideoResponsiveStyle = {
      width: "100%",
      maxWidth: "300px",
      height: "auto",
      display: "block"
    };

    if (chat.type === "text") {
      return (
        <div
          key={index}
          className={`chat-item chat-${chat.from === credentials.name ? "right" : "left"
            }`}
          ref={(el) => (messageRefs.current[chat.id] = el)}
          style={{
            display: "flex",
            alignItems: "flex-start",
            marginBottom: "10px",
            flexDirection: chat.from === credentials.name ? "row-reverse" : "row"
          }}
        >

          <div className="chat-details" style={{ display: deletedMessages.includes(chat.id) ? "none" : "block", }}>
            <div
              className="message-container"
              style={{ position: "relative", display: "inline-block", }}
            >
              {chat.reply && chat.reply_id && (
                (() => {
                  const replyUrl = chat.reply_url || (typeof chat.reply === 'string' ? chat.reply : null) || '';
                  const isReplyImg = !!replyUrl && /\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(replyUrl);
                  const isReplyVid = !!replyUrl && /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(replyUrl);
                  const isReplyFile = !!chat.reply_media && !isReplyImg && !isReplyVid;

                  // compact sizes
                  const BOX_HEIGHT = 36;
                  const THUMB = 28;

                  // Function to handle image click for larger view (lightbox)
                  const handleImageClick = (url) => {
                    setEnlargedImageUrl(url);  // Assuming you already have the state setup for enlargedImageUrl
                  };

                  // Function to display partial text before truncating
                  const getTruncatedText = (text, maxLength = 20) => {
                    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
                  };
                  const replyStyle = {
                    position: "relative",
                    marginTop: "10px", // Space from the above message
                    marginLeft: chat.from === credentials.name ? "50px" : "auto", // Adjust starting point of reply (left for sent, right for received)
                    marginRight: chat.from !== credentials.name ? "50px" : "auto", // Adjust starting point of reply (right for received, left for sent)
                    top: "50%",  // Center vertically in relation to the profile image
                    transform: "translateY(-50%)", // Center vertically using transform
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    fontSize: "10px",
                    background: "#e1e1e1ff", // Light grey background behind the reply
                    borderRadius: "8px", // Rounded corners for the reply background
                    padding: "4px 8px", // Padding around the reply content
                    cursor: "pointer", // Change the cursor to a clickable pointer
                  };

                  return (
                    <div
                      onClick={() => scrollToMessage(chat.reply_id)} // Scroll to the original message on click
                      title="Jump to replied message"
                      style={replyStyle}
                    >
                      {/* LEFT tiny thumbnail / icon */}<i className="mdi mdi-reply" style={{ fontSize: 16, color: "#666" }} />
                      {(isReplyImg || isReplyVid || isReplyFile) && (
                        <div style={{
                          width: THUMB,
                          height: THUMB,
                          borderRadius: 6,
                          overflow: "hidden",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "#fafafa",
                          border: "1px solid #eee"
                        }}>
                          {isReplyImg ? (
                            <img
                              src={replyUrl}
                              alt="img"
                              style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }}
                            />
                          ) : isReplyVid ? (
                            <video
                              src={replyUrl}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              muted
                              playsInline
                              controls={false}
                              onPlay={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                            />
                          ) : isReplyFile ? (
                            <i className="mdi mdi-file" style={{ fontSize: 16, color: "#666" }} />
                          ) : null}
                        </div>
                      )}


                      {/* RIGHT: for media replies we show NO text (per request). */}
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>
                        {isReplyImg || isReplyVid ? (
                          <span style={{ color: "#444", fontWeight: 600, fontSize: 12, marginLeft: 6 }}>
                            {chat.reply_username ? `${chat.reply_username}` : "Replied message"}
                          </span>
                        ) : isReplyFile ? (
                          <span style={{ color: "#444", fontWeight: 600, fontSize: 12 }}>
                            {chat.reply_username ? `${chat.reply_username}: ` : ''}File
                          </span>
                        ) : (
                          <span style={{ color: "#444", fontWeight: 600, marginRight: 6 }}>
                            {chat.reply_username ? `${chat.reply_username}: ` : ''}
                          </span>
                        )}

                        {/* Only render the reply text for non-media text replies */}
                        {!(isReplyImg || isReplyVid || isReplyFile) && (
                          <span style={{ color: "#555", marginLeft: 4, overflow: "hidden", textOverflow: "ellipsis" }}>
                            {getTruncatedText(chat.reply || "")}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()
              )}
              <div
                className="chat-text"
                style={{
                  padding: "8px 12px",
                  borderRadius: "16px",
                }}
              >
                {editingMessageId === chat.id ? (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <textarea
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)} // Update the text as the user types
                      style={{ resize: "none", padding: "8px", borderRadius: "8px", marginBottom: "8px" }}
                    />
                    <button
                      onClick={() => handleSaveEdit(chat.id)} // Save the edited message
                      className="btn btn-primary btn-sm"
                      style={{ marginTop: "8px" }}
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit} // Cancel editing
                      className="btn btn-secondary btn-sm"
                      style={{ marginTop: "8px" }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  // If not editing, show the message text
                  <div>{renderTextWithLargeEmojis(chat.text)}</div>
                )}
                {selectionMode ? (
                  <div
                    className="message-select-checkbox"
                    style={{
                      position: "absolute",
                      top: "50%",
                      right: chat.from === credentials.name ? "auto" : "-20px",
                      left: chat.from === credentials.name ? "-20px" : "auto",
                      transform: "translateY(-50%)",
                      cursor: "pointer",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelectMessage(chat.id);
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected(chat.id)}
                      onChange={() => { }}
                      // visually style it smaller if needed
                      style={{ width: 18, height: 18 }}
                      aria-label={`Select message ${chat.id}`}
                    />
                  </div>
                ) : (
                  <div
                    className="three-dots-icon"
                    style={{
                      position: "absolute",
                      top: "50%",
                      right: chat.from === credentials.name ? "auto" : "-20px",  // Right for left chat
                      left: chat.from === credentials.name ? "-20px" : "auto",  // Left for right chat
                      transform: "translateY(-50%)",
                      cursor: "pointer",
                      color: "black",
                    }}
                    onClick={(e) => toggleDropdown(index, e)} // Toggle dropdown on click
                  >
                    <i className="mdi mdi-dots-vertical" />
                  </div>)}

                {/* Dropdown Menu */}
                {openDropdown === index && (
                  <div
                    className="dropdown-menu-tribe"
                    style={{
                      position: "absolute",
                      top: "100%",  // Position it just below the text
                      [chat.from === credentials.name ? "right" : "left"]: "0",  // Right for left chat, left for right chat
                      backgroundColor: "#fff",
                      boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.2)",
                      borderRadius: "8px",
                      zIndex: "10",
                    }}
                  >
                    {/* Delete for Me option */}
                    <div
                      className="dropdown-item"
                      style={{
                        padding: "8px 16px",
                        cursor: "pointer",
                        borderBottom: "1px solid #eee",
                      }}
                      onClick={() =>
                        deleteForMe(chat.id, credentials.userId, credentials.room)  // Call the function for "Delete for Me"
                      }
                    >
                      Delete for Me
                    </div>

                    {/* Delete for Everyone option with condition */}
                    {canDelete && (  // Check if the user can delete for everyone
                      <div
                        className="dropdown-item"
                        style={{
                          padding: "8px 16px",
                          cursor: "pointer",
                        }}
                        onClick={() =>
                          deleteMessageSocket(
                            chat.id,                    // messageId
                            "forEveryone",              // deleteType
                            credentials.room,           // chatLobbyId
                            credentials.userId,         // userId
                            chat.timestamp              // timestamp
                          )
                        }
                      >
                        Delete for Everyone
                      </div>
                    )}
                    <div
                      className="dropdown-item"
                      style={{
                        padding: "8px 16px",
                        cursor: "pointer",
                        borderBottom: "1px solid #eee",
                      }}
                      onClick={() => {
                        copyToClipboard(chat.text);  // Copy the chat text
                        setOpenDropdown(null);  // Close the dropdown
                      }}
                    >
                      Copy
                    </div>
                    <div
                      className="dropdown-item"
                      style={{
                        padding: "8px 16px",
                        cursor: "pointer",
                        borderBottom: "1px solid #eee",
                      }}
                      onClick={() => { handleStartReply(chat); handleReplyPreviewOff(); }}
                    >
                      Reply
                    </div>
                    {chat.from === credentials.name && isMessageEditable(chat.timestamp) && (
                      <div
                        className="dropdown-item"
                        style={{
                          padding: "8px 16px",
                          cursor: "pointer",
                          borderBottom: "1px solid #eee",
                        }}
                        onClick={() => handleEditMessage(chat)} // Trigger edit message
                      >
                        Edit
                      </div>
                    )}
                    <div
                      className="dropdown-item"
                      style={{
                        padding: "8px 16px",
                        cursor: "pointer",
                        borderBottom: "1px solid #eee",
                      }}
                      onClick={() => {
                        setForwardMessage(chat.text);  // Save message
                        setShowForwardModal(true);     // Show modal
                      }}
                    >
                      Forward
                    </div>
                  </div>
                )}
              </div>
            </div>


            {chat.edit && (
              <div style={{ fontSize: "0.7em", color: "#666", marginTop: "4px", fontStyle: "italic" }}>
                Edited
              </div>
            )}
            <div
              className="chat-time"
              style={{ fontSize: "0.8em", color: "#666", marginTop: "4px" }}
            >
              {chat.time}
            </div>

            {showSeen && (
              <div style={{ fontSize: "0.7em", color: "#999" }}>
                {chat.seen ? "Seen" : ""}
              </div>
            )}
          </div>
        </div>
      );
    } else if (chat.type === "file") {
      const trimmedUrl = chat.url.trim();
      const fileUrl = /^https?:\/\//.test(trimmedUrl)
        ? trimmedUrl
        : `${BASE_ENDPOINT}/uploads/${trimmedUrl}`;
      const is_Image = chat.isImage;
      const is_Video = chat.isVideo;
      console.log(is_Image);

      return (
        <div
          key={index}
          className={`chat-item chat-${chat.from === credentials.name ? "right" : "left"
            }`}
          ref={(el) => (messageRefs.current[chat.id] = el)}
          style={{
            display: "flex",
            alignItems: "flex-start",
            marginBottom: "10px",
            flexDirection: chat.from === credentials.name ? "row-reverse" : "row",
            display: deletedMessages.includes(chat.id) ? "none" : "flex",
          }}
        >

          <div className="chat-details">
            <div
              className="message-container"
              style={{ position: "relative", display: "inline-block" }}
            >
              {chat.reply && chat.reply_id && (
                (() => {
                  const replyUrl = chat.reply_url || (typeof chat.reply === 'string' ? chat.reply : null) || '';
                  const isReplyImg = !!replyUrl && /\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(replyUrl);
                  const isReplyVid = !!replyUrl && /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(replyUrl);
                  const isReplyFile = !!chat.reply_media && !isReplyImg && !isReplyVid;

                  // compact sizes
                  const BOX_HEIGHT = 36;
                  const THUMB = 28;

                  // Function to handle image click for larger view (lightbox)
                  const handleImageClick = (url) => {
                    setEnlargedImageUrl(url);  // Assuming you already have the state setup for enlargedImageUrl
                  };

                  // Function to display partial text before truncating
                  const getTruncatedText = (text, maxLength = 20) => {
                    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
                  };
                  const replyStyle = {
                    position: "relative",
                    marginTop: "10px", // Space from the above message
                    marginLeft: chat.from === credentials.name ? "50px" : "auto", // Adjust starting point of reply (left for sent, right for received)
                    marginRight: chat.from !== credentials.name ? "50px" : "auto", // Adjust starting point of reply (right for received, left for sent)
                    top: "50%",  // Center vertically in relation to the profile image
                    transform: "translateY(-50%)", // Center vertically using transform
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    fontSize: "10px",
                    background: "#e1e1e1ff", // Light grey background behind the reply
                    borderRadius: "8px", // Rounded corners for the reply background
                    padding: "4px 8px", // Padding around the reply content
                    cursor: "pointer", // Change the cursor to a clickable pointer
                  };

                  return (
                    <div
                      onClick={() => scrollToMessage(chat.reply_id)} // Scroll to the original message on click
                      title="Jump to replied message"
                      style={replyStyle}
                    >
                      {/* LEFT tiny thumbnail / icon */}
                      <div style={{
                        width: THUMB,
                        height: THUMB,
                        borderRadius: 6,
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#fafafa",
                        border: "1px solid #eee"
                      }}>
                        {isReplyImg ? (<>
                          <i className="mdi mdi-reply" style={{ fontSize: 16, color: "#666" }} />
                          <img
                            src={replyUrl}
                            alt="img"
                            style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }}
                          /></>
                        ) : isReplyVid ? (
                          <video
                            src={replyUrl}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            muted
                            playsInline
                            controls={false}
                            onPlay={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                          />
                        ) : isReplyFile ? (
                          <i className="mdi mdi-file" style={{ fontSize: 16, color: "#666" }} />
                        ) : (
                          <i className="mdi mdi-reply" style={{ fontSize: 16, color: "#666" }} />
                        )}
                      </div>

                      {/* RIGHT: for media replies we show NO text (per request). */}
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>
                        {isReplyImg || isReplyVid ? (
                          <span style={{ color: "#444", fontWeight: 600, fontSize: 12, marginLeft: 6 }}>
                            {chat.reply_username ? `${chat.reply_username}` : "Replied message"}
                          </span>
                        ) : isReplyFile ? (
                          <span style={{ color: "#444", fontWeight: 600, fontSize: 12 }}>
                            {chat.reply_username ? `${chat.reply_username}: ` : ''}File
                          </span>
                        ) : (
                          <span style={{ color: "#444", fontWeight: 600, marginRight: 6 }}>
                            {chat.reply_username ? `${chat.reply_username}: ` : ''}
                          </span>
                        )}

                        {/* Only render the reply text for non-media text replies */}
                        {!(isReplyImg || isReplyVid || isReplyFile) && (
                          <span style={{ color: "#555", marginLeft: 4, overflow: "hidden", textOverflow: "ellipsis" }}>
                            {getTruncatedText(chat.reply || "")}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()
              )}
              {chat.isImage ? (
                <div className="relative group inline-block">
                  <img
                    src={fileUrl}
                    alt="uploaded"
                    style={commonimgResponsiveStyle}
                  />
                </div>
              ) : chat.isVideo ? (
                <video controls style={commonvideoResponsiveStyle}>
                  <source src={fileUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div
                  style={{
                    ...commonResponsiveStyle,
                    padding: "8px",
                    textAlign: "center"
                  }}
                >
                  <i className="mdi mdi-file" style={{ fontSize: "2em" }}></i>
                  {/* ↓ new file name below icon ↓ */}
                  <div style={{ fontSize: "0.8em", marginTop: "4px", wordBreak: "break-all" }}>
                    {fileUrl.split("/").pop()}
                  </div>
                </div>
              )}
              {chat.caption && (
                <div className="chat-details">
                  <div className="message-container" style={{ position: "relative", display: "inline-block", }}>
                    <div className="chat-text" style={{ padding: "8px 12px", borderRadius: "16px", position: "relative", }}>
                      {chat.caption}


                    </div>
                  </div>

                </div>
              )}
              {selectionMode ? (
                <div
                  className="message-select-checkbox"
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: chat.from === credentials.name ? "auto" : "-20px",
                    left: chat.from === credentials.name ? "-20px" : "auto",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelectMessage(chat.id);
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected(chat.id)}
                    onChange={() => { }}
                    // visually style it smaller if needed
                    style={{ width: 18, height: 18 }}
                    aria-label={`Select message ${chat.id}`}
                  />
                </div>
              ) : (
                <div
                  className="three-dots-icon"
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: chat.from === credentials.name ? "auto" : "-20px",  // Right for left chat
                    left: chat.from === credentials.name ? "-20px" : "auto",  // Left for right chat
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                    color: "black",
                  }}
                  onClick={(e) => toggleDropdown(index, e)} // Toggle dropdown on click
                >
                  <i className="mdi mdi-dots-vertical" />
                </div>)}

              {/* Dropdown Menu */}
              {openDropdown === index && (
                <div
                  className="dropdown-menu-tribe"
                  style={{
                    position: "absolute",
                    top: "100%",  // Position it just below the text
                    [chat.from === credentials.name ? "right" : "left"]: "0",  // Right for left chat, left for right chat
                    backgroundColor: "#fff",
                    boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.2)",
                    borderRadius: "8px",
                    zIndex: "10",
                  }}
                >
                  {/* Delete for Me option */}
                  <div
                    className="dropdown-item"
                    style={{
                      padding: "8px 16px",
                      cursor: "pointer",
                      borderBottom: "1px solid #eee",
                    }}
                    onClick={() =>
                      deleteForMe(chat.id, credentials.userId, credentials.room)  // Call the function for "Delete for Me"
                    }
                  >
                    Delete for Me
                  </div>

                  {/* Delete for Everyone option with condition */}
                  {canDelete && (  // Check if the user can delete for everyone
                    <div
                      className="dropdown-item"
                      style={{
                        padding: "8px 16px",
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        deleteMessageSocket(
                          chat.id,                    // messageId
                          "forEveryone",              // deleteType
                          credentials.room,           // chatLobbyId
                          credentials.userId,         // userId
                          chat.timestamp              // timestamp
                        )
                      }
                    >
                      Delete for Everyone
                    </div>
                  )}
                  <div
                    className="dropdown-item"
                    style={{
                      padding: "8px 16px",
                      cursor: "pointer",
                      borderBottom: "1px solid #eee",
                    }}
                    onClick={() => { handleStartReply(chat); handleReplyPreview(fileUrl); }}
                  >
                    Reply
                  </div>
                  <div
                    className="dropdown-item"
                    style={{
                      padding: "8px 16px",
                      cursor: "pointer",
                      borderBottom: "1px solid #eee",
                    }}
                    onClick={() => {
                      setForwardFile(fileUrl);  // Save message
                      setForwardImage(is_Image);
                      setForwardVideo(is_Video);
                      setShowForwardModal(true);
                    }}
                  >
                    Forward
                  </div>
                </div>
              )}
            </div>
            <div
              className="chat-time"
              style={{ fontSize: "0.8em", color: "#666", marginTop: "4px" }}
            >
              {chat.time}
            </div>

            {showSeen && (
              <div style={{ fontSize: "0.7em", color: "#999" }}>
                {chat.seen ? "Seen" : ""}
              </div>
            )}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginTop: "5px"
              }}
            >
              <div
                className="download-icon"
                style={{
                  display: "flex",
                  padding: "2px",
                  borderRadius: "4px"
                }}
              >
                <i
                  className="mdi mdi-download"
                  style={{
                    display: "flex",
                    padding: "2px",
                    borderRadius: "4px",
                    marginRight: "10px", cursor: "pointer", fontSize: "1.2em"
                  }}
                  onClick={() =>
                    downloadFile(
                      fileUrl,
                      chat.isImage
                        ? `Download-Image-${moment().format("YYYYMMDD-HHmmss")}.png`
                        : chat.isVideo
                          ? `Download-Video-${moment().format("YYYYMMDD-HHmmss")}.mp4`
                          : `Download-File-${moment().format("YYYYMMDD-HHmmss")}`
                    )
                  }
                  title="Download File"
                ></i>

                <i className="mdi mdi-arrow-expand" style={{ cursor: "pointer", fontSize: "1.2em" }} onClick={() => setEnlargedImageUrl(fileUrl)} />
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div id="app">
        <div className="main-wrapper main-wrapper-1">
          <div className="navbar-bg"></div>
          <div className="main-content">
            <section className="section">
              <div className="section-body">
                <div className="row">
                  {/* Left Sidebar: People List */}
                  {(!isMobile || (isMobile && !selectedUser)) && (
                    <div className="col-lg-3">
                      <div className="card">
                        <div className="body">
                          <div id="plist" className="people-list">
                            <div className="chat-search">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                              />
                            </div>
                            <div
                              className="m-b-20"
                              style={{
                                overflowY: "auto",
                                maxHeight: "calc(100vh - 150px)",
                              }}
                            >
                              {displayList.length > 0 ? (
                                <ul className="chat-list list-unstyled m-b-0">
                                  {displayList.map((item, idx) => {
                                    if (hasLobbies) {
                                      // existing chat lobby entry
                                      const usr = item;
                                      const count = unseenCount[usr._id] || 0;
                                      const isActive = usr.chatLobbyId === credentials.room;
                                      const otherUser =
                                        usr.participants[0]._id === credentials.userId
                                          ? usr.participants[1]
                                          : usr.participants[0];
                                      const firstName = otherUser.firstName || "N/A";
                                      const lastName = otherUser.lastName || "N/A";
                                      const profilepic =
                                        otherUser.profile_pic ||
                                        "/assets/admin_assets/img/users/user.png";
                                      return (
                                        <li
                                          key={usr.chatLobbyId}
                                          className={`clearfix ${isActive ? 'active-lobby' : ''}`}
                                          onClick={isActive ? undefined : () => handleUserClick(usr)}
                                          style={{
                                            cursor: isActive ? 'default' : 'pointer',
                                            backgroundColor: isActive ? '#e6f7ff' : 'transparent',
                                            borderLeft: isActive ? '4px solid #1890ff' : 'none',
                                            paddingLeft: isActive ? '8px' : '12px',
                                            opacity: 1,
                                          }}
                                        >
                                          <img
                                            src={profilepic}
                                            alt="avatar"
                                            style={{
                                              width: "40px",
                                              height: "40px",
                                              borderRadius: "50%",
                                            }}
                                          />
                                          <div className="about">
                                            <div className="name">
                                              {firstName} {lastName}
                                              {count > 0 && (
                                                <span
                                                  style={{
                                                    backgroundColor: "red",
                                                    color: "white",
                                                    borderRadius: "50%",
                                                    padding: "2px 6px",
                                                    fontSize: "0.7em",
                                                    marginLeft: "5px",
                                                  }}
                                                >
                                                  {count}
                                                </span>
                                              )}
                                            </div>
                                            {usr.lastmsg && (
                                              <div
                                                style={{
                                                  fontSize: "0.8em",
                                                  color: "gray",
                                                  marginTop: "2px",
                                                  whiteSpace: "nowrap",
                                                  overflow: "hidden",
                                                  textOverflow: "ellipsis",
                                                  maxWidth: "150px",
                                                }}
                                                dangerouslySetInnerHTML={{ __html: usr.lastmsg }}
                                              />
                                            )}
                                          </div>
                                        </li>
                                      );
                                    } else {
                                      // fallback to friends list
                                      const friend = item;
                                      return (
                                        <li
                                          key={friend._id}
                                          className="clearfix"
                                          onClick={() => handleFriendClick(friend)}
                                          style={{ cursor: "pointer" }}
                                        >
                                          <img
                                            src={friend.profile_pic || "/assets/admin_assets/img/users/user.png"}
                                            alt="avatar"
                                            style={{
                                              width: "40px",
                                              height: "40px",
                                              borderRadius: "50%",
                                            }}
                                          />
                                          <div className="about">
                                            <div className="name">
                                              {friend.firstName} {friend.lastName}
                                            </div>
                                          </div>
                                        </li>
                                      );
                                    }
                                  })}
                                </ul>) : (
                                <div style={{ padding: "20px", textAlign: "center", color: "#888" }}>
                                  No users found.<br />
                                  Try adjusting your search or{" "}
                                  <a href="/profile/tribers" style={{ color: "#1890ff", textDecoration: "underline" }}>
                                    add tribers
                                  </a>.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Chat Box (Right Side) */}
                  {(isMobile && selectedUser) || (!isMobile && (selectedUser || credentials.room)) ? (
                    <div className={isMobile ? "col-12" : "col-xs-12 col-sm-12 col-md-9 col-lg-9"}>
                      <div className="card">
                        {selectedFile && (

                          <div
                            className="file-preview-box"
                            style={{
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              transform: "translate(-50%, -50%)",
                              maxWidth: "90%",
                              maxHeight: "90%",
                              overflow: "auto",
                              background: "#fff",
                              padding: "1rem",
                              borderRadius: "8px",
                              boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                              zIndex: 20,
                            }}
                          >
                            {selectedFile.type.startsWith("image/") && (
                              <img
                                src={filePreviewUrl}
                                style={{ maxWidth: "100%", maxHeight: "60vh", objectFit: "contain", display: "block", margin: "0 auto" }}
                              />
                            )}
                            {selectedFile.type.startsWith("video/") && (
                              <video
                                controls
                                src={filePreviewUrl}
                                style={{ maxWidth: "100%", maxHeight: "60vh", display: "block", margin: "0 auto" }}
                              />
                            )}
                            {!selectedFile.type.startsWith("image/") &&
                              !selectedFile.type.startsWith("video/") && (
                                <div style={{ textAlign: "center" }}>{selectedFile.name}</div>
                              )}
                            <div style={{ marginTop: "1rem" }}>
                              <input
                                type="text"
                                id="caption"
                                placeholder="Add Caption"
                                value={caption}
                                onChange={handleCaptionChange} // Handle caption change
                                style={{
                                  width: "100%",
                                  padding: "0.5rem",
                                  borderRadius: "4px",
                                  border: "1px solid #ccc",
                                }}
                              />
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem", gap: "0.5rem" }}>
                              <button onClick={handleSendFile} className="btn btn-sm btn-primary">
                                Send
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedFile(null);
                                  setFilePreviewUrl(null);
                                  if (fileInputRef.current) fileInputRef.current.value = "";
                                }}
                                className="btn btn-sm btn-secondary"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                        <div className="chat">
                          {/* Chat Header */}
                          <div
                            className="chat-header clearfix"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            {/* Left: User Info */}
                            <div style={{ display: "flex", alignItems: "center" }}>
                              {isMobile && selectedUser && (
                                <i
                                  className="mdi mdi-arrow-left"
                                  style={{
                                    cursor: "pointer",
                                    marginRight: "10px",
                                    fontSize: "24px",
                                  }}
                                  onClick={() => setSelectedUser(null)}
                                  title="Back"
                                ></i>
                              )}
                              {selectedUser && (() => {
                                // Determine the other user based on credentials.userId
                                const otherUser =
                                  selectedUser.participants[0]._id === credentials.userId
                                    ? selectedUser.participants[1]
                                    : selectedUser.participants[0];
                                return (
                                  <a
                                    href={`/profile/tribers/${otherUser._id}`}
                                    className="chat-about"
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      textDecoration: "none",
                                      color: "inherit",
                                      marginLeft: "10px",
                                      cursor: "pointer",
                                    }}
                                  >
                                    <img
                                      src={otherUser.profile_pic || "/assets/admin_assets/img/users/user.png"}
                                      alt="avatar"
                                      style={{ width: "40px", height: "40px", borderRadius: "50%" }}
                                    />
                                    <div style={{ marginLeft: "8px" }}>
                                      {otherUser.firstName} {otherUser.lastName}
                                    </div>
                                  </a>
                                );
                              })()}

                              {!selectedUser && !credentials.room && (
                                <div className="chat-about" style={{ marginLeft: "10px" }}>
                                  <div className="chat-with">Select a user to start a chat</div>
                                </div>
                              )}
                            </div>

                            <div style={{ display: "flex", alignItems: "center", marginLeft: "auto" }}>
                              <div className="dropdown">
                                <i
                                  className="mdi mdi-dots-vertical"
                                  style={{ fontSize: "24px", cursor: "pointer" }}
                                  data-bs-toggle="dropdown"
                                  aria-expanded="false"
                                />
                                <ul className="dropdown-menu dropdown-menu-end">
                                  {!selectionMode ? (
                                    <>
                                      <li>
                                        <a
                                          className="dropdown-item"
                                          href="#"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            handleDeleteChat(credentials.room, credentials.userId);
                                            setTopDropdownOpen(false);
                                          }}
                                        >
                                          Delete Chat
                                        </a>
                                      </li>
                                      <li>
                                        <a className="dropdown-item" href="/profile/support">Report</a>
                                      </li>
                                      <li>
                                        <a
                                          className="dropdown-item"
                                          href="#"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            enterSelectionMode(); // start selection mode (no initial message)
                                            setTopDropdownOpen(false);
                                          }}
                                        >
                                          Select
                                        </a>
                                      </li>
                                    </>
                                  ) : (
                                    /* When in selection mode, show bulk actions at the top dropdown too */
                                    <>
                                      <li>
                                        <a
                                          className="dropdown-item"
                                          href="#"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            performBulkDeleteForMe();
                                            setTopDropdownOpen(false);
                                          }}
                                        >
                                          Delete For Me
                                        </a>
                                      </li>
                                      <li>
                                        <a
                                          className="dropdown-item"
                                          href="#"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            performBulkCopy();
                                            setTopDropdownOpen(false);
                                          }}
                                        >
                                          Copy
                                        </a>
                                      </li>
                                      <li>
                                        <a
                                          className="dropdown-item"
                                          href="#"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            // build the arrays and open the forward modal
                                            prepareBulkForward();

                                            setTopDropdownOpen(false);
                                          }}
                                        >
                                          Forward
                                        </a>
                                      </li>
                                      <li>
                                        <a
                                          className="dropdown-item"
                                          href="#"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            exitSelectionMode();
                                            setTopDropdownOpen(false);
                                          }}
                                        >
                                          Cancel
                                        </a>
                                      </li>
                                    </>
                                  )}
                                </ul>

                              </div>
                            </div>
                          </div>

                          {/* Chat Box */}
                          <div
                            className="chat-box"
                            id="mychatbox"
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              maxHeight: "calc(100vh - 150px)",
                            }}
                          >
                            <div
                              className="card-body chat-content"
                              ref={chatContentRef}
                              style={{
                                position: "relative",
                                flex: 1,
                                overflowY: "auto",
                                overflowX: "hidden",
                                wordBreak: "break-word", // Ensures long messages wrap properly
                              }}
                            >
                              {!hasMore && page > 0 && (
                                <div
                                  style={{
                                    textAlign: "center",
                                    padding: "10px",
                                    color: "#999",
                                    fontStyle: "italic",
                                  }}
                                >
                                  — No more messages —
                                </div>
                              )}
                              {isLoading && page > 0 && (
                                <div style={{ textAlign: 'center', padding: '10px' }}>Loading more...</div>
                              )}
                              {chats.map((chat, idx) => {
                                const label = getDateLabel(chat.timestamp);
                                const prevLabel = idx > 0 ? getDateLabel(chats[idx - 1].timestamp) : null;
                                return (
                                  <React.Fragment key={chat.id || idx}>
                                    {(idx === 0 || label !== prevLabel) && <DateSeparator label={label} />}
                                    {renderMessage(chat, idx, idx === chats.length - 1)}
                                  </React.Fragment>
                                );
                              })}
                              {selectedUser && typingUsers.has(selectedUser.participants.find(p => p._id !== credentials.userId)._id) && (
                                <div className="chat-item chat-left" style={{ marginBottom: '10px' }}>
                                  <div className="chat-details">
                                    <div className="message-container">
                                      <div
                                        className="chat-text"
                                        style={{
                                          padding: "8px 12px",
                                          borderRadius: "16px",
                                          fontStyle: "italic",
                                          opacity: 0.6
                                        }}
                                      >
                                        …
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>


                            {!selectedUser?.blockedBy?.includes(authUser._id) && !authUser.blockedTribes?.includes(selectedUser._id) && (
                              <>
                                {/* Chat Input Form */}
                                {showEmojiPicker && (
                                  <div style={{ position: 'absolute', right: 10, bottom: 60, zIndex: 1000 }} ref={emojiPickerRef}>
                                    <EmojiPicker
                                      onEmojiClick={handleEmojiClick}
                                      width={300}
                                      height={350}
                                    />
                                  </div>
                                )}
                                {replyingTo && (
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '8px 12px',
                                    margin: '8px 12px 0 12px',
                                    background: '#f5f6f8',
                                    borderRadius: '12px',
                                    maxWidth: 'calc(100% - 24px)',
                                    whiteSpace: 'nowrap',
                                    textOverflow: 'ellipsis',
                                    position: 'relative',
                                    zIndex: 50,
                                    border: '1px solid #e0e0e0'
                                  }}>
                                    {/* Preview column (image / video / file icon) */}
                                    <div style={{ flex: '0 0 auto', marginRight: 8, display: 'flex', alignItems: 'center' }}>
                                      {reply_image ? (
                                        // Image thumbnail
                                        <img
                                          src={replyingTo.reply}
                                          alt="img preview"
                                          style={{
                                            width: 48,
                                            height: 48,
                                            objectFit: 'cover',
                                            borderRadius: 6,
                                            border: '1px solid #ddd',
                                            display: 'block'
                                          }}
                                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        />
                                      ) : reply_video ? (
                                        // Non-playable video preview — interaction prevented
                                        <div style={{
                                          width: 48,
                                          height: 48,
                                          borderRadius: 6,
                                          overflow: 'hidden',
                                          border: '1px solid #ddd',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          background: '#000'
                                        }}>
                                          <video
                                            src={replyingTo.reply}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                            // no controls and disable interaction to ensure it doesn't play
                                            controls={false}
                                            muted
                                            playsInline
                                            onClick={(e) => { e.preventDefault(); e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                                            onPlay={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                                          />
                                        </div>
                                      ) : reply_file ? (
                                        // Generic file icon + (optional) filename
                                        <div style={{
                                          width: 48,
                                          height: 48,
                                          borderRadius: 6,
                                          overflow: 'hidden',
                                          border: '1px solid #ddd',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          background: '#fff'
                                        }}>
                                          <i className="mdi mdi-file" style={{ fontSize: 20, color: '#666' }} />
                                        </div>
                                      ) : (<></>)}
                                    </div>

                                    {/* Text part */}
                                    <div style={{
                                      overflow: 'hidden',
                                      whiteSpace: 'nowrap',
                                      textOverflow: 'ellipsis',
                                      flex: 1,
                                      fontSize: '0.85em',
                                      color: '#333',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      minWidth: 0 // allow ellipsis in flex children
                                    }}>
                                      <div style={{ fontSize: '0.82em', color: '#555', fontWeight: 600, marginBottom: 2 }}>
                                        Replying to {replyingTo.reply_username || 'message'}:
                                      </div>
                                      {/* If there is a file name show it before the text, else show reply text */}
                                      {!reply_image && !reply_video && (<>

                                        <div style={{
                                          overflow: 'hidden',
                                          whiteSpace: 'nowrap',
                                          textOverflow: 'ellipsis',
                                        }}>
                                          {replyingTo.filename
                                            ? replyingTo.filename
                                            : replyingTo.reply || ''}
                                        </div></>
                                      )}

                                    </div>

                                    {/* Cancel button */}
                                    <button
                                      onClick={handleCancelReply}
                                      title="Cancel reply"
                                      style={{
                                        marginLeft: '8px',
                                        border: 'none',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        fontSize: '1.0em',
                                        color: '#888',
                                        flex: '0 0 auto'
                                      }}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                )}

                                <div className="card-footer chat-form">

                                  <form
                                    id="chat-form"
                                    onSubmit={handleMessageSubmit}
                                    style={{ display: "flex", alignItems: "center" }}
                                  >
                                    <textarea
                                      className="form-control"
                                      placeholder="Type a message"
                                      value={input}
                                      onChange={e => {
                                        setInput(e.target.value);
                                        notifyTyping();
                                      }}
                                      onBlur={() => {
                                        // immediately clear on blur
                                        socket.emit("stopTyping", {
                                          room: credentials.room,
                                          userId: credentials.userId,
                                        });
                                      }}
                                      onKeyDown={handleKeyDown}
                                      style={{
                                        resize: "none",
                                        overflow: "auto",
                                        height: "50px",
                                        marginRight: "150px",
                                        flex: 1, // Allows input to take full width
                                      }}
                                    ></textarea>
                                    <div style={{ position: 'relative' }}>
                                      <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        style={{ marginLeft: "-150px" }}
                                      >
                                        <BsEmojiSmile />
                                      </button>
                                    </div>
                                    <button
                                      className="btn btn-primary btn-send"
                                      type="submit"
                                      style={{ marginLeft: "5px", zIndex: 0 }}
                                    >
                                      <i className="far fa-paper-plane"></i>
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-primary btn-file"
                                      onClick={() => document.getElementById("input-file").click()}
                                      style={{ marginLeft: "5px" }}
                                    >
                                      <i className="mdi mdi-paperclip"></i>
                                    </button>

                                    <input
                                      type="file"
                                      id="input-file"
                                      ref={fileInputRef}
                                      style={{ display: "none" }}
                                      accept="*/*"
                                    />

                                  </form>
                                </div></>
                            )}

                          </div>
                        </div>
                      </div>

                      {enlargedImageUrl && (
                        <div
                          className="image-lightbox-overlay"
                          onClick={() => setEnlargedImageUrl(null)}
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            backgroundColor: "rgba(0, 0, 0, 0.2)",  // ← semi-transparent black
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 999,
                            cursor: "zoom-out",
                          }}
                        >
                          <img
                            src={enlargedImageUrl}
                            alt="Enlarged"
                            style={{
                              maxWidth: "90%",
                              maxHeight: "90%",
                              boxShadow: "0 0 10px rgba(0,0,0,0.5)",
                            }}
                          />
                        </div>
                      )}

                    </div>
                  ) : null}
                  {showForwardModal && (
                    <>
                      <div
                        style={{
                          position: "fixed",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
                          zIndex: 999, // Ensure overlay is behind the modal
                        }}
                        onClick={() => {
                          setShowForwardModal(false);
                          setForwardImage(false);
                          setForwardFile('');
                          setForwardVideo(false);
                          setForwardMessage('');
                        }}


                      />
                      <div
                        className="col-lg-3"
                        style={{
                          position: "fixed",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          width: "60%",  // Set width to 60% of the screen width (you can adjust it based on needs)
                          maxWidth: "600px", // Limit the maximum width to avoid excessive stretching
                          zIndex: 1000,
                        }}
                      >
                        <div className="card">
                          <div className="body">
                            <div id="plist" className="people-list">
                              <div className="chat-search">
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="Search users..."
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                />
                              </div>
                              <div
                                className="m-b-20"
                                style={{
                                  overflowY: "auto",
                                  maxHeight: "calc(100vh - 150px)", // Adjust this to keep it scrollable
                                }}
                              >
                                {displayList.length > 0 ? (
                                  <ul className="chat-list list-unstyled m-b-0">
                                    {displayList.map((item, idx) => {
                                      const usr = item;
                                      const count = unseenCount[usr._id] || 0;
                                      const isActive = false;
                                      const otherUser =
                                        usr.participants[0]._id === credentials.userId
                                          ? usr.participants[1]
                                          : usr.participants[0];
                                      const firstName = otherUser.firstName || "N/A";
                                      const lastName = otherUser.lastName || "N/A";
                                      const profilepic =
                                        otherUser.profile_pic ||
                                        "/assets/admin_assets/img/users/user.png";
                                      return (
                                        <li
                                          key={usr.chatLobbyId}
                                          className={`clearfix ${isActive ? "active-lobby" : ""}`}
                                          onClick={isActive ? undefined : () => {
                                            if (selectedIds && selectedIds.length > 0) {
                                              handleBulkForward(otherUser._id);
                                            } else {
                                              handleForwardMessage(otherUser._id);
                                            }
                                            setForwardImage(false);
                                            setForwardFile('');
                                            setForwardVideo(false);
                                            setForwardMessage('');
                                            setShowForwardModal(false); // close modal after forwarding
                                          }}
                                          style={{
                                            cursor: isActive ? "default" : "pointer",
                                            backgroundColor: isActive ? "#e6f7ff" : "transparent",
                                            borderLeft: isActive ? "4px solid #1890ff" : "none",
                                            paddingLeft: isActive ? "8px" : "12px",
                                            opacity: 1,
                                          }}
                                        >
                                          <img
                                            src={profilepic}
                                            alt="avatar"
                                            style={{
                                              width: "40px",
                                              height: "40px",
                                              borderRadius: "50%",
                                            }}
                                          />
                                          <div className="about">
                                            <div className="name">
                                              {firstName} {lastName}
                                              {count > 0 && (
                                                <span
                                                  style={{
                                                    backgroundColor: "red",
                                                    color: "white",
                                                    borderRadius: "50%",
                                                    padding: "2px 6px",
                                                    fontSize: "0.7em",
                                                    marginLeft: "5px",
                                                  }}
                                                >
                                                  {count}
                                                </span>
                                              )}
                                            </div>
                                            {usr.lastmsg && (
                                              <div
                                                style={{
                                                  fontSize: "0.8em",
                                                  color: "gray",
                                                  marginTop: "2px",
                                                  whiteSpace: "nowrap",
                                                  overflow: "hidden",
                                                  textOverflow: "ellipsis",
                                                  maxWidth: "150px",
                                                }}
                                                dangerouslySetInnerHTML={{ __html: usr.lastmsg }}
                                              />
                                            )}
                                          </div>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                ) : (
                                  <div
                                    style={{
                                      padding: "20px",
                                      textAlign: "center",
                                      color: "#888",
                                    }}
                                  >
                                    No users found.<br />
                                    Try adjusting your search or{" "}
                                    <a
                                      href="/profile/tribers"
                                      style={{
                                        color: "#1890ff",
                                        textDecoration: "underline",
                                      }}
                                    >
                                      add tribers
                                    </a>
                                    .
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}






                  {/* End Chat Box */}
                  {/* ── Image Lightbox ── */}


                </div>
              </div>
            </section>
          </div>
        </div>
      </div>


      <Script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js" />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/nicescroll/3.7.6/jquery.nicescroll.min.js" />

    </>
  );
}
