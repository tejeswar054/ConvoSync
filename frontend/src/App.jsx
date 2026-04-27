import { useEffect, useState } from "react";
import { createSocket } from "./socket/socket";
import Sidebar from "./sidebar";

function App() {
  const [userId, setUserId] = useState("");
  const [socket, setSocket] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

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
      />

      <div style={{ padding: "20px" }}>
        <h2>
          {selectedUser
            ? `Chat with ${selectedUser}`
            : "Select a user"}
        </h2>
      </div>
    </div>
  );
}

export default App;

