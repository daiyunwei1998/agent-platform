'use client'

import {
  Box,
  Button,
  Checkbox,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Link,
  Stack,
  Text,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Providers } from '@/app/components/providers'
import { chatServiceHost, tenantServiceHost, imageHost } from '@/app/config'


export default function LoginPage() {
 

  return (
    <Providers>
      <Flex minH={'100vh'} bg={useColorModeValue('gray.50', 'gray.800')}>
        <Container maxW={'7xl'} p={0}>
          <Stack direction={{ base: 'column', md: 'row' }} h={'100vh'}>
            {/* Left side content */}
            <Flex
              flex={1}
              bg={'blue.400'}
              color={'white'}
              p={10}
              align={'center'}
              justify={'center'}
            >
              <Stack spacing={6} w={'full'} maxW={'lg'}>
                <Box as="img" src={`${imageHost}/tenant_logos/agent.png`} alt="閃應" w={40} />
                <Heading fontSize={{ base: '3xl', md: '4xl', lg: '5xl' }}>
                  屬於你的 AI 客服機器人
                </Heading>
                <Text fontSize={{ base: 'md', lg: 'lg' }}>
                  彈指間即享自動化的客戶服務
                </Text>
                <Text
                  textAlign={'center'}
                  mt={4}
                  position="absolute"
                  bottom={4}
                >
                  © 2024 閃應 All rights reserved.
                </Text>
              </Stack>
            </Flex>
            {/* Right side*/}
            <img 
        src={`${imageHost}/demo/infra.png`}
        alt="Infrastructure Diagram"
        className="max-w-[calc(100%+80px)] max-h-[calc(100vh-80px)] object-contain"
      />
          </Stack>
        </Container>
      </Flex>
    </Providers>
  )
}
