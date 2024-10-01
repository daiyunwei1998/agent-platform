import React, { useState } from 'react';
import { Box, VStack, HStack, Text, Icon, Image, Flex, useBreakpointValue } from '@chakra-ui/react';
import { FaDatabase, FaFileAlt, FaArrowRight } from 'react-icons/fa';
import { BsBodyText } from "react-icons/bs";

const FloatingIsland = ({ children, isActive, onMouseEnter, onMouseLeave }) => (
  <Box
    borderWidth={1}
    borderRadius="md"
    p={3}
    boxShadow="lg"
    bg="white"
    mb={3}
    transition="all 0.3s"
    opacity={isActive ? 1 : 0.6}
    transform={isActive ? "scale(1.02)" : "scale(1)"}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    _hover={{ boxShadow: "xl" }}
  >
    {children}
  </Box>
);

const Page2 = () => {
  const [activeSection, setActiveSection] = useState(null);
  const iconSize = useBreakpointValue({ base: 5, md: 6 });
  const arrowSize = useBreakpointValue({ base: 3, md: 4 });
  const stackDirection = useBreakpointValue({ base: "column", md: "row" });

  return (
    <VStack spacing={4} align="stretch" p={2}>
      <FloatingIsland
        isActive={activeSection === 0 || activeSection === null}
        onMouseEnter={() => setActiveSection(0)}
        onMouseLeave={() => setActiveSection(null)}
      >
        <Flex direction={stackDirection} justify="center" align="center" wrap="wrap">
          <VStack spacing={1}>
            <Icon as={FaFileAlt} boxSize={iconSize} color="red.500" />
            <Text fontSize="sm">原始資料</Text>
          </VStack>
          <Icon as={FaArrowRight} boxSize={arrowSize} color="gray.500" mx={1} />
          <VStack spacing={1}>
            <Icon as={BsBodyText} boxSize={iconSize} color="gray.500" />
            <Text fontSize="sm">文字塊</Text>
          </VStack>
          <Icon as={FaArrowRight} boxSize={arrowSize} color="gray.500" mx={1} />
          <VStack spacing={1}>
            <Icon as={FaDatabase} boxSize={iconSize} color="blue.500" />
            <Text fontSize="sm">向量化</Text>
          </VStack>
        </Flex>
        <Text color="rgb(66,153,225)" fontWeight="bold" mt={2} textAlign="center" fontSize="sm">建立知識庫</Text>
      </FloatingIsland>

      <FloatingIsland
        isActive={activeSection === 1 || activeSection === null}
        onMouseEnter={() => setActiveSection(1)}
        onMouseLeave={() => setActiveSection(null)}
      >
        <Flex align="center" justify="center" direction={{ base: "column", md: "row" }}>
          <HStack spacing={1} align="center">
            <Text fontSize="sm">query</Text>
            <Icon as={FaArrowRight} boxSize={arrowSize} color="gray.500" />
          </HStack>
          <Image 
            src={`${imageHost}/demo/openai-logo.png`}
            alt="OpenAI" 
            width="80px"
            height="26px"
            objectFit="contain" 
            mx={2}
          />
          <HStack spacing={1} align="center">
            <Icon as={FaArrowRight} boxSize={arrowSize} color="gray.500" />
            <Text fontSize="sm">response</Text>
          </HStack>
        </Flex>
        <Text color="rgb(66,153,225)" fontWeight="bold" mt={2} textAlign="center" fontSize="sm">調整LLM</Text>
      </FloatingIsland>

      <FloatingIsland
        isActive={activeSection === 2 || activeSection === null}
        onMouseEnter={() => setActiveSection(2)}
        onMouseLeave={() => setActiveSection(null)}
      >
        <Image src={`${imageHost}/demo/chat-example.png`} alt="Chat Example" w="100%" h="auto" />
        <Text color="rgb(66,153,225)" fontWeight="bold" mt={2} textAlign="center" fontSize="sm">串接既有服務</Text>
      </FloatingIsland>
    </VStack>
  );
};

export default Page2;