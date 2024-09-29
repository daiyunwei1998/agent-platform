import React, { useState, useEffect } from 'react';
import { Box, VStack, HStack, Heading, Text, Button, Table, Thead, Tbody, Tr, Th, Td, Stat, StatLabel, StatNumber, StatHelpText, useColorModeValue } from '@chakra-ui/react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { format, parseISO, utcToZonedTime } from 'date-fns-tz';
import {tenantServiceHost} from '@/app/config';

const BillingPage = ({tenantId}) => {
  const [usageData, setUsageData] = useState([]);
  const [totalUsage, setTotalUsage] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${tenantServiceHost}/api/v1/usage/monthly/daily/?tenant_id=${tenantId}&year=2024&month=9`);
        const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        const formattedData = response.data.map(item => ({
          date: format(utcToZonedTime(parseISO(item.date), userTimeZone), 'MMM dd'),
          tokens: item.tokens_used,
          price: item.total_price
        }));

        setUsageData(formattedData);
        setTotalUsage(formattedData.reduce((sum, item) => sum + item.tokens, 0));
        setTotalPrice(formattedData.reduce((sum, item) => sum + item.price, 0));
      } catch (error) {
        console.error('Error fetching usage data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <Box maxWidth="1200px" margin="auto" padding={8}>
      <VStack spacing={8} align="stretch">
        <Heading as="h1" size="xl">Billing Dashboard</Heading>

        <HStack spacing={8} align="stretch">
          <Stat flex={1} backgroundColor={bgColor} borderRadius="md" p={4} border="1px" borderColor={borderColor}>
            <StatLabel>Current Usage</StatLabel>
            <StatNumber>{totalUsage.toLocaleString()} tokens</StatNumber>
            <StatHelpText>Sep 1 - Sep 30, 2024</StatHelpText>
          </Stat>
          <Stat flex={1} backgroundColor={bgColor} borderRadius="md" p={4} border="1px" borderColor={borderColor}>
            <StatLabel>Estimated Bill</StatLabel>
            <StatNumber>${totalPrice.toFixed(2)}</StatNumber>
            <StatHelpText>Based on current usage</StatHelpText>
          </Stat>
        </HStack>

        <Box backgroundColor={bgColor} borderRadius="md" p={4} border="1px" borderColor={borderColor}>
          <Heading as="h2" size="md" mb={4}>Daily Usage This Billing Period</Heading>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={usageData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [value.toLocaleString(), name === 'tokens' ? 'Tokens' : 'Price']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Line type="monotone" dataKey="tokens" stroke="#3182CE" name="Tokens" />
            </LineChart>
          </ResponsiveContainer>
        </Box>

        <Box backgroundColor={bgColor} borderRadius="md" p={4} border="1px" borderColor={borderColor}>
          <Heading as="h2" size="md" mb={4}>Usage Details</Heading>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Date</Th>
                <Th>Tokens Used</Th>
                <Th>Price</Th>
              </Tr>
            </Thead>
            <Tbody>
              {usageData.slice(0, 5).map((item, index) => (
                <Tr key={index}>
                  <Td>{item.date}</Td>
                  <Td>{item.tokens.toLocaleString()}</Td>
                  <Td>${item.price.toFixed(4)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          {usageData.length > 5 && (
            <Text mt={2} color="blue.500" cursor="pointer">
              View all {usageData.length} days
            </Text>
          )}
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