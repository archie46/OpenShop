import React, { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useNavigate } from "react-router"
import { API, type LoginRequest } from "@/api/api"
import { useAuthStore } from "@/stores/useAuthStore"
import { motion } from 'framer-motion'

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {

  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const loginData: LoginRequest = {
        username: formData.username,
        password: formData.password
      };

      const response = await API.auth.login(loginData);
      console.log('Login successful:', response);
      
      // Update the auth store with user data and token
      setAuth(response.user, response.token);
      
      // Role-based navigation
      if (response.user.role === 'SELLER') {
        navigate('/seller/products');
      } else {
        navigate('/home');
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError('Login failed. Please check your credentials.');
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
        <Card className="shadow-lg border-muted">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Login to your account</CardTitle>
            <CardDescription>
              Enter your credentials below to access your account
            </CardDescription>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="text-red-500 text-sm mt-2">{error}</p>
              </motion.div>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
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
                  <div className="flex items-center">
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <a
                      href="#"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline text-primary"
                    >
                      Forgot your password?
                    </a>
                  </div>
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
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Logging in...' : 'Login'}
                  </Button>
                  <FieldDescription className="text-center mt-4">
                    Don&apos;t have an account?{' '}
                    <a 
                      onClick={() => navigate("/register")}
                      className="text-primary hover:underline cursor-pointer font-medium"
                    >
                      Sign up
                    </a>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
