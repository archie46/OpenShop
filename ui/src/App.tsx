import './App.css'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useNavigate } from "react-router"
import { motion } from "framer-motion"
import { 
  ShoppingBag, 
  Sparkles, 
  ArrowRight, 
  TrendingUp, 
  Shield, 
  Zap,
  Star,
  Users,
  Heart
} from "lucide-react"
import { useAuthStore } from './stores/useAuthStore'

function App() {
  const navigate = useNavigate();

  const features = [
    { icon: Shield, text: "Secure Shopping", color: "from-blue-500 to-cyan-500" },
    { icon: Zap, text: "Fast Delivery", color: "from-purple-500 to-pink-500" },
    { icon: Star, text: "Top Rated", color: "from-orange-500 to-red-500" },
  ];

  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-purple-500/10">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-primary/30 to-purple-500/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [360, 180, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-pink-500/30 to-purple-500/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-6xl mx-auto text-center"
        >
          {/* Logo/Brand Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-primary via-purple-600 to-pink-600 shadow-2xl mb-6 relative group">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <ShoppingBag className="h-12 w-12 text-white" />
              </motion.div>
              
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary to-pink-600 blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-full px-4 py-2 mb-6"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Welcome to the Future of Shopping</span>
            </motion.div>
          </motion.div>

          {/* Hero Text */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-6xl md:text-8xl font-bold mb-6 leading-tight"
          >
            <span className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
              OpenShop
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-3xl text-muted-foreground mb-4 max-w-3xl mx-auto leading-relaxed"
          >
            Your Ultimate Marketplace for
            <span className="text-primary font-semibold"> Amazing Products</span>
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-muted-foreground mb-12 max-w-2xl mx-auto"
          >
            Experience seamless shopping with thousands of products, verified sellers, and unbeatable deals
          </motion.p>

          {/* CTA Buttons */}
           <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            {isAuthenticated && (
              <Button 
                size="lg"
                onClick={() => navigate("/home")}
                className="text-lg px-10 py-7 rounded-xl shadow-2xl hover:shadow-primary/50 group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start Shopping
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary via-purple-600 to-pink-600"
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  style={{ opacity: 0.3 }}
                />
              </Button>
            )}
            
            {!isAuthenticated && (
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate("/register")}
                className="text-lg px-10 py-7 rounded-xl border-2 hover:border-primary/50 group"
              >
                <span className="flex items-center gap-2">
                  Create Account
                  <Users className="h-5 w-5 group-hover:scale-110 transition-transform" />
                </span>
              </Button>
            )}
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.text}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <Card className="p-6 backdrop-blur-sm bg-background/50 border-2 hover:border-primary/50 transition-all duration-300 group">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-all`}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <p className="font-semibold text-lg group-hover:text-primary transition-colors">
                    {feature.text}
                  </p>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex flex-wrap justify-center gap-8 mb-12"
          >
            {[
              { value: "50K+", label: "Products" },
              { value: "10K+", label: "Customers" },
              { value: "500+", label: "Sellers" },
              { value: "4.8★", label: "Rating" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1 + index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Bottom CTA */}
          {!isAuthenticated && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              <Card className="relative overflow-hidden p-8 backdrop-blur-sm bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border-2 border-primary/20">
                <div className="relative z-10">
                  <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
                    Already a member?
                  </Badge>
                  <p className="text-lg mb-4 text-muted-foreground">
                    Sign in to access your account and continue shopping
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => navigate("/login")}
                    className="group hover:bg-primary/10 border-primary/30"
                  >
                    <span className="flex items-center gap-2">
                      Sign In
                      <Heart className="h-4 w-4 group-hover:fill-primary group-hover:text-primary transition-all" />
                    </span>
                  </Button>
                </div>

              {/* Decorative gradient orbs */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.2, 0.3, 0.2],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-primary/30 to-purple-500/30 rounded-full blur-2xl"
              />
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.2, 0.3, 0.2],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-br from-pink-500/30 to-purple-500/30 rounded-full blur-2xl"
              />
            </Card>
          </motion.div>
          )}

          {/* Floating Elements */}
          <motion.div
            animate={{
              y: [0, -20, 0],
              rotate: [0, 5, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-20 right-10 opacity-20 hidden lg:block"
          >
            <TrendingUp className="h-20 w-20 text-primary" />
          </motion.div>

          <motion.div
            animate={{
              y: [0, 20, 0],
              rotate: [0, -5, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute bottom-20 left-10 opacity-20 hidden lg:block"
          >
            <Sparkles className="h-16 w-16 text-purple-500" />
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default App
