import React, { useState } from "react";
import ChatSidebar from "../components/chatsupport/ChatSidebar";
import ChatWindow from "../components/chatsupport/ChatWindow";

export default function CustomerSupport() {
    const [activeUser, setActiveUser] = useState(null);

    return (
        <div className="flex h-full bg-white">
            <ChatSidebar onSelect={setActiveUser} activeUserId={activeUser} />
            <ChatWindow userId={activeUser} />
        </div>
    );
}
