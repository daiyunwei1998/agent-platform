"use client"

import React from 'react';
import {
  ChakraProvider,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Image,
  Stack,
  Text,
  VStack,
  HStack,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaRobot, FaCloud, FaComments, FaFileUpload } from 'react-icons/fa';

const Feature = ({ icon, title, text }) => {
  return (
    <VStack>
      <Icon as={icon} w={10} h={10} color="blue.500" />
      <Text fontWeight="bold">{title}</Text>
      <Text textAlign="center">{text}</Text>
    </VStack>
  );
};

const LandingPage = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.200');
  const headingColor = useColorModeValue('gray.800', 'white');

  return (
    <ChakraProvider>
      <Box bg={bgColor} minH="100vh">
        <Container maxW="container.xl" px={{ base: 6, md: 12, lg: 20 }}>
          <Flex direction={{ base: 'column', md: 'row' }} align="center" justify="space-between" py={20} gap={10}>
            <VStack align="flex-start" spacing={6} maxW="lg">
              <Heading as="h1" size="3xl" color={headingColor}>
                閃應
              </Heading>
              <Text fontSize="xl" color={textColor}>
                在幾分鐘內生成定制的AI客服代理。無需編碼！
              </Text>
              <Button colorScheme="blue" size="lg">
                立即開始
              </Button>
            </VStack>
            <Box boxSize={{ base: 'sm', md: 'md' }}>
              <Image src="/hero-image.png" alt="AI代理插圖" />
            </Box>
          </Flex>

          <VStack spacing={16} py={20}>
            <Heading as="h2" size="2xl" textAlign="center" color={headingColor}>
              功能特點
            </Heading>
            <Stack direction={{ base: 'column', md: 'row' }} spacing={{ base: 10, md: 6, lg: 10 }} width="100%" justifyContent="space-between">
              <Feature
                icon={FaRobot}
                title="基於RAG的AI代理"
                text="創建針對您業務需求量身定制的智能代理"
              />
              <Feature
                icon={FaCloud}
                title="SaaS平台"
                text="適用於各種規模企業的全託管、可擴展解決方案"
              />
              <Feature
                icon={FaComments}
                title="內置聊天支持"
                text="AI代理與客戶支持的無縫集成"
              />
              <Feature
                icon={FaFileUpload}
                title="輕鬆上傳"
                text="只需上傳您的PDF文件，幾分鐘即可開始使用"
              />
            </Stack>
          </VStack>

          <VStack spacing={8} py={20}>
            <Heading as="h2" size="2xl" textAlign="center" color={headingColor}>
              使用方法
            </Heading>
            <HStack spacing={{ base: 4, md: 8 }} wrap="wrap" justify="center">
              <VStack p={6} bg="white" borderRadius="lg" boxShadow="md" maxW="sm" flex="1" minW={{ base: "100%", md: "30%" }}>
                <Text fontWeight="bold" fontSize="xl">1. 上傳您的內容</Text>
                <Text textAlign="center">上傳有關您業務的PDF或文檔</Text>
              </VStack>
              <VStack p={6} bg="white" borderRadius="lg" boxShadow="md" maxW="sm" flex="1" minW={{ base: "100%", md: "30%" }}>
                <Text fontWeight="bold" fontSize="xl">2. AI處理</Text>
                <Text textAlign="center">我們的系統分析並創建定制的AI代理</Text>
              </VStack>
              <VStack p={6} bg="white" borderRadius="lg" boxShadow="md" maxW="sm" flex="1" minW={{ base: "100%", md: "30%" }}>
                <Text fontWeight="bold" fontSize="xl">3. 部署和互動</Text>
                <Text textAlign="center">開始使用您的AI代理進行客戶支持</Text>
              </VStack>
            </HStack>
          </VStack>

          <VStack spacing={8} py={20}>
            <Heading as="h2" size="2xl" textAlign="center" color={headingColor}>
              準備好改變您的客戶支持了嗎？
            </Heading>
            <Button colorScheme="blue" size="lg">
              立即開始
            </Button>
          </VStack>
        </Container>
      </Box>
    </ChakraProvider>
  );
};

export default LandingPage;