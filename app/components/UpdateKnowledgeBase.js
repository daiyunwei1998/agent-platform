"use client";
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
  useBreakpointValue
} from "@chakra-ui/react";
import { useDropzone } from "react-dropzone";
import { MdCloudUpload, MdOutlineFilePresent } from "react-icons/md";
import { tenantServiceHost } from "@/app/config";

// Move FloatingBox outside of UpdateKnowledgeBase
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
  const toast = useToast();

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
          description: `File uploaded successfully.`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });

        setPendingTasks((prevTasks) => {
          const newTasks = [
            ...prevTasks,
            ...filesToUpload.map((file) => file.name),
          ];

          if (prevTasks.length === 0 && connect) {
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

  const responsiveSpacing = useBreakpointValue({ base: 4, md: 6, lg: 8 });
  const responsivePadding = useBreakpointValue({ base: 4, md: 6, lg: 8 });
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const shadowColor = useColorModeValue('rgba(0, 0, 0, 0.1)', 'rgba(255, 255, 255, 0.1)');

  return (
    <Box maxWidth="1200px" margin="auto" padding={responsivePadding}>
      <VStack spacing={responsiveSpacing} align="stretch">
        <Heading as="h1" size="xl">
          Update Knowledge Base
        </Heading>
        <FloatingBox
          responsivePadding={responsivePadding}
          bgColor={bgColor}
          borderColor={borderColor}
          shadowColor={shadowColor}
        >
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
      </VStack>
    </Box>
  );
};

export default UpdateKnowledgeBase;
