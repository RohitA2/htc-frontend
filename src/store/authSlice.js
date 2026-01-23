// store/slices/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Helper functions for localStorage
const setAuthData = (token, user) => {
    if (token) localStorage.setItem('token', token);
    if (user) localStorage.setItem('user', JSON.stringify(user));
};

const clearAuthData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

// Safe localStorage getter
const getStoredUser = () => {
    try {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
        return null;
    }
};

const getStoredToken = () => {
    return localStorage.getItem('token');
};

// ─── Async Thunks ────────────────────────────────────────────────
export const loginUser = createAsyncThunk(
    'auth/login',
    async ({ email, password }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/login`, {
                email,
                password
            });

            const { token, user, message } = response.data;

            if (token && user) {
                setAuthData(token, user);
                return { token, user, message };
            }

            return rejectWithValue('Invalid response from server');

        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                error.response?.data?.error ||
                'Login failed. Please check your credentials.'
            );
        }
    }
);

export const registerUser = createAsyncThunk(
    'auth/register',
    async (userData, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/register`, {
                fullName: userData.fullName,
                email: userData.email,
                password: userData.password,
                role: userData.role || 'User',
            });

            const { message, data: user } = response.data;

            // Auto-login after registration if token is provided
            if (response.data.token && user) {
                setAuthData(response.data.token, user);
                return {
                    token: response.data.token,
                    user,
                    message: message || 'Registration successful'
                };
            }

            return { message: message || 'Registration successful - please log in' };

        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                error.response?.data?.error ||
                'Registration failed. Please try again.'
            );
        }
    }
);

