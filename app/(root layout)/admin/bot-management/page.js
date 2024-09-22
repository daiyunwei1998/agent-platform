"use client";
import React, { useState, useEffect } from "react";
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
} from "@chakra-ui/react";
import { useDropzone } from "react-dropzone";
import {
  MdCloudUpload,
  MdOutlineFilePresent,
} from "react-icons/md";
import { tenantServiceHost, aiServiceHost } from "@/app/config";

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

const Dashboard = () => {
  const [files, setFiles] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [query, setQuery] = useState("");
  const [retrievalResult, setRetrievalResult] = useState("");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingQuery, setIsLoadingQuery] = useState(false); // Loading state for query
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bgColor = useColorModeValue("gray.50", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const toast = useToast();
  const tenantId = "tenant_2"; // Hardcoded tenant ID for now

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

  // Handle File Upload
  const handleUploadFile = async () => {
    setIsUploading(true);

    const formData = new FormData();
    formData.append("tenant_id", tenantId);

    files.forEach((file) => {
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
        setFiles([]);
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

  // Fetch Documents (Simulated)
  const fetchDocuments = async () => {
    // Simulating API call
    const data = ["Document 1", "Document 2", "Document 3"];
    setDocuments(data);
  };

  // Handle Test Query (AI Retrieval)
  const handleTestQuery = async () => {
    setIsLoadingQuery(true); // Start loading

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

  // Fetch documents on component mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  return (
    <Box minH="100vh" bg={bgColor}>
      <Flex>
        {/* Sidebar */}
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

        {/* Drawer for mobile view */}
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

        {/* Main Content */}
        <Box flex={1} p={8} maxW="800px" mx="auto">
          {activeSection === "dashboard" && (
            <VStack spacing={8} align="stretch">
              {/* Upload Section */}
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
                          justifyContent="space-between"
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

              {/* Documents Section */}
              <Box>
                <Heading size="lg" mb={4}>
                  Knowledge Base
                </Heading>
                <VStack align="stretch" spacing={2}>
                  {documents.map((doc, index) => (
                    <Box
                      key={index}
                      p={3}
                      bg="white"
                      borderRadius="md"
                      boxShadow="sm"
                    >
                      <Text>{doc}</Text>
                    </Box>
                  ))}
                </VStack>
              </Box>

              {/* Query Section */}
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
                    isLoading={isLoadingQuery} // Show loading indicator while fetching data
                    isDisabled={isLoadingQuery || query === ""} // Disable button if already loading or query is empty
                  >
                    Run Query
                  </Button>
                  <Textarea
                    value={retrievalResult}
                    readOnly
                    placeholder="Retrieval results will appear here"
                    minHeight="150px"
                  />
                </VStack>
              </Box>
            </VStack>
          )}
        </Box>
      </Flex>
    </Box>
  );
};

export default Dashboard;
