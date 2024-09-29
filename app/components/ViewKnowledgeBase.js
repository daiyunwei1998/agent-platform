"use client";
import React, { useState, useEffect, useRef } from "react";
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
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
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
  
  // New state variables for loading
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const {
    isOpen: isEditModalOpen,
    onOpen: onEditModalOpen,
    onClose: onEditModalClose,
  } = useDisclosure();
  
  const toast = useToast();

  // State and disclosure for delete confirmation
  const {
    isOpen: isDeleteAlertOpen,
    onOpen: onDeleteAlertOpen,
    onClose: onDeleteAlertClose,
  } = useDisclosure();
  const [entryToDelete, setEntryToDelete] = useState(null);
  const cancelRef = useRef();

  // Fetch document names
  const fetchDocNames = async () => {
    setIsLoadingDocNames(true);
    try {
      const response = await fetch(
        `${tenantServiceHost}/api/v1/tenant_docs/${tenantId}/`
      );

      if (response.status === 404) {
        // If 404, set docNames to an empty array
        setDocNames([]);
      }

      if (response.ok) {
        const data = await response.json();
        const docNames = data.map((item) => item.doc_name);
        setDocNames(docNames);
      }
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
    if (!editingEntry) return;
    setIsUpdating(true); // Start loading
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
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update entry content");
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
        description: error.message || "Failed to update entry content",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUpdating(false); // End loading
      onEditModalClose();
    }
  };

  // Delete entry
  const deleteEntry = async () => {
    if (!entryToDelete) return;
    setIsDeleting(true); // Start loading
    try {
      const response = await fetch(
        `${tenantServiceHost}/api/v1/${tenantId}/entries/${entryToDelete.id}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to delete entry");
      }
      toast({
        title: "Deleted",
        description: "Entry deleted successfully.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      // Remove the deleted entry from the state
      setDocEntries((prevEntries) =>
        prevEntries.filter((entry) => entry.id !== entryToDelete.id)
      );
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete entry",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false); // End loading
      setEntryToDelete(null);
      onDeleteAlertClose();
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
                    {docEntries.length === 0 ? (
                      <Text>No entries found.</Text>
                    ) : (
                      docEntries.map((entry, entryIndex) => (
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
                            mr={2}
                            onClick={() => {
                              console.log(`editing ${entry.id}`);
                              setEditingEntry(entry);
                              setEditedContent(entry.content);
                              onEditModalOpen();
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            colorScheme="red"
                            mt={2}
                            onClick={() => {
                              console.log(`deleting ${entry.id}`);
                              setEntryToDelete(entry);
                              onDeleteAlertOpen();
                            }}
                          >
                            Delete
                          </Button>
                        </Box>
                      ))
                    )}
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
            <Button
              colorScheme="blue"
              mr={3}
              onClick={updateEntryContent}
              isLoading={isUpdating} // Show loading state
              loadingText="Saving"
            >
              Save
            </Button>
            <Button variant="ghost" onClick={onEditModalClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog
        isOpen={isDeleteAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteAlertClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Entry
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this entry? This action cannot be
              undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteAlertClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={deleteEntry}
                ml={3}
                isLoading={isDeleting} // Show loading state
                loadingText="Deleting"
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default ViewKnowledgeBase;
