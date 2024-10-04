"use client";
import React, { useState, useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import axios from "axios";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  Sidebar,
  ConversationList,
  Conversation,
  Avatar
} from "@chatscope/chat-ui-kit-react";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import { chatServiceHost, tenantServiceHost, imageHost } from '@/app/config';

const AgentChat = ({ tenantId, userId, userName }) => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [assignedCustomers, setAssignedCustomers] = useState([]); // Changed to store user objects
  const [waitingCustomers, setWaitingCustomers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef(null);
  const messageRefs = useRef({});
  
  // Ref to keep track of the latest selectedCustomer
  const selectedCustomerRef = useRef(null);
  
  // Initialize the message queue
  const messageQueueRef = useRef([]);

  useEffect(() => {
    connect();
    fetchLogo();
    fetchConnectedUsers(); // Fetch connected users on initial render

    return () => {
      // Call dropCustomer on the currently selected customer before disconnecting
      if (selectedCustomerRef.current) {
        dropCustomer(selectedCustomerRef.current);
      }

      if (clientRef.current) {    
        // Deactivate the WebSocket connection
        clientRef.current.deactivate();
      }
    };
  }, []);

  // Function to fetch the connected users
  const fetchConnectedUsers = async () => {
    try {
      const response = await axios.get(`${chatServiceHost}/api/v1/tenants/${tenantId}/users/active`);
      if (response.data && response.data.data) {
        const users = response.data.data; // Expecting an array of { user_id, user_name }
        setAssignedCustomers(users); // Update assignedCustomers with user objects
      } else {
        console.error("Invalid response format:", response);
      }
    } catch (error) {
      console.error("Error fetching connected users:", error);
    }
  };

  const fetchLogo = async () => {
    try {
      const params = new URLSearchParams();
      params.append('tenant_id', tenantId);
  
      const response = await fetch(`${tenantServiceHost}/api/v1/tenants/find?${params.toString()}`, {});
      
      if (response.ok) {
        const data = await response.json();
        if (data.logo) {
          setLogoUrl(`${imageHost}/${data.logo}`);
        }
      } else {
        console.error("Failed to fetch logo:", response.statusText);
      }
    } catch (error) {
      console.error(`Error fetching tenant data for alias: ${tenantId}`, error);
    }
  };


  const connect = () => {
    console.log(`Connect with credential: Tenant ID: ${tenantId}, User ID: ${userId}, Username: ${userName}`);

    const socketUrl = chatServiceHost + `/ws`;
    const socket = new SockJS(socketUrl);

    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("Connected");

        client.subscribe(`/topic/${tenantId}.new_customer`, onNewCustomerReceived);
        client.subscribe(`/topic/${tenantId}.customer_message`, onMessageReceived);
        client.subscribe(`/topic/${tenantId}.customer_waiting`, onCustomerWaitingReceived, { ack: 'client-individual' });

        client.publish({
          destination: "/app/chat.addUser",
          body: JSON.stringify({
            sender: userId,
            type: "JOIN",
            tenant_id: tenantId,
            user_type: "agent",
            timestamp: new Date().toISOString(),
          }),
        });

        setIsConnected(true);

        // Process any queued messages
        if (messageQueueRef.current.length > 0) {
          console.log("Sending queued messages:", messageQueueRef.current);
          messageQueueRef.current.forEach((queuedMessage) => {
            client.publish(queuedMessage);
          });
          // Clear the queue after sending
          messageQueueRef.current = [];
        }
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
  };

  const onNewCustomerReceived = (payload) => {
    const message = JSON.parse(payload.body);
    console.log("Received new customer join message:", message);

    if (message.sender && !assignedCustomers.find(user => user.user_id === message.sender)) {
      // Assuming message.sender is user_id and you might need user_name
      // If user_name is not provided, you might need to fetch it separately
      setAssignedCustomers((prevCustomers) => [...prevCustomers, { user_id: message.sender, user_name: message.sender }]);
    }

    setMessages((prevMessages) => [...prevMessages, { ...message, timestamp: new Date().toISOString() }]);
  };

  const onMessageReceived = (payload) => {
    const message = JSON.parse(payload.body);
    console.log("Received chat message:", message);

    setMessages((prevMessages) => [...prevMessages, { ...message, timestamp: new Date().toISOString() }]);
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
        timestamp: new Date().toISOString(),
      };

      setMessages((prevMessages) => [...prevMessages, chatMessage]);

      clientRef.current.publish({
        destination: "/app/chat.sendMessage",
        body: JSON.stringify(chatMessage),
      });

      console.log("sending messages:", chatMessage);

      setMessageInput("");
    }
  };

  const pickUpCustomer = (customer) => {
    const pickUpInfo = {
      agent: userId,
      customer: customer,
      type: "pickup",
      tenant_id: tenantId,
      timestamp: new Date().toISOString(),
    };

    const publishPayload = {
      destination: "/app/chat.pickUp",
      body: JSON.stringify(pickUpInfo),
    };

    const pickUpNotification = {
      sender: userId,
      sender_name: userName,
      content: `客服 ${userName} 正在為您服務`,
      type: "CHAT",
      tenant_id: tenantId,
      receiver: customer,
      user_type: "agent",
      timestamp: new Date().toISOString(),
    };


    const pickUpNotificationPayload = {
      destination: "/app/chat.sendMessage",
      body: JSON.stringify(pickUpNotification),
    };



    if (isConnected && clientRef.current && clientRef.current.active) {
      clientRef.current.publish(publishPayload);
      clientRef.current.publish(pickUpNotificationPayload);
      console.log("Picking up customer immediately:", pickUpInfo);
    } else {
      // Enqueue the message to be sent once connected
      messageQueueRef.current.push(publishPayload);
      messageQueueRef.current.push(pickUpNotificationPayload);
      console.log("Queued pickup message (waiting for connection):", pickUpInfo);
    }
  };

  const dropCustomer = (customer) => {
    if (!clientRef.current || !customer) {
      console.warn("Cannot drop customer: WebSocket not connected or customer is null");
      return;
    }

    const dropInfo = {
      agent: userId,
      customer: customer,
      type: "drop",
      tenant_id: tenantId,
      timestamp: new Date().toISOString(),
    };

    clientRef.current.publish({
      destination: "/app/chat.pickUp",
      body: JSON.stringify(dropInfo),
    });

    console.log("Dropping customer:", dropInfo);
  };

  const loadOfflineMessages = async (customerId) => {
    try {
      const response = await axios.get(
        `${chatServiceHost}/api/chats/${tenantId}/${customerId}`
      );
      setMessages(response.data.map(msg => ({ ...msg, timestamp: new Date(msg.timestamp).toISOString() })));
    } catch (error) {
      console.error("Error loading offline messages:", error);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ height: "calc(100vh - 72px)" }}>
      <MainContainer>
        <Sidebar position="left" scrollable={false}>
          <ConversationList>
            {assignedCustomers.map((user) => (
              <Conversation
                key={user.user_id}
                name={user.user_name}
                info={waitingCustomers.includes(user.user_id) ? "Waiting" : ""}
                active={user.user_id === selectedCustomer}
                onClick={() => {
                  // Drop the currently selected customer before switching
                  if (selectedCustomerRef.current) {
                    dropCustomer(selectedCustomerRef.current);
                  }

                  setSelectedCustomer(user.user_id);
                  selectedCustomerRef.current = user.user_id; // Update the ref
                  pickUpCustomer(user.user_id);
                  //loadOfflineMessages(user.user_id);
                  acknowledgeMessage(user.user_id);
                }}
              >
                <Avatar 
                  src={`${imageHost}/tenant_logos/user.png`} 
                  name={user.user_name} 
                  status={waitingCustomers.includes(user.user_id) ? "available" : "dnd"} 
                />
              </Conversation>
            ))}
          </ConversationList>
        </Sidebar>
        <ChatContainer>
          <MessageList>
            {messages
               .filter((msg) => 
                (msg.type === "CHAT" &&
                  (
                    msg.sender === selectedCustomer ||
                    (msg.sender === userId && msg.receiver === selectedCustomer)
                  )
                ) ||
                (msg.type === "SUMMARY" && msg.receiver === selectedCustomer)
              )
              .map((msg, idx) => (
                <Message
                  key={idx}
                  model={{
                    message: msg.content,
                    sentTime: formatTimestamp(msg.timestamp),
                    sender: msg.sender === userId ? userName : msg.sender,
                    direction: msg.sender === userId ? "outgoing" : "incoming",
                    position: "normal",
                  }}>
                  <Message.Header sender={msg.sender === userId ? userName : msg.sender} sentTime={formatTimestamp(msg.timestamp)} />
                  <Message.Footer>
                    <small>{new Date(msg.timestamp).toLocaleTimeString()}</small>
                  </Message.Footer>
                  <Avatar
                    src={msg.sender === userId ? `${imageHost}/tenant_logos/agent.png` : `${imageHost}/tenant_logos/user.png`}
                    name={msg.sender === userId ? userName : msg.sender}
                  />
                </Message>
              ))}
          </MessageList>
          <MessageInput
            placeholder="Type message here"
            value={messageInput}
            onChange={(val) => setMessageInput(val)}
            onSend={sendMessage}
            attachButton={false}
          />
        </ChatContainer>
      </MainContainer>
    </div>
  );
};

export default AgentChat;
