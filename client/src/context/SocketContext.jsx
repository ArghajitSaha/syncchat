import { useAppStore } from "@/store";
import { HOST } from "@/utils/constants";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const socket = useRef(null); // Make sure to initialize it to `null`
  const { userInfo } = useAppStore(); // Correct usage of useAppStore()

  const handleReceiveMessage = useCallback((message) => {
    const {
      selectedChatData,
      selectedChatType,
      addMessage,
      addContactsInDMContacts,
    } = useAppStore.getState();

    if (
      selectedChatType !== undefined &&
      (selectedChatData._id === message.sender._id ||
        selectedChatData._id === message.recipient._id)
    ) {
      console.log("Message received:", message);
      addMessage(message); // Ensure this function is defined correctly in the store
    }
    addContactsInDMContacts(message);
  }, []);

  useEffect(() => {
    if (userInfo) {
      socket.current = io(HOST, {
        withCredentials: true,
        query: { userId: userInfo.id },
      });

      socket.current.on("connect", () => {
        console.log("Connected to socket server");
      });

      const handleReceiveChannelMessage = (message) => {
        const {
          selectedChatData,
          selectedChatType,
          addMessage,
          addChannelInChannelList,
        } = useAppStore.getState();

        if (
          selectedChatType !== undefined &&
          selectedChatData._id === message.channelId
        ) {
          addMessage(message);
        }
        addChannelInChannelList(message);
      };

      // Register the message handler
      socket.current.on("receiveMessage", handleReceiveMessage);
      socket.current.on("receive-channel-message", handleReceiveChannelMessage);

      return () => {
        // Clean up the socket connection
        if (socket.current) {
          socket.current.off("receiveMessage", handleReceiveMessage); // Remove listener to avoid memory leaks
          socket.current.disconnect();
        }
      };
    }
  }, [userInfo, handleReceiveMessage]);

  return (
    <SocketContext.Provider value={socket.current}>
      {children}
    </SocketContext.Provider>
  );
};
