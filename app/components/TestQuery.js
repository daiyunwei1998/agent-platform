"use client";
import React, { useState } from "react";
import {
  Box,
  Button,
  Input,
  VStack,
  Heading,
  useToast,
} from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";
import { aiServiceHost } from "@/app/config";
import styles from "./Dashboard.module.css";

const TestQuery = ({ tenantId }) => {
  const [query, setQuery] = useState("");
  const [retrievalResult, setRetrievalResult] = useState("");
  const [isLoadingQuery, setIsLoadingQuery] = useState(false);
  const toast = useToast();

  // Handle Test Query (AI Retrieval)
  const handleTestQuery = async () => {
    setIsLoadingQuery(true);

    try {
      const response = await fetch(`${aiServiceHost}/api/v1/rag`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query,
          tenant_id: tenantId,
        }),
      });

      if (!response.ok) {
        throw new Error("AI Service error");
      }

      const data = await response.json();
      setRetrievalResult(data.data);
    } catch (error) {
      console.error("Error:", error);
      setRetrievalResult("Error fetching data. Please try again.");
      toast({
        title: "Error",
        description: "Failed to fetch query results",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingQuery(false);
    }
  };

  return (
    <Box>
      <Heading size="lg" mb={4}>
        Test Query
      </Heading>
      <VStack spacing={4} align="stretch">
        <Input
          placeholder="Enter your query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button
          colorScheme="blue"
          onClick={handleTestQuery}
          isLoading={isLoadingQuery}
          isDisabled={isLoadingQuery || query === ""}
        >
          Run Query
        </Button>
        <Box
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          p={4}
          minHeight="150px"
          overflowY="auto"
          bg="white"
        >
          {retrievalResult ? (
            <ReactMarkdown className={styles["markdown-content"]}>
              {retrievalResult}
            </ReactMarkdown>
          ) : (
            <Box color="gray.500">Retrieval results will appear here</Box>
          )}
        </Box>
      </VStack>
    </Box>
  );
};

export default TestQuery;
