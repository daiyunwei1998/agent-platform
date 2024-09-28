"use client";
import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from 'react-markdown';
import {
  Box,
  Button,
  Text,
  Icon,
  VStack,
  Heading,
  Input,
  Textarea,
  Flex,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useToast,
  Stack,
  useColorModeValue,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react";
import { useDropzone } from "react-dropzone";
import { MdCloudUpload, MdOutlineFilePresent } from "react-icons/md";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { tenantServiceHost, aiServiceHost, chatServiceHost } from "@/app/config";
import styles from './Dashboard.module.css'

// Sidebar Content for Navigation
const SidebarContent = ({ onClose }) => {
  return (
    <VStack align="stretch" spacing={4}>
      <Button justifyContent="flex-start" variant="ghost" onClick={onClose}>
        Dashboard
      </Button>
      <Button justifyContent="flex-start" variant="ghost" onClick={onClose}>
        Knowledge Base
      </Button>
      <Button justifyContent="flex-start" variant="ghost" onClick={onClose}>
        Test Retrieval
      </Button>
    </VStack>
  );
};

const Dashboard = ({ tenantId }) => {
  const [files, setFiles] = useState([]);
  const [query, setQuery] = useState("");
  const [retrievalResult, setRetrievalResult] = useState("");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingQuery, setIsLoadingQuery] = useState(false);
  const [pendingTasks, setPendingTasks] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bgColor = useColorModeValue("gray.50", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const toast = useToast();
  const clientRef = useRef(null);

  // New state variables for Knowledge Base functionality
  const [docNames, setDocNames] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docEntries, setDocEntries] = useState([]);
  const [isLoadingDocNames, setIsLoadingDocNames] = useState(false);
  const [isLoadingDocEntries, setIsLoadingDocEntries] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const { isOpen: isEditModalOpen, onOpen: onEditModalOpen, onClose: onEditModalClose } = useDisclosure();

  // File Drop Zone
  const onDrop = (acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      console.log("File:", file.name, "MIME Type:", file.type);
    });

    setFiles(
      acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      )
    );
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "application/json": [".json"],
    },
  });

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
    console.log("Received task complete message:", message);

    const filename = message.filename;

    setPendingTasks((prevTasks) => {
      const newTasks = prevTasks.filter((name) => name !== filename);

      if (newTasks.length === 0) {
        disconnect();
      }

      return newTasks;
    });

    toast({
      title: "Task Complete",
      description: `The task with filename ${filename} has been completed.`,
      status: "success",
      duration: 5000,
      isClosable: true,
    });
  };

  // Handle File Upload
  const handleUploadFile = async () => {
    setIsUploading(true);

    const filesToUpload = files;
    setFiles([]);

    const formData = new FormData();
    formData.append("tenant_id", tenantId);

    filesToUpload.forEach((file) => {
      formData.append("file", file);
    });

    const uploadUrl = `${tenantServiceHost}/files/upload/`;
    console.log("Sending request to:", uploadUrl);

    try {
      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Upload successful.",
          description: `File uploaded successfully. Task ID: ${result.task_id}`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });

        setPendingTasks((prevTasks) => {
          const newTasks = [...prevTasks, ...filesToUpload.map((file) => file.name)];

          if (prevTasks.length === 0) {
            connect();
          }

          return newTasks;
        });
      } else {
        const error = await response.json();
        toast({
          title: "Upload failed.",
          description: `Error: ${error.detail || "Unknown error occurred"}`,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Upload error.",
        description: `Error: ${error.message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Test Query (AI Retrieval)
  const handleTestQuery = async () => {
    setIsLoadingQuery(true);

    try {
      const response = await fetch(`${aiServiceHost}/api/v1/rag`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query,
          tenant_id: tenantId,
        }),
      });

      if (!response.ok) {
        throw new Error("AI Service error");
      }

      const data = await response.json();
      setRetrievalResult(data.data);
    } catch (error) {
      console.error("Error:", error);
      setRetrievalResult("Error fetching data. Please try again.");
    } finally {
      setIsLoadingQuery(false);
    }
  };

  // Fetch document names
  const fetchDocNames = async () => {
    setIsLoadingDocNames(true);
    try {
      const response = await fetch(`${tenantServiceHost}/api/v1/tenant_docs/${tenantId}/`);
      if (!response.ok) {
        throw new Error("Failed to fetch document names");
      }
      const data = await response.json();
      const docNames = data.map(item => item.doc_name);
      setDocNames(docNames);
    } catch (error) {
      console.error("Error fetching document names:", error);
      toast({
        title: "Error",
        description: "Failed to fetch document names",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingDocNames(false);
    }
  };

  // Fetch entries for a selected document
  const fetchDocEntries = async (docName) => {
    setIsLoadingDocEntries(true);
    try {
      const response = await fetch(`${tenantServiceHost}/api/v1/knowledge_base/${tenantId}/entries?docName=${encodeURIComponent(docName)}`);
      if (!response.ok) {
        throw new Error("Failed to fetch document entries");
      }
      const data = await response.json();
      setDocEntries(data.entries);
    } catch (error) {
      console.error("Error fetching document entries:", error);
      toast({
        title: "Error",
        description: "Failed to fetch document entries",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingDocEntries(false);
    }
  };

  // Update entry content
  const updateEntryContent = async () => {
    try {
      console.log(`edited ${editingEntry.id}`)
      const response = await fetch(`${tenantServiceHost}/api/v1/knowledge_base/${tenantId}/entries/${editingEntry.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newContent: editedContent }),
      });
      if (!response.ok) {
        throw new Error("Failed to update entry content");
      }
      toast({
        title: "Success",
        description: "Entry content updated successfully",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      await fetchDocEntries(selectedDoc);
    } catch (error) {
      console.error("Error updating entry content:", error);
      toast({
        title: "Error",
        description: "Failed to update entry content",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      onEditModalClose();
    }
  };

  // Cleanup WebSocket on component unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  // Fetch documents on component mount
  useEffect(() => {
    fetchDocNames();
  }, []);

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
          <SidebarContent />
        </Box>

        <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
          <DrawerOverlay>
            <DrawerContent>
              <DrawerCloseButton />
              <DrawerHeader>Menu</DrawerHeader>
              <DrawerBody>
                <SidebarContent onClose={onClose} />
              </DrawerBody>
            </DrawerContent>
          </DrawerOverlay>
        </Drawer>

        <Box flex={1} p={8} maxW="800px" mx="auto">
          {activeSection === "dashboard" && (
            <VStack spacing={8} align="stretch">
              <Box>
                <Heading size="lg" mb={4}>
                  Update Knowledge Base
                </Heading>
                <Box
                  p={4}
                  borderWidth={2}
                  borderColor={isDragActive ? "blue.300" : "gray.300"}
                  borderRadius="lg"
                  borderStyle="dashed"
                  bg={useColorModeValue("gray.50", "gray.700")}
                  textAlign="center"
                  {...getRootProps()}
                  cursor="pointer"
                  _hover={{ borderColor: "blue.400" }}
                  transition="border-color 0.2s"
                >
                  <input {...getInputProps()} accept=".pdf, .txt, .json" />
                  <Icon as={MdCloudUpload} boxSize={10} color="gray.500" />
                  <Text mt={2} fontSize="lg" fontWeight="bold" color="gray.500">
                    {isDragActive
                      ? "Drop files here"
                      : "Drag & drop files or click"}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    (PDF, TXT, JSON)
                  </Text>

                  {files.length > 0 && (
                    <Stack mt={4} spacing={3}>
                      {files.map((file, index) => (
                        <Box
                          key={index}
                          p={2}
                          borderWidth={1}
                          borderColor="gray.300"
                          borderRadius="md"
                          display="flex"
                          alignItems="center"
                          bg="white"
                        >
                          <Icon
                            as={MdOutlineFilePresent}
                            boxSize={6}
                            color="blue.500"
                          />
                          <Text flex="1" ml={3}>
                            {file.name}
                          </Text>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Box>
                <Button
                  mt={4}
                  colorScheme="blue"
                  onClick={handleUploadFile}
                  isDisabled={files.length === 0 || isUploading}
                  isLoading={isUploading}
                >
                  {isUploading ? "Uploading..." : "Upload Files"}
                </Button>
              </Box>

              <Box>
                <Heading size="lg" mb={4}>
                  Knowledge Base
                </Heading>
                {isLoadingDocNames ? (
                  <Text>Loading document names...</Text>
                ) : (
                  <Accordion allowToggle>
                     {docNames.map((docName, index) => (
                      <AccordionItem key={index}>
                        <h2>
                          <AccordionButton
                            onClick={() => {
                              setSelectedDoc(docName);
                              fetchDocEntries(docName);
                            }}
                          >
                            <Box flex="1" textAlign="left">
                              {docName}
                            </Box>
                            <AccordionIcon />
                          </AccordionButton>
                        </h2>
                        <AccordionPanel pb={4}>
                          {isLoadingDocEntries && selectedDoc === docName ? (
                            <Text>Loading entries...</Text>
                          ) : (
                            <VStack align="stretch" spacing={2}>
                              {docEntries.map((entry, entryIndex) => (
                                <Box
                                  key={entryIndex}
                                  p={3}
                                  bg="white"
                                  borderRadius="md"
                                  boxShadow="sm"
                                >
                                  <Text>{entry.content}</Text>
                                  <Button
                                    size="sm"
                                    colorScheme="blue"
                                    mt={2}
                                    onClick={() => {
                                      console.log(`editing ${entry.id}`)
                                      setEditingEntry(entry);
                                      setEditedContent(entry.content);
                                      onEditModalOpen();
                                    }}
                                  >
                                    Edit
                                  </Button>
                                </Box>
                              ))}
                            </VStack>
                          )}
                        </AccordionPanel>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </Box>

              <Box>
                <Heading size="lg" mb={4}>
                  Test Query
                </Heading>
                <VStack spacing={4} align="stretch">
                  <Input
                    placeholder="Enter your query"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <Button
                    colorScheme="blue"
                    onClick={handleTestQuery}
                    isLoading={isLoadingQuery}
                    isDisabled={isLoadingQuery || query === ""}
                  >
                    Run Query
                  </Button>
                  <Box
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="md"
                    p={4}
                    minHeight="150px"
                    overflowY="auto"
                    bg="white"
                  >
                    {retrievalResult ? (
                      <ReactMarkdown className={styles['markdown-content']}>{retrievalResult}</ReactMarkdown>
                    ) : (
                      <Box color="gray.500">Retrieval results will appear here</Box>
                    )}
                  </Box>
                </VStack>
              </Box>

            </VStack>
          )}
        </Box>
      </Flex>

      {/* Edit Entry Modal */}
      <Modal isOpen={isEditModalOpen} onClose={onEditModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Entry</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={10}
            />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={updateEntryContent}>
              Save
            </Button>
            <Button variant="ghost" onClick={onEditModalClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Dashboard;