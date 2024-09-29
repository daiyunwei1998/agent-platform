import React from 'react';
import { Box, VStack, HStack, Heading, Text, Button, Table, Thead, Tbody, Tr, Th, Td, Stat, StatLabel, StatNumber, StatHelpText, useColorModeValue } from '@chakra-ui/react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Generate mock data for daily usage in the current month
const generateDailyUsage = () => {
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    tokens: Math.floor(Math.random() * 2000) + 500, // Random number between 500 and 2500
  }));
};

const dailyUsageData = generateDailyUsage();

const BillingPage = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Box maxWidth="1200px" margin="auto" padding={8}>
      <VStack spacing={8} align="stretch">
        <Heading as="h1" size="xl">Billing Dashboard</Heading>

        <HStack spacing={8} align="stretch">
          <Stat flex={1} backgroundColor={bgColor} borderRadius="md" p={4} border="1px" borderColor={borderColor}>
            <StatLabel>Current Usage</StatLabel>
            <StatNumber>52,500 tokens</StatNumber>
            <StatHelpText>Jun 1 - Jun 30</StatHelpText>
          </Stat>
          <Stat flex={1} backgroundColor={bgColor} borderRadius="md" p={4} border="1px" borderColor={borderColor}>
            <StatLabel>Estimated Bill</StatLabel>
            <StatNumber>$105.00</StatNumber>
            <StatHelpText>$0.002 per token</StatHelpText>
          </Stat>
        </HStack>

        <Box backgroundColor={bgColor} borderRadius="md" p={4} border="1px" borderColor={borderColor}>
          <Heading as="h2" size="md" mb={4}>Daily Usage This Billing Period</Heading>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyUsageData}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="tokens" stroke="#3182CE" />
            </LineChart>
          </ResponsiveContainer>
        </Box>

        <Box backgroundColor={bgColor} borderRadius="md" p={4} border="1px" borderColor={borderColor}>
          <Heading as="h2" size="md" mb={4}>Recent Invoices</Heading>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Date</Th>
                <Th>Amount</Th>
                <Th>Status</Th>
                <Th>Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              <Tr>
                <Td>May 31, 2023</Td>
                <Td>$110.00</Td>
                <Td>Paid</Td>
                <Td><Button size="sm">Download</Button></Td>
              </Tr>
              <Tr>
                <Td>Apr 30, 2023</Td>
                <Td>$90.00</Td>
                <Td>Paid</Td>
                <Td><Button size="sm">Download</Button></Td>
              </Tr>
            </Tbody>
          </Table>
        </Box>

        <HStack justify="space-between">
          <Button colorScheme="blue">Update Payment Method</Button>
          <Button>Set Usage Alert</Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default BillingPage;