export const updateUserProfile = createAsyncThunk(
    'auth/updateProfile',
    async (userData, { rejectWithValue, getState }) => {
        try {
            const { auth } = getState();

            if (!auth.token) {
                return rejectWithValue('Not authenticated. Please log in again.');
            }

            const response = await axios.post(
                `${API_BASE_URL}/auth/updateProfile`,
                userData,
                {
                    headers: {
                        'Authorization': `Bearer ${auth.token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Handle different response formats
            let updatedUser;
            if (response.data.result?.data) {
                updatedUser = response.data.result.data;
            } else if (response.data.data) {
                updatedUser = response.data.data;
            } else if (response.data.user) {
                updatedUser = response.data.user;
            } else {
                updatedUser = response.data;
            }

            // Update localStorage with new user data
            setAuthData(auth.token, updatedUser);

            return updatedUser;

        } catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                clearAuthData();
                window.location.href = '/login?session=expired';
                return rejectWithValue('Session expired. Please log in again.');
            }

            return rejectWithValue(
                error.response?.data?.message ||
                error.response?.data?.error ||
                'Failed to update profile. Please try again.'
            );
        }
    }
);

export const verifyToken = createAsyncThunk(
    'auth/verifyToken',
    async (_, { rejectWithValue }) => {
        const token = getStoredToken();

        if (!token) {
            return rejectWithValue('No authentication token found');
        }

        try {
            const response = await axios.get(`${API_BASE_URL}/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const user = response.data.user || response.data;

            // Refresh stored user data
            setAuthData(token, user);

            return user;

        } catch (error) {
            // Clear invalid data
            clearAuthData();

            return rejectWithValue(
                error.response?.status === 401 ?
                    'Session expired. Please log in again.' :
                    'Failed to verify session.'
            );
        }
    }
);

export const fetchUserProfile = createAsyncThunk(
    'auth/fetchUserProfile',
    async (_, { rejectWithValue, getState }) => {
        try {
            const { auth } = getState();

            if (!auth.token) {
                return rejectWithValue('Not authenticated. Please log in again.');
            }

            const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${auth.token}`
                }
            });

            // Handle the API response format
            let userData;
            if (response.data.result?.data) {
                userData = response.data.result.data;
            } else if (response.data.data) {
                userData = response.data.data;
            } else if (response.data.user) {
                userData = response.data.user;
            } else {
                userData = response.data;
            }

            // Update localStorage with fresh user data
            setAuthData(auth.token, userData);

            return userData;

        } catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                clearAuthData();
                return rejectWithValue('Session expired. Please log in again.');
            }

            return rejectWithValue(
                error.response?.data?.message ||
                error.response?.data?.error ||
                'Failed to fetch profile. Please try again.'
            );
        }
    }
);


// Add this async thunk to authSlice.js
export const changePassword = createAsyncThunk(
    'auth/changePassword',
    async ({ currentPassword, newPassword }, { rejectWithValue, getState }) => {
        try {
            const { auth } = getState();

            if (!auth.token) {
                return rejectWithValue('Not authenticated. Please log in again.');
            }

            const response = await axios.post(
                `${API_BASE_URL}/auth/changePassword`,
                { currentPassword, newPassword },
                {
                    headers: {
                        'Authorization': `Bearer ${auth.token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;

        } catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                clearAuthData();
                return rejectWithValue('Session expired. Please log in again.');
            }

            return rejectWithValue(
                error.response?.data?.message ||
                error.response?.data?.error ||
                'Failed to change password. Please try again.'
            );
        }
    }
);
// ─── Slice ─────────────────────────────────────────────────
const initialState = {
    user: getStoredUser(),
    token: getStoredToken(),
    isAuthenticated: !!getStoredToken(),
    loading: false,
    error: null,
    registerLoading: false,
    registerSuccess: false,
    registerMessage: '',
    profileLoading: false,
    profileFetchLoading: false,
    profileError: null,
    profileUpdateSuccess: false,
    profileUpdateMessage: '',
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            clearAuthData();
            Object.assign(state, {
                user: null,
                token: null,
                isAuthenticated: false,
                error: null,
                registerSuccess: false,
                profileError: null,
                profileUpdateSuccess: false,
            });
        },
        clearErrors: (state) => {
            state.error = null;
            state.profileError = null;
            state.registerMessage = '';
            state.profileUpdateMessage = '';
        },
        clearProfileSuccess: (state) => {
            state.profileUpdateSuccess = false;
            state.profileUpdateMessage = '';
        },
        clearRegisterSuccess: (state) => {
            state.registerSuccess = false;
            state.registerMessage = '';
        },
        resetAuthState: (state) => {
            Object.assign(state, initialState);
        },
        setUser: (state, action) => {
            state.user = action.payload;
        },
    },
    extraReducers: (builder) => {
        // Login
        builder
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.isAuthenticated = true;
                state.error = null;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.isAuthenticated = false;
            });

        // Register
        builder
            .addCase(registerUser.pending, (state) => {
                state.registerLoading = true;
                state.registerSuccess = false;
                state.registerMessage = '';
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.registerLoading = false;
                state.registerSuccess = true;
                state.registerMessage = action.payload.message || 'Registration successful';

                // Auto-login if token is provided
                if (action.payload.token && action.payload.user) {
                    state.user = action.payload.user;
                    state.token = action.payload.token;
                    state.isAuthenticated = true;
                }
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.registerLoading = false;
                state.error = action.payload;
            });

        // Update Profile
        builder
            .addCase(updateUserProfile.pending, (state) => {
                state.profileLoading = true;
                state.profileError = null;
                state.profileUpdateSuccess = false;
                state.profileUpdateMessage = '';
            })
            .addCase(updateUserProfile.fulfilled, (state, action) => {
                state.profileLoading = false;
                state.user = action.payload;
                state.profileUpdateSuccess = true;
                state.profileUpdateMessage = 'Profile updated successfully';
                state.profileError = null;
            })
            .addCase(updateUserProfile.rejected, (state, action) => {
                state.profileLoading = false;
                state.profileError = action.payload;
                state.profileUpdateSuccess = false;
            });

        // Fetch User Profile
        builder
            .addCase(fetchUserProfile.pending, (state) => {
                state.profileFetchLoading = true;
                state.profileError = null;
            })
            .addCase(fetchUserProfile.fulfilled, (state, action) => {
                state.profileFetchLoading = false;
                state.user = action.payload;
                state.profileError = null;
            })
            .addCase(fetchUserProfile.rejected, (state, action) => {
                state.profileFetchLoading = false;
                state.profileError = action.payload;
            });

        // Verify Token
        builder
            .addCase(verifyToken.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(verifyToken.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.isAuthenticated = true;
                state.error = null;
            })
            .addCase(verifyToken.rejected, (state, action) => {
                state.loading = false;
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
                state.error = action.payload;
            });

        builder
            // Change Password
            .addCase(changePassword.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(changePassword.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;
            })
            .addCase(changePassword.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

    },
});

export const {
    logout,
    clearErrors,
    clearProfileSuccess,
    clearRegisterSuccess,
    resetAuthState,
    setUser
} = authSlice.actions;

export default authSlice.reducer;