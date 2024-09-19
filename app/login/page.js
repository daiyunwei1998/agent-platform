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
  useToast
} from '@chakra-ui/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FcGoogle } from 'react-icons/fc'
import { Providers } from '../providers'
import { chatServiceHost, ternantServiceHost } from '@/app/config';

export default function LoginPage() {
  const [alias, setAlias] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const router = useRouter()
  const toast = useToast()

  const handleLogin = async () => {
    // Reset error state
    setError(null)
  
    // Basic form validation
    if (!alias || !email || !password) {
      toast({
        title: '所有欄位都是必填的',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }
  
    setLoading(true)

  
    try {
      const tenantResponse = await fetch(`${ternantServiceHost}/api/v1/tenants/${alias}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      let tenantId;
      if (tenantResponse.ok) {
        const { tenant_id } = await tenantResponse.json();
        tenantId = tenant_id;
       
      } else {
        const data = await response.json()
        setError(data.message || '無法驗證商戶')
        toast({
          title: '無法驗證商戶',
          description: data.message || '請檢查商戶別名或註冊商戶',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
      }
      console.log("getting tenant id: " + tenantId);
      const response = await fetch(`${chatServiceHost}/api/v1/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
        },
        body: JSON.stringify({ 
          "alias":alias,
           "email":email, 
           "password":password }),
      })
  
      if (response.ok) {
        // Login successful, redirect to /admin
        toast({
          title: '登入成功',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
        router.push('/admin')
      } else {
        const data = await response.json()
        setError(data.message || '登入失敗')
        toast({
          title: '登入失敗',
          description: data.message || '請檢查您的憑證',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
      }
    } catch (err) {
      console.log(err)
      setError('伺服器錯誤，請稍後再試')
      toast({
        title: '伺服器錯誤',
        description: '請稍後再試',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }
  return (
   <Providers>
     <Flex minH={'100vh'} bg={useColorModeValue('gray.50', 'gray.800')}>
      <Container maxW={'7xl'} p={0}>
        <Stack direction={{ base: 'column', md: 'row' }} h={'100vh'}>
          <Flex flex={1} bg={'blue.400'} color={'white'} p={10} align={'center'} justify={'center'}>
            <Stack spacing={6} w={'full'} maxW={'lg'}>
              <Box as="img" src="/agent.png" alt="閃應雲" w={40} />
              <Heading fontSize={{ base: '3xl', md: '4xl', lg: '5xl' }}>
                屬於你的AI客服機器人
              </Heading>
              <Text fontSize={{ base: 'md', lg: 'lg' }}>
                彈指間即享自動化的客戶服務
              </Text>
              <Text textAlign={'center'} mt={4} position="absolute" bottom={4}>
              © 2024 閃應雲 All rights reserved.
                </Text>
            </Stack>
          </Flex>
          <Flex flex={1} p={10} align={'center'} justify={'center'}>
            <Stack spacing={4} w={'full'} maxW={'md'}>
              <Heading fontSize={'4xl'} textAlign={'center'}>登入賬戶</Heading>
              <Text fontSize={'xl'} color={'gray.600'} textAlign={'center'}>
                沒有賬戶？ <Link color={'blue.400'}>註冊</Link>
              </Text>
              <FormControl id="alias">
                <FormLabel>商戶代號</FormLabel>
                <Input
                  type="text"
                  placeholder="請輸入商戶代號"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                />
              </FormControl>
              <FormControl id="email">
                <FormLabel>郵箱</FormLabel>
                <Input
                  type="email"
                  placeholder="請輸入郵箱"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </FormControl>
              <FormControl id="password">
                <FormLabel>密碼</FormLabel>
                <Input
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </FormControl>
              <Stack spacing={6}>
                <Stack
                  direction={{ base: 'column', sm: 'row' }}
                  align={'start'}
                  justify={'space-between'}
                >
                  <Checkbox>記住賬戶</Checkbox>
                  <Link color={'blue.400'}>忘記密碼?</Link>
                </Stack>
                <Button 
                colorScheme={'blue'} 
                variant={'solid'}
                isLoading={loading}
                onClick={handleLogin}>
                  登入
                </Button>
              </Stack>
              <Button w={'full'} variant={'outline'} leftIcon={<FcGoogle />}>
                使用Google登入
              </Button>
            </Stack>
          </Flex>
        </Stack>
      </Container>
    </Flex>
   </Providers>
  )
}