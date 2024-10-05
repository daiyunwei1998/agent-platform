"use client";
import React, { useState, useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import axios from "axios";
import {
  Box,
  Flex,
  Text,
  Input,
  Button,
  Spinner,
  Alert,
  AlertIcon,
  Avatar,
  VStack,
  HStack,
  Divider,
  useToast,
  IconButton,
} from "@chakra-ui/react";
import { chatServiceHost, tenantServiceHost, imageHost, aiServiceHost} from "@/app/config";
import { CloseIcon } from "@chakra-ui/icons";

const AgentChat = ({ tenantId, userId, userName }) => {
  // State Variables
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [assignedCustomers, setAssignedCustomers] = useState([]);
  const [waitingCustomers, setWaitingCustomers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [summary, setSummary] = useState(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  const clientRef = useRef(null);
  const messageRefs = useRef({});
  const selectedCustomerRef = useRef(null);
  const messageQueueRef = useRef([]);

  const toast = useToast();

  // Fetch connected users and tenant logo on mount
  useEffect(() => {
    connectWebSocket();
    fetchLogo();
    fetchConnectedUsers();

    return () => {
      if (selectedCustomerRef.current) {
        dropCustomer(selectedCustomerRef.current);
      }

      if (clientRef.current) {
        clientRef.current.deactivate();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to fetch connected users
  const fetchConnectedUsers = async () => {
    try {
      const response = await axios.get(
        `${chatServiceHost}/api/v1/tenants/${tenantId}/users/active`
      );
      if (response.data && response.data.data) {
        const users = response.data.data; // Expecting [{ user_id, user_name }, ...]
        setAssignedCustomers(users);
      } else {
        console.error("Invalid response format:", response);
      }
    } catch (error) {
      console.error("Error fetching connected users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch connected users.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Function to fetch tenant logo
  const fetchLogo = async () => {
    try {
      const params = new URLSearchParams();
      params.append("tenant_id", tenantId);

      const response = await fetch(
        `${tenantServiceHost}/api/v1/tenants/find?${params.toString()}`,
        {}
      );

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

  // WebSocket Connection
  const connectWebSocket = () => {
    console.log(
      `Connecting with Tenant ID: ${tenantId}, User ID: ${userId}, Username: ${userName}`
    );

    const socketUrl = `${chatServiceHost}/ws`;
    const socket = new SockJS(socketUrl);

    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("WebSocket Connected");

        client.subscribe(
          `/topic/${tenantId}.new_customer`,
          onNewCustomerReceived
        );
        client.subscribe(
          `/topic/${tenantId}.customer_message`,
          onMessageReceived
        );
        client.subscribe(
          `/topic/${tenantId}.customer_waiting`,
          onCustomerWaitingReceived,
          { ack: "client-individual" }
        );

        // Notify server of user joining
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
          messageQueueRef.current.forEach((queuedMessage) => {
            client.publish(queuedMessage);
          });
          messageQueueRef.current = [];
        }
      },
      onStompError: (frame) => {
        console.error("Broker reported error: " + frame.headers["message"]);
        console.error("Additional details: " + frame.body);
        toast({
          title: "WebSocket Error",
          description: frame.headers["message"],
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      },
      debug: (str) => {
        console.log(str);
      },
    });

    client.activate();
    clientRef.current = client;
  };

  // Handlers for incoming messages
  const onNewCustomerReceived = (payload) => {
    const message = JSON.parse(payload.body);
    console.log("New Customer:", message);

    if (
      message.sender &&
      !assignedCustomers.find((user) => user.user_id === message.sender)
    ) {
      setAssignedCustomers((prev) => [
        ...prev,
        { user_id: message.sender, user_name: message.sender },
      ]);
    }

    setMessages((prev) => [
      ...prev,
      { ...message, timestamp: new Date().toISOString() },
    ]);
  };

  const onMessageReceived = (payload) => {
    const message = JSON.parse(payload.body);
    console.log("Chat Message:", message);

    setMessages((prev) => [
      ...prev,
      { ...message, timestamp: new Date().toISOString() },
    ]);
  };

  const onCustomerWaitingReceived = (payload) => {
    const message = JSON.parse(payload.body);
    console.log("Customer Waiting:", message);

    messageRefs.current[message.customer_id] = payload;

    if (
      message.customer_id &&
      !waitingCustomers.includes(message.customer_id)
    ) {
      setWaitingCustomers((prev) => [...prev, message.customer_id]);
    }
  };

  const acknowledgeMessage = (customerId) => {
    const message = messageRefs.current[customerId];

    if (message) {
      try {
        message.ack();
        console.log(`Acknowledged message for customer: ${customerId}`);
      } catch (error) {
        console.error(
          `Failed to acknowledge message for customer: ${customerId}`,
          error
        );
      }
      delete messageRefs.current[customerId];
    }
  };

  // Function to send a chat message
  const sendMessage = () => {
    if (
      messageInput.trim() !== "" &&
      clientRef.current &&
      selectedCustomer
    ) {
      const chatMessage = {
        sender: userId,
        content: messageInput,
        type: "CHAT",
        tenant_id: tenantId,
        receiver: selectedCustomer,
        user_type: "agent",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, chatMessage]);

      clientRef.current.publish({
        destination: "/app/chat.sendMessage",
        body: JSON.stringify(chatMessage),
      });

      console.log("Sent message:", chatMessage);

      setMessageInput("");
    }
  };

  // Function to fetch summary
  const fetchSummary = async (customerId) => {
    setIsLoadingSummary(true);
    setSummaryError(null);
    setSummary(null);

    try {
      const response = await axios.post(`${aiServiceHost}/summary`, {
        tenant_id: tenantId,
        customer_id: customerId,
      });

      const summaryText = response.data.summary;
      setSummary(summaryText);
    } catch (error) {
      console.error("Error fetching summary:", error);
      setSummaryError("Failed to load summary.");
      toast({
        title: "Error",
        description: "Failed to fetch customer summary.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // Function to pick up a customer
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
      console.log("Picked up customer:", pickUpInfo);
    } else {
      messageQueueRef.current.push(publishPayload);
      messageQueueRef.current.push(pickUpNotificationPayload);
      console.log("Queued pickup message:", pickUpInfo);
    }

    // Fetch summary after picking up
    fetchSummary(customer);
  };

  // Function to drop a customer
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

    console.log("Dropped customer:", dropInfo);
  };

  // Function to format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Flex height="calc(100vh - 72px)" direction="row">
      {/* Sidebar */}
      <Box
        width="250px"
        bg="gray.100"
        p={4}
        borderRight="1px"
        borderColor="gray.200"
        overflowY="auto"
      >
        <Text fontSize="xl" mb={4}>
          Connected Customers
        </Text>
        <VStack spacing={4} align="stretch">
          {assignedCustomers.map((user) => (
            <HStack
              key={user.user_id}
              p={2}
              bg={
                user.user_id === selectedCustomer
                  ? "blue.100"
                  : "transparent"
              }
              borderRadius="md"
              cursor="pointer"
              onClick={() => {
                if (selectedCustomerRef.current) {
                  dropCustomer(selectedCustomerRef.current);
                }

                setSelectedCustomer(user.user_id);
                selectedCustomerRef.current = user.user_id;
                pickUpCustomer(user.user_id);
                acknowledgeMessage(user.user_id);
              }}
            >
              <Avatar
                size="sm"
                src={`${imageHost}/tenant_logos/user.png`}
                name={user.user_name}
              />
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold">{user.user_name}</Text>
                {waitingCustomers.includes(user.user_id) && (
                  <Text fontSize="sm" color="gray.500">
                    Waiting
                  </Text>
                )}
              </VStack>
              {selectedCustomer === user.user_id && (
                <IconButton
                  icon={<CloseIcon />}
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    dropCustomer(user.user_id);
                    setSelectedCustomer(null);
                    selectedCustomerRef.current = null;
                  }}
                />
              )}
            </HStack>
          ))}
        </VStack>
      </Box>

      {/* Main Chat Area */}
      <Flex flex="1" direction="column">
        {/* Summary Section */}
        <Box
          bg="gray.50"
          p={4}
          borderBottom="1px"
          borderColor="gray.200"
        >
          <Text fontSize="lg" fontWeight="bold" mb={2}>
            Customer Summary
          </Text>
          {isLoadingSummary ? (
            <Flex align="center">
              <Spinner size="sm" mr={2} />
              <Text>Loading summary...</Text>
            </Flex>
          ) : summaryError ? (
            <Alert status="error">
              <AlertIcon />
              {summaryError}
            </Alert>
          ) : summary ? (
            <Box
              p={3}
              bg="blue.50"
              borderRadius="md"
              border="1px"
              borderColor="blue.200"
            >
              <Text>{summary}</Text>
            </Box>
          ) : (
            <Text color="gray.500">No summary available.</Text>
          )}
        </Box>

        {/* Messages */}
        <Box
          flex="1"
          p={4}
          overflowY="auto"
          bg="white"
        >
          <VStack spacing={4} align="stretch">
            {messages
              .filter(
                (msg) =>
                  (msg.type === "CHAT" &&
                    (msg.sender === selectedCustomer ||
                      (msg.sender === userId &&
                        msg.receiver === selectedCustomer))) ||
                  msg.type === "SYSTEM"
              )
              .map((msg, idx) => {
                if (msg.type === "SYSTEM") {
                  return (
                    <Flex
                      key={idx}
                      justify="center"
                      align="center"
                      bg="yellow.100"
                      p={2}
                      borderRadius="md"
                    >
                      <Text fontSize="sm" color="yellow.800">
                        {msg.content}
                      </Text>
                    </Flex>
                  );
                }

                const isOutgoing = msg.sender === userId;
                return (
                  <Flex
                    key={idx}
                    align={isOutgoing ? "flex-end" : "flex-start"}
                  >
                    {!isOutgoing && (
                      <Avatar
                        size="sm"
                        src={`${imageHost}/tenant_logos/user.png`}
                        name={msg.sender}
                        mr={2}
                      />
                    )}
                    <Box
                      bg={isOutgoing ? "blue.100" : "gray.100"}
                      p={3}
                      borderRadius="md"
                      maxW="70%"
                    >
                      <Text>{msg.content}</Text>
                      <Text fontSize="xs" color="gray.500" textAlign="right">
                        {formatTimestamp(msg.timestamp)}
                      </Text>
                    </Box>
                    {isOutgoing && (
                      <Avatar
                        size="sm"
                        src={`${imageHost}/tenant_logos/agent.png`}
                        name={userName}
                        ml={2}
                      />
                    )}
                  </Flex>
                );
              })}
          </VStack>
        </Box>

        {/* Message Input */}
        <Box p={4} bg="gray.50" borderTop="1px" borderColor="gray.200">
          <Flex>
            <Input
              placeholder="Type your message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button
              colorScheme="blue"
              ml={2}
              onClick={sendMessage}
              isDisabled={!messageInput.trim()}
            >
              Send
            </Button>
          </Flex>
        </Box>
      </Flex>
    </Flex>
  );
};

export default AgentChat;
