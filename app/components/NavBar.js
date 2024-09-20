'use client'
import { Box, Flex, Button, IconButton, useBreakpointValue, useColorModeValue } from '@chakra-ui/react'
import { useRouter, usePathname } from 'next/navigation'
import { FiSettings, FiMessageSquare, FiLogOut, FiLogIn } from 'react-icons/fi'
import { RiRobot2Line } from 'react-icons/ri'
import { useState } from 'react'

const Navbar = () => {
  const router = useRouter()
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const activeBgColor = useColorModeValue('blue.100', 'blue.900')
  const activeTextColor = useColorModeValue('blue.700', 'blue.300')
  const inactiveBgColor = useColorModeValue('white', 'gray.800')
  const [loggedIn, setLoggedIn] = useState(false)

  // Use responsive value to hide text on smaller screens
  const showText = useBreakpointValue({ base: false, md: true })


  const navItems = [
    { name: 'Bot Management', icon: RiRobot2Line, href: '/admin/bot-management' },
    { name: 'Tenant Settings', icon: FiSettings, href: '/admin/tenant-settings' },
    { name: 'Customer Chat', icon: FiMessageSquare, href: '/admin/customer-chat' },
  ]

  const handleLogoutLogin = () => {
    setLoggedIn(!loggedIn)
  }

  const pathname = usePathname()

  return (
    <Box bg={bgColor} borderBottom={`1px solid ${borderColor}`} p={4}>
      <Flex justify="space-between" align="center">
        {/* Admin Dashboard title */}
        <Box fontSize="2xl" fontWeight="bold">
          Admin Dashboard
        </Box>

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
              {/* Only show text on medium or larger screens */}
              {showText && item.name}
            </Button>
          ))}
        </Flex>

        {/* Login/Logout Icon */}
        <IconButton
          icon={loggedIn ? <FiLogOut /> : <FiLogIn />}
          onClick={handleLogoutLogin}
          variant="ghost"
          colorScheme="blue"
          aria-label={loggedIn ? 'Logout' : 'Login'}
        />
      </Flex>
    </Box>
  )
}

export default Navbar
