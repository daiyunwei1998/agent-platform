"use client";

import React, { useState, useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import axios from "axios";

const AgentChat = () => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [assignedCustomers, setAssignedCustomers] = useState([]);
  const [waitingCustomers, setWaitingCustomers] = useState([]);
  const clientRef = useRef(null);
  const messageRefs = useRef({}); 

  const tenantId = "tenant1";
  const userId = "agent1";

  useEffect(() => {
    const socketUrl = `http://localhost:8080/ws`;
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

        // Subscribe to customer_waiting channel
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

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
    };
  }, [tenantId, userId]);

  const onNewCustomerReceived = (payload) => {
    const message = JSON.parse(payload.body);
    console.log("Received new customer join message:", message);

    // Add to assignedCustomers if not already present
    if (message.sender && !assignedCustomers.includes(message.sender)) {
      setAssignedCustomers((prevCustomers) => [...prevCustomers, message.sender]);
    }

    // Initialize chat messages or other logic (from persisted chat history)
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

    // Store the message reference for acknowledgment later
    messageRefs.current[message.customer_id] = payload;

    if (message.customer_id && !waitingCustomers.includes(message.customer_id)) {
      setWaitingCustomers((prevCustomers) => [...prevCustomers, message.customer_id]);
    }
  };

  const acknowledgeMessage = (customerId) => {
    const message = messageRefs.current[customerId];

    if (message) {
      console.log(message);
      try {
        message.ack();
        console.log(`Acknowledged message for customer: ${customerId}`);
      } catch (error) {
        console.error(`Failed to acknowledge message for customer: ${customerId}`, error);
      }
      // Remove the reference after acknowledgment
      delete messageRefs.current[customerId];
    }
  };

  const sendMessage = () => {
    if (messageInput.trim() !== "" && clientRef.current && selectedCustomer) {
      const chatMessage = {
        sender: userId,             // Agent's ID, e.g., "agent1"
        content: messageInput,      // Message content
        type: "CHAT",
        tenant_id: tenantId,         // "tenant1"
        receiver: selectedCustomer, // Target customer's ID, e.g., "customer1"
        user_type: "agent",
      };

      // Append the sent message to the messages state
      setMessages((prevMessages) => [...prevMessages, chatMessage]);

      // Publish the message to the server
      clientRef.current.publish({
        destination: "/app/chat.sendMessage",
        body: JSON.stringify(chatMessage),
      });

      // Clear the input field after sending the message
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
                      ? "yellow" // Highlight customers who are in the waiting state
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
                      (msg.sender === selectedCustomer && msg.receiver === userId) || // Messages from the customer to the agent
                      (msg.sender === userId && msg.receiver === selectedCustomer)    // Messages from the agent to the customer
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
    </div>
  );
};

export default AgentChat;
