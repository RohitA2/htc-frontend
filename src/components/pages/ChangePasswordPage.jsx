// pages/ChangePasswordPage.jsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import {
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  ArrowLeft,
  Shield,
  AlertCircle,
  Key,
  LogOut
} from 'lucide-react';
import { changePassword, clearErrors } from '../../store/authSlice';

const ChangePasswordPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, isAuthenticated, error, loading } = useSelector(state => state.auth);

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [redirectTimer, setRedirectTimer] = useState(5);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Clear errors on mount
  useEffect(() => {
    dispatch(clearErrors());
  }, [dispatch]);

  // Handle redirect timer after success
  useEffect(() => {
    if (success && redirectTimer > 0) {
      const timer = setTimeout(() => {
        setRedirectTimer(redirectTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (success && redirectTimer === 0) {
      handleLogoutAndRedirect();
    }
  }, [success, redirectTimer]);

  // Check password strength
  useEffect(() => {
    const password = formData.newPassword;
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    });
  }, [formData.newPassword]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (!passwordStrength.uppercase || !passwordStrength.lowercase ||
      !passwordStrength.number || !passwordStrength.special) {
      newErrors.newPassword = 'Password does not meet strength requirements';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Check if new password is same as current
    if (formData.currentPassword && formData.newPassword &&
      formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
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

    // Clear success message when user starts typing
    if (success) {
      setSuccess(false);
      setRedirectTimer(5);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await dispatch(changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      })).unwrap();

      // Success - reset form and show success message
      setSuccess(true);
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setErrors({});

    } catch (error) {
      console.error('Password change error:', error);
    }
  };

  const handleCancel = () => {
    navigate('/profile');
  };

  const handleLogoutAndRedirect = () => {
    // Clear form and redirect to login
    setSuccess(false);
    navigate('/login', { 
      state: { 
        message: 'Password changed successfully! Please login with your new password.',
        email: user?.email 
      } 
    });
  };

  const getPasswordStrengthScore = () => {
    const score = Object.values(passwordStrength).filter(Boolean).length;
    return (score / 5) * 100;
  };

  const getPasswordStrengthColor = () => {
    const score = getPasswordStrengthScore();
    if (score <= 40) return 'bg-red-500';
    if (score <= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    const score = getPasswordStrengthScore();
    if (score <= 40) return 'Weak';
    if (score <= 70) return 'Medium';
    return 'Strong';
  };

  const passwordRequirements = [
    { label: 'At least 8 characters', met: passwordStrength.length },
    { label: 'Contains uppercase letter', met: passwordStrength.uppercase },
    { label: 'Contains lowercase letter', met: passwordStrength.lowercase },
    { label: 'Contains number', met: passwordStrength.number },
    { label: 'Contains special character', met: passwordStrength.special }
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Back Button */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Profile</span>
          </button>

          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Change Password</h1>
              <p className="text-gray-600 mt-1">Secure your account with a new password</p>
            </div>
          </div>
        </div>

        {/* Success Message with Redirect Timer */}
        {success && (
          <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl shadow-sm">
            <div className="flex items-start">
              <div className="p-3 bg-green-100 rounded-xl mr-4">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-green-800">Password Changed Successfully!</h3>
                    <p className="text-green-700 mt-1">
                      Your password has been updated. For security reasons, you'll be logged out and redirected to the login page.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-green-700 font-medium">
                      Redirecting in {redirectTimer}s
                    </div>
                    <div className="w-8 h-8">
                      <div className="w-full h-full rounded-full border-2 border-green-500 border-t-transparent animate-spin"></div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-green-200">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-green-700">
                      Please login again with your new password.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setRedirectTimer(0)}
                        className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
                      >
                        Login Now
                      </button>
                      <button
                        onClick={() => {
                          setSuccess(false);
                          setRedirectTimer(5);
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        Stay Logged In
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Info Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Key className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Password Security</h3>
                  <p className="text-sm text-gray-600">Best practices</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                  <h4 className="font-medium text-blue-900 mb-2">Use a strong password</h4>
                  <p className="text-sm text-blue-700">
                    Combine letters, numbers, and special characters for maximum security.
                  </p>
                </div>

                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <h4 className="font-medium text-emerald-900 mb-2">Don't reuse passwords</h4>
                  <p className="text-sm text-emerald-700">
                    Use unique passwords for different accounts to prevent security breaches.
                  </p>
                </div>

                <div className="p-4 bg-violet-50/50 rounded-xl border border-violet-100">
                  <h4 className="font-medium text-violet-900 mb-2">Consider a password manager</h4>
                  <p className="text-sm text-violet-700">
                    Password managers help generate and store secure passwords.
                  </p>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Email:</span> {user.email}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-semibold">Last Updated:</span>{' '}
                    {new Date(user.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Change Password Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Form Header */}
              <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="text-xl font-semibold text-gray-900">Update Your Password</h2>
                <p className="text-gray-600 text-sm mt-1">
                  Enter your current password and set a new secure password
                </p>
              </div>

              {/* Error Message */}
              {error && !success && (
                <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                    <div>
                      <p className="font-medium text-red-800">Unable to change password</p>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-6">
                  {/* Current Password */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Lock className="w-4 h-4" />
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        placeholder="Enter your current password"
                        disabled={success}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-500 ${errors.currentPassword
                          ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                          : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                          }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        disabled={success}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center disabled:opacity-50"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                        )}
                      </button>
                    </div>
                    {errors.currentPassword && (
                      <p className="text-sm text-red-600">{errors.currentPassword}</p>
                    )}
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Lock className="w-4 h-4" />
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        placeholder="Create a strong new password"
                        disabled={success}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-500 ${errors.newPassword
                          ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                          : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                          }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        disabled={success}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center disabled:opacity-50"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                        )}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {formData.newPassword && !success && (
                      <div className="mt-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Password Strength</span>
                          <span className={`text-sm font-medium px-3 py-1 rounded-full ${getPasswordStrengthText() === 'Weak' ? 'bg-red-100 text-red-700' :
                            getPasswordStrengthText() === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                            }`}>
                            {getPasswordStrengthText()}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                            style={{ width: `${getPasswordStrengthScore()}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Password Requirements */}
                    {formData.newPassword && !success && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-sm font-medium text-gray-700 mb-3">Password Requirements:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {passwordRequirements.map((req, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <div className={`p-1 rounded ${req.met ? 'bg-green-100' : 'bg-gray-100'}`}>
                                {req.met ? (
                                  <Check className="h-3 w-3 text-green-600" />
                                ) : (
                                  <X className="h-3 w-3 text-gray-400" />
                                )}
                              </div>
                              <span className={`text-sm ${req.met ? 'text-green-700' : 'text-gray-500'}`}>
                                {req.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {errors.newPassword && (
                      <p className="text-sm text-red-600">{errors.newPassword}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Lock className="w-4 h-4" />
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm your new password"
                        disabled={success}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-500 ${errors.confirmPassword
                          ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                          : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                          }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={success}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center disabled:opacity-50"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-600">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {!success && (
                  <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex-1 px-4 py-3.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm hover:shadow"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Updating Password...
                        </span>
                      ) : (
                        'Change Password'
                      )}
                    </button>
                  </div>
                )}

                {/* Security Notice */}
                {!success && (
                  <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm text-amber-800 font-medium">Security Notice</p>
                        <p className="text-sm text-amber-700 mt-1">
                          For security reasons, you'll be automatically logged out after changing your password and redirected to the login page.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Logout Button */}
            {!success && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleLogoutAndRedirect}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl border border-gray-300 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout & Return to Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;