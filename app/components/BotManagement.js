"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Flex,
  VStack,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { chatServiceHost } from "@/app/config";

import UpdateKnowledgeBase from "./UpdateKnowledgeBase";
import ViewKnowledgeBase from "./ViewKnowledgeBase";
import TestQuery from "./TestQuery";

const SidebarContent = ({ setActiveSection, onClose }) => {
  return (
    <VStack align="stretch" spacing={4}>
      <Button
        justifyContent="flex-start"
        variant="ghost"
        onClick={() => {
          setActiveSection("updateKnowledgeBase");
          onClose && onClose();
        }}
      >
        Update Knowledge Base
      </Button>
      <Button
        justifyContent="flex-start"
        variant="ghost"
        onClick={() => {
          setActiveSection("viewKnowledgeBase");
          onClose && onClose();
        }}
      >
        View Knowledge Base
      </Button>
      <Button
        justifyContent="flex-start"
        variant="ghost"
        onClick={() => {
          setActiveSection("testQuery");
          onClose && onClose();
        }}
      >
        Test Query
      </Button>
    </VStack>
  );
};

const BotManagement = ({ tenantId }) => {
  const [activeSection, setActiveSection] = useState("updateKnowledgeBase");
  const [pendingTasks, setPendingTasks] = useState([]);
  const clientRef = useRef(null);
  const toast = useToast();

  // WebSocket connection and message handling
  const connect = () => {
    if (clientRef.current && clientRef.current.connected) {
      console.log("WebSocket client is already connected.");
      return;
    }

    console.log(`Connecting WebSocket for Tenant ID: ${tenantId}`);

    const socketUrl = chatServiceHost + `/ws`;
    const socket = new SockJS(socketUrl);
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(
          `/topic/${tenantId}.task_complete`,
          onMessageReceived,
          {
            ack: "client-individual",
          }
        );
        console.log("Connected to WebSocket channel.");
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

  const disconnect = () => {
    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
      console.log("Disconnected from WebSocket.");
    }
  };

  const onMessageReceived = (payload) => {
    const message = JSON.parse(payload.body);
    console.log("Received worker message:", message);

    const filename = message.file;

    setPendingTasks((prevTasks) => {
      const newTasks = prevTasks.filter((name) => name !== filename);

      if (newTasks.length === 0) {
        disconnect();
      }

      return newTasks;
    });
    if (message.status == "success") {
      toast({
        title: "Task Complete",
        description: `The task with filename ${filename} has been completed.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } else {
      console.log(message.error);
      toast({
        title: "Task Failed",
        description: message.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Cleanup WebSocket on component unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  // Chakra UI hooks
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bgColor = useColorModeValue("gray.50", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <Box minH="100vh" bg={bgColor}>
      <Flex>
        <Box
          display={{ base: "none", md: "block" }}
          w="250px"
          borderRightWidth={1}
          borderColor={borderColor}
          h="calc(100vh - 80px)"
          p={5}
        >
          <SidebarContent setActiveSection={setActiveSection} />
        </Box>

        <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
          <DrawerOverlay>
            <DrawerContent>
              <DrawerCloseButton />
              <DrawerHeader>Menu</DrawerHeader>
              <DrawerBody>
                <SidebarContent
                  setActiveSection={setActiveSection}
                  onClose={onClose}
                />
              </DrawerBody>
            </DrawerContent>
          </DrawerOverlay>
        </Drawer>

        <Box flex={1} p={8} maxW="800px" mx="auto">
          {activeSection === "updateKnowledgeBase" && (
            <UpdateKnowledgeBase
              tenantId={tenantId}
              pendingTasks={pendingTasks}
              setPendingTasks={setPendingTasks}
              connect={connect}
              clientRef={clientRef}
            />
          )}
          {activeSection === "viewKnowledgeBase" && (
            <ViewKnowledgeBase tenantId={tenantId} />
          )}
          {activeSection === "testQuery" && (
            <TestQuery tenantId={tenantId} />
          )}
        </Box>
      </Flex>
    </Box>
  );
};

export default BotManagement;
