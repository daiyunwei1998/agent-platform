'use client'
import { Box, Flex, Button, Menu, MenuButton, MenuList, MenuItem, useBreakpointValue, useColorModeValue, Image } from '@chakra-ui/react'
import { useRouter, usePathname } from 'next/navigation'
import { FiSettings, FiMessageSquare, FiLogOut } from 'react-icons/fi'
import { RiRobot2Line } from 'react-icons/ri'
import { useState, useEffect } from 'react'
import { useCookies } from 'react-cookie'
import Link from 'next/link'

const Navbar = ({ name, logo }) => {
  const router = useRouter()
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const activeBgColor = useColorModeValue('blue.100', 'blue.900')
  const activeTextColor = useColorModeValue('blue.700', 'blue.300')
  const inactiveBgColor = useColorModeValue('white', 'gray.800')
  const [loggedIn, setLoggedIn] = useState(false)
  const [cookies] = useCookies(['jwt'])

  // Use responsive value to hide text on smaller screens
  const showText = useBreakpointValue({ base: false, md: true })

  useEffect(() => {
    setLoggedIn(!!cookies.jwt)
  }, [cookies.jwt])

  const navItems = [
    { name: 'Bot Management', icon: RiRobot2Line, href: '/admin/bot-management' },
    { name: 'Tenant Settings', icon: FiSettings, href: '/admin/tenant-settings' },
    { name: 'Customer Chat', icon: FiMessageSquare, href: '/admin/customer-chat' },
  ]

  const handleLogout = () => {
    // Implement logout logic here (e.g., clear JWT token)
    setLoggedIn(false)
  }

  const pathname = usePathname()

  return (
    <Box bg={bgColor} borderBottom={`1px solid ${borderColor}`} p={4}>
      <Flex justify="space-between" align="center">
        {/* Admin Dashboard title with icon */}
        <Link href = "/">
          <Flex align="center">
            <Image src={logo} alt="Logo" boxSize="30px" mr={2} />
            <Box fontSize="2xl" fontWeight="bold">
              {name}
            </Box>
          </Flex>
        </Link>

        {/* Navigation Items */}
        <Flex gap={4}>
          {navItems.map((item) => (
            <Button
              key={item.name}
              onClick={() => router.push(item.href)}
              variant="ghost"
              colorScheme="blue"
              size="md"
              fontSize="lg"
              bg={pathname === item.href ? activeBgColor : inactiveBgColor}
              _hover={{ bg: activeBgColor, color: activeTextColor }}
              leftIcon={<item.icon />}
            >
              {showText && item.name}
            </Button>
          ))}
        </Flex>

        {/* User Menu */}
        {loggedIn ? (
          <Menu>
            <MenuButton as={Button} rounded={'full'} variant={'link'} cursor={'pointer'} minW={0}>
              <Image src="/user.png" alt="User" boxSize="40px" borderRadius="full" />
            </MenuButton>
            <MenuList>
              <MenuItem onClick={() => router.push('/account-settings')}>Account Settings</MenuItem>
              <MenuItem onClick={handleLogout}>Log Out</MenuItem>
            </MenuList>
          </Menu>
        ) : (
          <Button onClick={() => router.push('/login')} colorScheme="blue">
            Login
          </Button>
        )}
      </Flex>
    </Box>
  )
}

export default Navbar