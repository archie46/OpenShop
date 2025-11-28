import { SignupForm } from "@/components/signup-form"
import { motion } from 'framer-motion'
import { ShoppingBag } from 'lucide-react'

export default function SignupPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl mx-auto"
        >
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center gap-2 mb-4"
            >
              <ShoppingBag className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">OpenShop</h1>
            </motion.div>
            <p className="text-muted-foreground">Join our marketplace community</p>
          </div>

          <SignupForm />
        </motion.div>
      </div>
    </div>
  )
}
