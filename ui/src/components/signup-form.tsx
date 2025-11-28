import React, { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useNavigate } from "react-router"
import { API, type RegisterRequest } from "@/api/api"
import { motion } from 'framer-motion'
import { ShoppingBag, Store } from 'lucide-react'
import axios from "axios"

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    name: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSeller, setIsSeller] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const registerData: RegisterRequest = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: isSeller ? 'SELLER' : 'CUSTOMER',
        name: formData.name,
      };

      const response = await API.auth.register(registerData);
      console.log('Registration successful:', response);
      navigate('/login');
    } catch (err) {
if (axios.isAxiosError(err)) {
  const data = err.response?.data;

  // If backend did not respond (network issue)
  if (!err.response) {
    setError("Unable to connect to server. Please try again.");
    return;
  }

  const errorCode = data?.errorCode ?? "";
  const validationErrors = data?.validationErrors;

  // Handle validation errors
  if (errorCode.startsWith("VALIDATION")) {

    // Case 1: validationErrors is an object { field: "message" }
    if (validationErrors && typeof validationErrors === "object") {
      const firstKey = Object.keys(validationErrors)[0];
      if (firstKey) {
        setError(validationErrors[firstKey]);
        return;
      }
    }

    // Case 2: if server used array-style errors
    if (Array.isArray(validationErrors) && validationErrors.length > 0) {
      setError(validationErrors[0]);
      return;
    }

    // Fallback
    setError("Validation error occurred.");
    return;
  }

  // Handle other known errors
  if (data?.message) {
    setError(data.message);
    return;
  }

  // Default fallback
  setError("Registration failed. Please try again.");
  console.error("Registration failed:", err);

} else {
  // Non-Axios error fallback
  setError("An unexpected error occurred.");
  console.error("Unexpected error:", err);
}
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="overflow-hidden shadow-lg border-muted">
          <CardContent className="grid p-0 md:grid-cols-2">
            <form className="p-6 md:p-8" onSubmit={handleSubmit}>
              <FieldGroup>
                <div className="flex flex-col gap-2 text-center mb-6">
                  <CardTitle className="text-2xl">Create your account</CardTitle>
                  <CardDescription>
                    Enter your details below to create your account
                  </CardDescription>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <p className="text-red-500 text-sm mt-2">{error}</p>
                    </motion.div>
                  )}
                </div>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="transition-all"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="username">Username</FieldLabel>
                  <Input
                    id="username"
                    type="text"
                    placeholder="john_doe"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    className="transition-all"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="name">Display Name</FieldLabel>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="transition-all"
                  />
                </Field>
                <Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="password">Password</FieldLabel>
                      <Input 
                        id="password" 
                        type="password" 
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        className="transition-all"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="confirmPassword">
                        Confirm Password
                      </FieldLabel>
                      <Input 
                        id="confirmPassword" 
                        type="password" 
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required
                        className="transition-all"
                      />
                    </Field>
                  </div>
                  <FieldDescription>
                    Must be at least 8 characters long.
                  </FieldDescription>
                </Field>
                <Field>
                  <div className="flex items-center space-x-2 p-4 rounded-lg border border-muted hover:border-primary/50 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      id="seller"
                      checked={isSeller}
                      onChange={(e) => setIsSeller(e.target.checked)}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
                    />
                    <FieldLabel htmlFor="seller" className="text-sm font-normal cursor-pointer flex items-center gap-2">
                      <Store className="h-4 w-4" />
                      Register as a seller
                    </FieldLabel>
                  </div>
                  <FieldDescription>
                    Check this if you want to sell products on our platform.
                  </FieldDescription>
                </Field>
                <Field>
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </Field>
                <FieldDescription className="text-center">
                  Already have an account?{' '}
                  <a 
                    onClick={() => navigate("/login")}
                    className="text-primary hover:underline cursor-pointer font-medium"
                  >
                    Sign in
                  </a>
                </FieldDescription>
              </FieldGroup>
            </form>
            <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 relative hidden md:flex items-center justify-center p-8">
              <div className="text-center space-y-6">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 backdrop-blur-sm"
                >
                  <ShoppingBag className="h-12 w-12 text-primary" />
                </motion.div>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <h3 className="text-2xl font-bold">Join OpenShop</h3>
                  <p className="text-muted-foreground">
                    Your gateway to thousands of quality products
                  </p>
                </motion.div>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-3 text-sm"
                >
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span>Fast & secure checkout</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span>Track your orders easily</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span>Exclusive deals & offers</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      <FieldDescription className="text-center px-4">
        By clicking continue, you agree to our{' '}
        <a href="#" className="text-primary hover:underline">Terms of Service</a>{' '}
        and{' '}
        <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}
