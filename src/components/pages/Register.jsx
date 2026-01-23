import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearErrors } from '../../store/authSlice';
import {
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
  TruckIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });
  const [errors, setErrors] = useState({});
  
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
    dispatch(clearErrors());
  }, [isAuthenticated, navigate, dispatch]);

  useEffect(() => {
    // Check password strength
    const password = formData.password;
    setPasswordStrength({
      hasMinLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  }, [formData.password]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  async function submit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const result = await dispatch(registerUser({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: 'User' // Default role
      })).unwrap();
      
      if (result.user) {
        localStorage.setItem('user', JSON.stringify(result.user));
        
        // Show success message or redirect
        navigate('/login', { replace: true, state: { message: 'Registration successful! Please login.' } });
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  }

  const passwordRequirements = [
    { label: 'At least 8 characters', met: passwordStrength.hasMinLength },
    { label: 'Contains uppercase letter', met: passwordStrength.hasUpperCase },
    { label: 'Contains lowercase letter', met: passwordStrength.hasLowerCase },
    { label: 'Contains number', met: passwordStrength.hasNumber },
    { label: 'Contains special character', met: passwordStrength.hasSpecialChar },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Full Screen Container */}
      <div className="flex h-screen">
        {/* Left Section - Full Height Background Image */}
        <div
          className="hidden md:flex md:w-2/5 relative overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(rgba(30, 64, 175, 0.85), rgba(49, 46, 129, 0.9)), url('/images/truck.jfif')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Optional: Add overlay pattern */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>

          <div className="relative z-10 flex flex-col h-full p-8 md:p-12 lg:p-16">
            {/* Logo/Brand */}
            <div className="flex items-center space-x-3 mb-8 md:mb-12">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/30">
                <TruckIcon className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">HTC Transport</h1>
            </div>

            {/* Hero Content */}
            <div className="flex-1 flex flex-col justify-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                Join Our Logistics
                <span className="block text-blue-200 mt-2">Revolution</span>
              </h2>

              <div className="space-y-4 mt-8">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-blue-100 font-medium">Advanced Fleet Management</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-blue-100 font-medium">Real-time Tracking</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-blue-100 font-medium">Smart Logistics Solutions</span>
                </div>
              </div>
            </div>

            {/* Footer Text */}
            <div className="mt-8 pt-8 border-t border-blue-400/30">
              <p className="text-blue-200 text-sm font-medium italic">
                "Streamlining transportation for a connected world"
              </p>
            </div>
          </div>
        </div>

        {/* Right Section - Full Height Register Form */}
        <div className="w-full md:w-3/5 flex items-center justify-center p-4 md:p-8 lg:p-12 overflow-y-auto">
          <div className="w-full max-w-md">
            {/* Form Header */}
            <div className="text-center md:text-left mb-8 md:mb-10">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Create Account
              </h1>
              <p className="text-gray-600 text-sm md:text-base">
                Join <span className="text-blue-600 font-semibold">HTC Transport</span> and transform your logistics
              </p>
            </div>

            {/* Register Form */}
            <form onSubmit={submit} className="space-y-5 md:space-y-6">
              {/* Full Name Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    className={`w-full px-4 py-3 md:py-3.5 border rounded-xl 
                             focus:outline-none transition duration-200
                             placeholder-gray-400 text-sm md:text-base
                             ${errors.fullName ? 'border-red-300 focus:border-red-500 focus:ring-3 focus:ring-red-200' 
                                               : 'border-gray-300 focus:border-blue-500 focus:ring-3 focus:ring-blue-200'}`}
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    type="text"
                    placeholder="Enter your full name"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                {errors.fullName && (
                  <p className="text-sm text-red-600 mt-1">{errors.fullName}</p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    className={`w-full px-4 py-3 md:py-3.5 border rounded-xl 
                             focus:outline-none transition duration-200
                             placeholder-gray-400 text-sm md:text-base
                             ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-3 focus:ring-red-200' 
                                           : 'border-gray-300 focus:border-blue-500 focus:ring-3 focus:ring-blue-200'}`}
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    type="email"
                    placeholder="you@example.com"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    className={`w-full px-4 py-3 md:py-3.5 border rounded-xl 
                             focus:outline-none transition duration-200
                             placeholder-gray-400 text-sm md:text-base pr-12
                             ${errors.password ? 'border-red-300 focus:border-red-500 focus:ring-3 focus:ring-red-200' 
                                              : 'border-gray-300 focus:border-blue-500 focus:ring-3 focus:ring-blue-200'}`}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 mt-1">{errors.password}</p>
                )}
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
                    <div className="space-y-1">
                      {passwordRequirements.map((req, index) => (
                        <div key={index} className="flex items-center">
                          {req.met ? (
                            <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <XCircleIcon className="h-4 w-4 text-red-400 mr-2" />
                          )}
                          <span className={`text-xs ${req.met ? 'text-green-600' : 'text-gray-500'}`}>
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    className={`w-full px-4 py-3 md:py-3.5 border rounded-xl 
                             focus:outline-none transition duration-200
                             placeholder-gray-400 text-sm md:text-base pr-12
                             ${errors.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-3 focus:ring-red-200' 
                                                     : 'border-gray-300 focus:border-blue-500 focus:ring-3 focus:ring-blue-200'}`}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    required
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="terms" className="text-gray-700">
                    I agree to the{' '}
                    <Link to="/terms" className="text-blue-600 hover:text-blue-800 font-medium">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="text-blue-600 hover:text-blue-800 font-medium">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
              </div>

              {/* Error Message from API */}
              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 md:py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 
                         text-white font-semibold rounded-xl shadow-lg
                         hover:from-blue-700 hover:to-indigo-700 
                         focus:outline-none focus:ring-4 focus:ring-blue-200
                         disabled:opacity-70 disabled:cursor-not-allowed
                         transition-all duration-200 transform hover:-translate-y-0.5
                         active:translate-y-0 text-sm md:text-base"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    Create Account
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </span>
                )}
              </button>

              {/* Login Link */}
              <div className="text-center pt-4 md:pt-6">
                <p className="text-gray-600 text-sm md:text-base">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="font-semibold text-blue-600 hover:text-blue-800 
                             transition duration-200 inline-flex items-center"
                  >
                    Sign in
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}