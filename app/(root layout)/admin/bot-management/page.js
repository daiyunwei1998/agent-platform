"use client"
import { useState } from 'react';
import { Box, Button, Text, Icon, useColorModeValue, Stack, useToast } from '@chakra-ui/react';
import { useDropzone } from 'react-dropzone';
import { MdCloudUpload, MdOutlineFilePresent } from 'react-icons/md';
import { Providers } from '@/app/components/providers';
import { tenantServiceHost } from '@/app/config';

const FileUpload = () => {
  const [files, setFiles] = useState([]);
  const tenantId = 'tenant_2'; // Hardcoded tenant_id for now
  const [isUploading, setIsUploading] = useState(false);
  const toast = useToast();

  // File drop handler
  const onDrop = (acceptedFiles) => {
    acceptedFiles.forEach(file => {
      console.log('File:', file.name, 'MIME Type:', file.type);  // Check the MIME type and extension
    });
  
    setFiles(acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    })));
  };

  // Setting up dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/json': ['.json']
    },
  });
  

  // Styling for preview icons and drag area
  const dropzoneBg = useColorModeValue('gray.100', 'gray.700');

  // Upload file function
  const handleUploadFile = async () => {
    setIsUploading(true); // Start uploading

    const formData = new FormData();
    formData.append('tenant_id', tenantId);
    
    files.forEach(file => {
      formData.append('file', file);
    });
    
    const uploadUrl = `${tenantServiceHost}/files/upload/`;
    console.log("Sending request to:", uploadUrl);
    
    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Upload successful.',
          description: `File uploaded successfully. Task ID: ${result.task_id}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        setFiles([]);
      } else {
        const error = await response.json();
        toast({
          title: 'Upload failed.',
          description: `Error: ${error.detail || 'Unknown error occurred'}`,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Upload error.',
        description: `Error: ${error.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false); // End uploading
    }
  };

  return (
    <Providers>
      <Box
        p={4}
        borderWidth={2}
        borderColor={isDragActive ? 'green.300' : 'gray.300'}
        borderRadius="lg"
        borderStyle="dashed"
        bg={dropzoneBg}
        width="100%"
        maxW="500px"
        mx="auto"
        textAlign="center"
        {...getRootProps()}
        cursor="pointer"
        _hover={{ borderColor: 'blue.400' }}
        transition="border-color 0.2s"
      >
        <input {...getInputProps()} accept=".pdf, .txt, .json" />
        <Icon as={MdCloudUpload} boxSize={10} color="gray.500" />
        <Text mt={2} fontSize="lg" fontWeight="bold" color="gray.500">
          {isDragActive ? 'Drop your files here...' : 'Drag & drop your files here, or click to select'}
        </Text>
        <Text fontSize="sm" color="gray.500">(Supported: .pdf, .txt, .json)</Text>

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
                _dark={{ bg: 'gray.800' }}
              >
                <Icon as={MdOutlineFilePresent} boxSize={6} color="blue.500" />
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
        {isUploading ? 'Uploading...' : 'Upload Files'}
      </Button>
    </Providers>
  );
};

export default FileUpload;