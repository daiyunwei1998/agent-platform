"use client";
import React, { useState } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Input,
  Button,
  FormControl,
  FormLabel,
  Container,
  Image,
  Divider,
  Progress,
  useToast,
  HStack,
} from '@chakra-ui/react';
import { FcGoogle } from 'react-icons/fc';
import { Providers } from '../providers';
import { chatServiceHost, ternantServiceHost } from '@/app/config';
import { useRouter } from 'next/navigation';


const TwoStepAccountCreationForm = () => {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const [tenantId, setTenantId] = useState("");
  const [formData, setFormData] = useState({
    tenant: '',
    tenantAlias: '',
    logo: null,
    name: '',
    email: '',
    password: '',
  });
  const toast = useToast();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, logo: file });
    }
  };

  const handleNextStep = async () => {
    if (!formData.tenant || !formData.tenantAlias || !formData.logo) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all fields and upload a logo.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Prepare form data for tenant registration
    const tenantData = new FormData();
    tenantData.append('name', formData.tenant);
    tenantData.append('alias', formData.tenantAlias);
    tenantData.append('logo', formData.logo);

    
    try {
      // Send the tenant registration request
      const response = await fetch(ternantServiceHost+'/api/v1/tenants/', {
        method: 'POST',
        body: tenantData, // multipart/form-data is automatically set by FormData
      });

      const { tenant_id } = await response.json();
      setTenantId(tenant_id);
      console.log("registered tenantId:" + tenantId);

      if (!response.ok) {
        throw new Error("Failed to create tenant");
      }

      toast({
        title: "Tenant created",
        description: "Tenant information has been successfully submitted.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      setStep(2); // Move to Step 2 after successful tenant creation
    } catch (error) {
      console.error("Error creating tenant:", error);
      toast({
        title: "Error",
        description: "There was an error creating the tenant. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all fields.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Prepare JSON payload for user registration
    const userData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role:"ADMIN",
      tenant_id:tenantId
    };

    try {
      // Send the user registration request
      const response = await fetch(chatServiceHost+`/api/v1/tenants/${tenantId}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData), // Send JSON request bod
      });

      if (!response.ok) {
        throw new Error("Failed to create user");
      }

      toast({
        title: "Account created",
        description: "Your account has been successfully created.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

     
      router.push('/dashboard');
    } catch (error) {
      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description: "There was an error creating your account. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Providers>
      <Container maxW="md" py={8}>
        <VStack spacing={6} align="stretch">
          <Progress value={step === 1 ? 50 : 100} size="sm" colorScheme="blue" />
          <Box textAlign="center">
            <Image src="/agent.png" alt="Logo" boxSize="50px" mx="auto" mb={4} />
            <Heading size="xl" mb={2}>Create an account</Heading>
            <Text fontSize="md" color="gray.600">
              {step === 1 ? "Step 1: Company Information" : "Step 2: Admin Registration"}
            </Text>
          </Box>

          <VStack as="form" spacing={4} onSubmit={step === 2 ? handleSubmitUser : undefined}>
            {step === 1 ? (
              <>
                <FormControl isRequired>
                  <FormLabel>Tenant</FormLabel>
                  <Input name="tenant" value={formData.tenant} onChange={handleInputChange} placeholder="Enter tenant name" />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Tenant Alias</FormLabel>
                  <Input name="tenantAlias" value={formData.tenantAlias} onChange={handleInputChange} placeholder="Enter tenant alias" />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Company Logo</FormLabel>
                  <Button as="label" htmlFor="file-upload" colorScheme="blue" variant="outline" cursor="pointer" w="full">
                    {formData.logo ? 'Logo uploaded' : 'Upload logo'}
                    <Input
                      id="file-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      display="none"
                    />
                  </Button>
                </FormControl>

                <Button colorScheme="blue" w="full" onClick={handleNextStep}>
                  Next
                </Button>
              </>
            ) : (
              <>
                <FormControl isRequired>
                  <FormLabel>Name</FormLabel>
                  <Input name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter your name" />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="Enter your email" />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Password</FormLabel>
                  <Input name="password" type="password" value={formData.password} onChange={handleInputChange} placeholder="Enter your password" />
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    At least 8 characters long
                  </Text>
                </FormControl>

                <HStack w="full">
                  <Button colorScheme="gray" w="full" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button colorScheme="blue" w="full" type="submit">
                    Create account
                  </Button>
                </HStack>
              </>
            )}
          </VStack>

          {step === 2 && (
            <>
              <Divider />

              <Button
                leftIcon={<FcGoogle />}
                variant="outline"
                w="full"
                size="lg"
              >
                Sign up with Google
              </Button>

              <Text textAlign="center">
                Already have an account?{' '}
                <Button variant="link" colorScheme="blue">
                  Log in
                </Button>
              </Text>
            </>
          )}
        </VStack>
      </Container>
    </Providers>
  );
};

export default TwoStepAccountCreationForm;
