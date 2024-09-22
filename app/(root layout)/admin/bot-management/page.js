"use client"
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Text,
  Icon,
  useColorModeValue,
  VStack,
  HStack,
  Heading,
  Input,
  Textarea,
  Flex,
  Spacer,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
} from '@chakra-ui/react';
import { useDropzone } from 'react-dropzone';
import { MdCloudUpload, MdOutlineFilePresent, MdMenu, MdDashboard, MdStorage, MdChat } from 'react-icons/md';

const SidebarContent = ({ onClose }) => {
  return (
    <VStack align="stretch" spacing={4}>
      <Button leftIcon={<MdDashboard />} justifyContent="flex-start" variant="ghost" onClick={onClose}>
        Dashboard
      </Button>
      <Button leftIcon={<MdStorage />} justifyContent="flex-start" variant="ghost" onClick={onClose}>
        Knowledge Base
      </Button>
      <Button leftIcon={<MdChat />} justifyContent="flex-start" variant="ghost" onClick={onClose}>
        Test Retrieval
      </Button>
    </VStack>
  );
};

const Dashboard = () => {
  const [files, setFiles] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [query, setQuery] = useState('');
  const [retrievalResult, setRetrievalResult] = useState('');
  const [activeSection, setActiveSection] = useState('dashboard');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const onDrop = (acceptedFiles) => {
    setFiles(acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    })));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/json': ['.json']
    },
  });

  const handleUploadFile = async () => {
    // Implement file upload logic here
    console.log('Files uploaded');
    setFiles([]);
  };

  const fetchDocuments = async () => {
    // Simulating API call
    const data = ['Document 1', 'Document 2', 'Document 3'];
    setDocuments(data);
  };

  const handleRetrieval = async () => {
    // Simulating API call
    setRetrievalResult('This is a simulated retrieval result based on your query.');
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return (
    <Box minH="100vh" bg={bgColor}>

      <Flex>
        <Box
          display={{ base: 'none', md: 'block' }}
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
          {activeSection === 'dashboard' && (
            <VStack spacing={8} align="stretch">
              <Box>
                <Heading size="lg" mb={4}>Update Knowledge Base</Heading>
                <Box
                  p={4}
                  borderWidth={2}
                  borderColor={isDragActive ? 'blue.300' : 'gray.300'}
                  borderRadius="lg"
                  borderStyle="dashed"
                  bg={useColorModeValue('gray.50', 'gray.700')}
                  textAlign="center"
                  {...getRootProps()}
                  cursor="pointer"
                  _hover={{ borderColor: 'blue.400' }}
                  transition="border-color 0.2s"
                >
                  <input {...getInputProps()} accept=".pdf, .txt, .json" />
                  <Icon as={MdCloudUpload} boxSize={10} color="gray.500" />
                  <Text mt={2} fontSize="lg" fontWeight="bold" color="gray.500">
                    {isDragActive ? 'Drop files here' : 'Drag & drop files or click'}
                  </Text>
                  <Text fontSize="sm" color="gray.500">(PDF, TXT, JSON)</Text>
                </Box>
                <Button mt={4} colorScheme="blue" onClick={handleUploadFile} isDisabled={files.length === 0}>
                  Upload Files
                </Button>
              </Box>

              <Box>
                <Heading size="lg" mb={4}>Knowledge Base</Heading>
                <VStack align="stretch" spacing={2}>
                  {documents.map((doc, index) => (
                    <Box key={index} p={3} bg="white" borderRadius="md" boxShadow="sm">
                      <Text>{doc}</Text>
                    </Box>
                  ))}
                </VStack>
              </Box>

              <Box>
                <Heading size="lg" mb={4}>Test Retrieval</Heading>
                <VStack spacing={4} align="stretch">
                  <Input
                    placeholder="Enter your query"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <Button colorScheme="blue" onClick={handleRetrieval}>
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