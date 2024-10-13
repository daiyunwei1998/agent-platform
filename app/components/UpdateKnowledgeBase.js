import React, { useState } from "react";
import {
  Box,
  Button,
  Text,
  Icon,
  VStack,
  Heading,
  Stack,
  useColorModeValue,
  useToast,
  useBreakpointValue,
  Input,
  FormControl,
  FormLabel,
  Textarea,
} from "@chakra-ui/react";
import { useDropzone } from "react-dropzone";
import { MdCloudUpload, MdOutlineFilePresent, MdAdd } from "react-icons/md";
import { tenantServiceHost } from "@/app/config";

const FloatingBox = ({
  children,
  responsivePadding,
  bgColor,
  borderColor,
  shadowColor,
  ...props
}) => (
  <Box
    backgroundColor={bgColor}
    borderRadius="lg"
    p={responsivePadding}
    border="1px"
    borderColor={borderColor}
    boxShadow={`0 4px 6px ${shadowColor}`}
    transition="all 0.3s"
    _hover={{
      boxShadow: `0 6px 8px ${shadowColor}`,
      transform: 'translateY(-2px)',
    }}
    {...props}
  >
    {children}
  </Box>
);

const UpdateKnowledgeBase = ({
  tenantId,
  pendingTasks,
  setPendingTasks,
  connect,
  clientRef,
}) => {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [customContent, setCustomContent] = useState("");
  const [customDocName, setCustomDocName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const toast = useToast();

  // File Drop Zone and Handle File Upload logic remains the same
  const onDrop = (acceptedFiles) => {
    // ... (unchanged)
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "application/json": [".json"],
    },
  });

  const handleUploadFile = async () => {
    // ... (unchanged)
  };

  const handleAddCustomEntry = async () => {
    if (!customContent.trim() || !customDocName.trim()) {
      toast({
        title: "Validation Error",
        description: "Both Content and Document Name are required.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsAdding(true);

    const addUrl = `${tenantServiceHost}/api/v1/knowledge_base/${tenantId}/entries`;

    try {
      const response = await fetch(addUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: customContent,
          docName: customDocName,
        }),
      });

      if (response.ok) {
        toast({
          title: "Entry Added",
          description: "Custom entry added successfully.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });

        setCustomContent("");
        setCustomDocName("");
      } else {
        const error = await response.json();
        throw new Error(error.detail || "Unknown error occurred");
      }
    } catch (error) {
      toast({
        title: "Add Entry Failed",
        description: `Error: ${error.message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsAdding(false);
    }
  };

  const responsiveSpacing = useBreakpointValue({ base: 4, md: 6, lg: 8 });
  const responsivePadding = useBreakpointValue({ base: 4, md: 6, lg: 8 });
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const shadowColor = useColorModeValue('rgba(0, 0, 0, 0.1)', 'rgba(255, 255, 255, 0.1)');

  return (
    <Box maxWidth="1200px" margin="auto" padding={responsivePadding}>
      <VStack spacing={responsiveSpacing} align="stretch">
        <Heading as="h1" size="xl" mb={responsiveSpacing}>
          Update Knowledge Base
        </Heading>

        {/* File Upload Section */}
        <FloatingBox
          responsivePadding={responsivePadding}
          bgColor={bgColor}
          borderColor={borderColor}
          shadowColor={shadowColor}
        >
          <Heading as="h2" size="lg" mb={4}>
            Upload Files
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
              {isDragActive ? "Drop files here" : "Drag & drop files or click"}
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
            width="full"
          >
            {isUploading ? "Uploading..." : "Upload Files"}
          </Button>
        </FloatingBox>

        {/* Add Custom Entry Section */}
        <FloatingBox
          responsivePadding={responsivePadding}
          bgColor={bgColor}
          borderColor={borderColor}
          shadowColor={shadowColor}
        >
          <Heading as="h2" size="lg" mb={4}>
            Add Custom Entry
          </Heading>
          <VStack spacing={4} align="stretch">
            <FormControl id="customDocName" isRequired>
              <FormLabel>Document Name</FormLabel>
              <Input
                placeholder="Enter the document name..."
                value={customDocName}
                onChange={(e) => setCustomDocName(e.target.value)}
              />
            </FormControl>
            <FormControl id="customContent" isRequired>
              <FormLabel>Content</FormLabel>
              <Textarea
                placeholder="Enter the content of the entry..."
                value={customContent}
                onChange={(e) => setCustomContent(e.target.value)}
                minHeight="150px"
                resize="vertical"
              />
            </FormControl>
            <Button
              leftIcon={<MdAdd />}
              onClick={handleAddCustomEntry}
              isDisabled={isAdding}
              isLoading={isAdding}
              loadingText="Adding Entry"
              width="full"
              colorScheme="blue"
              variant="outline"
            >
              Add Custom Entry
            </Button>
          </VStack>
        </FloatingBox>
      </VStack>
    </Box>
  );
};

export default UpdateKnowledgeBase;