"use client";

import React, { useState, useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import axios from "axios";

const chatServiceHost = "http://203.204.185.67:8080";

const AgentChat = () => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [assignedCustomers, setAssignedCustomers] = useState([]);
  const [waitingCustomers, setWaitingCustomers] = useState([]);
  const [tenantId, setTenantId] = useState(""); // Tenant ID state
  const [userId, setUserId] = useState(""); // User ID state
  const [isConnected, setIsConnected] = useState(false); // Track connection status
  const clientRef = useRef(null);
  const messageRefs = useRef({});

  const connect = () => {
    if (tenantId && userId) {
      const socketUrl = chatServiceHost + `/ws`;
      const socket = new SockJS(socketUrl);

      const client = new Client({
        webSocketFactory: () => socket,
        reconnectDelay: 5000,
        onConnect: () => {
          console.log("Connected");

          // Subscribe to customer join events
          client.subscribe(`/topic/${tenantId}.new_customer`, onNewCustomerReceived);

          // Subscribe to customer chat messages
          client.subscribe(`/topic/${tenantId}.customer_message`, onMessageReceived);

          // Subscribe to customer waiting channel
          client.subscribe(`/topic/${tenantId}.customer_waiting`, onCustomerWaitingReceived, { ack: 'client-individual' });

          // Notify server that agent has joined
          client.publish({
            destination: "/app/chat.addUser",
            body: JSON.stringify({
              sender: userId,
              type: "JOIN",
              tenant_id: tenantId,
              user_type: "agent",
            }),
          });

          setIsConnected(true); // Mark as connected
        },
        onStompError: (frame) => {
          console.error("Broker reported error: " + frame.headers["message"]);
          console.error("Additional details: " + frame.body);
        },
        debug: (str) => {
          console.log(str);
        },
      });

      client.activate();
      clientRef.current = client;
    }
  };

  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
    };
  }, []);

  const onNewCustomerReceived = (payload) => {
    const message = JSON.parse(payload.body);
    console.log("Received new customer join message:", message);

    if (message.sender && !assignedCustomers.includes(message.sender)) {
      setAssignedCustomers((prevCustomers) => [...prevCustomers, message.sender]);
    }

    setMessages((prevMessages) => [...prevMessages, message]);
  };

  const onMessageReceived = (payload) => {
    const message = JSON.parse(payload.body);
    console.log("Received chat message:", message);

    setMessages((prevMessages) => [...prevMessages, message]);
  };

  const onCustomerWaitingReceived = (payload) => {
    const message = JSON.parse(payload.body);
    console.log("Received customer waiting message:", message);

    messageRefs.current[message.customer_id] = payload;

    if (message.customer_id && !waitingCustomers.includes(message.customer_id)) {
      setWaitingCustomers((prevCustomers) => [...prevCustomers, message.customer_id]);
    }
  };

  const acknowledgeMessage = (customerId) => {
    const message = messageRefs.current[customerId];

    if (message) {
      try {
        message.ack();
        console.log(`Acknowledged message for customer: ${customerId}`);
      } catch (error) {
        console.error(`Failed to acknowledge message for customer: ${customerId}`, error);
      }
      delete messageRefs.current[customerId];
    }
  };

  const sendMessage = () => {
    if (messageInput.trim() !== "" && clientRef.current && selectedCustomer) {
      const chatMessage = {
        sender: userId,
        content: messageInput,
        type: "CHAT",
        tenant_id: tenantId,
        receiver: selectedCustomer,
        user_type: "agent",
      };

      setMessages((prevMessages) => [...prevMessages, chatMessage]);

      clientRef.current.publish({
        destination: "/app/chat.sendMessage",
        body: JSON.stringify(chatMessage),
      });

      setMessageInput("");
    }
  };

  const loadOfflineMessages = async (customerId) => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/chats/${tenantId}/${customerId}`
      );
      setMessages(response.data);
    } catch (error) {
      console.error("Error loading offline messages:", error);
    }
  };

  return (
    <div>
      <h2>Agent Chat</h2>

      {!isConnected && (
        <div>
          <input
            type="text"
            placeholder="Enter Tenant ID"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
          />
          <input
            type="text"
            placeholder="Enter User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          <button
            onClick={() => {
              if (tenantId && userId) {
                connect(); // Trigger connection logic here
              } else {
                alert("Please enter both Tenant ID and User ID");
              }
            }}
          >
            Connect
          </button>
        </div>
      )}

      {isConnected && (
        <div style={{ display: "flex" }}>
          <div style={{ width: "20%", borderRight: "1px solid #ccc", padding: "10px" }}>
            <h3>Assigned Customers</h3>
            <ul>
              {assignedCustomers.map((customerId) => (
                <li key={customerId}>
                  <button
                    onClick={() => {
                      setSelectedCustomer(customerId);
                      loadOfflineMessages(customerId);
                      acknowledgeMessage(customerId);
                    }}
                    style={{
                      backgroundColor: waitingCustomers.includes(customerId)
                        ? "yellow"
                        : "white",
                    }}
                  >
                    {customerId}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div style={{ width: "80%", padding: "10px" }}>
            {selectedCustomer ? (
              <>
                <h3>Chat with {selectedCustomer}</h3>
                <div
                  style={{
                    border: "1px solid #ccc",
                    height: "300px",
                    overflowY: "scroll",
                    padding: "10px",
                  }}
                >
                  {messages
                    .filter(
                      (msg) =>
                        (msg.sender === selectedCustomer && msg.receiver === userId) ||
                        (msg.sender === userId && msg.receiver === selectedCustomer)
                    )
                    .map((msg, idx) => (
                      <div key={idx}>
                        <strong>{msg.sender}: </strong>
                        <span>{msg.content}</span>
                      </div>
                    ))}
                </div>
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") sendMessage();
                  }}
                  style={{ width: "80%", padding: "10px" }}
                />
                <button onClick={sendMessage} style={{ padding: "10px" }}>
                  Send
                </button>
              </>
            ) : (
              <p>Select a customer to start chatting.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentChat;
