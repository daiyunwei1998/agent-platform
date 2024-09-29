"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Text,
  VStack,
  Heading,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Textarea,
  useDisclosure,
} from "@chakra-ui/react";
import { tenantServiceHost } from "@/app/config";

const ViewKnowledgeBase = ({ tenantId }) => {
  const [docNames, setDocNames] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docEntries, setDocEntries] = useState([]);
  const [isLoadingDocNames, setIsLoadingDocNames] = useState(false);
  const [isLoadingDocEntries, setIsLoadingDocEntries] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const {
    isOpen: isEditModalOpen,
    onOpen: onEditModalOpen,
    onClose: onEditModalClose,
  } = useDisclosure();
  const toast = useToast();

  // Fetch document names
  const fetchDocNames = async () => {
    setIsLoadingDocNames(true);
    try {
      const response = await fetch(
        `${tenantServiceHost}/api/v1/tenant_docs/${tenantId}/`
      );
      if (!response.ok) {
        if (response.status === 404) {
            // If 404, set docNames to an empty array
            setDocNames([]);
          } else if (response.status === 500) {
            // If 500, throw an error to be caught in the catch block
            throw new Error("Server error while fetching document names");
          } else {
            // Handle other unexpected statuses
            throw new Error(`Unexpected error: ${response.statusText}`);
        }
      }
      const data = await response.json();
      const docNames = data.map((item) => item.doc_name);
      setDocNames(docNames);
    } catch (error) {
      console.error("Error fetching document names:", error);
      toast({
        title: "Error",
        description: "Failed to fetch document names",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingDocNames(false);
    }
  };

  // Fetch entries for a selected document
  const fetchDocEntries = async (docName) => {
    setIsLoadingDocEntries(true);
    try {
      const response = await fetch(
        `${tenantServiceHost}/api/v1/knowledge_base/${tenantId}/entries?docName=${encodeURIComponent(
          docName
        )}`,
        { cache: "no-store" }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch document entries");
      }
      const data = await response.json();
      console.log("doc entries:", data.entries);
      setDocEntries(data.entries);
    } catch (error) {
      console.error("Error fetching document entries:", error);
      toast({
        title: "Error",
        description: "Failed to fetch document entries",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingDocEntries(false);
    }
  };

  // Update entry content
  const updateEntryContent = async () => {
    try {
      console.log(`edited ${editingEntry.id}`);
      const response = await fetch(
        `${tenantServiceHost}/api/v1/knowledge_base/${tenantId}/entries/${editingEntry.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ newContent: editedContent }),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to update entry content");
      }
      toast({
        title: "Success",
        description: "Entry content updated successfully",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      await fetchDocEntries(selectedDoc);
    } catch (error) {
      console.error("Error updating entry content:", error);
      toast({
        title: "Error",
        description: "Failed to update entry content",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      onEditModalClose();
    }
  };

  // Fetch documents on component mount
  useEffect(() => {
    fetchDocNames();
  }, []);

  return (
    <Box>
      <Heading size="lg" mb={4}>
        Knowledge Base
      </Heading>
      {isLoadingDocNames ? (
        <Text>Loading document names...</Text>
      ) : (
        <Accordion allowToggle>
          {docNames.map((docName, index) => (
            <AccordionItem key={index}>
              <h2>
                <AccordionButton
                  onClick={() => {
                    setSelectedDoc(docName);
                    fetchDocEntries(docName);
                  }}
                >
                  <Box flex="1" textAlign="left">
                    {docName}
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                {isLoadingDocEntries && selectedDoc === docName ? (
                  <Text>Loading entries...</Text>
                ) : (
                  <VStack align="stretch" spacing={2}>
                    {docEntries.map((entry, entryIndex) => (
                      <Box
                        key={entryIndex}
                        p={3}
                        bg="white"
                        borderRadius="md"
                        boxShadow="sm"
                      >
                        <Text>{entry.content}</Text>
                        <Button
                          size="sm"
                          colorScheme="blue"
                          mt={2}
                          onClick={() => {
                            console.log(`editing ${entry.id}`);
                            setEditingEntry(entry);
                            setEditedContent(entry.content);
                            onEditModalOpen();
                          }}
                        >
                          Edit
                        </Button>
                      </Box>
                    ))}
                  </VStack>
                )}
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Edit Entry Modal */}
      <Modal isOpen={isEditModalOpen} onClose={onEditModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Entry</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={10}
            />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={updateEntryContent}>
              Save
            </Button>
            <Button variant="ghost" onClick={onEditModalClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ViewKnowledgeBase;
