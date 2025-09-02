// src/pages/index.jsx
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Timer, 
  BookOpen, 
  Trophy, 
  Users,
  ArrowRight,
  CheckCircle,
  Star,
  Play,
  Zap,
  Heart,
  Brain,
  Coffee,
  Target,
  Sparkles,
  Github,
  Twitter,
  Mail
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/UI/Button'
import Card from '@/components/UI/Card'
import { useUser } from '@/context/UserContext'

const LandingPage = () => {
  const navigate = useNavigate()
  const { user, signInWithGoogle, continueAsGuest } = useUser()
  const [currentFeature, setCurrentFeature] = useState(0)

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !user.isGuest) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const features = [
    {
      icon: Timer,
      title: 'Smart Focus Timer',
      description: 'Pomodoro, deep work, and custom sessions with intelligent break suggestions',
      image: '/images/focus-timer.png',
      color: 'text-blue-500'
    },
    {
      icon: BookOpen,
      title: 'Visual Study Journal',
      description: 'Beautiful bookshelf view of your learning journey with detailed analytics',
      image: '/images/study-journal.png',
      color: 'text-green-500'
    },
    {
      icon: Trophy,
      title: 'Achievement System',
      description: 'Gamified progress tracking with milestones, levels, and motivational rewards',
      image: '/images/achievements.png',
      color: 'text-yellow-500'
    },
    {
      icon: Users,
      title: 'Study Together',
      description: 'Virtual study rooms with real-time synchronization and social motivation',
      image: '/images/study-rooms.png',
      color: 'text-purple-500'
    }
  ]

  const benefits = [
    {
      icon: Brain,
      title: 'Enhanced Focus',
      description: 'Scientifically-backed techniques to improve concentration and reduce distractions'
    },
    {
      icon: Target,
      title: 'Goal Achievement',
      description: 'Smart goal setting and tracking to help you accomplish your learning objectives'
    },
    {
      icon: Heart,
      title: 'Wellness Integration',
      description: 'Built-in breathing exercises, stretches, and mindfulness practices'
    },
    {
      icon: Sparkles,
      title: 'Personalized Experience',
      description: 'Adaptive interface that learns your preferences and optimizes your workflow'
    }
  ]

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Graduate Student',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
      content: 'Lumos Hub transformed my study habits. The visual progress tracking keeps me motivated every day.'
    },
    {
      name: 'Marcus Rodriguez',
      role: 'Software Developer',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marcus',
      content: 'The focus rooms feature is incredible. Studying with others online has never felt so natural.'
    },
    {
      name: 'Emily Watson',
      role: 'Medical Student',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily',
      content: 'Perfect for intensive study sessions. The break reminders and wellness features keep me healthy.'
    }
  ]

  // Cycle through features
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature(prev => (prev + 1) % features.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleGetStarted = async () => {
    if (user?.isGuest) {
      navigate('/dashboard')
    } else {
      try {
        await signInWithGoogle()
      } catch (error) {
        console.error('Sign in failed:', error)
      }
    }
  }

  const handleGuestAccess = () => {
    continueAsGuest()
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface">
      {/* Navigation */}
      <nav className="border-b border-card-border bg-surface/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">L</span>
              </div>
              <span className="text-xl font-semibold text-text">Lumos Hub</span>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              {user ? (
                <Button onClick={() => navigate('/dashboard')}>
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Button onClick={handleGuestAccess} variant="ghost">
                    Try as Guest
                  </Button>
                  <Button onClick={handleGetStarted}>
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl sm:text-6xl font-bold text-text mb-6">
                Illuminate Your
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {' '}Learning Journey
                </span>
              </h1>
              
              <p className="text-xl text-text-secondary max-w-3xl mx-auto mb-8">
                Transform your study sessions with intelligent focus tools, beautiful progress tracking, 
                and a supportive community that keeps you motivated every step of the way.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  onClick={handleGetStarted}
                  size="lg"
                  className="min-w-48"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Start Learning Today
                </Button>
                
                <Button
                  onClick={handleGuestAccess}
                  variant="ghost"
                  size="lg"
                  className="min-w-48"
                >
                  <Zap className="mr-2 h-5 w-5" />
                  Try Demo
                </Button>
              </div>
            </motion.div>

            {/* Hero Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto"
            >
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">10,000+</p>
                <p className="text-sm text-text-secondary">Study Sessions</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-secondary">2,500+</p>
                <p className="text-sm text-text-secondary">Active Learners</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-accent">95%</p>
                <p className="text-sm text-text-secondary">Satisfaction Rate</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4">
              Everything You Need to Excel
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Powerful features designed to enhance your focus, track your progress, 
              and keep you motivated throughout your learning journey.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Feature List */}
            <div className="space-y-8">
              {features.map((feature, index) => {
                const IconComponent = feature.icon
                const isActive = currentFeature === index
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`p-6 rounded-lg border cursor-pointer transition-all ${
                      isActive 
                        ? 'border-primary bg-primary/5' 
                        : 'border-card-border bg-surface hover:border-primary/30'
                    }`}
                    onClick={() => setCurrentFeature(index)}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg bg-background ${feature.color}`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className={`font-semibold mb-2 ${isActive ? 'text-primary' : 'text-text'}`}>
                          {feature.title}
                        </h3>
                        <p className="text-text-secondary">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Feature Preview */}
            <div className="relative">
              <motion.div
                key={currentFeature}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-surface rounded-xl border border-card-border p-8 shadow-2xl"
              >
                <div className={`text-center ${features[currentFeature].color}`}>
                  {React.createElement(features[currentFeature].icon, { 
                    className: "h-16 w-16 mx-auto mb-4" 
                  })}
                  <h3 className="text-xl font-semibold text-text mb-2">
                    {features[currentFeature].title}
                  </h3>
                  <p className="text-text-secondary">
                    {features[currentFeature].description}
                  </p>
                </div>
              </motion.div>

              {/* Feature indicators */}
              <div className="flex justify-center mt-6 space-x-2">
                {features.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentFeature(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      currentFeature === index ? 'bg-primary w-8' : 'bg-card-border'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4">
              Why Choose Lumos Hub?
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Join thousands of learners who have transformed their study habits 
              and achieved their academic and professional goals.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 rounded-lg bg-primary/10 text-primary">
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-text mb-2">{benefit.title}</h3>
                        <p className="text-text-secondary">{benefit.description}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-secondary/5 to-accent/5">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4">
              Loved by Learners Worldwide
            </h2>
            <div className="flex items-center justify-center space-x-1 text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-6 w-6 fill-current" />
              ))}
              <span className="ml-2 text-text-secondary">4.9/5 from 500+ reviews</span>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <p className="font-semibold text-text">{testimonial.name}</p>
                      <p className="text-sm text-text-secondary">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-text-secondary italic">"{testimonial.content}"</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-lg text-text-secondary mb-8">
              Join thousands of successful learners and start your journey today. 
              No credit card required.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="min-w-56"
              >
                <ArrowRight className="mr-2 h-5 w-5" />
                Get Started for Free
              </Button>
              
              <Button
                onClick={handleGuestAccess}
                variant="outline"
                size="lg"
                className="min-w-56"
              >
                Explore Demo
              </Button>
            </div>

            <div className="flex items-center justify-center mt-8 space-x-8 text-sm text-text-secondary">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Free to use
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                No ads
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Privacy focused
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-card-border bg-surface/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">L</span>
                </div>
                <span className="text-xl font-semibold text-text">Lumos Hub</span>
              </div>
              <p className="text-text-secondary mb-4">
                Illuminating paths to academic and professional success through 
                intelligent study tools and community support.
              </p>
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm">
                  <Github className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Links */}
            <div>
              <h3 className="font-semibold text-text mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li><a href="#" className="hover:text-text">Features</a></li>
                <li><a href="#" className="hover:text-text">Pricing</a></li>
                <li><a href="#" className="hover:text-text">Updates</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-text mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li><a href="#" className="hover:text-text">Help Center</a></li>
                <li><a href="#" className="hover:text-text">Contact</a></li>
                <li><a href="#" className="hover:text-text">Privacy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-card-border mt-8 pt-8 text-center text-sm text-text-secondary">
            <p>&copy; 2025 Lumos Hub. All rights reserved. Made with ❤️ for learners everywhere.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
