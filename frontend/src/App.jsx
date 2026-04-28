import { useEffect, useState } from "react";
import { createSocket } from "./socket/socket";
import Sidebar from "./sidebar";
import ChatWindow from "./components/ChatWindow";

function App() {
  const [userId, setUserId] = useState("");
  const [socket, setSocket] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});

  useEffect(() => {
    const id = prompt("Enter your userId");
    setUserId(id);

    const newSocket = createSocket(id);
    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);

  return (
    <div style={{ display: "flex" }}>
      <Sidebar
        socket={socket}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        unreadCounts={unreadCounts}
        setUnreadCounts={setUnreadCounts}
      />

      <ChatWindow
        socket={socket}
        userId={userId}
        selectedUser={selectedUser}
        unreadCounts={unreadCounts}
        setUnreadCounts={setUnreadCounts}
      />
    </div>
  );
}

export default App;

