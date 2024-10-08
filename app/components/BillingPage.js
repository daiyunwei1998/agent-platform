import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
  Alert,
  AlertIcon,
  Spinner,
  Collapse,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Input,
  useBreakpointValue,
} from '@chakra-ui/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import axios from 'axios';
import { tenantServiceHost } from '@/app/config';
import { format, parseISO } from 'date-fns';
import getCurrentMonthRange from '@/utils/getCurrentMonthRange';

const BillingPage = ({ tenantId }) => {
  const [usageData, setUsageData] = useState([]);
  const [totalUsage, setTotalUsage] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [billingHistory, setBillingHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUsageDetails, setShowUsageDetails] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState('');

  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const shadowColor = useColorModeValue('rgba(0, 0, 0, 0.1)', 'rgba(255, 255, 255, 0.1)');

  const responsiveSpacing = useBreakpointValue({ base: 4, md: 6, lg: 8 });
  const responsivePadding = useBreakpointValue({ base: 4, md: 6, lg: 8 });
  const responsiveDirection = useBreakpointValue({ base: 'column', md: 'row' });

  useEffect(() => {
    const timezoneOffsetMinutes = -new Date().getTimezoneOffset();
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const today = new Date();
        const response = await axios.get(
          `${tenantServiceHost}/api/v1/usage/monthly/daily/`,
          {
            params: {
              tenant_id: tenantId,
              year: today.getFullYear(),
              month: today.getMonth() + 1,
              timezone_offset_minutes: timezoneOffsetMinutes,
            },
          }
        );

        if (!Array.isArray(response.data) || response.data.length === 0) {
          throw new Error('Invalid data received from API');
        }

        const formattedData = response.data.map((item) => ({
          date: format(parseISO(item.date), 'MMM dd'),
          tokens: item.tokens_used,
          price: item.total_price,
        }));

        setUsageData(formattedData);
        const totalTokens = formattedData.reduce(
          (sum, item) => sum + item.tokens,
          0
        );
        const totalCost = formattedData.reduce(
          (sum, item) => sum + item.price,
          0
        );
        setTotalUsage(totalTokens);
        setTotalPrice(totalCost);

        // Set fake billing history data
        setBillingHistory([
          { period: 'Aug 2024', tokensUsed: 500000, totalPrice: 50.0 },
          { period: 'Jul 2024', tokensUsed: 450000, totalPrice: 45.0 },
          { period: 'Jun 2024', tokensUsed: 480000, totalPrice: 48.0 },
        ]);
      } catch (error) {
        if (error.response && error.response.status === 404) {
          setUsageData([]);
          setTotalUsage(0);
          setTotalPrice(0);
          console.log('No usage data found for the selected period.');
        } else {
          console.error('Error fetching usage data:', error);
          setError(error.message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [tenantId]);

  const handleSaveAlertThreshold = () => {
    // Implement saving logic here
    console.log('Alert threshold set to:', alertThreshold);
    setIsAlertModalOpen(false);
  };

  const FloatingBox = ({ children, ...props }) => (
    <Box
      backgroundColor={bgColor}
      borderRadius="lg"
      p={responsivePadding}
      border="1px"
      borderColor={borderColor}
      boxShadow={`0 4px 6px ${shadowColor}`}
      transition="all 0.3s"
      _hover={{
        boxShadow: `0 6px 8px ${shadowColor}`,
        transform: 'translateY(-2px)',
      }}
      {...props}
    >
      {children}
    </Box>
  );

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        Error loading data: {error}
      </Alert>
    );
  }

  const periodString = getCurrentMonthRange();

  return (
    <Box maxWidth="1200px" margin="auto" padding={responsivePadding}>
      <VStack spacing={responsiveSpacing} align="stretch">
        <Heading as="h1" size="xl">
          Billing Dashboard
        </Heading>

        <HStack spacing={responsiveSpacing} align="stretch" flexDirection={responsiveDirection}>
          <FloatingBox flex={1}>
            <Stat>
              <StatLabel>Current Usage</StatLabel>
              <StatNumber>{totalUsage.toLocaleString()} tokens</StatNumber>
              <StatHelpText>{periodString}</StatHelpText>
            </Stat>
          </FloatingBox>
          <FloatingBox flex={1}>
            <Stat>
              <StatLabel>Estimated Bill</StatLabel>
              <StatNumber>${totalPrice.toFixed(2)}</StatNumber>
              <StatHelpText>Based on current usage</StatHelpText>
            </Stat>
          </FloatingBox>
        </HStack>

        {usageData.length > 0 ? (
          <FloatingBox>
            <Heading as="h2" size="md" mb={4}>
              Daily Usage This Billing Period
            </Heading>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={usageData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value, dataKey) => {
                    if (dataKey === 'tokens') {
                      return [value.toLocaleString(), 'Tokens'];
                    } else if (dataKey === 'price') {
                      return [`$${value.toFixed(2)}`, 'Price'];
                    }
                    return [value, dataKey];
                  }}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="tokens"
                  stroke="#3182CE"
                  name="Tokens"
                />
              </LineChart>
            </ResponsiveContainer>
          </FloatingBox>
        ) : (
          <Alert status="warning">
            <AlertIcon />
            No usage data available for the selected period.
          </Alert>
        )}

        {usageData.length > 0 && (
          <FloatingBox>
            <Heading
              as="h2"
              size="md"
              mb={4}
              onClick={() => setShowUsageDetails(!showUsageDetails)}
              cursor="pointer"
            >
              Usage Details {showUsageDetails ? '▲' : '▼'}
            </Heading>
            <Collapse in={showUsageDetails} animateOpacity>
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
            </Collapse>
          </FloatingBox>
        )}

        <FloatingBox>
          <Heading as="h2" size="md" mb={4}>
            Billing History
          </Heading>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Period</Th>
                <Th>Tokens Used</Th>
                <Th>Total Price</Th>
                <Th>Invoice</Th>
              </Tr>
            </Thead>
            <Tbody>
              {billingHistory.map((item, index) => (
                <Tr key={index}>
                  <Td>{item.period}</Td>
                  <Td>{item.tokensUsed.toLocaleString()}</Td>
                  <Td>${item.totalPrice.toFixed(2)}</Td>
                  <Td>
                    <Button size="sm" colorScheme="blue">
                      Download Invoice
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </FloatingBox>

        <HStack justify="space-between" flexDirection={responsiveDirection}>
          <Button colorScheme="blue" mb={{ base: 2, md: 0 }}>Update Payment Method</Button>
          <Button onClick={() => setIsAlertModalOpen(true)}>Set Usage Alert</Button>
        </HStack>
      </VStack>

      {/* Usage Alert Modal */}
      <Modal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Set Usage Alert Threshold</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={2}>
              Enter the token usage threshold at which you would like to receive
              an alert:
            </Text>
            <Input
              placeholder="Enter token threshold"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleSaveAlertThreshold}>
              Save
            </Button>
            <Button variant="ghost" onClick={() => setIsAlertModalOpen(false)}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default BillingPage;