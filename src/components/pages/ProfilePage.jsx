// pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Globe,
    Edit2,
    Save,
    X,
    Camera,
    Truck,
    Shield,
    ChevronRight,
    Calendar,
    CheckCircle,
    AlertCircle,
    RefreshCw
} from 'lucide-react';
import {
    fetchUserProfile,
    updateUserProfile,
    clearErrors,
    clearProfileSuccess
} from '../../store/authSlice';

const ProfilePage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const {
        user,
        profileLoading,
        profileFetchLoading,
        profileError,
        profileUpdateSuccess,
        profileUpdateMessage,
        isAuthenticated
    } = useSelector(state => state.auth);

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        mobile_number: '',
        country: '',
        state: '',
        city: '',
        location: '',
    });

    const [formErrors, setFormErrors] = useState({});

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    // Fetch profile data when component mounts
    useEffect(() => {
        if (isAuthenticated) {
            dispatch(fetchUserProfile());
        }
    }, [dispatch, isAuthenticated]);

    // Initialize form data from user
    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || '',
                email: user.email || '',
                mobile_number: user.mobile_number || '',
                country: user.country || '',
                state: user.state || '',
                city: user.city || '',
                location: user.location || '',
            });
        }
    }, [user]);

    // Clear success message after 4 seconds
    useEffect(() => {
        if (profileUpdateSuccess) {
            const timer = setTimeout(() => {
                dispatch(clearProfileSuccess());
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [profileUpdateSuccess, dispatch]);

    // Clear errors when component mounts
    useEffect(() => {
        dispatch(clearErrors());
    }, [dispatch]);

    const validateForm = () => {
        const errors = {};

        if (!formData.fullName?.trim()) {
            errors.fullName = 'Full name is required';
        }

        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Email is invalid';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error for this field
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            await dispatch(updateUserProfile(formData)).unwrap();
            setIsEditing(false);
            // Refresh profile data after update
            dispatch(fetchUserProfile());
        } catch (error) {
            console.error('Update error:', error);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormErrors({});

        // Reset form to original user data
        if (user) {
            setFormData({
                fullName: user.fullName || '',
                email: user.email || '',
                mobile_number: user.mobile_number || '',
                country: user.country || '',
                state: user.state || '',
                city: user.city || '',
                location: user.location || '',
            });
        }
    };

    const handleRefreshProfile = () => {
        dispatch(fetchUserProfile());
    };

    const getInitials = () => {
        if (!user?.fullName) return 'U';
        return user.fullName
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid date';
        }
    };

    // Show loading state while fetching profile
    if (profileFetchLoading && !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-16">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading profile data...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-16">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Profile Data</h3>
                    <p className="text-gray-600 mb-4">Unable to load profile information.</p>
                    <button
                        onClick={handleRefreshProfile}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-2 sm:pt-8 shadow-3xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Success Message */}
                {profileUpdateSuccess && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                            <p className="text-green-700 font-medium">{profileUpdateMessage}</p>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {profileError && !profileUpdateSuccess && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <div className="flex items-center">
                            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                            <p className="text-red-700 font-medium">{profileError}</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Profile Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            {/* Profile Avatar */}
                            <div className="flex flex-col items-center mb-6">
                                <div className="relative mb-4">
                                    <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                                        {getInitials()}
                                    </div>
                                    {isEditing && (
                                        <button
                                            type="button"
                                            className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <Camera className="w-5 h-5 text-gray-700" />
                                        </button>
                                    )}
                                </div>

                                <h2 className="text-xl font-bold text-gray-900">{user.fullName}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <Mail className="w-4 h-4 text-gray-500" />
                                    <span className="text-gray-600 text-sm">{user.email}</span>
                                </div>

                                <div className="mt-4 px-4 py-2 bg-blue-50 rounded-full">
                                    <span className="text-blue-700 text-sm font-medium flex items-center gap-2">
                                        <Truck className="w-4 h-4" />
                                        {user.role || 'User'}
                                    </span>
                                </div>
                            </div>

                            {/* Account Info */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Shield className="w-5 h-5 text-gray-500" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Account Status</p>
                                            <p className="text-sm text-gray-600">Active since {formatDate(user.createdAt)}</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.status === 'Active'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                        }`}>
                                        {user.status}
                                    </span>
                                </div>

                                {user.is_verified && (
                                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                        <div>
                                            <p className="text-sm font-medium text-green-800">Verified Account</p>
                                            <p className="text-xs text-green-600">
                                                Verified on {formatDate(user.is_verified_at)}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Account Overview */}
                        <div className="mt-6 bg-white rounded-2xl shadow-lg p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Account Overview</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Member Since</span>
                                    <span className="text-sm font-medium">{formatDate(user.createdAt)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Last Updated</span>
                                    <span className="text-sm font-medium">{formatDate(user.updatedAt)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Edit Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                            {/* Form Header */}
                            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                                    <p className="text-sm text-gray-600">Update your personal details</p>
                                </div>

                                {!isEditing ? (
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        Edit Profile
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={handleCancel}
                                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSubmit}
                                            disabled={profileLoading || profileFetchLoading}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            <Save className="w-4 h-4" />
                                            {profileLoading ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Form Content */}
                            <form onSubmit={handleSubmit} className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Full Name */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                            <User className="w-4 h-4" />
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none transition-colors ${formErrors.fullName
                                                ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                                                : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                                } ${!isEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                                        />
                                        {formErrors.fullName && (
                                            <p className="text-sm text-red-600">{formErrors.fullName}</p>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                            <Mail className="w-4 h-4" />
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            disabled
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                                        />
                                        <p className="text-xs text-gray-500">Email cannot be changed</p>
                                    </div>

                                    {/* Phone Number */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                            <Phone className="w-4 h-4" />
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            name="mobile_number"
                                            value={formData.mobile_number}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            placeholder="Enter phone number"
                                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none transition-colors ${'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                                } ${!isEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                                        />
                                    </div>

                                    {/* Country */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                            <Globe className="w-4 h-4" />
                                            Country
                                        </label>
                                        <input
                                            type="text"
                                            name="country"
                                            value={formData.country}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            placeholder="Enter country"
                                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none transition-colors ${'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                                } ${!isEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                                        />
                                    </div>

                                    {/* State */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                            <MapPin className="w-4 h-4" />
                                            State/Province
                                        </label>
                                        <input
                                            type="text"
                                            name="state"
                                            value={formData.state}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            placeholder="Enter state"
                                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none transition-colors ${'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                                } ${!isEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                                        />
                                    </div>

                                    {/* City */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                            <MapPin className="w-4 h-4" />
                                            City
                                        </label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            placeholder="Enter city"
                                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none transition-colors ${'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                                } ${!isEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                                        />
                                    </div>

                                    {/* Full Address */}
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                            <MapPin className="w-4 h-4" />
                                            Full Address
                                        </label>
                                        <textarea
                                            name="location"
                                            value={formData.location}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            placeholder="Enter complete address"
                                            rows="3"
                                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none transition-colors ${'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                                } ${!isEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                                        />
                                    </div>
                                </div>

                                {user.dob && (
                                    <div className="mt-6 pt-6 border-t border-gray-200">
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                            <Calendar className="w-4 h-4" />
                                            Date of Birth
                                        </label>
                                        <p className="mt-1 text-gray-600">{formatDate(user.dob)}</p>
                                    </div>
                                )}
                            </form>
                        </div>

                        {/* Security Section in ProfilePage.jsx */}
                        <div className="mt-6 bg-white rounded-2xl shadow-lg p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Security Settings</h3>
                            <div className="space-y-4">
                                <button
                                    type="button"
                                    onClick={() => navigate('/change-password')}
                                    className="w-full flex justify-between items-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                                            <Shield className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium text-gray-900">Change Password</p>
                                            <p className="text-sm text-gray-600">Update your account password</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;